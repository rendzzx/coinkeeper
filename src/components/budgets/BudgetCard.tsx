
"use client";

import { useMemo, useEffect } from "react";
import type { Budget } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAppContext } from "@/context/AppContext";
import { useSettings } from "@/context/SettingsContext";
import { useTransaction } from "@/context/TransactionContext";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { format, isWithinInterval } from "date-fns";
import { Bell, BellOff, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { sendBudgetNotification } from "@/lib/notifications";

type BudgetCardProps = {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onViewTransactions: (budget: Budget) => void;
};

export function BudgetCard({ budget, onEdit, onViewTransactions }: BudgetCardProps) {
  const { state } = useAppContext();
  const { settings } = useSettings();
  const { transactions } = useTransaction();
  const { t } = useTranslation();
  const { categories } = state;
  const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;

  const { spent, progress } = useMemo(() => {
    let relevantTransactions = transactions;

    if (budget.type === 'one-time' && budget.startDate && budget.endDate) {
      const startDate = new Date(budget.startDate);
      const endDate = new Date(budget.endDate);
      relevantTransactions = transactions.filter(t => isWithinInterval(new Date(t.date), { start: startDate, end: endDate }));
    } else { // periodic
      const now = new Date();
      relevantTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === now.getFullYear() && transactionDate.getMonth() === now.getMonth();
      });
    }

    const spentAmount = relevantTransactions
      .filter(t => {
        if (t.type !== 'expense') return false;

        const categoryAndSubcategories = categories.find(c => c.id === budget.categoryIds[0])?.subcategories.map(sc => sc.id) || [];
        const allCategoryIds = [budget.categoryIds[0], ...categoryAndSubcategories];

        const inCategory = budget.categoryIds.length > 0 && allCategoryIds.includes(t.categoryId);
        const inTags = budget.tags.length > 0 && t.tags.some(tag => budget.tags.includes(tag));
        
        return inCategory || inTags;
      })
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      spent: spentAmount,
      progress: (spentAmount / budget.amount) * 100,
    };
  }, [transactions, budget, categories]);

  useEffect(() => {
    sendBudgetNotification(budget, progress, spent, t);
  }, [progress, spent, budget, t]);
  
  const getBudgetPeriodDescription = () => {
    if (budget.type === 'one-time' && budget.startDate && budget.endDate) {
      return `${format(new Date(budget.startDate), 'MMM d')} - ${format(new Date(budget.endDate), 'MMM d, yyyy')}`;
    }
    return t('thisMonth');
  };

  const notificationsEnabled = budget.enableNotifications ?? true;

  return (
    <Card className="hover:bg-muted/50 transition-colors flex flex-col justify-between h-full">
      <div onClick={() => onEdit(budget)} className="cursor-pointer">
        <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle className="text-lg">{budget.name}</CardTitle>
                    <CardDescription>{getBudgetPeriodDescription()}</CardDescription>
                </div>
                 {notificationsEnabled ? (
                    <Bell className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
            </div>
        </CardHeader>
        <CardContent>
             <p className="text-sm text-muted-foreground">
                {t('spentOf', { spent: formatCurrency(spent, currency, hideAmounts, numberFormat, decimalPlaces), total: formatCurrency(budget.amount, currency, hideAmounts, numberFormat, decimalPlaces) })}
            </p>
            <Progress value={progress} className="w-full h-2 mt-2" />
            <p className="text-right text-xs text-muted-foreground mt-1">{Math.floor(progress)}%</p>
        </CardContent>
      </div>
      <CardFooter className="pt-4">
        <Button variant="outline" size="sm" className="w-full" onClick={(e) => {
          e.stopPropagation();
          onViewTransactions(budget);
        }}>
            <ExternalLink className="mr-2 h-4 w-4" />
            {t('seeTransactions')}
        </Button>
      </CardFooter>
    </Card>
  );
}
