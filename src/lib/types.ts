export interface HistoryLog {
  id: string; // uuid
  timestamp: string; // ISO string
  action:
    | 'create'
    | 'update'
    | 'delete'
    | 'system'
    | 'notification'
    | 'sync'
    | 'restore';
  entity:
    | 'wallet'
    | 'transaction'
    | 'scheduled'
    | 'debt'
    | 'budget'
    | 'settings'
    | 'category'
    | 'tag'
    | 'walletType'
    | 'other';
  entityId?: string | null; // id entitas (jika relevan)
  description?: string; // ringkasan human readable
  userId?: string | null; // optional (future BYOC multi-user)
  context?: {
    // optional, metadata
    walletId?: string | null;
    categoryId?: string | null;
    amount?: number | null;
    type?: string | null; // income/expense/transfer/...
    source?: 'manual' | 'scheduled' | 'system' | 'import' | 'sync';
    device?: string | null;
  };
  oldValue?: any | null; // JSON serializable
  newValue?: any | null; // JSON serializable
  changes?: Record<string, {old: any; new: any}> | null;
  status?: 'success' | 'failed' | 'pending';
  version?: string; // schema/app version
  restoreId?: string | null; // when moved to restore bin (for undo)
}

export type RestoreBinItem = {
  id: string; // uuid for the bin entry itself
  entity: HistoryLog['entity'];
  entityId: string;
  payload: any; // the full object that was deleted
  deletedAt: string; // ISO string
  originActionId?: string; // Optional: ID of the history log that triggered the deletion
};

export type Attachment = {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
};

export type WalletType = {
  id: string;
  name: string;
  icon: string; // lucide icon name
};

export type Wallet = {
  id: string;
  name: string;
  balance: number;
  typeId: string;
  color?: string;
};

export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  walletId: string;
  categoryId: string;
  date: string; // ISO string
  notes?: string;
  tags: string[];
  transferId?: string; // Used to link two sides of a transfer
  attachments?: Attachment[];
  debtId?: string; // Used to link a payment to a debt
};

export type ScheduledTransaction = {
  id: string;
  name: string;
  amount: number;
  type: TransactionType;
  walletId: string;
  categoryId: string;
  startDate: string; // ISO string
  time: string; // HH:mm:ss
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  endDate?: string | null; // ISO string
  nextDueDate: string; // ISO string
  lastRun: string | null; // ISO string of the last time it successfully ran
  status: 'active' | 'completed';
  locked?: boolean;
  notes?: string;
  tags: string[];
};

export type TransferPayload = {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  date: string; // ISO string
  notes?: string;
  tags?: string[];
};

export type SubCategory = {
  id: string;
  name: string;
  icon: string;
  color?: string;
  isSystem?: boolean;
  defaultName?: string;
  defaultIcon?: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string; // lucide icon name
  type: 'income' | 'expense' | 'all';
  color?: string;
  subcategories: SubCategory[];
  isSystem?: boolean;
  defaultName?: string;
  defaultIcon?: string;
};

export type Tag = {
  id: string;
  name: string;
  color?: string;
};

export type Budget = {
  id: string;
  name: string;
  categoryIds: string[];
  tags: string[];
  amount: number;
  type: 'periodic' | 'one-time';
  startDate?: string; // ISO String for one-time budgets
  endDate?: string; // ISO String for one-time budgets
  enableNotifications?: boolean;
};

export type Debt = {
  id: string;
  person: string;
  type: 'debt' | 'loan'; // 'debt' = I owe, 'loan' = I am owed
  initialAmount: number;
  paidAmount: number;
  startDate: string; // ISO string
  dueDate: string | null;
  status: 'active' | 'paid';
  walletId?: string; // Wallet where the initial amount was received/given
  sourceTransactionId?: string; // The transaction created when the debt/loan was created
  linkedTransactionIds: string[];
  notes?: string;
  attachments?: Attachment[];
  enableNotifications?: boolean;
  tags?: string[];
};

