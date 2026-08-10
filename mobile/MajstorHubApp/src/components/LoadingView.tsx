import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, useTheme } from 'react-native-paper';

export function LoadingView({ fullScreen = false }: { fullScreen?: boolean }) {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, fullScreen && { backgroundColor: theme.colors.background }]}
    >
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
