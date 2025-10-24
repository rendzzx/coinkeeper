
"use client";

import { useMemo } from "react";
import { DollarSign, Wallet, ArrowDown, ArrowUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useTranslation } from "@/hooks/use-translation";
import { formatCurrency } from "@/lib/utils";
import type { Transaction, AppSettings } from "@/lib/types";

type ReportSummaryProps = {
    transactions: Transaction[];
    settings: AppSettings;
}

export function ReportSummary({ transactions, settings }: ReportSummaryProps) {
    const { t } = useTranslation();
    const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;

    const summary = useMemo(() => {
        const totalIncome = transactions
            .filter(t => t.type === 'income' && !t.transferId)
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpense = transactions
            .filter(t => t.type === 'expense' && !t.transferId)
            .reduce((sum, t) => sum + t.amount, 0);

        const netIncome = totalIncome - totalExpense;

        return { totalIncome, totalExpense, netIncome };
    }, [transactions]);

    return (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
                title={t('income')}
                value={formatCurrency(summary.totalIncome, currency, hideAmounts, numberFormat, decimalPlaces)}
                icon={<ArrowUp className="h-4 w-4 text-green-500" />}
            />
            <StatCard
                title={t('expenses')}
                value={formatCurrency(summary.totalExpense, currency, hideAmounts, numberFormat, decimalPlaces)}
                icon={<ArrowDown className="h-4 w-4 text-red-500" />}
            />
            <StatCard
                title={t('netIncome')}
                value={formatCurrency(summary.netIncome, currency, hideAmounts, numberFormat, decimalPlaces)}
                icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
        </div>
    );
}
