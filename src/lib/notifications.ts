
"use client";

import type { AppSettings, Budget, Debt, ScheduledTransaction } from "./types";
import { formatCurrency } from "./utils";
import { logHistory } from "./history";

type TFunction = (key: any, replacements?: any) => string;

// A centralized function to request permission if needed.
const checkNotificationPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
        console.warn("This browser does not support desktop notification");
        return false;
    }
    if (Notification.permission === 'granted') {
        return true;
    }
    if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    }
    return false;
};

export const sendBudgetNotification = async (budget: Budget, progress: number, spent: number, t: TFunction) => {
    if (!budget.enableNotifications) return;

    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return;

    const threshold = 90;
    const isExceeded = progress >= 100;
    const isWarning = progress >= threshold && progress < 100;

    // Use a tag that includes the date to ensure the notification is shown only once per day per state
    const today = new Date().toISOString().split('T')[0];

    if (isExceeded) {
        const description = t('budgetExceededWarning', { categoryName: budget.name });
         new Notification(t('budgetExceeded'), {
            body: description,
            tag: `budget-exceeded-${budget.id}-${today}`, // Tag to prevent duplicate notifications for the same day
        });
        await logHistory({ action: 'notification', entity: 'budget', entityId: budget.id, description, status: 'success' });

    } else if (isWarning) {
        const description = t('budgetUsageWarning', { progress: Math.floor(progress), categoryName: budget.name });
        new Notification(t('budgetAlert'), {
            body: description,
            tag: `budget-warning-${budget.id}-${today}`,
        });
        await logHistory({ action: 'notification', entity: 'budget', entityId: budget.id, description, status: 'success' });
    }
};

export const sendDebtNotification = async (debt: Debt, settings: AppSettings, t: TFunction) => {
    if (!debt.enableNotifications || debt.status !== 'active' || !debt.dueDate) return;

    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return;

    const today = new Date().toISOString().split('T')[0];
    
    if (new Date(debt.dueDate) < new Date()) {
        const remaining = debt.initialAmount - debt.paidAmount;
        const description = t('debtOverdueBody', { person: debt.person, amount: formatCurrency(remaining, settings.currency, false, settings.numberFormat, settings.decimalPlaces) });
        new Notification(t('debtOverdue'), {
            body: description,
            tag: `debt-overdue-${debt.id}-${today}`,
        });
        await logHistory({ action: 'notification', entity: 'debt', entityId: debt.id, description, status: 'success' });
    }
};

export const sendScheduledTransactionNotification = async (schedule: ScheduledTransaction, settings: AppSettings, t: TFunction) => {
    const hasPermission = await checkNotificationPermission();
    if (!hasPermission) return;
    
    const description = t('toastScheduleExecutedBody', { name: schedule.name, amount: formatCurrency(schedule.amount, settings.currency, false, settings.numberFormat, settings.decimalPlaces) });
    new Notification(t('toastScheduleExecuted'), {
        body: description,
        tag: `schedule-executed-${schedule.id}-${new Date().getTime()}`, // Unique tag for each execution
    });
     await logHistory({ action: 'notification', entity: 'scheduled', entityId: schedule.id, description, status: 'success' });
};
