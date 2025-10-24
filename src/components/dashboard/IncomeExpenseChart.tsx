
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { formatCurrency } from "@/lib/utils"
import { useAppContext } from "@/context/AppContext"
import { useSettings } from "@/context/SettingsContext"
import { useTransaction } from "@/context/TransactionContext"
import { useMemo } from "react"
import { subDays, format } from "date-fns"
import { useTranslation } from "@/hooks/use-translation"

export function IncomeExpenseChart() {
  const { settings } = useSettings();
  const { transactions } = useTransaction();
  const { t } = useTranslation();
  const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;

  const chartData = useMemo(() => {
    const data: { date: string; income: number; expense: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i)
      data.push({
        date: format(date, "MMM d"),
        income: 0,
        expense: 0,
      })
    }

    transactions.forEach(t => {
      const date = new Date(t.date)
      const dayIndex = data.findIndex(d => d.date === format(date, "MMM d"))
      if (dayIndex !== -1) {
        if (t.type === 'income') {
          data[dayIndex].income += t.amount
        } else {
          data[dayIndex].expense += t.amount
        }
      }
    })

    return data
  }, [transactions])


  return (
    <Card className="flex flex-col flex-1 w-full">
      <CardHeader>
        <CardTitle>{t('incomeVsExpense')}</CardTitle>
        <CardDescription>{t('last7Days')}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={{
          income: { label: t('income'), color: "hsl(var(--chart-1))" },
          expense: { label: t('expense'), color: "hsl(var(--chart-2))" },
        }}>
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickFormatter={(value) => hideAmounts ? '*****' : formatCurrency(Number(value), currency, false, numberFormat, 0).slice(0, -3)}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<ChartTooltipContent 
                formatter={(value) => formatCurrency(Number(value), currency, hideAmounts, numberFormat, decimalPlaces)} 
                indicator="dot"
              />}
            />
            <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expense" fill="var(--color-expense)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
