import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getCraftsmanProfile } from '../api/craftsmen';
import { ApiError } from '../api/client';
import { useAuth } from './AuthContext';

export type WorkMode = 'client' | 'craftsman';

interface WorkModeContextValue {
  mode: WorkMode;
  hasCraftsmanProfile: boolean;
  isLoading: boolean;
  setMode: (mode: WorkMode) => void;
  refreshHasCraftsmanProfile: () => Promise<void>;
}

const WorkModeContext = createContext<WorkModeContextValue | undefined>(undefined);

export function WorkModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mode, setMode] = useState<WorkMode>('client');
  const [hasCraftsmanProfile, setHasCraftsmanProfile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const detect = useCallback(async (userId: string) => {
    try {
      await getCraftsmanProfile(userId);
      setHasCraftsmanProfile(true);
      setMode('craftsman');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setHasCraftsmanProfile(false);
        setMode('client');
        return;
      }
      throw err;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setHasCraftsmanProfile(false);
      setMode('client');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    detect(user.id)
      .catch(() => {
        setHasCraftsmanProfile(false);
        setMode('client');
      })
      .finally(() => setIsLoading(false));
  }, [user, detect]);

  const refreshHasCraftsmanProfile = useCallback(async () => {
    if (!user) return;
    await detect(user.id).catch(() => setHasCraftsmanProfile(false));
  }, [user, detect]);

  const value = useMemo<WorkModeContextValue>(
    () => ({ mode, hasCraftsmanProfile, isLoading, setMode, refreshHasCraftsmanProfile }),
    [mode, hasCraftsmanProfile, isLoading, refreshHasCraftsmanProfile],
  );

  return <WorkModeContext.Provider value={value}>{children}</WorkModeContext.Provider>;
}

export function useWorkMode(): WorkModeContextValue {
  const context = useContext(WorkModeContext);
  if (!context) throw new Error('useWorkMode must be used within a WorkModeProvider');
  return context;
}