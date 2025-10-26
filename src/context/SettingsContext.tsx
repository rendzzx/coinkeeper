'use client';

import React, {
  createContext,
  useContext,
  useMemo,
  ReactNode,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';
import {useLiveQuery} from 'dexie-react-hooks';
import {db} from '@/lib/db';
import type {AppSettings, User} from '@/lib/types';
import {initialMockState} from './AppContextLoader';
import {logHistory} from '@/lib/history';
import {diffObjects} from '@/lib/utils';

const SESSION_CACHE_KEY = 'coinKeeperSettingsState';
const CACHE_VERSION = '1.0.9';
const DEBOUNCE_DELAY = 500;

// Define the shape of the context
interface ISettingsContext {
  settings: AppSettings;
  updateSettings: (
    newSettings: Partial<Omit<AppSettings, 'user'>> & {user?: Partial<User>}
  ) => Promise<void>;
}

// Create the context
const SettingsContext = createContext<ISettingsContext | undefined>(undefined);

function getInitialCache(devMode: boolean): AppSettings | null {
  try {
    if (devMode) console.time('Load settings from sessionStorage');
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) {
      if (devMode) console.timeEnd('Load settings from sessionStorage');
      return null;
    }
    const parsed = JSON.parse(raw);
    if (parsed.version === CACHE_VERSION) {
      if (devMode) {
        console.info(
          '%c[Cache] Loaded settings from sessionStorage',
          'color:#3b82f6;font-weight:bold;'
        );
        console.timeEnd('Load settings from sessionStorage');
      }
      return parsed.state;
    }
  } catch (err) {
    console.error('[Cache] Failed to parse settings cache:', err);
  }
  if (devMode) console.timeEnd('Load settings from sessionStorage');
  return null;
}

// Create the provider component
export function SettingsProvider({children}: {children: ReactNode}) {
  const devModeRef = useRef(initialMockState.settings.devMode); // Ref to hold devMode without causing re-renders
  const [cachedState, setCachedState] = useState<AppSettings | null>(() =>
    getInitialCache(devModeRef.current)
  );
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const liveSettings = useLiveQuery(() => db.settings.get('userSettings'), []);

  useEffect(() => {
    if (liveSettings?.value) {
      devModeRef.current = liveSettings.value.devMode;

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(() => {
        try {
          sessionStorage.setItem(
            SESSION_CACHE_KEY,
            JSON.stringify({version: CACHE_VERSION, state: liveSettings.value})
          );
          if (devModeRef.current) {
            console.info(
              `%c[Cache] Settings cache updated at ${new Date().toLocaleTimeString()}`,
              'color:#f59e0b;font-weight:bold;'
            );
          }
        } catch (err) {
          console.error('[Cache] Failed to update settings cache:', err);
        }
      }, DEBOUNCE_DELAY);
    }
  }, [liveSettings]);

  const settings = useMemo(() => {
    return liveSettings?.value ?? cachedState ?? initialMockState.settings;
  }, [liveSettings, cachedState]);

  const updateSettings = useCallback(
    async (
      newSettings: Partial<Omit<AppSettings, 'user'>> & {user?: Partial<User>}
    ) => {
      await db.transaction('rw', db.settings, db.history, async () => {
        const currentSettingsEntry = await db.settings.get('userSettings');
        const currentSettings =
          currentSettingsEntry?.value || initialMockState.settings;

        if (currentSettings.devMode) {
          console.time(`[Settings] UPDATE`);
          console.info('[Settings] Updating settings:', newSettings);
        }

        let updatedSettings: AppSettings;

        if (newSettings.user && currentSettings.user) {
          const updatedUser = {...currentSettings.user, ...newSettings.user};
          updatedSettings = {
            ...currentSettings,
            ...newSettings,
            user: updatedUser,
          };
        } else {
          updatedSettings = {...currentSettings, ...newSettings} as AppSettings;
        }

        await db.settings.put({key: 'userSettings', value: updatedSettings});

        await logHistory({
          action: 'update',
          entity: 'settings',
          entityId: 'userSettings',
          oldValue: currentSettings,
          newValue: updatedSettings,
          changes: diffObjects(currentSettings, newSettings),
          description: 'Application settings updated.',
        });

        if (currentSettings.devMode) {
          console.timeEnd(`[Settings] UPDATE`);
        }
      });
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      settings,
      updateSettings,
    }),
    [settings, updateSettings]
  );

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

// Create a custom hook to use the context
export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
