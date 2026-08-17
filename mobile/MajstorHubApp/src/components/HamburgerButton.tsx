import { StyleSheet, View } from 'react-native';
import { IconButton, useTheme } from 'react-native-paper';
import { useAppDrawer } from '../contexts/DrawerContext';
import { useChat } from '../contexts/ChatContext';
import { useTranslation } from '../i18n';

export function HamburgerButton() {
  const { openDrawer } = useAppDrawer();
  const { totalUnread } = useChat();
  const theme = useTheme();
  const t = useTranslation();

  return (
    <View style={styles.root}>
      <IconButton
        icon="menu"
        size={22}
        style={styles.button}
        onPress={openDrawer}
        accessibilityLabel={t.common.menu}
      />
      {totalUnread > 0 && <View style={[styles.dot, { backgroundColor: theme.colors.error }]} />}
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
  dot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
