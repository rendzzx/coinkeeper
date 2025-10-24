
"use client";

import { useEffect } from "react";
import type { Debt } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { formatCurrency } from "@/lib/utils";
import { useSettings } from "@/context/SettingsContext";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { format, formatDistanceToNow, differenceInMonths, isPast } from "date-fns";
import { enUS, id as idLocale } from 'date-fns/locale';
import { Bell, BellOff } from "lucide-react";
import { sendDebtNotification } from "@/lib/notifications";

type DebtCardProps = {
  debt: Debt;
  onEdit: (debt: Debt) => void;
};

export function DebtCard({ debt, onEdit }: DebtCardProps) {
  const { settings } = useSettings();
  const { t, lang } = useTranslation();
  const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;

  const remaining = debt.initialAmount - debt.paidAmount;
  const progress = (debt.paidAmount / debt.initialAmount) * 100;
  
  const isDebt = debt.type === 'debt'; // I owe money
  const isPaid = debt.status === 'paid';
  const notificationsEnabled = debt.enableNotifications ?? false;

  useEffect(() => {
    sendDebtNotification(debt, settings, t);
  }, [debt, settings, t]);


  const renderDueDate = () => {
    if (!debt.dueDate) return null;

    const dueDate = new Date(debt.dueDate);
    const now = new Date();
    const monthsUntilDue = differenceInMonths(dueDate, now);
    const locale = lang === 'id' ? idLocale : enUS;

    if (monthsUntilDue < 3) {
      const distance = formatDistanceToNow(dueDate, { addSuffix: true, locale });
      return dueDate < now 
        ? <p className="text-xs text-destructive">{t('overdueBy', { distance })}</p>
        : <p className="text-xs text-muted-foreground">{t('dueIn', { distance })}</p>
    } else {
      return <p className="text-xs text-muted-foreground">{t('dueDate')}: {format(dueDate, "PP")}</p>;
    }
  }

  return (
    <div onClick={() => onEdit(debt)} className="cursor-pointer">
        <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-lg">{debt.person}</CardTitle>
                        <CardDescription>
                            {isDebt ? `${t('youOwe')}` : `${t('owesYou')}`}
                        </CardDescription>
                    </div>
                    <Badge variant={isPaid ? "secondary" : isDebt ? "destructive" : "default"} className="flex items-center gap-1.5">
                        {isPaid ? t('paid') : (
                            <>
                                {notificationsEnabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                                {isDebt ? t('debt') : t('loan')}
                            </>
                        )}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-end gap-3">
                {isPaid ? (
                     <div className="text-center py-4">
                        <p className="text-lg font-semibold text-green-600">{t('fullyPaid')}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(debt.initialAmount, currency, hideAmounts, numberFormat, decimalPlaces)}</p>
                    </div>
                ) : (
                    <>
                        <div>
                             <div className="flex justify-between items-baseline">
                                <p className="text-sm font-medium">{t('remaining')}</p>
                                {renderDueDate()}
                             </div>
                             <p className="text-2xl font-bold font-headline">
                                {formatCurrency(remaining, currency, hideAmounts, numberFormat, decimalPlaces)}
                            </p>
                        </div>
                        <div>
                            <Progress value={progress} className="w-full h-2" />
                            <p className="text-right text-xs text-muted-foreground mt-1">
                                {t('paidOf', {
                                    paid: formatCurrency(debt.paidAmount, currency, hideAmounts, numberFormat, decimalPlaces),
                                    total: formatCurrency(debt.initialAmount, currency, hideAmounts, numberFormat, decimalPlaces)
                                })}
                            </p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
