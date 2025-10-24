
"use client";

import { useMemo } from 'react';
import { Pie, PieChart, Cell, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { useSettings } from '@/context/SettingsContext';
import { useTransaction } from '@/context/TransactionContext';
import { formatCurrency } from '@/lib/utils';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { useTranslation } from '@/hooks/use-translation';

const FALLBACK_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function ExpenseDistributionChart() {
  const { state } = useAppContext();
  const { settings } = useSettings();
  const { transactions } = useTransaction();
  const { t } = useTranslation();
  const { categories } = state;
  const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;

  const chartData = useMemo(() => {
    const expenseByCategory: { [key: string]: { amount: number, color?: string } } = {};
    const now = new Date();
    
    transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
      .forEach(t => {
        const parentCategory = categories.find(c => c.id === t.categoryId || c.subcategories.some(sc => sc.id === t.categoryId));
        if (parentCategory) {
            if (!expenseByCategory[parentCategory.id]) {
                expenseByCategory[parentCategory.id] = { amount: 0, color: parentCategory.color };
            }
            expenseByCategory[parentCategory.id].amount += t.amount;
        }
      });
      
    return Object.entries(expenseByCategory)
      .map(([categoryId, data]) => ({
        name: categories.find(c => c.id === categoryId)?.name || 'Unknown',
        value: data.amount,
        color: data.color,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories]);

  const chartConfig = useMemo(() => {
    return chartData.reduce((acc, data, index) => {
      acc[data.name] = {
        label: data.name,
        color: data.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]
      };
      return acc;
    }, {} as any);
  }, [chartData]);
  

  if (chartData.length === 0) {
    return (
      <Card className="flex flex-col flex-1 w-full">
        <CardHeader>
          <CardTitle>{t('expenseDistribution')}</CardTitle>
          <CardDescription>{t('thisMonth')}</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">{t('noExpenseDataThisMonth')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col flex-1 w-full">
      <CardHeader>
        <CardTitle>{t('expenseDistribution')}</CardTitle>
        <CardDescription>{t('thisMonth')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[300px]">
          <PieChart accessibilityLayer>
            <Tooltip
              content={<ChartTooltipContent
                formatter={(value, name) => <div><span className="font-medium">{name}</span>: {formatCurrency(Number(value), currency, hideAmounts, numberFormat, decimalPlaces)}</div>}
                indicator="dot"
                nameKey="name" 
              />}
            />
            <Pie
              data={chartData}
              labelLine={false}
              outerRadius="80%"
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
