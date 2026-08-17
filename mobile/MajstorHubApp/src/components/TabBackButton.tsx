import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useTabHistory } from '../contexts/TabHistoryContext';
import { useTranslation } from '../i18n';

export function TabBackButton() {
  const { canGoBack, goBack } = useTabHistory();
  const t = useTranslation();

  if (!canGoBack) return null;

  return (
    <View style={styles.root}>
      <IconButton icon="arrow-left" size={22} style={styles.button} onPress={goBack} accessibilityLabel={t.common.back} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    margin: 0,
  },
});