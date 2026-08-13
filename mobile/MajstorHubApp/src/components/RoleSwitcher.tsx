import { SegmentedButtons } from 'react-native-paper';
import { useWorkMode } from '../contexts/WorkModeContext';
import type { WorkMode } from '../contexts/WorkModeContext';
import { useTranslation } from '../i18n';

export function RoleSwitcher() {
  const { mode, setMode } = useWorkMode();
  const t = useTranslation();

  return (
    <SegmentedButtons
      value={mode}
      onValueChange={(value) => setMode(value as WorkMode)}
      buttons={[
        { value: 'client', label: t.roleSwitcher.customer, icon: 'account' },
        { value: 'craftsman', label: t.roleSwitcher.provider, icon: 'hammer-wrench' },
      ]}
    />
  );
}