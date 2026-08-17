import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { navigationRef } from '../navigation/navigationRef';
import type { MainTabParamList } from '../navigation/types';

type TabKey = keyof MainTabParamList;

const KNOWN_TAB_KEYS = new Set<string>([
  'DashboardTab',
  'BrowseTab',
  'BookingsTab',
  'AssistantTab',
  'MessagesTab',
  'ProfileTab',
]);

interface TabHistoryContextValue {
  canGoBack: boolean;
  goBack: () => void;
  handleStateChange: () => void;
}

const TabHistoryContext = createContext<TabHistoryContextValue | undefined>(undefined);

export function TabHistoryProvider({ children }: { children: ReactNode }) {
  // Browser-history style stack of distinct top-level tabs visited this session.
  // Navigating back to the entry just below the top collapses it instead of
  // growing forever, so hopping Profile -> Messages -> Profile -> Messages never
  // balloons the stack or ping-pongs indefinitely.
  const historyRef = useRef<TabKey[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);

  const handleStateChange = useCallback(() => {
    if (!navigationRef.isReady()) return;
    const state = navigationRef.getRootState();
    const routeName = state?.routes[state.index]?.name;

    if (!routeName || !KNOWN_TAB_KEYS.has(routeName)) {
      // Outside the main tab navigator (auth/admin) - drop stale history so a
      // later login starts clean instead of resuming a previous session's trail.
      if (historyRef.current.length > 0) {
        historyRef.current = [];
        setCanGoBack(false);
      }
      return;
    }

    const tab = routeName as TabKey;
    const history = historyRef.current;
    const top = history[history.length - 1];
    if (tab === top) return; // subpage push within the same tab - not a tab switch

    const belowTop = history[history.length - 2];
    if (belowTop === tab) {
      // Landed back on the entry just below the top - this is a "back" move,
      // collapse rather than push so the stack can't grow from ping-ponging.
      history.pop();
    } else {
      history.push(tab);
    }
    setCanGoBack(history.length > 1);
  }, []);

  const goBack = useCallback(() => {
    const history = historyRef.current;
    if (history.length < 2 || !navigationRef.isReady()) return;
    const target = history[history.length - 2];
    navigationRef.navigate(target as never);
  }, []);

  const value = useMemo<TabHistoryContextValue>(
    () => ({ canGoBack, goBack, handleStateChange }),
    [canGoBack, goBack, handleStateChange],
  );

  return <TabHistoryContext.Provider value={value}>{children}</TabHistoryContext.Provider>;
}

export function useTabHistory(): TabHistoryContextValue {
  const context = useContext(TabHistoryContext);
  if (!context) throw new Error('useTabHistory must be used within a TabHistoryProvider');
  return context;
}