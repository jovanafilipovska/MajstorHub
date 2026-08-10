import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { login as loginRequest, register as registerRequest } from '../api/auth';
import { getMe } from '../api/users';
import { setUnauthorizedHandler } from '../api/client';
import type { LoginRequest, RegisterRequest, UserResponse } from '../types/api';

const SECURE_STORE_KEY = 'majstorhub_token';

interface AuthContextValue {
  token: string | null;
  user: UserResponse | null;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
    });
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    (async () => {
      const stored = await SecureStore.getItemAsync(SECURE_STORE_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await getMe(stored);
        setToken(stored);
        setUser(me);
      } catch {
        await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await loginRequest(payload);
    await SecureStore.setItemAsync(SECURE_STORE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const response = await registerRequest(payload);
    await SecureStore.setItemAsync(SECURE_STORE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) return;
    const me = await getMe(token);
    setUser(me);
  }, [token]);

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isLoading, login, register, logout, refreshUser }),
    [token, user, isLoading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
