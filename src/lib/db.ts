
// /src/lib/db.ts
import Dexie, { type Table } from 'dexie';
import type { 
    Wallet, 
    Transaction, 
    Category, 
    Tag, 
    Budget, 
    AppSettings, 
    WalletType, 
    ScheduledTransaction, 
    Debt,
    HistoryLog,
    RestoreBinItem,
    Action
} from './types';

// Define a type for the settings table, which stores the single settings object.
// We'll use a known key to always access the same entry.
export interface SettingsEntry {
    key: 'userSettings';
    value: AppSettings;
}

export class CoinKeeperDB extends Dexie {
    wallets!: Table<Wallet, string>;
    transactions!: Table<Transaction, string>;
    categories!: Table<Category, string>;
    tags!: Table<Tag, string>;
    budgets!: Table<Budget, string>;
    walletTypes!: Table<WalletType, string>;
    scheduledTransactions!: Table<ScheduledTransaction, string>;
    debts!: Table<Debt, string>;
    settings!: Table<SettingsEntry, string>;
    history!: Table<HistoryLog, string>;
    restoreBin!: Table<RestoreBinItem, string>;
    
    // Add a dispatch property
    dispatch!: (action: Action) => Promise<void>;

    constructor() {
        super('CoinKeeperDB');
        this.version(1).stores({
            wallets: '&id, name',
            transactions: '&id, date, walletId, categoryId, amount, *tags',
            categories: '&id, type, name',
            tags: '&id, name, color',
            budgets: '&id, type',
            walletTypes: '&id',
            scheduledTransactions: '&id, nextDueDate, frequency, status',
            debts: '&id, status, type, dueDate',
            settings: '&key'
        });
        
        this.version(2).stores({
            history: '&id, timestamp, action, entity, entityId, *context'
        }).upgrade(tx => {
            // This upgrade function is intentionally left empty.
            // It's only here to create the new 'history' table for new and existing users.
            // No data migration is needed for this version change.
            console.log("Upgrading database to version 2, adding history table.");
        });

        this.version(3).stores({
            restoreBin: '&id, entity, entityId, deletedAt'
        }).upgrade(tx => {
            console.log("Upgrading database to version 3, adding restoreBin table.");
        });

        this.version(4).stores({
            history: '&id, timestamp, action, entity, entityId, *context, restoreId'
        }).upgrade(tx => {
            console.log("Upgrading database to version 4, adding restoreId index to history table.");
        });

        this.version(5).stores({
            scheduledTransactions: '&id, nextDueDate, frequency, status, lastRun'
        }).upgrade(tx => {
            console.log("Upgrading database to version 5, adding lastRun index to scheduledTransactions table.");
        });
    }
}

export const db = new CoinKeeperDB();

