
"use client"

import { useAppContext } from "@/context/AppContext"
import { useSettings } from "@/context/SettingsContext"
import { useTransaction } from "@/context/TransactionContext"
import { useWallet } from "@/context/WalletContext"
import { formatCurrency, getCategoryName, getWalletName } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useMemo } from "react"
import { ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { useTranslation } from "@/hooks/use-translation"

export function RecentTransactions() {
  const { state } = useAppContext()
  const { settings } = useSettings()
  const { transactions } = useTransaction();
  const { wallets } = useWallet();
  const { t } = useTranslation();
  const { categories } = state
  const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;

  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
  }, [transactions])

  return (
    <Card className="flex flex-col flex-1 w-full">
      <CardHeader>
        <CardTitle>{t('recentTransactions')}</CardTitle>
        <CardDescription>{t('your5MostRecentTransactions')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentTransactions.length > 0 ? (
          recentTransactions.map((transaction) => {
            const isIncome = transaction.type === "income";
            return (
              <div key={transaction.id} className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className={isIncome ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}>
                    {isIncome ? <ArrowUpRight className="h-4 w-4 text-green-500" /> : <ArrowDownLeft className="h-4 w-4 text-red-500" />}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium">{getCategoryName(categories, transaction.categoryId)}</p>
                  <p className="text-sm text-muted-foreground">{getWalletName(wallets, transaction.walletId)}</p>
                </div>
                <div className={`font-semibold ${isIncome ? 'text-green-600' : ''}`}>
                  {isIncome ? '+' : '-'}{formatCurrency(transaction.amount, currency, hideAmounts, numberFormat, decimalPlaces)}
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">{t('noTransactionsYet')}</p>
        )}
      </CardContent>
    </Card>
  )
}
