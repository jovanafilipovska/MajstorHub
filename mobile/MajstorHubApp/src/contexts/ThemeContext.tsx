import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Appearance } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark';

const SECURE_STORE_KEY = 'majstorhub_theme_mode';

interface ThemeContextValue {
  mode: ThemeMode;
  isLoading: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      const resolved: ThemeMode = stored === 'dark' ? 'dark' : 'light';
      setModeState(resolved);
      Appearance.setColorScheme(resolved);
      setIsLoading(false);
    })();
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    await SecureStore.setItemAsync(SECURE_STORE_KEY, next);
    Appearance.setColorScheme(next);
    setModeState(next);
  }, []);

  const toggleTheme = useCallback(async () => {
    await setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, isLoading, setMode, toggleTheme }),
    [mode, isLoading, setMode, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeMode(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeMode must be used within a ThemeProvider');
  return context;
}
