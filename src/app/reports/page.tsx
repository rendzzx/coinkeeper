
"use client";

import { useState } from "react";
import Link from "next/link";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth } from "date-fns";
import { Header } from "@/components/layout/Header";
import { useTranslation } from "@/hooks/use-translation";
import { useAppContext } from "@/context/AppContext";
import { useSettings } from "@/context/SettingsContext";
import { useWallet } from "@/context/WalletContext";
import { useTransaction } from "@/context/TransactionContext";
import { ReportFilters } from "@/components/reports/ReportFilters";
import { ReportSummary } from "@/components/reports/ReportSummary";
import { FinancialTrendChart } from "@/components/reports/FinancialTrendChart";
import { CategoryExpenseChart } from "@/components/reports/CategoryExpenseChart";
import { TagExpenseChart } from "@/components/reports/TagExpenseChart";
import { CategoryIncomeChart } from "@/components/reports/CategoryIncomeChart";
import { TagIncomeChart } from "@/components/reports/TagIncomeChart";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { WalletForm } from "@/components/wallets/WalletForm";

export default function ReportsPage() {
  const { t } = useTranslation();
  const { state } = useAppContext();
  const { settings } = useSettings();
  const { wallets } = useWallet();
  const { transactions } = useTransaction();
  const { categories, tags } = state;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNoWalletAlertOpen, setIsNoWalletAlertOpen] = useState(false);
  const [isWalletFormOpen, setIsWalletFormOpen] = useState(false);

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const handleDateChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };
  
  const handleAddTransactionClick = () => {
    if (wallets.length === 0) {
      setIsNoWalletAlertOpen(true);
    } else {
      setIsFormOpen(true);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (!dateRange?.from) return true;
    const transactionDate = new Date(t.date);
    if (dateRange.from && !dateRange.to) {
        return transactionDate >= dateRange.from;
    }
    if (dateRange.from && dateRange.to) {
        return transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <Header title={t('reports')} />
      <ReportFilters selectedRange={dateRange} onDateChange={handleDateChange} />
      
      {filteredTransactions.length > 0 ? (
        <>
            <ReportSummary transactions={filteredTransactions} settings={settings} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FinancialTrendChart transactions={filteredTransactions} dateRange={dateRange} settings={settings} />
                <CategoryExpenseChart transactions={filteredTransactions} categories={categories} settings={settings} />
                <CategoryIncomeChart transactions={filteredTransactions} categories={categories} settings={settings} />
                <TagExpenseChart transactions={filteredTransactions} tags={tags} settings={settings} />
                <TagIncomeChart transactions={filteredTransactions} tags={tags} settings={settings} />
            </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg mt-4">
            <h3 className="text-xl font-semibold">{t('noExpenseDataThisMonth')}</h3>
            <p className="text-muted-foreground mt-2">{t('getStartedByAddingTransaction')}</p>
            <Button onClick={handleAddTransactionClick} className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" /> {t('addTransaction')}
            </Button>
        </div>
      )}

      <TransactionForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} />
      <WalletForm isOpen={isWalletFormOpen} setIsOpen={setIsWalletFormOpen} />

      <AlertDialog open={isNoWalletAlertOpen} onOpenChange={setIsNoWalletAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('noWalletsYet')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('getStartedByCreatingWallet')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setIsNoWalletAlertOpen(false);
              setIsWalletFormOpen(true);
            }}>
              {t('createWallet')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
