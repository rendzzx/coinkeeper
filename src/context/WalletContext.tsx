

"use client";

import React, { createContext, useContext, useMemo, ReactNode, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import type { Wallet, WalletType, Transaction } from '@/lib/types';
import { useTransaction } from './TransactionContext';
import { logHistory } from '@/lib/history';
import { diffObjects } from '@/lib/utils';
import { toast } from '@/hooks/use-toast-internal';
import { useTranslation } from '@/hooks/use-translation';

interface IWalletContext {
  wallets: Wallet[];
  walletTypes: WalletType[];
  addWallet: (wallet: Omit<Wallet, 'id' | 'balance'>, initialBalance: number) => Promise<void>;
  updateWallet: (wallet: Wallet, newValues: Partial<Wallet>) => Promise<void>;
  deleteWallet: (walletId: string) => Promise<void>;
  addWalletType: (walletType: Omit<WalletType, 'id'>) => Promise<void>;
  updateWalletType: (walletType: WalletType) => Promise<void>;
  deleteWalletType: (walletTypeId: string) => Promise<void>;
}

const WalletContext = createContext<IWalletContext | undefined>(undefined);

export function WalletProvider({ children, wallets, walletTypes }: { children: ReactNode, wallets: Wallet[], walletTypes: WalletType[] }) {
  const { addTransaction } = useTransaction();
  const { t } = useTranslation();

  const addWallet = useCallback(async (walletData: Omit<Wallet, 'id' | 'balance'>, initialBalance: number) => {
    const newWallet: Wallet = {
      ...walletData,
      id: uuidv4(),
      balance: 0, 
    };
    await db.wallets.add(newWallet);
    await logHistory({ action: 'create', entity: 'wallet', entityId: newWallet.id, newValue: newWallet, description: `Wallet "${newWallet.name}" created.` });
    toast({ title: t('toastWalletAdded'), description: t('toastWalletAddedDesc', { walletName: newWallet.name }) });
    
    if (initialBalance > 0) {
      const transaction: Omit<Transaction, 'id'> = {
        type: "income",
        amount: initialBalance,
        walletId: newWallet.id,
        categoryId: 'sys-initial',
        date: new Date().toISOString(),
        notes: "Initial balance",
        tags: [],
        attachments: [],
      };
      // addTransaction already logs its own history.
      await addTransaction(transaction);
    }
  }, [addTransaction, t]);

  const updateWallet = useCallback(async (wallet: Wallet, newValues: Partial<Wallet>) => {
    await db.transaction('rw', db.wallets, db.history, db.categories, db.transactions, async () => {
        const oldWallet = await db.wallets.get(wallet.id);
        const balanceDifference = (newValues.balance ?? wallet.balance) - wallet.balance;

        if (balanceDifference !== 0) {
            const adjustmentCategory = (await db.categories.get("sys-adjustment"));
            const transaction: Omit<Transaction, 'id'> = {
                type: balanceDifference > 0 ? "income" : "expense",
                amount: Math.abs(balanceDifference),
                walletId: wallet.id,
                categoryId: adjustmentCategory?.id || 'sys-adjustment',
                date: new Date().toISOString(),
                notes: "Balance adjustment",
                tags: [],
                attachments: [],
            };
            // addTransaction will handle logging for the transaction it creates.
            await addTransaction(transaction, 'system');
        }
        
        await db.wallets.update(wallet.id, { name: newValues.name, typeId: newValues.typeId, color: newValues.color });
        
        const updatedWallet = await db.wallets.get(wallet.id); // Re-fetch to get the final state
        await logHistory({ action: 'update', entity: 'wallet', entityId: wallet.id, oldValue: oldWallet, newValue: updatedWallet, changes: diffObjects(oldWallet!, updatedWallet!), description: `Wallet "${wallet.name}" updated.` });
    });
  }, [addTransaction]);

  const deleteWallet = useCallback(async (walletId: string) => {
    await db.transaction('rw', db.wallets, db.transactions, db.history, db.restoreBin, async () => {
        const walletToDelete = await db.wallets.get(walletId);
        if (!walletToDelete) return;

        const restoreId = uuidv4();
        await db.restoreBin.add({ id: restoreId, entity: 'wallet', entityId: walletId, payload: walletToDelete, deletedAt: new Date().toISOString() });
        await db.wallets.delete(walletId);

        // Also soft-delete associated transactions
        const associatedTransactions = await db.transactions.where('walletId').equals(walletId).toArray();
        for (const tx of associatedTransactions) {
            const txRestoreId = uuidv4();
            await db.restoreBin.add({ id: txRestoreId, entity: 'transaction', entityId: tx.id, payload: tx, deletedAt: new Date().toISOString() });
            await db.transactions.delete(tx.id);
            await logHistory({ action: 'delete', entity: 'transaction', entityId: tx.id, oldValue: tx, status: 'pending', restoreId: txRestoreId, description: `Transaction deleted due to wallet deletion.`, context: { source: 'system' } });
        }
        
        await logHistory({ action: 'delete', entity: 'wallet', entityId: walletId, oldValue: walletToDelete, status: 'pending', restoreId: restoreId, description: `Wallet "${walletToDelete.name}" deleted.` });
    });
    toast({ title: t('toastWalletDeleted'), description: t('toastWalletDeletedDesc') });
  }, [t]);

  const addWalletType = useCallback(async (walletType: Omit<WalletType, 'id'>) => {
    const newId = uuidv4();
    const newWalletType = { ...walletType, id: newId };
    await db.walletTypes.add(newWalletType);
    await logHistory({ action: 'create', entity: 'walletType', entityId: newId, newValue: newWalletType, description: `Wallet type "${walletType.name}" created.` });
    toast({ title: t('toastWalletTypeAdded') });
  }, [t]);

  const updateWalletType = useCallback(async (walletType: WalletType) => {
    const oldWalletType = await db.walletTypes.get(walletType.id);
    await db.walletTypes.update(walletType.id, walletType);
    await logHistory({ action: 'update', entity: 'walletType', entityId: walletType.id, oldValue: oldWalletType, newValue: walletType, changes: diffObjects(oldWalletType!, walletType), description: `Wallet type "${walletType.name}" updated.` });
    toast({ title: t('toastWalletTypeUpdated') });
  }, [t]);

  const deleteWalletType = useCallback(async (walletTypeId: string) => {
    const oldWalletType = await db.walletTypes.get(walletTypeId);
    if (oldWalletType) {
        const restoreId = uuidv4();
        await db.restoreBin.add({ id: restoreId, entity: 'walletType', entityId: walletTypeId, payload: oldWalletType, deletedAt: new Date().toISOString() });
        await db.walletTypes.delete(walletTypeId);
        await logHistory({ action: 'delete', entity: 'walletType', entityId: walletTypeId, oldValue: oldWalletType, status: 'pending', restoreId: restoreId, description: `Wallet type "${oldWalletType.name}" deleted.` });
    }
    toast({ title: t('toastWalletTypeDeleted') });
  }, [t]);

  const contextValue = useMemo(() => ({
    wallets,
    walletTypes,
    addWallet,
    updateWallet,
    deleteWallet,
    addWalletType,
    updateWalletType,
    deleteWalletType,
  }), [wallets, walletTypes, addWallet, updateWallet, deleteWallet, addWalletType, updateWalletType, deleteWalletType]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
