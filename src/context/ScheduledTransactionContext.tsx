

"use client";

import React, { createContext, useContext, useMemo, ReactNode, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import type { ScheduledTransaction, AppSettings, Transaction } from '@/lib/types';
import { addDays, addWeeks, addMonths, addYears, setHours, setMinutes, setSeconds, isPast, startOfDay } from 'date-fns';
import { useTransaction } from './TransactionContext';
import { sendScheduledTransactionNotification } from '@/lib/notifications';
import { useSettings } from './SettingsContext';
import { translations, type TranslationKey } from '@/lib/i18n';
import { logHistory } from '@/lib/history';
import { diffObjects } from '@/lib/utils';
import { useAppContext } from './AppContext';
import { useLiveQuery } from 'dexie-react-hooks';

interface IScheduledTransactionContext {
    scheduledTransactions: ScheduledTransaction[];
    addScheduledTransaction: (schedule: Omit<ScheduledTransaction, 'id' | 'nextDueDate' | 'status' | 'lastRun'>) => Promise<void>;
    updateScheduledTransaction: (schedule: ScheduledTransaction) => Promise<void>;
    deleteScheduledTransaction: (scheduleId: string) => Promise<void>;
    processScheduledTransactions: () => Promise<void>;
}

const ScheduledTransactionContext = createContext<IScheduledTransactionContext | undefined>(undefined);

const calculateNextDueDate = (currentDueDate: Date, frequency: ScheduledTransaction['frequency']): Date => {
    switch (frequency) {
      case 'daily': return addDays(currentDueDate, 1);
      case 'weekly': return addWeeks(currentDueDate, 1);
      case 'monthly': return addMonths(currentDueDate, 1);
      case 'yearly': return addYears(currentDueDate, 1);
      case 'once':
      default:
          return currentDueDate;
    }
}

export function ScheduledTransactionProvider({ children }: { children: ReactNode }) {
    const { addTransaction } = useTransaction();
    const { settings } = useSettings();
    const scheduledTransactions = useLiveQuery(() => db.scheduledTransactions.toArray(), [], []);


    const t = useCallback((key: TranslationKey, replacements?: any) => {
        const lang = settings?.language || 'en';
        let translation = translations[lang]?.[key] || translations['en'][key] || key;
        if (replacements) {
            Object.keys(replacements).forEach(rKey => {
                translation = translation.replace(`{{${rKey}}}`, String(replacements[rKey]));
            })
        }
        return translation;
    }, [settings?.language]);

    const executeSchedule = useCallback(async (schedule: ScheduledTransaction, currentSettings: AppSettings) => {
        if (schedule.status === 'completed') return false;

        let hasChanges = false;
        const now = new Date();
        // Start checking from the last run date, or the start date if it has never run
        let currentDate = startOfDay(schedule.lastRun ? new Date(schedule.lastRun) : new Date(schedule.startDate));
        
        // If it's a subsequent run, calculate the next potential date
        if (schedule.lastRun) {
             currentDate = calculateNextDueDate(currentDate, schedule.frequency);
        }
       
        let createdTransactionIds: string[] = [];

        await db.transaction('rw', db.transactions, db.wallets, db.scheduledTransactions, db.history, async () => {
            while (currentDate <= now) {
                if (schedule.endDate && currentDate > new Date(schedule.endDate)) {
                    await db.scheduledTransactions.update(schedule.id, { status: 'completed' });
                    hasChanges = true;
                    break;
                }
                
                const [hours, minutes, seconds] = schedule.time.split(':').map(Number);
                let transactionDate = setHours(currentDate, hours);
                transactionDate = setMinutes(transactionDate, minutes);
                transactionDate = setSeconds(transactionDate, seconds || 0);
    
                const newTransactionId = uuidv4();
                await addTransaction({
                    amount: schedule.amount,
                    type: schedule.type,
                    walletId: schedule.walletId,
                    categoryId: schedule.categoryId,
                    date: transactionDate.toISOString(),
                    notes: schedule.notes || `Scheduled: ${schedule.name}`,
                    tags: schedule.tags,
                    attachments: [],
                }, 'scheduled');
                createdTransactionIds.push(newTransactionId);
                
                sendScheduledTransactionNotification(schedule, currentSettings, t);
                
                hasChanges = true;
                
                // Update lastRun date and lock the schedule
                await db.scheduledTransactions.update(schedule.id, { 
                    lastRun: currentDate.toISOString(),
                    locked: true,
                });
    
                if (schedule.frequency === 'once') {
                    await db.scheduledTransactions.update(schedule.id, { status: 'completed' });
                    break;
                }
                
                currentDate = calculateNextDueDate(currentDate, schedule.frequency);
            }

            if (createdTransactionIds.length > 0) {
                await logHistory({ action: 'system', entity: 'scheduled', entityId: schedule.id, description: `Scheduled transaction "${schedule.name}" ran and created ${createdTransactionIds.length} transaction(s).`, newValue: { createdTransactionIds } });
            }

            // After processing, set the next due date correctly for future runs
            if (schedule.status === 'active') {
                await db.scheduledTransactions.update(schedule.id, { nextDueDate: currentDate.toISOString() });
            }
        });
    
        return hasChanges;
    }, [addTransaction, t]);
    
    const processScheduledTransactions = useCallback(async () => {
        const activeSchedules = (scheduledTransactions || []).filter(s => s.status === 'active');
        if (!settings) return;
    
        for (const schedule of activeSchedules) {
            if (new Date(schedule.nextDueDate) <= new Date()) {
                await executeSchedule(schedule, settings);
            }
        }
    }, [settings, executeSchedule, scheduledTransactions]);

    useEffect(() => {
        const interval = setInterval(() => {
            processScheduledTransactions();
        }, 60 * 1000); // Run every minute

        // Run on initial load as well
        processScheduledTransactions();

        return () => clearInterval(interval);
    }, [processScheduledTransactions]);


    const addScheduledTransaction = useCallback(async (scheduleData: Omit<ScheduledTransaction, 'id' | 'nextDueDate' | 'status' | 'lastRun'>) => {
        const newId = uuidv4();
        
        let nextDueDate = new Date(scheduleData.startDate);
        if (scheduleData.frequency !== 'once') {
            while (nextDueDate < new Date()) {
                nextDueDate = calculateNextDueDate(nextDueDate, scheduleData.frequency);
            }
        }
        
        const newSchedule: ScheduledTransaction = {
            ...scheduleData,
            id: newId,
            nextDueDate: nextDueDate.toISOString(),
            status: 'active',
            lastRun: null, // It has never run before
            locked: false,
        };

        await db.scheduledTransactions.add(newSchedule);
        await logHistory({ action: 'create', entity: 'scheduled', entityId: newId, newValue: newSchedule, description: `Scheduled transaction "${newSchedule.name}" created.` });
        
        // Immediately process to catch up on any missed transactions
        await processScheduledTransactions();
    }, [processScheduledTransactions]);

    const updateScheduledTransaction = useCallback(async (schedule: ScheduledTransaction) => {
        const oldSchedule = await db.scheduledTransactions.get(schedule.id);
        if (!oldSchedule) return;
        
        await db.scheduledTransactions.update(schedule.id, schedule);
        await logHistory({ action: 'update', entity: 'scheduled', entityId: schedule.id, oldValue: oldSchedule, newValue: schedule, changes: diffObjects(oldSchedule!, schedule), description: `Scheduled transaction "${schedule.name}" updated.` });

    }, []);

    const deleteScheduledTransaction = useCallback(async (scheduleId: string) => {
        const oldSchedule = await db.scheduledTransactions.get(scheduleId);
        if (oldSchedule) {
            const restoreId = uuidv4();
            await db.restoreBin.add({ id: restoreId, entity: 'scheduled', entityId: scheduleId, payload: oldSchedule, deletedAt: new Date().toISOString() });
            await db.scheduledTransactions.delete(scheduleId);
            await logHistory({ action: 'delete', entity: 'scheduled', entityId: scheduleId, oldValue: oldSchedule, status: 'pending', restoreId: restoreId, description: `Scheduled transaction "${oldSchedule.name}" deleted.` });
        }
    }, []);

    const contextValue = useMemo(() => ({
        scheduledTransactions: scheduledTransactions || [],
        addScheduledTransaction,
        updateScheduledTransaction,
        deleteScheduledTransaction,
        processScheduledTransactions,
    }), [scheduledTransactions, addScheduledTransaction, updateScheduledTransaction, deleteScheduledTransaction, processScheduledTransactions]);

    return (
        <ScheduledTransactionContext.Provider value={contextValue}>
            {children}
        </ScheduledTransactionContext.Provider>
    );
}

export function useScheduledTransaction() {
    const context = useContext(ScheduledTransactionContext);
    if (context === undefined) {
        throw new Error('useScheduledTransaction must be used within a ScheduledTransactionProvider');
    }
    return context;
}
