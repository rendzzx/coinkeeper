
"use client";

import { useMemo } from "react";
import { format, formatDistanceToNow } from "date-fns";
import type { ScheduledTransaction } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAppContext } from "@/context/AppContext";
import { useSettings } from "@/context/SettingsContext";
import { useWallet } from "@/context/WalletContext";
import { formatCurrency, getCategoryName, getWalletName } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { Badge } from "../ui/badge";
import { ArrowDown, ArrowUp } from "lucide-react";
import { id as idLocale, enUS } from 'date-fns/locale';

type ScheduledTransactionCardProps = {
  schedule: ScheduledTransaction;
  onEdit: (schedule: ScheduledTransaction) => void;
};

export function ScheduledTransactionCard({ schedule, onEdit }: ScheduledTransactionCardProps) {
  const { state } = useAppContext();
  const { settings } = useSettings();
  const { wallets } = useWallet();
  const { t, lang } = useTranslation();
  const { categories } = state;
  const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;

  const nextDueDate = new Date(schedule.nextDueDate);
  const isOverdue = nextDueDate < new Date() && schedule.status === 'active';
  
  const formattedNextDate = useMemo(() => {
    try {
      return format(nextDueDate, "PPP", { locale: lang === 'id' ? idLocale : enUS });
    } catch (e) {
      // Fallback for environments where dynamic import might be tricky
      return format(nextDueDate, "PPP");
    }
  }, [nextDueDate, lang]);

  const timeToNextDate = useMemo(() => {
    try {
      return formatDistanceToNow(nextDueDate, { addSuffix: true, locale: lang === 'id' ? idLocale : enUS });
    } catch (e) {
      return formatDistanceToNow(nextDueDate, { addSuffix: true });
    }
  }, [nextDueDate, lang]);

  const isIncome = schedule.type === "income";

  const getStatusBadge = (status: ScheduledTransaction['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="secondary" className="capitalize bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">{t(status)}</Badge>;
      case 'completed':
        return <Badge variant="outline" className="capitalize">{t(status)}</Badge>;
      default:
        return <Badge variant="secondary" className="capitalize">{t(status)}</Badge>;
    }
  }

  return (
    <div onClick={() => onEdit(schedule)} className="cursor-pointer">
      <Card className="hover:bg-muted/50 transition-colors h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{schedule.name}</CardTitle>
            <div className="flex items-center gap-2">
              {getStatusBadge(schedule.status)}
              {isIncome ? <ArrowUp className="h-5 w-5 text-green-500" /> : <ArrowDown className="h-5 w-5 text-red-500" />}
            </div>
          </div>
          <CardDescription className="capitalize">
            {t(schedule.frequency)} &bull; {getCategoryName(categories, schedule.categoryId)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-grow justify-end gap-2">
          <div className="text-2xl font-bold font-headline">
            {formatCurrency(schedule.amount, currency, hideAmounts, numberFormat, decimalPlaces)}
          </div>
           {schedule.status !== 'completed' && (
             <div>
              <p className="text-sm font-medium">{t('nextDueDate')}</p>
              <p className={`text-sm ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>{formattedNextDate} ({timeToNextDate})</p>
             </div>
           )}
           <div>
            <p className="text-sm font-medium">{t('wallet')}</p>
            <p className="text-sm text-muted-foreground">{getWalletName(wallets, schedule.walletId)}</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
