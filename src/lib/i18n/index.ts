
import en from './en.json';
import id from './id.json';

export const translations = {
  en,
  id,
};

export type TranslationKey = keyof typeof en & keyof typeof id;
