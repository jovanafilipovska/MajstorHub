import type { Language } from '../contexts/LanguageContext';
import type { ServiceCategoryResponse } from '../types/api';

export function localizedText(en: string, mk: string, sq: string, language: Language): string {
  if (language === 'mk') return mk || en;
  if (language === 'sq') return sq || en;
  return en;
}

export function getCategoryName(category: ServiceCategoryResponse, language: Language): string {
  return localizedText(category.nameEn, category.nameMk, category.nameSq, language);
}

export function getCategoryDescription(category: ServiceCategoryResponse, language: Language): string | undefined {
  return localizedText(category.descriptionEn ?? '', category.descriptionMk ?? '', category.descriptionSq ?? '', language) || undefined;
}