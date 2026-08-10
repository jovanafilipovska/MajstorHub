import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.error }]}>
        {message}
      </Text>
      {onRetry && (
        <Button mode="outlined" onPress={onRetry}>
          Retry
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  message: {
    textAlign: 'center',
  },
});
