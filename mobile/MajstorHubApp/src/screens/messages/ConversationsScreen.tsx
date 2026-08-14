import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Avatar, Badge, Button, Card, Dialog, HelperText, Portal, Text, useTheme } from 'react-native-paper';
import { deleteConversation, getConversations } from '../../api/messages';
import { resolveMediaUrl } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { MessagesStackParamList } from '../../navigation/types';
import type { ConversationSummaryResponse } from '../../types/api';

type Props = NativeStackScreenProps<MessagesStackParamList, 'Conversations'>;

function initialsOf(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ConversationsScreen({ navigation }: Props) {
  const { token, user } = useAuth();
  const { unreadByBooking, refreshUnread, subscribeToConversationDeleted } = useChat();
  const theme = useTheme();
  const t = useTranslation();
  const [conversations, setConversations] = useState<ConversationSummaryResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useAutoDismiss(deleteError, setDeleteError);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    const controller = new AbortController();
    getConversations(token, controller.signal)
      .then(setConversations)
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(apiErrorMessage(err, t, t.messages.failedToLoadConversations));
      });
    refreshUnread();
    return () => controller.abort();
  }, [token, t, refreshUnread]);

  useFocusEffect(load);

  useEffect(() => {
    return subscribeToConversationDeleted((payload) => {
      setConversations((prev) => prev?.filter((c) => c.bookingId !== payload.bookingId) ?? prev);
    });
  }, [subscribeToConversationDeleted]);

  const confirmDelete = async () => {
    if (!token || !pendingDeleteId) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteConversation(pendingDeleteId, token);
      setConversations((prev) => prev?.filter((c) => c.bookingId !== pendingDeleteId) ?? prev);
    } catch (err) {
      setDeleteError(apiErrorMessage(err, t, t.messages.failedToDeleteConversation));
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!conversations) return <LoadingView />;

  return (
    <View style={styles.root}>
      {deleteError && <HelperText type="error">{deleteError}</HelperText>}

      <FlatList
        contentContainerStyle={styles.list}
        data={conversations}
        keyExtractor={(item) => item.bookingId}
        ListEmptyComponent={<Text style={styles.empty}>{t.messages.emptyConversations}</Text>}
        renderItem={({ item }) => {
          const unread = unreadByBooking[item.bookingId] ?? item.unreadCount;
          const isMine = item.lastMessageSenderId === user?.id;
          const bodyText = item.lastMessageIsPhoto ? t.messages.photoPreview : item.lastMessagePreview;
          const preview = bodyText ? (isMine ? `${t.messages.youPrefix}${bodyText}` : bodyText) : undefined;
          return (
            <Card
              style={styles.card}
              onPress={() =>
                navigation.navigate('Chat', { bookingId: item.bookingId, otherPartyName: item.otherPartyName })
              }
              onLongPress={() => setPendingDeleteId(item.bookingId)}
            >
              <Card.Title
                title={item.otherPartyName}
                subtitle={preview}
                left={(props) =>
                  item.otherPartyProfileImageUrl ? (
                    <Avatar.Image size={props.size} source={{ uri: resolveMediaUrl(item.otherPartyProfileImageUrl) }} />
                  ) : (
                    <Avatar.Text
                      size={props.size}
                      label={initialsOf(item.otherPartyName)}
                      style={{ backgroundColor: theme.colors.primary }}
                      labelStyle={{ color: theme.colors.onPrimary }}
                    />
                  )
                }
                right={() => (
                  <View style={styles.rightColumn}>
                    {item.lastMessageAt && (
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {formatRelative(item.lastMessageAt)}
                      </Text>
                    )}
                    {unread > 0 && <Badge style={styles.badge}>{unread}</Badge>}
                  </View>
                )}
              />
            </Card>
          );
        }}
      />

      <Portal>
        <Dialog visible={pendingDeleteId !== null} onDismiss={() => setPendingDeleteId(null)}>
          <Dialog.Title>{t.messages.deleteDialog.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t.messages.deleteDialog.body}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPendingDeleteId(null)} disabled={deleting}>
              {t.common.cancel}
            </Button>
            <Button onPress={confirmDelete} loading={deleting} disabled={deleting} textColor={theme.colors.error}>
              {t.common.delete}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 4,
    paddingRight: 16,
  },
  badge: {
    alignSelf: 'flex-end',
  },
});