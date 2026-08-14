import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AppDrawerMenu } from '../components/AppDrawerMenu';

interface DrawerContextValue {
  visible: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);

  const openDrawer = useCallback(() => setVisible(true), []);
  const closeDrawer = useCallback(() => setVisible(false), []);

  const value = useMemo<DrawerContextValue>(() => ({ visible, openDrawer, closeDrawer }), [visible, openDrawer, closeDrawer]);

  return (
    <DrawerContext.Provider value={value}>
      {children}
      <AppDrawerMenu visible={visible} onClose={closeDrawer} />
    </DrawerContext.Provider>
  );
}

export function useAppDrawer(): DrawerContextValue {
  const context = useContext(DrawerContext);
  if (!context) throw new Error('useAppDrawer must be used within a DrawerProvider');
  return context;
}
