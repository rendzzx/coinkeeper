"use client";

import {type ReactNode, useState, useEffect, useMemo, useRef} from "react";
import {v4 as uuidv4} from "uuid";
import {AppProvider} from "./AppContext";
import type {
  AppState,
  Category,
  DashboardCardKey,
  Transaction,
} from "@/lib/types";
import {AnimatedLogo} from "@/components/icons/AnimatedLogo";
import {db} from "@/lib/db";
import {useLiveQuery} from "dexie-react-hooks";

import {WalletProvider} from "./WalletContext";
import {TransactionProvider} from "./TransactionContext";
import {ScheduledTransactionProvider} from "./ScheduledTransactionContext";

import mockWallets from "@/lib/mock-data/wallets.json";
import mockWalletTypes from "@/lib/mock-data/wallet-types.json";
import mockTransactions from "@/lib/mock-data/transactions.json";
import mockCategories from "@/lib/mock-data/categories.json";
import mockTags from "@/lib/mock-data/tags.json";
import mockBudgetsData from "@/lib/mock-data/budgets.json";
import mockScheduledTransactions from "@/lib/mock-data/scheduled-transactions.json";
import mockDebts from "@/lib/mock-data/debts.json";
import mockSettings from "@/lib/mock-data/settings.json";
import {ALL_NAV_ITEMS, ALL_DASHBOARD_CARDS} from "@/lib/config-data";
import {SettingsProvider, useSettings} from "./SettingsContext";

export const initialMockState: AppState = {
  wallets: mockWallets,
  walletTypes: mockWalletTypes,
  transactions: (mockTransactions as Transaction[]).map((t) => ({
    ...t,
    date: new Date(t.date).toISOString(),
  })),
  scheduledTransactions: mockScheduledTransactions,
  categories: mockCategories as Category[],
  tags: mockTags,
  budgets: mockBudgetsData,
  debts: mockDebts,
  settings: {
    user: mockSettings.user,
    currency: mockSettings.currency as "USD" | "IDR" | "EUR",
    language: mockSettings.language as "en" | "id",
    theme: "system",
    timeFormat: mockSettings.timeFormat as "12h" | "24h",
    hideAmounts: mockSettings.hideAmounts,
    numberFormat: mockSettings.numberFormat as "IDR" | "USD",
    decimalPlaces: mockSettings.decimalPlaces,
    navItemOrder: ALL_NAV_ITEMS.map((item) => item.id),
    dashboardCardOrder: ALL_DASHBOARD_CARDS.map((c) => c.id),
    dashboardCardVisibility: ALL_DASHBOARD_CARDS.reduce((acc, card) => {
      acc[card.id] = true;
      return acc;
    }, {} as Record<DashboardCardKey, boolean>),
    devMode: false,
    toastDuration: mockSettings.toastDuration,
    passwordHash: mockSettings.passwordHash,
    passwordHint: mockSettings.passwordHint,
  },
  history: [],
  restoreBin: [],
};

const SESSION_CACHE_KEY = "coinKeeperAppState_Main";
const CACHE_VERSION = "1.3.1"; // Version updated to include all data
const DEBOUNCE_DELAY = 500;

async function initializeDatabase() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    console.log(
      "%c[DB] Populating with mock data...",
      "color:#22c55e;font-weight:bold;"
    );

    const user = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    const settingsWithUser = {...initialMockState.settings, user};

    await db.transaction("rw", db.tables, async () => {
      await db.wallets.bulkAdd(initialMockState.wallets);
      await db.walletTypes.bulkAdd(initialMockState.walletTypes);
      await db.transactions.bulkAdd(initialMockState.transactions);
      await db.categories.bulkAdd(initialMockState.categories);
      await db.tags.bulkAdd(initialMockState.tags);
      await db.budgets.bulkAdd(initialMockState.budgets);
      await db.scheduledTransactions.bulkAdd(
        initialMockState.scheduledTransactions
      );
      await db.debts.bulkAdd(initialMockState.debts);
      await db.settings.add({
        key: "userSettings",
        value: settingsWithUser,
      });
    });
  }
}

export function AppContextLoader({children}: {children: ReactNode}) {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initializeDatabase()
      .then(() => setDbReady(true))
      .catch((err) => console.error("[DB] Init failed:", err));
  }, []);

  if (!dbReady) {
    return null; // The initial loading is handled by InnerLayout in layout.tsx now
  }

  return (
    <SettingsProvider>
      <AppProviderWithLiveQueries>{children}</AppProviderWithLiveQueries>
    </SettingsProvider>
  );
}

