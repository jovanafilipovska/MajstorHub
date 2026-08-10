import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, Dialog, HelperText, IconButton, Portal, SegmentedButtons, Text } from 'react-native-paper';
import { deleteUser, getAllUsers } from '../../api/users';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import type { Role, UserResponse } from '../../types/api';

type UserFilter = Extract<Role, 'Client' | 'Craftsman'>;

export function AdminUsersScreen() {
  const { token } = useAuth();
  const [users, setUsers] = useState<UserResponse[] | null>(null);
  const [filter, setFilter] = useState<UserFilter>('Client');
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    const controller = new AbortController();
    getAllUsers(token, controller.signal)
      .then(setUsers)
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Failed to load users.');
      });
    return () => controller.abort();
  }, [token]);

  useFocusEffect(load);

  const confirmDelete = async () => {
    if (!token || !pendingDeleteId) return;
    setActionError(null);
    setDeleting(true);
    try {
      await deleteUser(pendingDeleteId, token);
      setUsers((prev) => prev?.filter((u) => u.id !== pendingDeleteId) ?? null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete user.');
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  };

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!users) return <LoadingView />;

  const filtered = users.filter((u) => u.role === filter);

  return (
    <View style={styles.root}>
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filter}
          onValueChange={(value) => setFilter(value as UserFilter)}
          buttons={[
            { value: 'Client', label: 'Clients' },
            { value: 'Craftsman', label: 'Craftsmen' },
          ]}
        />
        {actionError && <HelperText type="error">{actionError}</HelperText>}
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={filtered}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No {filter === 'Client' ? 'clients' : 'craftsmen'} yet.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Title
              title={item.fullName}
              subtitle={`${item.email}${item.phoneNumber ? ' · ' + item.phoneNumber : ''}`}
              right={(props) => (
                <IconButton {...props} icon="delete" onPress={() => setPendingDeleteId(item.id)} />
              )}
            />
          </Card>
        )}
      />

      <Portal>
        <Dialog visible={pendingDeleteId !== null} onDismiss={() => setPendingDeleteId(null)}>
          <Dialog.Title>Delete user?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">This will permanently remove this account. This cannot be undone.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPendingDeleteId(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button onPress={confirmDelete} loading={deleting} disabled={deleting}>
              Delete
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
  filterContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  list: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  card: {
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
});
