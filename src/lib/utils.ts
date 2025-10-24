

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Category, Wallet } from "./types";
import { AppSettings } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "USD", hideAmounts: boolean = false, numberFormat: 'IDR' | 'USD' = 'USD', decimalPlaces: number = 2) {
  if (hideAmounts) {
    return '*****';
  }
  
  const locale = numberFormat === 'IDR' ? 'id-ID' : 'en-US';

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);
}

export function getCategoryName(categories: Category[], categoryId: string): string {
    for (const category of categories) {
        if (category.id === categoryId) {
            return category.name;
        }
        const subCategory = category.subcategories.find(sc => sc.id === categoryId);
        if (subCategory) {
            return subCategory.name;
        }
    }
    return "N/A";
}

export function getWalletName(wallets: Wallet[], walletId: string): string {
    const wallet = wallets.find(w => w.id === walletId);
    return wallet ? wallet.name : "N/A";
}

export function formatDateTime(
    dateString: string,
    language: AppSettings['language'] = 'en',
    timeFormat: AppSettings['timeFormat'] = '24h'
): string {
    const date = new Date(dateString);
    const locale = language === 'id' ? 'id-ID' : 'en-US';
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: timeFormat === '12h',
    };
    return new Intl.DateTimeFormat(locale, options).format(date);
}

export function diffObjects<T extends object>(oldObj: T, newObj: Partial<T>): Record<string, { old: any; new: any }> | null {
  if (!oldObj) return null;
  const changes: Record<string, { old: any; new: any }> = {};
  let hasChanges = false;

  for (const key in newObj) {
    if (Object.prototype.hasOwnProperty.call(newObj, key)) {
      const oldVal = oldObj[key as keyof T];
      const newVal = newObj[key as keyof T];
      // Simple JSON stringify comparison to handle nested objects/arrays in a basic way
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes[key] = { old: oldVal, new: newVal };
        hasChanges = true;
      }
    }
  }
  return hasChanges ? changes : null;
}
