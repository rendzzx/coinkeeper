
"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import type { Transaction, Category, AppSettings } from "@/lib/types";

type CategoryExpenseChartProps = {
    transactions: Transaction[];
    categories: Category[];
    settings: AppSettings;
};

export function CategoryExpenseChart({ transactions, categories, settings }: CategoryExpenseChartProps) {
    const { t } = useTranslation();
    const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;

    const chartData = useMemo(() => {
        const expenseData: { [key: string]: { name: string, total: number } } = {};

        categories.filter(c => c.type === 'expense').forEach(parentCat => {
            expenseData[parentCat.id] = { name: parentCat.name, total: 0 };
        });

        transactions.filter(t => t.type === 'expense').forEach(t => {
            const parentCategory = categories.find(c => c.id === t.categoryId || c.subcategories.some(sc => sc.id === t.categoryId));
            if (parentCategory && expenseData[parentCategory.id]) {
                expenseData[parentCategory.id].total += t.amount;
            } else {
                 const otherCategory = categories.find(c => c.name === 'Other');
                 if(otherCategory && expenseData[otherCategory.id]) {
                    expenseData[otherCategory.id].total += t.amount;
                 }
            }
        });
        
        return Object.values(expenseData).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

    }, [transactions, categories]);

    const chartConfig = {
        total: { label: t('expenses'), color: "hsl(var(--chart-1))" }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('expenseByCategory')}</CardTitle>
                <CardDescription>{t('expenseBreakdownDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ChartContainer config={chartConfig}>
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ left: 10, right: 30 }}
                            accessibilityLayer
                        >
                            <CartesianGrid horizontal={false} />
                            <YAxis
                                dataKey="name"
                                type="category"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={5}
                                width={80}
                                tick={{ fontSize: 12 }}
                            />
                            <XAxis dataKey="total" type="number" hide />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))' }}
                                content={<ChartTooltipContent
                                    formatter={(value) => formatCurrency(Number(value), currency, hideAmounts, numberFormat, decimalPlaces)} 
                                    indicator="dot"
                                />}
                            />
                            <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    );
}
