import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getCraftsmanProfile } from '../api/craftsmen';
import { ApiError } from '../api/client';
import { useAuth } from './AuthContext';
import type { Role } from '../types/api';

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

  // A freshly-registered Craftsman has no CraftsmanProfile row yet (that's a
  // separate creation step), but they should still land in craftsman mode —
  // showing CraftsmanProfileEditor in "create" state — rather than defaulting
  // to client/browse just because the profile doesn't exist yet.
  const detect = useCallback(async (userId: string, registeredRole: Role) => {
    try {
      await getCraftsmanProfile(userId);
      setHasCraftsmanProfile(true);
      setMode('craftsman');
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setHasCraftsmanProfile(false);
        setMode(registeredRole === 'Craftsman' ? 'craftsman' : 'client');
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
    detect(user.id, user.role)
      .catch(() => {
        setHasCraftsmanProfile(false);
        setMode(user.role === 'Craftsman' ? 'craftsman' : 'client');
      })
      .finally(() => setIsLoading(false));
  }, [user, detect]);

  const refreshHasCraftsmanProfile = useCallback(async () => {
    if (!user) return;
    await detect(user.id, user.role).catch(() => setHasCraftsmanProfile(false));
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