function getInitialCache(devMode: boolean): AppState | null {
  try {
    if (devMode) console.time("Load main context from sessionStorage");
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) {
      if (devMode) console.timeEnd("Load main context from sessionStorage");
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed.version === CACHE_VERSION) {
      if (devMode) {
        console.info(
          "%c[Cache] Loaded main context from sessionStorage",
          "color:#3b82f6;font-weight:bold;"
        );
        console.timeEnd("Load main context from sessionStorage");
      }
      return parsed.state;
    }
  } catch (err) {
    console.error("[Cache] Failed to parse main context cache:", err);
  }
  if (devMode) console.timeEnd("Load main context from sessionStorage");
  return null;
}

// A component dedicated to managing the session cache without affecting the main render tree.
function AppContextCacheManager({liveState}: {liveState: any}) {
  const {settings} = useSettings();
  const devMode = settings?.devMode ?? false;
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (liveState) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        try {
          sessionStorage.setItem(
            SESSION_CACHE_KEY,
            JSON.stringify({version: CACHE_VERSION, state: liveState})
          );
          if (devMode) {
            console.info(
              `%c[Cache] Main context session cache updated at ${new Date().toLocaleTimeString()}`,
              "color:#f59e0b;font-weight:bold;"
            );
          }
        } catch (err) {
          console.error("[Cache] Failed to update main context cache:", err);
        }
      }, DEBOUNCE_DELAY);
    }
  }, [liveState, devMode]);

  return null; // This component does not render anything.
}

function AppProviderWithLiveQueries({children}: {children: ReactNode}) {
  const {settings} = useSettings();
  const devMode = settings?.devMode ?? false;

  const [cachedState] = useState<AppState | null>(() =>
    getInitialCache(devMode)
  );

  // Fetch all data centrally
  const wallets = useLiveQuery(
    () => db.wallets.toArray(),
    [],
    cachedState?.wallets
  );
  const walletTypes = useLiveQuery(
    () => db.walletTypes.toArray(),
    [],
    cachedState?.walletTypes
  );
  const transactions = useLiveQuery(
    () => db.transactions.orderBy("date").reverse().toArray(),
    [],
    cachedState?.transactions
  );
  const scheduledTransactions = useLiveQuery(
    () => db.scheduledTransactions.toArray(),
    [],
    cachedState?.scheduledTransactions
  );
  const categories = useLiveQuery(
    () => db.categories.toArray(),
    [],
    cachedState?.categories
  );
  const tags = useLiveQuery(() => db.tags.toArray(), [], cachedState?.tags);
  const budgets = useLiveQuery(
    () => db.budgets.toArray(),
    [],
    cachedState?.budgets
  );
  const debts = useLiveQuery(() => db.debts.toArray(), [], cachedState?.debts);
  const history = useLiveQuery(
    () => db.history.orderBy("timestamp").reverse().toArray(),
    [],
    cachedState?.history
  );
  const restoreBin = useLiveQuery(
    () => db.restoreBin.toArray(),
    [],
    cachedState?.restoreBin
  );

  const initialStateToRender = useMemo<AppState | null>(() => {
    // Check if all live queries have returned data
    if (
      wallets &&
      walletTypes &&
      transactions &&
      categories &&
      tags &&
      budgets &&
      debts &&
      scheduledTransactions &&
      history &&
      restoreBin
    ) {
      return {
        wallets,
        walletTypes,
        transactions,
        categories,
        tags,
        budgets,
        debts,
        scheduledTransactions,
        history,
        restoreBin,
        settings: settings, // settings are now managed by SettingsProvider
      };
    }
    // If not all live queries are ready, return the cached state
    return cachedState;
  }, [
    wallets,
    walletTypes,
    transactions,
    categories,
    tags,
    budgets,
    debts,
    scheduledTransactions,
    history,
    restoreBin,
    cachedState,
    settings,
  ]);

  if (!initialStateToRender) {
    // This state should be very brief as it's only hit if cache is empty and DB is not ready.
    // The main loading indicator is now in layout.tsx's InnerLayout
    return null;
  }

  // Separate the state for the main AppContext from the data passed to other providers
  const {
    wallets: liveWallets,
    walletTypes: liveWalletTypes,
    transactions: liveTransactions,
    ...mainAppState
  } = initialStateToRender;

  return (
    <AppProvider initialState={mainAppState}>
      <AppContextCacheManager liveState={initialStateToRender} />
      <TransactionProvider>
        <WalletProvider wallets={liveWallets!} walletTypes={liveWalletTypes!}>
          <ScheduledTransactionProvider>
            {children}
          </ScheduledTransactionProvider>
        </WalletProvider>
      </TransactionProvider>
    </AppProvider>
  );
}
