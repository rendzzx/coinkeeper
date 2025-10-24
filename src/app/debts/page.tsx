
"use client";

import { useState } from "react";
import { Plus, PlusCircle, Landmark, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "@/context/AppContext";
import { useWallet } from "@/context/WalletContext";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { DebtCard } from "@/components/debts/DebtCard";
import { DebtForm } from "@/components/debts/DebtForm";
import type { Debt } from "@/lib/types";
import { useTranslation } from "@/hooks/use-translation";
import { DebtPaymentForm } from "@/components/debts/DebtPaymentForm";
import { Card } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { WalletForm } from "@/components/wallets/WalletForm";

export default function DebtsPage() {
  const { state } = useAppContext();
  const { wallets } = useWallet();
  const { t } = useTranslation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | undefined>(undefined);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [isNoWalletAlertOpen, setIsNoWalletAlertOpen] = useState(false);
  const [isWalletFormOpen, setIsWalletFormOpen] = useState(false);

  const handleAddDebt = () => {
    if (wallets.length === 0) {
      setIsNoWalletAlertOpen(true);
    } else {
      setSelectedDebt(undefined);
      setIsFormOpen(true);
      setIsFabOpen(false);
    }
  };

  const handlePayDebt = () => {
    setIsPaymentFormOpen(true);
    setIsFabOpen(false);
  }

  const handleEditDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setIsFormOpen(true);
  };

  const handleWalletCreated = () => {
    setIsWalletFormOpen(false);
    setIsFormOpen(true);
    setSelectedDebt(undefined);
  }
  
  const sortedDebts = [...state.debts].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  const hasActiveDebts = state.debts.some(d => d.status === 'active');

  return (
    <div className="flex flex-col gap-6 pb-24">
      <Header title={t('debts')} />

      {sortedDebts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sortedDebts.map((debt) => (
            <DebtCard key={debt.id} debt={debt} onEdit={handleEditDebt} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg">
            <Landmark className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-semibold">{t('noDebtsYet')}</h3>
            <p className="text-muted-foreground mt-2">{t('getStartedByAddingDebt')}</p>
            <Button onClick={handleAddDebt} className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" /> {t('addDebt')}
            </Button>
        </div>
      )}

      <DebtForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        debt={selectedDebt}
      />

      <DebtPaymentForm
        isOpen={isPaymentFormOpen}
        setIsOpen={setIsPaymentFormOpen}
      />

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

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-end gap-3"
            >
              <div className="flex items-center gap-3">
                  <Card className="px-3 py-2 text-sm font-medium shadow-lg">{t('addDebt')}</Card>
                  <Button onClick={handleAddDebt} variant="secondary" className="h-12 w-12 rounded-full shadow-lg">
                    <PlusCircle className="h-6 w-6" />
                  </Button>
              </div>
              <div className="flex items-center gap-3">
                  <Card className="px-3 py-2 text-sm font-medium shadow-lg">{t('payDebtLoan')}</Card>
                  <Button onClick={handlePayDebt} disabled={!hasActiveDebts} variant="secondary" className="h-12 w-12 rounded-full shadow-lg">
                    <DollarSign className="h-6 w-6" />
                  </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className="h-16 w-16 rounded-full shadow-lg"
          size="icon"
        >
          <motion.div
            animate={{ rotate: isFabOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="h-8 w-8" />
          </motion.div>
        </Button>
      </div>
    </div>
  );
}