export type NavItem = {
  id: string;
  href: string;
  label: string;
  icon: string;
};

export type DashboardCardKey =
  | 'totalBalance'
  | 'income'
  | 'expenses'
  | 'netIncome'
  | 'incomeExpenseChart'
  | 'expenseDistributionChart'
  | 'recentTransactions'
  | 'budgetOverview'
  | 'debtLoanOverview';

export type DashboardCardSetting = {
  id: DashboardCardKey;
  label: string;
};

export type User = {
  id: string;
  createdAt: string; // ISO string
  passwordHash: string | null;
  passwordHint: string | null;
  autoLockTimeout: number; // in seconds. 0 means never.
};

export type AppSettings = {
  user: User | null;
  currency: 'USD' | 'IDR' | 'EUR';
  language: 'en' | 'id';
  theme: 'light' | 'dark' | 'system';
  timeFormat: '12h' | '24h';
  hideAmounts: boolean;
  navItemOrder: string[];
  dashboardCardOrder: DashboardCardKey[];
  dashboardCardVisibility: Record<DashboardCardKey, boolean>;
  numberFormat: 'IDR' | 'USD';
  decimalPlaces: number;
  devMode: boolean;
  toastDuration: number;
};

export type AppState = {
  wallets: Wallet[];
  walletTypes: WalletType[];
  transactions: Transaction[];
  scheduledTransactions: ScheduledTransaction[];
  categories: Category[];
  tags: Tag[];
  budgets: Budget[];
  debts: Debt[];
  settings: AppSettings;
  history: HistoryLog[];
  restoreBin: RestoreBinItem[];
};

export type AppContextValue = {
  state: Omit<
    AppState,
    'settings' | 'wallets' | 'walletTypes' | 'transactions'
  >;
  dispatch: (action: Action) => void;
  isPageTransitioning: boolean;
  setIsPageTransitioning: React.Dispatch<React.SetStateAction<boolean>>;
  pageTitle: string;
  setPageTitle: React.Dispatch<React.SetStateAction<string>>;
  handleLock: () => void;
  setHandleLock: React.Dispatch<React.SetStateAction<() => void>>;
  handleExport: () => void;
  setHandleExport: React.Dispatch<React.SetStateAction<() => void>>;
  handleImport: () => void;
  setHandleImport: React.Dispatch<React.SetStateAction<() => void>>;
};

export type Action =
  | {type: 'SET_STATE'; payload: AppState}
  | {type: 'ADD_BUDGET'; payload: Budget}
  | {type: 'UPDATE_BUDGET'; payload: Budget}
  | {type: 'DELETE_BUDGET'; payload: string}
  | {type: 'ADD_CATEGORY'; payload: Category}
  | {type: 'UPDATE_CATEGORY'; payload: Category}
  | {type: 'DELETE_CATEGORY'; payload: string}
  | {
      type: 'ADD_SUBCATEGORY';
      payload: {parentCategoryId: string; subCategory: SubCategory};
    }
  | {
      type: 'UPDATE_SUBCATEGORY';
      payload: {parentCategoryId: string; subCategory: SubCategory};
    }
  | {
      type: 'DELETE_SUBCATEGORY';
      payload: {parentCategoryId: string; subCategoryId: string};
    }
  | {type: 'ADD_TAG'; payload: Tag}
  | {type: 'UPDATE_TAG'; payload: Tag}
  | {type: 'DELETE_TAG'; payload: string}
  | {type: 'ADD_DEBT'; payload: Debt}
  | {type: 'UPDATE_DEBT'; payload: Debt}
  | {type: 'DELETE_DEBT'; payload: string}
  | {
      type: 'ADD_DEBT_PAYMENT';
      payload: {debtId: string; transaction: Transaction};
    }
  | {type: 'RESTORE_FROM_BIN'; payload: string}
  | {type: 'PERMANENT_DELETE_FROM_BIN'; payload: string};
