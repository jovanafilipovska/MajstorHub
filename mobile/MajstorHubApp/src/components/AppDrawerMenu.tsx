import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Button, Dialog, Divider, Drawer, Portal, Text, useTheme } from 'react-native-paper';
import { mainNavItems } from '../navigation/mainNavItems';
import { navigationRef } from '../navigation/navigationRef';
import { useAuth } from '../contexts/AuthContext';
import { useWorkMode } from '../contexts/WorkModeContext';
import { useChat } from '../contexts/ChatContext';
import { useTranslation } from '../i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

const DRAWER_WIDTH = Dimensions.get('window').width * 0.78;
const ANIMATION_MS = 250;

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AppDrawerMenu({ visible, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const t = useTranslation();
  const { mode } = useWorkMode();
  const { totalUnread } = useChat();
  const { logout } = useAuth();
  // Kept mounted through the closing animation - Modal's own `visible` prop
  // would unmount it instantly, cutting off the slide-out.
  const [mounted, setMounted] = useState(false);
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(translateX, { toValue: 0, duration: ANIMATION_MS, useNativeDriver: true }).start();
      return;
    }

    Animated.timing(translateX, { toValue: DRAWER_WIDTH, duration: ANIMATION_MS, useNativeDriver: true }).start();
    // Animated's own `finished` flag is unreliable across interruptions (e.g. a
    // Fast Refresh reload mid-animation) - if it never reports finished:true,
    // `mounted` gets stuck true forever, leaving this Modal's full-screen
    // backdrop blocking the whole app. A plain timer matched to the animation
    // duration is deterministic; the ref guard skips the unmount if the drawer
    // was reopened before the timer fired.
    const timeout = setTimeout(() => {
      if (!visibleRef.current) setMounted(false);
    }, ANIMATION_MS);
    return () => clearTimeout(timeout);
  }, [visible, translateX]);

  if (!mounted) return null;

  const items = mainNavItems.filter((item) => item.modes.includes(mode));

  const navigateTo = (key: (typeof items)[number]['key']) => {
    onClose();
    if (navigationRef.isReady()) {
      navigationRef.navigate(key as never);
    }
  };

  const confirmLogout = () => {
    setLogoutDialogVisible(false);
    onClose();
    logout();
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Portal.Host>
        <View style={styles.root}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t.common.cancel} />
          <Animated.View
            style={[
              styles.panel,
              {
                width: DRAWER_WIDTH,
                paddingTop: insets.top + 12,
                paddingBottom: insets.bottom -18,
                backgroundColor: theme.colors.surface,
                transform: [{ translateX }],
              },
            ]}
          >
            <Text variant="titleLarge" style={styles.header}>
              {t.common.appName}
            </Text>
            <Drawer.Section showDivider={false} style={styles.navSection}>
              {items.map((item) => (
                <Drawer.Item
                  key={item.key}
                  icon={item.icon}
                  label={item.title(t)}
                  onPress={() => navigateTo(item.key)}
                  right={
                    item.key === 'MessagesTab' && totalUnread > 0 ? () => <Badge>{totalUnread}</Badge> : undefined
                  }
                />
              ))}
            </Drawer.Section>

            <Divider />
            <View style={styles.settingsRow}>
              <View style={styles.settingsItem}>
                <LanguageSwitcher />
              </View>
              <View style={styles.settingsItem}>
                <ThemeToggle />
              </View>
            </View>

            <Divider style={styles.logoutDivider} />
            <Drawer.Item
              icon="logout"
              label={t.common.logOut}
              onPress={() => setLogoutDialogVisible(true)}
              theme={{ colors: { onSurfaceVariant: theme.colors.error } }}
            />

            <Portal>
              <Dialog visible={logoutDialogVisible} onDismiss={() => setLogoutDialogVisible(false)}>
                <Dialog.Title>{t.drawer.logOutDialog.title}</Dialog.Title>
                <Dialog.Content>
                  <Text variant="bodyMedium">{t.drawer.logOutDialog.body}</Text>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => setLogoutDialogVisible(false)}>{t.common.cancel}</Button>
                  <Button onPress={confirmLogout} textColor={theme.colors.error}>
                    {t.common.logOut}
                  </Button>
                </Dialog.Actions>
              </Dialog>
            </Portal>
          </Animated.View>
        </View>
      </Portal.Host>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    height: '100%',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  navSection: {
    flex: 1,
  },
  settingsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  settingsItem: {
    flex: 1,
  },
  logoutDivider: {
    marginTop: 16,
  },
});
