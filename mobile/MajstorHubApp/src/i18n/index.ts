import { useLanguage } from '../contexts/LanguageContext';
import type { Language } from '../contexts/LanguageContext';
import { en } from './en';
import { mk } from './mk';
import { sq } from './sq';
import type { Translations } from './types';

const dictionaries: Record<Language, Translations> = { en, mk, sq };

export function useTranslation(): Translations {
  const { language } = useLanguage();
  return dictionaries[language];
}

export type { Translations };
export { apiErrorMessage } from './apiErrors';