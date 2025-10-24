
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { useWallet } from "@/context/WalletContext";
import { useTransaction } from "@/context/TransactionContext"; // Use new context
import { useSettings } from "@/context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { TransactionDataTable } from "@/components/transactions/TransactionDataTable";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { useTranslation } from "@/hooks/use-translation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { WalletForm } from "@/components/wallets/WalletForm";
import { db } from "@/lib/db";

export default function TransactionsPage() {
  const { state } = useAppContext();
  const { settings } = useSettings();
  const { wallets } = useWallet();
  const { transactions } = useTransaction(); // Get transactions and actions from new context
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isNoWalletAlertOpen, setIsNoWalletAlertOpen] = useState(false);
  const [isWalletFormOpen, setIsWalletFormOpen] = useState(false);
  

  const handleAddTransactionClick = () => {
    if (wallets.length === 0) {
      setIsNoWalletAlertOpen(true);
    } else {
      setIsFormOpen(true);
    }
  };

  const handleWalletCreated = () => {
    setIsWalletFormOpen(false);
    setIsFormOpen(true);
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <Header title={t('transactions')} />
      
      <TransactionDataTable data={transactions} />

      <TransactionForm isOpen={isFormOpen} setIsOpen={setIsFormOpen} />
      <WalletForm 
        isOpen={isWalletFormOpen} 
        setIsOpen={setIsWalletFormOpen}
        onSuccess={handleWalletCreated} 
      />

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

      <Button
        onClick={handleAddTransactionClick}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-lg z-50"
        size="icon"
      >
        <Plus className="h-8 w-8" />
        <span className="sr-only">{t('addTransaction')}</span>
      </Button>
    </div>
  );
}
