import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { useWorkMode } from '../contexts/WorkModeContext';

const MODE_LABELS = { client: 'Customer', craftsman: 'Provider' } as const;

export function RoleSwitcher() {
  const { mode, setMode } = useWorkMode();
  const nextMode = mode === 'client' ? 'craftsman' : 'client';

  return (
    <Button
      mode="outlined"
      icon="swap-horizontal"
      onPress={() => setMode(nextMode)}
      style={styles.pill}
      contentStyle={styles.pillContent}
    >
      {`${MODE_LABELS[mode]} mode ⇄ ${MODE_LABELS[nextMode]}`}
    </Button>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'center',
    borderRadius: 20,
  },
  pillContent: {
    paddingHorizontal: 4,
  },
});