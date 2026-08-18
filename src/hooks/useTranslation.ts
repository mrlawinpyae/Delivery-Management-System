import { useLanguageStore } from '../store/useLanguageStore';
import { dictionary } from '../locales/dictionary';
import type { TranslationKey } from '../locales/dictionary';

export const useTranslation = () => {
  const { language, toggleLanguage } = useLanguageStore();

  const t = (key: TranslationKey | (string & {})): string => {
    // Cast to access dictionary dynamically while fallbacking to the key itself if not found
    const currentDict = dictionary[language] as Record<string, string>;
    return currentDict[key] || key;
  };

  return { t, language, toggleLanguage };
};
