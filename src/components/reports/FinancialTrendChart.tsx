

"use client";

import { useMemo } from "react";
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { format, eachDayOfInterval, eachMonthOfInterval, startOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import type { Transaction, AppSettings } from "@/lib/types";

type FinancialTrendChartProps = {
  transactions: Transaction[];
  dateRange: DateRange | undefined;
  settings: AppSettings;
};

export function FinancialTrendChart({ transactions, dateRange, settings }: FinancialTrendChartProps) {
  const { t } = useTranslation();
  const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;

  const chartData = useMemo(() => {
    if (!dateRange?.from || !dateRange.to) return [];

    const diffDays = (dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 3600 * 24);
    
    const useMonthlyAggregation = diffDays > 60; 

    const intervalDates = useMonthlyAggregation 
        ? eachMonthOfInterval({ start: dateRange.from, end: dateRange.to })
        : eachDayOfInterval({ start: dateRange.from, end: dateRange.to });

    const dateFormat = useMonthlyAggregation ? "MMM yyyy" : "MMM d";

    const data = intervalDates.map(date => ({
      date: format(date, dateFormat),
      income: 0,
      expense: 0,
    }));

    transactions.forEach(t => {
        const transactionDate = new Date(t.date);
        
        const dateKey = format(transactionDate, dateFormat);

        const entry = data.find(d => d.date === dateKey);

        if (entry) {
            if (t.type === 'income') {
                entry.income += t.amount;
            } else {
                entry.expense += t.amount;
            }
        }
    });

    return data;
  }, [transactions, dateRange]);

  const chartConfig = {
    income: { label: t('income'), color: "hsl(var(--chart-1))" },
    expense: { label: t('expense'), color: "hsl(var(--chart-2))" },
  };

  const currencySymbol = new Intl.NumberFormat(settings.language, {
    style: 'currency',
    currency: settings.currency,
  }).formatToParts(1).find(part => part.type === 'currency')?.value || '$';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('financialTrend')}</CardTitle>
        <CardDescription>{t('financialTrendDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ChartContainer config={chartConfig}>
            <LineChart data={chartData} accessibilityLayer margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => hideAmounts ? '*****' : `${currencySymbol}${Number(value) / 1000}k`}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent
                  formatter={(value) => formatCurrency(Number(value), currency, hideAmounts, numberFormat, decimalPlaces)} 
                  indicator="dot"
                />}
              />
              <Line dataKey="income" type="monotone" stroke="var(--color-income)" strokeWidth={2} dot={false} />
              <Line dataKey="expense" type="monotone" stroke="var(--color-expense)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
