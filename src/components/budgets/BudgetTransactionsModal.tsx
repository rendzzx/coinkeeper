
"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { isWithinInterval } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";
import { useAppContext } from "@/context/AppContext";
import { useTransaction } from "@/context/TransactionContext";
import { useSettings } from "@/context/SettingsContext";
import { useWallet } from "@/context/WalletContext";
import { useTranslation } from "@/hooks/use-translation";
import { formatCurrency, getCategoryName, getWalletName } from "@/lib/utils";
import type { Budget, Transaction } from "@/lib/types";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

type BudgetTransactionsModalProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  budget: Budget;
};

function TransactionItem({ transaction }: { transaction: Transaction }) {
  const { state } = useAppContext();
  const { settings } = useSettings();
  const { wallets } = useWallet();
  const { currency, hideAmounts, numberFormat, decimalPlaces } = settings;
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0">
      <div className="flex-1 overflow-hidden">
        <p className="font-medium truncate">{getCategoryName(state.categories, transaction.categoryId)}</p>
        <p className="text-sm text-muted-foreground">{getWalletName(wallets, transaction.walletId)}</p>
        <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), 'PP')}</p>
        {transaction.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {transaction.tags.map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
        )}
      </div>
      <div className="font-semibold text-right">
        {formatCurrency(transaction.amount, currency, hideAmounts, numberFormat, decimalPlaces)}
      </div>
    </div>
  );
}

export function BudgetTransactionsModal({ isOpen, setIsOpen, budget }: BudgetTransactionsModalProps) {
  const { state } = useAppContext();
  const { transactions } = useTransaction();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { categories } = state;

  const relevantTransactions = useMemo(() => {
    let dateFilteredTransactions: Transaction[];

    if (budget.type === 'one-time' && budget.startDate && budget.endDate) {
      const startDate = new Date(budget.startDate);
      const endDate = new Date(budget.endDate);
      dateFilteredTransactions = transactions.filter(t => isWithinInterval(new Date(t.date), { start: startDate, end: endDate }));
    } else { // periodic
      const now = new Date();
      dateFilteredTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getFullYear() === now.getFullYear() && transactionDate.getMonth() === now.getMonth();
      });
    }

    return dateFilteredTransactions
      .filter(t => {
        if (t.type !== 'expense') return false;

        const categoryAndSubcategories = categories.find(c => c.id === budget.categoryIds[0])?.subcategories.map(sc => sc.id) || [];
        const allCategoryIds = [budget.categoryIds[0], ...categoryAndSubcategories];

        const inCategory = budget.categoryIds.length > 0 && allCategoryIds.includes(t.categoryId);
        const inTags = budget.tags.length > 0 && t.tags.some(tag => budget.tags.includes(tag));
        
        return inCategory || inTags;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, budget, categories]);
  
  const content = (
    <div className="overflow-hidden">
        {relevantTransactions.length > 0 ? (
          relevantTransactions.map(tx => <TransactionItem key={tx.id} transaction={tx} />)
        ) : (
          <p className="p-4 text-center text-muted-foreground">{t('noTransactionsYet')}</p>
        )}
    </div>
  );

  const title = `${t('transactions')} for ${budget.name}`;

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="overflow-y-auto max-h-[70vh]">
            {content}
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
            {content}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
