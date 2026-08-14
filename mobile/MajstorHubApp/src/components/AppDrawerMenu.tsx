import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Badge, Drawer, Text, useTheme } from 'react-native-paper';
import { mainNavItems } from '../navigation/mainNavItems';
import { navigationRef } from '../navigation/navigationRef';
import { useWorkMode } from '../contexts/WorkModeContext';
import { useChat } from '../contexts/ChatContext';
import { useTranslation } from '../i18n';

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
  // Kept mounted through the closing animation - Modal's own `visible` prop
  // would unmount it instantly, cutting off the slide-out.
  const [mounted, setMounted] = useState(false);
  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(translateX, { toValue: 0, duration: ANIMATION_MS, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateX, { toValue: DRAWER_WIDTH, duration: ANIMATION_MS, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) setMounted(false);
        },
      );
    }
  }, [visible, translateX]);

  if (!mounted) return null;

  const items = mainNavItems.filter((item) => item.modes.includes(mode));

  const navigateTo = (key: (typeof items)[number]['key']) => {
    onClose();
    if (navigationRef.isReady()) {
      navigationRef.navigate(key as never);
    }
  };

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t.common.cancel} />
        <Animated.View
          style={[
            styles.panel,
            {
              width: DRAWER_WIDTH,
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
              backgroundColor: theme.colors.surface,
              transform: [{ translateX }],
            },
          ]}
        >
          <Text variant="titleLarge" style={styles.header}>
            {t.common.appName}
          </Text>
          <Drawer.Section showDivider={false}>
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
        </Animated.View>
      </View>
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
});
