

"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import type { Transaction, Tag, AppSettings } from "@/lib/types";

type TagExpenseChartProps = {
    transactions: Transaction[];
    tags: Tag[];
    settings: AppSettings;
};

export function TagExpenseChart({ transactions, tags, settings }: TagExpenseChartProps) {
    const { t } = useTranslation();
    const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;

    const chartData = useMemo(() => {
        const expenseData: { [key: string]: { name: string, total: number } } = {};

        tags.forEach(tag => {
            expenseData[tag.name] = { name: tag.name, total: 0 };
        });

        transactions.filter(t => t.type === 'expense').forEach(t => {
            t.tags.forEach(tagName => {
                if (expenseData[tagName]) {
                    expenseData[tagName].total += t.amount;
                }
            });
        });
        
        return Object.values(expenseData).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

    }, [transactions, tags]);

    const chartConfig = {
        total: { label: t('expenses'), color: "hsl(var(--chart-1))" }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('expenseByTag')}</CardTitle>
                <CardDescription>{t('expenseByTagDescription')}</CardDescription>
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
