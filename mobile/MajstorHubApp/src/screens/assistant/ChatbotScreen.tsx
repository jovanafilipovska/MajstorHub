import { useCallback, useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Button, Dialog, HelperText, IconButton, Portal, Text, TextInput, useTheme } from 'react-native-paper';
import { getChatbotConversation, resetChatbotConversation, sendChatbotMessage } from '../../api/chatbot';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkMode } from '../../contexts/WorkModeContext';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { HamburgerButton } from '../../components/HamburgerButton';
import { TabBackButton } from '../../components/TabBackButton';
import { ChatSuggestionCard } from '../../components/ChatSuggestionCard';
import { apiErrorMessage, useTranslation } from '../../i18n';
import { distanceKm } from '../../utils/geo';
import type { AssistantStackParamList } from '../../navigation/types';
import type { ChatbotMessageResponse, ChatbotMode } from '../../types/api';

type Props = NativeStackScreenProps<AssistantStackParamList, 'Chatbot'>;

interface Coordinates {
  latitude: number;
  longitude: number;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

export function ChatbotScreen({ navigation }: Props) {
  const { token } = useAuth();
  const { mode, hasCraftsmanProfile, isLoading: workModeLoading } = useWorkMode();
  const theme = useTheme();
  const t = useTranslation();
  const insets = useSafeAreaInsets();

  const backendMode: ChatbotMode = mode === 'craftsman' ? 'Craftsman' : 'Client';
  const unavailable = mode === 'craftsman' && !hasCraftsmanProfile;

  const [messages, setMessages] = useState<ChatbotMessageResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [resetVisible, setResetVisible] = useState(false);
  const [resetting, setResetting] = useState(false);

  useAutoDismiss(sendError, setSendError);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      } catch {
        // Best-effort only - the assistant still works without a device location.
      }
    })();
  }, []);

  const load = useCallback(() => {
    if (!token || unavailable) return;
    setError(null);
    getChatbotConversation(backendMode, token)
      .then((response) => {
        // Suggestions only ever come back on the live send-message response,
        // never persisted server-side - re-attach them here by message id so
        // returning to this screen (e.g. from a suggestion's profile) doesn't
        // wipe the cards this refetch has no way of knowing about.
        setMessages((prev) => {
          if (!prev) return response.messages;
          const suggestionsById = new Map(prev.filter((m) => m.suggestions).map((m) => [m.id, m.suggestions]));
          return response.messages.map((m) => ({ ...m, suggestions: m.suggestions ?? suggestionsById.get(m.id) }));
        });
      })
      .catch((err) => setError(apiErrorMessage(err, t, t.assistant.failedToLoad)));
  }, [token, backendMode, unavailable, t]);

  useFocusEffect(load);

  const onSend = async () => {
    const body = draft.trim();
    if (!body || !token || sending) return;
    setSendError(null);
    setSending(true);
    const optimisticMessage: ChatbotMessageResponse = {
      id: `temp-${Date.now()}`,
      role: 'User',
      content: body,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => (prev ? [...prev, optimisticMessage] : [optimisticMessage]));
    setDraft('');
    try {
      const assistantMessage = await sendChatbotMessage(
        { mode: backendMode, message: body, latitude: coords?.latitude, longitude: coords?.longitude },
        token,
      );
      setMessages((prev) => (prev ? [...prev, assistantMessage] : [assistantMessage]));
    } catch (err) {
      setSendError(apiErrorMessage(err, t, t.assistant.failedToSend));
    } finally {
      setSending(false);
    }
  };

  const confirmReset = async () => {
    if (!token) return;
    setResetting(true);
    try {
      await resetChatbotConversation(backendMode, token);
      setMessages([]);
      setResetVisible(false);
    } catch (err) {
      setSendError(apiErrorMessage(err, t, t.assistant.failedToReset));
    } finally {
      setResetting(false);
    }
  };

  if (workModeLoading) return <LoadingView fullScreen />;

  if (unavailable) {
    return (
      <View style={[styles.emptyState, { backgroundColor: theme.colors.background, paddingTop: insets.top + 24 }]}>
        <View style={styles.emptyStateHeader}>
          <View style={styles.headerLeft}>
            <TabBackButton />
            <Text variant="titleMedium">{t.assistant.title}</Text>
          </View>
          <HamburgerButton />
        </View>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {t.assistant.craftsmanProfileRequired}
        </Text>
        <Button mode="contained" onPress={() => navigation.getParent()?.navigate('ProfileTab' as never)}>
          {t.craftsmanDashboardScreen.goToProfile}
        </Button>
      </View>
    );
  }

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!messages) return <LoadingView fullScreen />;

  const greeting = mode === 'craftsman' ? t.assistant.craftsmanGreeting : t.assistant.clientGreeting;
  const displayMessages: ChatbotMessageResponse[] =
    messages.length === 0
      ? [{ id: 'greeting', role: 'Assistant', content: greeting, createdAt: new Date().toISOString() }]
      : messages;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12, borderBottomColor: theme.colors.outlineVariant }]}>
        <View style={styles.headerLeft}>
          <TabBackButton />
          <Text variant="titleLarge">{t.assistant.title}</Text>
        </View>
        <View style={styles.headerActions}>
          <IconButton icon="refresh" onPress={() => setResetVisible(true)} disabled={messages.length === 0} />
          <HamburgerButton />
        </View>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={[...displayMessages].reverse()}
        inverted
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          sending ? (
            <View style={[styles.bubbleRow]}>
              <View style={[styles.bubble, { backgroundColor: theme.colors.surfaceVariant }]}>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>{t.assistant.thinking}</Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const isOwn = item.role === 'User';
          return (
            <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
              <View style={styles.bubbleColumn}>
                <View style={[styles.bubble, { backgroundColor: isOwn ? theme.colors.primary : theme.colors.surfaceVariant }]}>
                  <Text style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>
                    {item.content}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={[styles.time, { color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
                {!isOwn && item.suggestions && item.suggestions.length > 0 && (
                  <View style={styles.suggestionsColumn}>
                    {item.suggestions.map((suggestion) => (
                      <ChatSuggestionCard
                        key={suggestion.userId}
                        item={suggestion}
                        distanceLabel={
                          coords && suggestion.latitude != null && suggestion.longitude != null
                            ? formatDistance(
                                distanceKm(coords, { latitude: suggestion.latitude, longitude: suggestion.longitude }),
                              )
                            : null
                        }
                        onPress={() =>
                          navigation.navigate('CraftsmanDetail', {
                            craftsmanUserId: suggestion.userId,
                            craftsmanName: suggestion.fullName,
                          })
                        }
                      />
                    ))}
                  </View>
                )}
              </View>
            </View>
          );
        }}
      />

      {sendError && <HelperText type="error">{sendError}</HelperText>}

      <View style={[styles.composeRow, { backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 8 }]}>
        <TextInput
          style={styles.composeInput}
          mode="outlined"
          placeholder={t.assistant.composePlaceholder}
          value={draft}
          onChangeText={setDraft}
          multiline
          dense
        />
        <IconButton icon="send" mode="contained" disabled={!draft.trim() || sending} onPress={onSend} />
      </View>

      <Portal>
        <Dialog visible={resetVisible} onDismiss={() => setResetVisible(false)}>
          <Dialog.Title>{t.assistant.newChatDialog.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t.assistant.newChatDialog.body}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetVisible(false)} disabled={resetting}>
              {t.common.cancel}
            </Button>
            <Button onPress={confirmReset} loading={resetting} disabled={resetting}>
              {t.assistant.newChat}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  bubbleRowOwn: {
    justifyContent: 'flex-end',
  },
  bubbleColumn: {
    maxWidth: '85%',
    gap: 2,
  },
  suggestionsColumn: {
    gap: 8,
    paddingTop: 4,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
  time: {
    alignSelf: 'flex-end',
    opacity: 0.7,
  },
  composeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  composeInput: {
    flex: 1,
    maxHeight: 120,
  },
  emptyState: {
    flex: 1,
    gap: 8,
    alignItems: 'flex-start',
    padding: 16,
  },
  emptyStateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
});