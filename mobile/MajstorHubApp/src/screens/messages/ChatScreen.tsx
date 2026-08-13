import { useCallback, useEffect, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HelperText, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { getMessageHistory, markConversationRead, sendMessage } from '../../api/messages';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { MessagesStackParamList } from '../../navigation/types';
import type { MessageResponse } from '../../types/api';

type Props = NativeStackScreenProps<MessagesStackParamList, 'Chat'>;

function upsertById(messages: MessageResponse[], incoming: MessageResponse): MessageResponse[] {
  if (messages.some((m) => m.id === incoming.id)) return messages;
  return [...messages, incoming];
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function ChatScreen({ route }: Props) {
  const { bookingId } = route.params;
  const { token, user } = useAuth();
  const { subscribe, clearUnread } = useChat();
  const theme = useTheme();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<MessageResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    getMessageHistory(bookingId, token)
      .then(setMessages)
      .catch((err) => setError(apiErrorMessage(err, t, t.messages.failedToLoadHistory)));
  }, [bookingId, token, t]);

  useFocusEffect(
    useCallback(() => {
      load();
      if (token) markConversationRead(bookingId, token).catch(() => {});
      clearUnread(bookingId);
    }, [load, token, bookingId, clearUnread]),
  );

  useEffect(() => {
    return subscribe((message) => {
      if (message.bookingId !== bookingId) return;
      setMessages((prev) => (prev ? upsertById(prev, message) : [message]));
      if (message.senderId !== user?.id && token) {
        markConversationRead(bookingId, token).catch(() => {});
        clearUnread(bookingId);
      }
    });
  }, [subscribe, bookingId, user?.id, token, clearUnread]);

  const onSend = async () => {
    const body = draft.trim();
    if (!body || !token) return;
    setSendError(null);
    setSending(true);
    try {
      const message = await sendMessage({ bookingId, body }, token);
      setMessages((prev) => (prev ? upsertById(prev, message) : [message]));
      setDraft('');
    } catch (err) {
      setSendError(apiErrorMessage(err, t, t.messages.failedToSend));
    } finally {
      setSending(false);
    }
  };

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!messages) return <LoadingView />;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <FlatList
        contentContainerStyle={styles.list}
        data={[...messages].reverse()}
        inverted
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isOwn = item.senderId === user?.id;
          return (
            <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
              <View
                style={[
                  styles.bubble,
                  { backgroundColor: isOwn ? theme.colors.primary : theme.colors.surfaceVariant },
                ]}
              >
                <Text style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>
                  {item.body}
                </Text>
                <Text
                  variant="labelSmall"
                  style={[styles.time, { color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}
                >
                  {formatTime(item.createdAt)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {sendError && <HelperText type="error">{sendError}</HelperText>}

      <View
        style={[
          styles.composeRow,
          { backgroundColor: theme.colors.background, paddingBottom: insets.bottom + 8 },
        ]}
      >
        <TextInput
          style={styles.composeInput}
          mode="outlined"
          placeholder={t.messages.composePlaceholder}
          value={draft}
          onChangeText={setDraft}
          multiline
          dense
        />
        <IconButton icon="send" mode="contained" disabled={!draft.trim() || sending} onPress={onSend} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowOwn: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
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
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  composeInput: {
    flex: 1,
    maxHeight: 120,
  },
});