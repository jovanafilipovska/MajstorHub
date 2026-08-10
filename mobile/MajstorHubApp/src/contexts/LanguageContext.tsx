import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

// Persists the chosen language, but nothing reads it to translate UI text yet
// — that wiring is a deliberate follow-up pass, not part of this one.
export type Language = 'mk' | 'sq' | 'en';

const SECURE_STORE_KEY = 'majstorhub_language';
const VALID_LANGUAGES: Language[] = ['mk', 'sq', 'en'];

interface LanguageContextValue {
  language: Language;
  isLoading: boolean;
  setLanguage: (language: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('mk');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      const resolved = VALID_LANGUAGES.includes(stored as Language) ? (stored as Language) : 'mk';
      setLanguageState(resolved);
      setIsLoading(false);
    })();
  }, []);

  const setLanguage = useCallback(async (next: Language) => {
    await SecureStore.setItemAsync(SECURE_STORE_KEY, next);
    setLanguageState(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ language, isLoading, setLanguage }),
    [language, isLoading, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
