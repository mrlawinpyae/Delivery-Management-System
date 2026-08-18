import en from './en.json';
import mm from './mm.json';

export const dictionary = {
  en,
  mm,
} as const;

export type Language = keyof typeof dictionary;
export type TranslationKey = keyof typeof en;
