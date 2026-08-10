import { View } from 'react-native';
import { SegmentedButtons, Text } from 'react-native-paper';
import { useWorkMode } from '../contexts/WorkModeContext';
import type { WorkMode } from '../contexts/WorkModeContext';

export function RoleSwitcher() {
  const { mode, setMode } = useWorkMode();

  return (
    <View style={{ gap: 8 }}>
      <Text variant="labelLarge">I'm using MajstorHub as a</Text>
      <SegmentedButtons
        value={mode}
        onValueChange={(value) => setMode(value as WorkMode)}
        buttons={[
          { value: 'client', label: 'Client', icon: 'magnify' },
          { value: 'craftsman', label: 'Craftsman', icon: 'account-hard-hat' },
        ]}
      />
    </View>
  );
}