

"use client";

import React, { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import type { Transaction, TransferPayload } from '@/lib/types';
import { toast } from '@/hooks/use-toast-internal';
import { logHistory } from '@/lib/history';
import { diffObjects } from '@/lib/utils';
import { useTranslation } from '@/hooks/use-translation';
import { useLiveQuery } from 'dexie-react-hooks';

// Define the shape of the context
interface ITransactionContext {
  transactions: Transaction[];
  addTransaction: (transaction: Omit<Transaction, 'id'>, source?: 'manual' | 'system' | 'scheduled') => Promise<void>;
  updateTransaction: (oldTransaction: Transaction, newTransaction: Transaction) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  addTransfer: (payload: TransferPayload) => Promise<void>;
}

// Create the context
const TransactionContext = createContext<ITransactionContext | undefined>(undefined);

// Create the provider component
export function TransactionProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const transactions = useLiveQuery(() => db.transactions.orderBy('date').reverse().toArray(), [], []);
  
  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>, source: 'manual' | 'system' | 'scheduled' = 'manual') => {
    const txId = uuidv4();
    
    const newTransaction: Transaction = {
        ...transaction,
        id: txId,
    };
    
    await db.transaction('rw', db.wallets, db.transactions, db.history, async () => {
        const wallet = await db.wallets.get(newTransaction.walletId);
        if (wallet) {
            const newBalance = newTransaction.type === 'income'
                ? wallet.balance + newTransaction.amount
                : wallet.balance - newTransaction.amount;
            await db.wallets.update(wallet.id, { balance: newBalance });
        }
        await db.transactions.add(newTransaction);
        await logHistory({ action: 'create', entity: 'transaction', entityId: txId, newValue: newTransaction, description: `Transaction of ${newTransaction.amount} recorded.`, context: { source, amount: newTransaction.amount, type: newTransaction.type } });
    });
  }, []);

  const updateTransaction = useCallback(async (oldTransaction: Transaction, newTransaction: Transaction) => {
    await db.transaction('rw', db.wallets, db.transactions, db.debts, db.history, async () => {
        // Revert old transaction amount from the correct wallet
        const oldWallet = await db.wallets.get(oldTransaction.walletId);
        if (oldWallet) {
            const revertedBalance = oldTransaction.type === 'income' 
                ? oldWallet.balance - oldTransaction.amount 
                : oldWallet.balance + oldTransaction.amount;
            await db.wallets.update(oldWallet.id, { balance: revertedBalance });
        }
        
        // If wallet was changed, get the balance of the wallet that is now correct
        const currentWalletState = await db.wallets.get(newTransaction.walletId);
        if (!currentWalletState) return;

        // Apply new transaction amount to the new wallet
        const finalBalance = newTransaction.type === 'income' 
            ? currentWalletState.balance + newTransaction.amount 
            : currentWalletState.balance - newTransaction.amount;
        await db.wallets.update(newTransaction.walletId, { balance: finalBalance });
        
        await db.transactions.put(newTransaction);
        await logHistory({ action: 'update', entity: 'transaction', entityId: newTransaction.id, oldValue: oldTransaction, newValue: newTransaction, changes: diffObjects(oldTransaction, newTransaction), description: `Transaction ${newTransaction.id} updated.` });
        
        // Update linked debt if it exists
        if(newTransaction.debtId) {
            const debt = await db.debts.get(newTransaction.debtId);
            if (debt && debt.sourceTransactionId === newTransaction.id) {
                 await db.debts.update(debt.id, {
                    initialAmount: newTransaction.amount,
                    startDate: newTransaction.date,
                    notes: newTransaction.notes,
                    tags: newTransaction.tags,
                    attachments: newTransaction.attachments,
                 });
                 // This debt update should also be logged, but it might be complex to do it here without causing circular dependencies.
                 // For now, logging the transaction update is the main goal.
            }
        }
    });
  }, []);
  
  const deleteTransaction = useCallback(async (transactionId: string) => {
    await db.transaction('rw', db.wallets, db.transactions, db.history, db.restoreBin, async () => {
        const transactionToDelete = await db.transactions.get(transactionId);
        if (!transactionToDelete) return;
        
        const restoreId = uuidv4();
        let isTransfer = !!transactionToDelete.transferId;
        
        // If it's a transfer, handle both sides
        if (isTransfer) {
            const otherSideTx = await db.transactions.get(transactionToDelete.transferId!);
            if (otherSideTx) {
                // Move both to restore bin
                await db.restoreBin.add({ id: restoreId, entity: 'transaction', entityId: transactionId, payload: transactionToDelete, deletedAt: new Date().toISOString() });
                await db.restoreBin.add({ id: uuidv4(), entity: 'transaction', entityId: otherSideTx.id, payload: otherSideTx, deletedAt: new Date().toISOString(), originActionId: restoreId });

                // Revert balances
                const wallet1 = await db.wallets.get(transactionToDelete.walletId);
                if (wallet1) {
                    const newBalance1 = transactionToDelete.type === 'income' ? wallet1.balance - transactionToDelete.amount : wallet1.balance + transactionToDelete.amount;
                    await db.wallets.update(wallet1.id, { balance: newBalance1 });
                }
                const wallet2 = await db.wallets.get(otherSideTx.walletId);
                if (wallet2) {
                    const newBalance2 = otherSideTx.type === 'income' ? wallet2.balance - otherSideTx.amount : wallet2.balance + otherSideTx.amount;
                    await db.wallets.update(wallet2.id, { balance: newBalance2 });
                }

                // Delete from main table
                await db.transactions.delete(transactionToDelete.id);
                await db.transactions.delete(otherSideTx.id);

                await logHistory({ action: 'delete', entity: 'transaction', entityId: transactionId, oldValue: transactionToDelete, status: 'pending', restoreId: restoreId, description: `Transfer transaction deleted.` });
            }
        } else {
            // Handle single transaction deletion
            await db.restoreBin.add({ id: restoreId, entity: 'transaction', entityId: transactionId, payload: transactionToDelete, deletedAt: new Date().toISOString() });
            
            const wallet = await db.wallets.get(transactionToDelete.walletId);
            if (wallet) {
                const newBalance = transactionToDelete.type === 'income' ? wallet.balance - transactionToDelete.amount : wallet.balance + transactionToDelete.amount;
                await db.wallets.update(wallet.id, { balance: newBalance });
            }
            
            await db.transactions.delete(transactionToDelete.id);
            await logHistory({ action: 'delete', entity: 'transaction', entityId: transactionId, oldValue: transactionToDelete, status: 'pending', restoreId: restoreId, description: `Transaction ${transactionId} deleted.` });
        }
        toast({ title: t('toastTransactionDeleted'), description: t('toastTransactionDeletedDesc') });
    });
  }, [t]);

  const addTransfer = useCallback(async (payload: TransferPayload) => {
      const { fromWalletId, toWalletId, amount, date, notes, tags } = payload;

      await db.transaction('rw', db.wallets, db.transactions, db.categories, db.history, async () => {
          const fromWallet = await db.wallets.get(fromWalletId);
          const toWallet = await db.wallets.get(toWalletId);
          const transferCategory = await db.categories.get("sys-transfer");

          if (!fromWallet || !toWallet || !transferCategory) {
              toast({ title: "Transfer failed", description: "Wallets or Transfer category not found.", variant: "destructive" });
              return;
          }
          
          const expenseId = uuidv4();
          const incomeId = uuidv4();

          const expenseTransaction: Transaction = {
              id: expenseId, type: 'expense', amount, walletId: fromWalletId, categoryId: transferCategory.id, date,
              notes: notes || `Transfer to ${toWallet.name}`, tags: tags || [], transferId: incomeId, attachments: [],
          };
          const incomeTransaction: Transaction = {
              id: incomeId, type: 'income', amount, walletId: toWalletId, categoryId: transferCategory.id, date,
              notes: notes || `Transfer from ${fromWallet.name}`, tags: tags || [], transferId: expenseId, attachments: [],
          };
          
          await db.wallets.update(fromWalletId, { balance: fromWallet.balance - amount });
          await db.wallets.update(toWalletId, { balance: toWallet.balance + amount });
          await db.transactions.bulkAdd([expenseTransaction, incomeTransaction]);
          
          await logHistory({ action: 'create', entity: 'transaction', entityId: expenseId, newValue: expenseTransaction, description: `Transfer of ${amount} from "${fromWallet.name}" to "${toWallet.name}".`, context: { source: 'system', type: 'transfer' } });
      });
  }, []);

  const contextValue = useMemo(() => ({
    transactions: transactions || [],
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addTransfer,
  }), [transactions, addTransaction, updateTransaction, deleteTransaction, addTransfer]);

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
}

// Create a custom hook to use the context
export function useTransaction() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransaction must be used within a TransactionProvider');
  }
  return context;
}
