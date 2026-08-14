import { useCallback, useEffect, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Avatar, HelperText, IconButton, Text, TextInput, useTheme } from 'react-native-paper';
import { getMessageHistory, markConversationRead, sendMessage, sendPhotoMessage } from '../../api/messages';
import { resolveMediaUrl } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';
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

function initialsOf(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

function lastOwnMessageId(messages: MessageResponse[], userId: string): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].senderId === userId) return messages[i].id;
  }
  return null;
}

export function ChatScreen({ route }: Props) {
  const { bookingId } = route.params;
  const { token, user } = useAuth();
  const { subscribe, subscribeToReadReceipts, clearUnread } = useChat();
  const theme = useTheme();
  const t = useTranslation();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<MessageResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useAutoDismiss(sendError, setSendError);

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

  useEffect(() => {
    return subscribeToReadReceipts((receipt) => {
      if (receipt.bookingId !== bookingId) return;
      setMessages((prev) =>
        prev
          ? prev.map((m) => (m.senderId === user?.id && !m.readAt ? { ...m, readAt: receipt.readAt } : m))
          : prev,
      );
    });
  }, [subscribeToReadReceipts, bookingId, user?.id]);

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

  const onAttachPhoto = async () => {
    if (!token) return;
    setSendError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setSendError(t.messages.photoPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploadingPhoto(true);
    try {
      const message = await sendPhotoMessage(bookingId, result.assets[0].uri, token);
      setMessages((prev) => (prev ? upsertById(prev, message) : [message]));
    } catch (err) {
      setSendError(apiErrorMessage(err, t, t.messages.failedToUploadPhoto));
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!messages) return <LoadingView />;

  const lastOwnId = user ? lastOwnMessageId(messages, user.id) : null;

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
          const showSeen = isOwn && item.id === lastOwnId && !!item.readAt;
          return (
            <View style={[styles.bubbleRow, isOwn && styles.bubbleRowOwn]}>
              {!isOwn &&
                (item.senderProfileImageUrl ? (
                  <Avatar.Image
                    size={28}
                    source={{ uri: resolveMediaUrl(item.senderProfileImageUrl) }}
                    style={styles.avatar}
                  />
                ) : (
                  <Avatar.Text
                    size={28}
                    label={initialsOf(item.senderName)}
                    style={[styles.avatar, { backgroundColor: theme.colors.primary }]}
                    labelStyle={{ color: theme.colors.onPrimary, fontSize: 12 }}
                  />
                ))}
              <View style={styles.bubbleColumn}>
                <View
                  style={[
                    styles.bubble,
                    { backgroundColor: isOwn ? theme.colors.primary : theme.colors.surfaceVariant },
                  ]}
                >
                  {item.photoUrl ? (
                    <Image source={{ uri: resolveMediaUrl(item.photoUrl) }} style={styles.photo} />
                  ) : (
                    <Text style={{ color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }}>
                      {item.body}
                    </Text>
                  )}
                  <Text
                    variant="labelSmall"
                    style={[styles.time, { color: isOwn ? theme.colors.onPrimary : theme.colors.onSurfaceVariant }]}
                  >
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
                {showSeen && (
                  <Text variant="labelSmall" style={[styles.seen, { color: theme.colors.onSurfaceVariant }]}>
                    {t.messages.seen}
                  </Text>
                )}
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
        <IconButton icon="image-outline" disabled={uploadingPhoto} loading={uploadingPhoto} onPress={onAttachPhoto} />
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
    alignItems: 'flex-end',
    gap: 6,
  },
  bubbleRowOwn: {
    justifyContent: 'flex-end',
  },
  avatar: {
    marginBottom: 2,
  },
  bubbleColumn: {
    maxWidth: '80%',
    gap: 2,
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 2,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
  time: {
    alignSelf: 'flex-end',
    opacity: 0.7,
  },
  seen: {
    alignSelf: 'flex-end',
    marginRight: 4,
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
});