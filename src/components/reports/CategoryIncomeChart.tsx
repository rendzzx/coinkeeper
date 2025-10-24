

"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import type { Transaction, Category, AppSettings } from "@/lib/types";

type CategoryIncomeChartProps = {
    transactions: Transaction[];
    categories: Category[];
    settings: AppSettings;
};

export function CategoryIncomeChart({ transactions, categories, settings }: CategoryIncomeChartProps) {
    const { t } = useTranslation();
    const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;

    const chartData = useMemo(() => {
        const incomeData: { [key: string]: { name: string, total: number } } = {};

        categories.filter(c => c.type === 'income').forEach(parentCat => {
            incomeData[parentCat.id] = { name: parentCat.name, total: 0 };
        });

        transactions.filter(t => t.type === 'income').forEach(t => {
            const parentCategory = categories.find(c => c.id === t.categoryId || c.subcategories.some(sc => sc.id === t.categoryId));
            if (parentCategory && incomeData[parentCategory.id]) {
                incomeData[parentCategory.id].total += t.amount;
            }
        });
        
        return Object.values(incomeData).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

    }, [transactions, categories]);

    const chartConfig = {
        total: { label: t('income'), color: "hsl(var(--chart-2))" }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('incomeByCategory')}</CardTitle>
                <CardDescription>{t('incomeBreakdownDescription')}</CardDescription>
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
