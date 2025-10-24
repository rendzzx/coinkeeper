

"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState } from 'react';
import type { AppState, Action, Budget, Category, Tag, SubCategory, Debt, RestoreBinItem, AppContextValue } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { initialMockState } from './AppContextLoader';
import type { Transaction } from '@/lib/types';
import { logHistory } from '@/lib/history';
import { diffObjects } from '@/lib/utils';
import { useWallet } from './WalletContext';
import { toast } from '@/hooks/use-toast-internal';
import { translations, type TranslationKey } from '@/lib/i18n';
import { useSettings } from './SettingsContext';

async function handleDispatch(action: Action) {
    await db.transaction('rw', [db.wallets, db.transactions, db.categories, db.tags, db.budgets, db.walletTypes, db.scheduledTransactions, db.debts, db.settings, db.history, db.restoreBin], async () => {
        // We can't use the useSettings hook here directly, so we read it from DB when needed.
        // This is a bit inefficient, but it's the price for keeping this logic outside a component.
        const settingsEntry = await db.settings.get('userSettings');
        const lang = settingsEntry?.value.language || 'en';
        const t = (key: TranslationKey, replacements?: any) => {
            let translation = translations[lang]?.[key] || translations['en'][key] || key;
            if (replacements) {
                Object.keys(replacements).forEach(rKey => {
                    translation = translation.replace(`{{${rKey}}}`, String(replacements[rKey]));
                })
            }
            return translation;
        };

        switch (action.type) {
            case 'SET_STATE':
                await db.transaction('rw', db.tables, async () => {
                    await Promise.all(Object.keys(initialMockState).map(key => {
                        const tableKey = key as keyof AppState;
                        if (['transactions', 'wallets', 'walletTypes', 'settings', 'scheduledTransactions'].includes(tableKey)) {
                            return Promise.resolve();
                        }
                        // @ts-ignore
                        return db[tableKey].bulkPut(action.payload[tableKey]);
                    }));
                });
                await logHistory({ action: 'system', entity: 'other', description: 'Application state reset or imported.' });
                break;
            
            case 'ADD_BUDGET':
                await db.budgets.add(action.payload);
                await logHistory({ action: 'create', entity: 'budget', entityId: action.payload.id, newValue: action.payload, description: `Budget "${action.payload.name}" created.` });
                toast({ title: t('toastBudgetAdded') });
                break;
            case 'UPDATE_BUDGET': {
                const oldBudget = await db.budgets.get(action.payload.id);
                await db.budgets.update(action.payload.id, action.payload);
                await logHistory({ action: 'update', entity: 'budget', entityId: action.payload.id, oldValue: oldBudget, newValue: action.payload, changes: diffObjects(oldBudget!, action.payload), description: `Budget "${action.payload.name}" updated.` });
                toast({ title: t('toastBudgetUpdated') });
                break;
            }
            case 'DELETE_BUDGET': {
                const oldBudget = await db.budgets.get(action.payload);
                if (oldBudget) {
                    const restoreId = uuidv4();
                    await db.restoreBin.add({ id: restoreId, entity: 'budget', entityId: oldBudget.id, payload: oldBudget, deletedAt: new Date().toISOString() });
                    await db.budgets.delete(action.payload);
                    await logHistory({ action: 'delete', entity: 'budget', entityId: action.payload, oldValue: oldBudget, status: 'pending', restoreId, description: `Budget "${oldBudget.name}" deleted.` });
                    toast({ title: t('toastBudgetDeleted'), description: t('toastBudgetDeletedDesc', { budgetName: oldBudget.name }) });
                }
                break;
            }

            case 'ADD_CATEGORY':
                await db.categories.add(action.payload);
                await logHistory({ action: 'create', entity: 'category', entityId: action.payload.id, newValue: action.payload, description: `Category "${action.payload.name}" created.` });
                toast({ title: t('toastCategoryAdded') });
                break;
            case 'UPDATE_CATEGORY': {
                const oldCategory = await db.categories.get(action.payload.id);
                await db.categories.update(action.payload.id, action.payload);
                 await logHistory({ action: 'update', entity: 'category', entityId: action.payload.id, oldValue: oldCategory, newValue: action.payload, changes: diffObjects(oldCategory!, action.payload), description: `Category "${action.payload.name}" updated.` });
                 toast({ title: t('toastCategoryUpdated') });
                break;
            }
            case 'DELETE_CATEGORY': {
                const oldCategory = await db.categories.get(action.payload);
                if (oldCategory) {
                    const restoreId = uuidv4();
                    await db.restoreBin.add({ id: restoreId, entity: 'category', entityId: oldCategory.id, payload: oldCategory, deletedAt: new Date().toISOString() });
                    await db.categories.delete(action.payload);
                    await logHistory({ action: 'delete', entity: 'category', entityId: action.payload, oldValue: oldCategory, status: 'pending', restoreId, description: `Category "${oldCategory.name}" deleted.` });
                    toast({ title: t('toastCategoryDeleted'), variant: "destructive" });
                }
                break;
            }
            
            case 'ADD_SUBCATEGORY': {
                const { parentCategoryId, subCategory } = action.payload;
                const parent = await db.categories.get(parentCategoryId);
                if (parent) {
                    const newValue = { subcategories: [...parent.subcategories, subCategory] };
                    await db.categories.update(parentCategoryId, newValue);
                    await logHistory({ action: 'update', entity: 'category', entityId: parentCategoryId, description: `Subcategory "${subCategory.name}" added to "${parent.name}".`, newValue: subCategory, context: { source: 'manual' } });
                    toast({ title: t('toastSubcategoryAdded') });
                }
                break;
            }
            case 'UPDATE_SUBCATEGORY': {
                const { parentCategoryId, subCategory } = action.payload;
                const parent = await db.categories.get(parentCategoryId);
                if (parent) {
                    const oldSubCategory = parent.subcategories.find(sc => sc.id === subCategory.id);
                    const updatedSubcategories = parent.subcategories.map(sc => sc.id === subCategory.id ? subCategory : sc);
                    await db.categories.update(parentCategoryId, { subcategories: updatedSubcategories });
                    await logHistory({ action: 'update', entity: 'category', entityId: subCategory.id, oldValue: oldSubCategory, newValue: subCategory, changes: diffObjects(oldSubCategory!, subCategory), description: `Subcategory "${subCategory.name}" updated.` });
                    toast({ title: t('toastSubcategoryUpdated') });
                }
                break;
            }
            case 'DELETE_SUBCATEGORY': {
                const { parentCategoryId, subCategoryId } = action.payload;
                const parent = await db.categories.get(parentCategoryId);
                if (parent) {
                    const oldSubCategory = parent.subcategories.find(sc => sc.id === subCategoryId);
                    if (oldSubCategory) {
                        const restoreId = uuidv4();
                        await db.restoreBin.add({ id: restoreId, entity: 'category', entityId: oldSubCategory.id, payload: { ...oldSubCategory, parentCategoryId }, deletedAt: new Date().toISOString() });
                        const updatedSubcategories = parent.subcategories.filter(sc => sc.id !== subCategoryId);
                        await db.categories.update(parentCategoryId, { subcategories: updatedSubcategories });
                        await logHistory({ action: 'delete', entity: 'category', entityId: subCategoryId, oldValue: oldSubCategory, status: 'pending', restoreId, description: `Subcategory "${oldSubCategory.name}" deleted.` });
                        toast({ title: t('toastSubcategoryDeleted'), variant: "destructive" });
                    }
                }
                break;
            }
            
            case 'ADD_TAG':
                await db.tags.add(action.payload);
                await logHistory({ action: 'create', entity: 'tag', entityId: action.payload.id, newValue: action.payload, description: `Tag "${action.payload.name}" created.` });
                toast({ title: t('toastTagAdded') });
                break;
            case 'UPDATE_TAG': {
                const oldTag = await db.tags.get(action.payload.id);
                await db.tags.update(action.payload.id, action.payload);
                await logHistory({ action: 'update', entity: 'tag', entityId: action.payload.id, oldValue: oldTag, newValue: action.payload, changes: diffObjects(oldTag!, action.payload), description: `Tag "${action.payload.name}" updated.` });
                toast({ title: t('toastTagUpdated') });
                break;
            }
            case 'DELETE_TAG': {
                const oldTag = await db.tags.get(action.payload);
                if (oldTag) {
                    const restoreId = uuidv4();
                    await db.restoreBin.add({ id: restoreId, entity: 'tag', entityId: oldTag.id, payload: oldTag, deletedAt: new Date().toISOString() });
                    await db.tags.delete(action.payload);
                    await logHistory({ action: 'delete', entity: 'tag', entityId: action.payload, oldValue: oldTag, status: 'pending', restoreId, description: `Tag "${oldTag.name}" deleted.` });
                    toast({ title: t('toastTagDeleted') });
                }
                break;
            }

            case 'ADD_DEBT': {
                const debtPayload = action.payload;
                if (debtPayload.sourceTransactionId) {
                    await db.debts.add(debtPayload);
                    const newCategory = debtPayload.type === 'debt' ? 'sub-sys-debt-2' : 'sub-sys-debt-1';
                    await db.transactions.update(debtPayload.sourceTransactionId, { debtId: debtPayload.id, categoryId: newCategory });
                    await logHistory({ action: 'create', entity: 'debt', entityId: debtPayload.id, newValue: debtPayload, description: `Debt for "${debtPayload.person}" created from existing transaction.` });
                } else {
                    const transactionType = debtPayload.type === 'debt' ? 'income' : 'expense';
                    const categoryId = debtPayload.type === 'debt' ? 'sub-sys-debt-2' : 'sub-sys-debt-1';
                    const newTransactionId = uuidv4();
                    const newTransaction: Transaction = {
                        id: newTransactionId, type: transactionType, amount: debtPayload.initialAmount, walletId: debtPayload.walletId!,
                        categoryId: categoryId, date: debtPayload.startDate, notes: debtPayload.notes || `Initial amount for ${debtPayload.type} with ${debtPayload.person}`,
                        tags: debtPayload.tags || [], attachments: debtPayload.attachments, debtId: debtPayload.id,
                    };
                    const updatedDebt = { ...debtPayload, sourceTransactionId: newTransactionId };
                    
                    await db.debts.add(updatedDebt);
                    await db.transactions.add(newTransaction);
                    
                    const wallet = await db.wallets.get(debtPayload.walletId!);
                    if (wallet) {
                        const newBalance = transactionType === 'income' ? wallet.balance + debtPayload.initialAmount : wallet.balance - debtPayload.initialAmount;
                        await db.wallets.update(wallet.id, { balance: newBalance });
                    }
                    await logHistory({ action: 'create', entity: 'debt', entityId: updatedDebt.id, newValue: updatedDebt, description: `Debt for "${updatedDebt.person}" created.` });
                    await logHistory({ action: 'create', entity: 'transaction', entityId: newTransaction.id, newValue: newTransaction, description: `Source transaction for debt created.`, context: { source: 'system' } });
                }
                toast({ title: t('toastDebtAdded') });
                break;
            }
            case 'UPDATE_DEBT': {
                const oldDebt = await db.debts.get(action.payload.id);
                await db.debts.update(action.payload.id, action.payload);
                await logHistory({ action: 'update', entity: 'debt', entityId: action.payload.id, oldValue: oldDebt, newValue: action.payload, changes: diffObjects(oldDebt!, action.payload), description: `Debt for "${action.payload.person}" updated.` });
                toast({ title: t('toastDebtUpdated') });
                break;
            }
            case 'DELETE_DEBT': {
                const oldDebt = await db.debts.get(action.payload);
                if (oldDebt) {
                    const restoreId = uuidv4();
                    await db.restoreBin.add({ id: restoreId, entity: 'debt', entityId: oldDebt.id, payload: oldDebt, deletedAt: new Date().toISOString() });
                    await db.debts.delete(action.payload);
                    // Note: This does not soft-delete linked transactions. A full implementation would need to handle that.
                    await logHistory({ action: 'delete', entity: 'debt', entityId: action.payload, oldValue: oldDebt, status: 'pending', restoreId, description: `Debt for "${oldDebt.person}" deleted.` });
                    toast({ title: t('toastDebtDeleted'), description: t('toastDebtDeletedDesc', { person: oldDebt.person }) });
                }
                break;
            }

            case 'ADD_DEBT_PAYMENT': {
                const { debtId, transaction } = action.payload;
                const debtToUpdate = await db.debts.get(debtId);
                if (!debtToUpdate) return;
                
                const newPaidAmount = debtToUpdate.paidAmount + transaction.amount;
                const newStatus = newPaidAmount >= debtToUpdate.initialAmount ? 'paid' : 'active';
                
                await db.debts.update(debtId, {
                    paidAmount: newPaidAmount,
                    status: newStatus,
                });
                
                await db.transactions.add(transaction);

                const wallet = await db.wallets.get(transaction.walletId);
                if (wallet) {
                    const newBalance = transaction.type === 'income' ? wallet.balance + transaction.amount : wallet.balance - transaction.amount;
                    await db.wallets.update(wallet.id, { balance: newBalance });
                }
                 await logHistory({ action: 'create', entity: 'transaction', entityId: transaction.id, newValue: transaction, description: `Payment of ${transaction.amount} for debt "${debtToUpdate.person}".`, context: { source: 'manual', amount: transaction.amount, type: transaction.type } });
                 if(newStatus === 'paid') {
                    await logHistory({ action: 'update', entity: 'debt', entityId: debtId, description: `Debt for "${debtToUpdate.person}" marked as paid.` });
                 }
                break;
            }
            case 'RESTORE_FROM_BIN': {
                const binItem = await db.restoreBin.get(action.payload);
                if (!binItem) return;

                // Restore logic based on entity type
                switch(binItem.entity) {
                    case 'wallet':
                        await db.wallets.add(binItem.payload);
                        break;
                    case 'transaction':
                        await db.transactions.add(binItem.payload);
                        const wallet = await db.wallets.get(binItem.payload.walletId);
                        if (wallet) {
                            const newBalance = binItem.payload.type === 'income' ? wallet.balance + binItem.payload.amount : wallet.balance - binItem.payload.amount;
                            await db.wallets.update(wallet.id, { balance: newBalance });
                        }
                        // Handle transfer restore
                        if (binItem.payload.transferId) {
                            const otherSideBinItem = await db.restoreBin.where({ entity: 'transaction', entityId: binItem.payload.transferId }).first();
                            if (otherSideBinItem) {
                                await db.transactions.add(otherSideBinItem.payload);
                                await db.restoreBin.delete(otherSideBinItem.id);
                                const otherHistoryLog = await db.history.where({ restoreId: otherSideBinItem.id }).first();
                                if (otherHistoryLog) await db.history.update(otherHistoryLog.id, { status: 'success' });
                            }
                        }
                        break;
                    case 'budget':
                        await db.budgets.add(binItem.payload);
                        break;
                    case 'tag':
                        await db.tags.add(binItem.payload);
                        break;
                    case 'category':
                        // If it's a subcategory
                        if (binItem.payload.parentCategoryId) {
                            const parent = await db.categories.get(binItem.payload.parentCategoryId);
                            if (parent) {
                                parent.subcategories.push(binItem.payload);
                                await db.categories.put(parent);
                            }
                        } else { // It's a main category
                            await db.categories.add(binItem.payload);
                        }
                        break;
                    // Add other entity types here
                }
                
                const historyLog = await db.history.where({ restoreId: binItem.id }).first();
                if (historyLog) {
                    await db.history.update(historyLog.id, { status: 'success', restoreId: null });
                }
                
                await db.restoreBin.delete(binItem.id);
                await logHistory({ action: 'restore', entity: binItem.entity, entityId: binItem.entityId, newValue: binItem.payload, description: `Restored ${binItem.entity} "${binItem.payload.name || binItem.entityId}".` });
                toast({ title: t('toastItemRestored'), description: t('toastItemRestoredDesc') });
                break;
            }
            case 'PERMANENT_DELETE_FROM_BIN': {
                 const binItem = await db.restoreBin.get(action.payload);
                if (!binItem) return;
                
                const historyLog = await db.history.where({ restoreId: binItem.id }).first();
                if (historyLog) {
                    await db.history.update(historyLog.id, { status: 'success', restoreId: null });
                }
                
                await db.restoreBin.delete(binItem.id);
                await logHistory({ action: 'delete', entity: binItem.entity, entityId: binItem.entityId, oldValue: binItem.payload, status: 'success', description: `Permanently deleted ${binItem.entity} "${binItem.payload.name || binItem.entityId}".` });
                toast({ title: t('toastItemPermanentlyDeleted'), description: t('toastItemPermanentlyDeletedDesc'), variant: 'destructive' });
                break;
            }
        }
    });
}
// Augment the db instance with the dispatch method
db.dispatch = handleDispatch;


const AppContext = createContext<AppContextValue | undefined>(undefined);


export function AppProvider({ children, initialState }: { children: ReactNode, initialState: Omit<AppState, 'settings' | 'wallets' | 'walletTypes' | 'transactions'> }) {
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [pageTitle, setPageTitle] = useState<string>('');

  if (!initialState) {
    return null; // Or a loading spinner
  }

  return (
    <AppContext.Provider value={{ state: initialState, dispatch: handleDispatch, isPageTransitioning, setIsPageTransitioning, pageTitle, setPageTitle }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
