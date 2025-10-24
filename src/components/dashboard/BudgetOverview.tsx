"use client";

import {useMemo} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Progress} from "@/components/ui/progress";
import {useAppContext} from "@/context/AppContext";
import {useSettings} from "@/context/SettingsContext";
import {useTransaction} from "@/context/TransactionContext";
import {formatCurrency, getCategoryName} from "@/lib/utils";
import {useTranslation} from "@/hooks/use-translation";
import {isWithinInterval} from "date-fns";
import {PlusCircle} from "lucide-react";
import Link from "next/link";

export function BudgetOverview() {
  const {state} = useAppContext();
  const {settings} = useSettings();
  const {transactions} = useTransaction();
  const {t} = useTranslation();
  const {categories, budgets} = state;
  const {currency, hideAmounts, numberFormat, decimalPlaces} = settings;

  const periodicBudgets = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return budgets
      .filter((b) => b.type === "periodic")
      .map((budget) => {
        const spent = transactions
          .filter((t) => {
            const transactionDate = new Date(t.date);
            const isCurrentMonth =
              transactionDate >= startOfMonth && transactionDate <= endOfMonth;
            if (t.type !== "expense" || !isCurrentMonth) return false;

            const categoryAndSubcategories =
              categories
                .find((c) => c.id === budget.categoryIds[0])
                ?.subcategories.map((sc) => sc.id) || [];
            const allCategoryIds = [
              budget.categoryIds[0],
              ...categoryAndSubcategories,
            ];

            const inCategory =
              budget.categoryIds.length > 0 &&
              allCategoryIds.includes(t.categoryId);
            const inTags =
              budget.tags.length > 0 &&
              t.tags.some((tag) => budget.tags.includes(tag));

            return inCategory || inTags;
          })
          .reduce((sum, t) => sum + t.amount, 0);

        const progress = (spent / budget.amount) * 100;

        return {...budget, spent, progress};
      });
  }, [budgets, transactions, categories]);

  if (periodicBudgets.length === 0) {
    return (
      <Card className="flex flex-col flex-1 w-full items-center justify-center text-center p-8">
        <CardHeader>
          <CardTitle>{t("monthlyBudgets")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("noBudgetsSet")}</p>
          <Button asChild variant="link" className="mt-2">
            <Link href="/budgets">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t("createBudget")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col flex-1 w-full">
      <CardHeader>
        <CardTitle>{t("budgetOverviewWidgetTitle")}</CardTitle>
        <CardDescription>{t("thisMonth")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {periodicBudgets.map((budget) => (
          <div key={budget.id}>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{budget.name}</span>
              <span className="text-sm text-muted-foreground">
                {t("spentOf", {
                  spent: formatCurrency(
                    budget.spent,
                    currency,
                    hideAmounts,
                    numberFormat,
                    decimalPlaces
                  ),
                  total: formatCurrency(
                    budget.amount,
                    currency,
                    hideAmounts,
                    numberFormat,
                    decimalPlaces
                  ),
                })}
              </span>
            </div>
            <Progress value={budget.progress} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
