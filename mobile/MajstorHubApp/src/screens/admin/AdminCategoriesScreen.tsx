import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, Dialog, FAB, HelperText, IconButton, Portal, Text, TextInput } from 'react-native-paper';
import {
  approveServiceCategory,
  createServiceCategory,
  deleteServiceCategory,
  listPendingServiceCategories,
  listServiceCategories,
  updateServiceCategory,
} from '../../api/serviceCategories';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import type { ServiceCategoryResponse } from '../../types/api';

export function AdminCategoriesScreen() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<ServiceCategoryResponse[] | null>(null);
  const [pending, setPending] = useState<ServiceCategoryResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    const controller = new AbortController();
    Promise.all([listServiceCategories(controller.signal), listPendingServiceCategories(token)])
      .then(([approved, pendingCategories]) => {
        setCategories(approved);
        setPending(pendingCategories);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Failed to load categories.');
      });
    return () => controller.abort();
  }, [token]);

  useFocusEffect(load);

  const confirmDelete = async () => {
    if (!token || pendingDeleteId === null) return;
    setActionError(null);
    setDeleting(true);
    try {
      await deleteServiceCategory(pendingDeleteId, token);
      setCategories((prev) => prev?.filter((c) => c.id !== pendingDeleteId) ?? null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to delete category.');
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  };

  const approve = async (id: number) => {
    if (!token) return;
    setActionError(null);
    setApprovingId(id);
    try {
      const approved = await approveServiceCategory(id, token);
      setPending((prev) => prev.filter((c) => c.id !== id));
      setCategories((prev) => (prev ? [...prev, approved] : [approved]));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to approve category.');
    } finally {
      setApprovingId(null);
    }
  };

  const reject = async (id: number) => {
    if (!token) return;
    setActionError(null);
    setRejectingId(id);
    try {
      await deleteServiceCategory(id, token);
      setPending((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Failed to reject category.');
    } finally {
      setRejectingId(null);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setAddError(null);
    setDialogVisible(true);
  };

  const openEdit = (category: ServiceCategoryResponse) => {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description ?? '');
    setAddError(null);
    setDialogVisible(true);
  };

  const submitDialog = async () => {
    if (!token) return;
    if (name.trim().length === 0) {
      setAddError('Category name is required.');
      return;
    }
    setAddError(null);
    setSubmitting(true);
    try {
      const payload = { name: name.trim(), description: description.trim() || undefined };
      if (editingId !== null) {
        const updated = await updateServiceCategory(editingId, payload, token);
        setCategories((prev) => prev?.map((c) => (c.id === editingId ? updated : c)) ?? null);
      } else {
        const created = await createServiceCategory(payload, token);
        setCategories((prev) => (prev ? [...prev, created] : [created]));
      }
      setDialogVisible(false);
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <ErrorView message={error} onRetry={load} />;
  if (!categories) return <LoadingView />;

  return (
    <View style={styles.root}>
      {actionError && (
        <View style={styles.actionErrorContainer}>
          <HelperText type="error">{actionError}</HelperText>
        </View>
      )}

      <FlatList
        contentContainerStyle={styles.list}
        data={categories}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          pending.length > 0 ? (
            <View style={styles.pendingSection}>
              <Text variant="titleMedium">Pending approval</Text>
              {pending.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <Card.Title title={item.name} subtitle={item.description} />
                  <Card.Actions>
                    <Button
                      onPress={() => reject(item.id)}
                      loading={rejectingId === item.id}
                      disabled={rejectingId === item.id || approvingId === item.id}
                    >
                      Reject
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => approve(item.id)}
                      loading={approvingId === item.id}
                      disabled={approvingId === item.id || rejectingId === item.id}
                    >
                      Approve
                    </Button>
                  </Card.Actions>
                </Card>
              ))}
              <Text variant="titleMedium" style={styles.approvedHeader}>
                Categories
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>No categories yet.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => openEdit(item)}>
            <Card.Title
              title={item.name}
              subtitle={item.description}
              right={(props) => (
                <IconButton {...props} icon="delete" onPress={() => setPendingDeleteId(item.id)} />
              )}
            />
          </Card>
        )}
      />

      <FAB icon="plus" style={styles.fab} onPress={openAdd} label="Add Category" />

      <Portal>
        <Dialog visible={pendingDeleteId !== null} onDismiss={() => setPendingDeleteId(null)}>
          <Dialog.Title>Delete category?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              This cannot be undone. Craftsmen currently in this category will be unaffected unless you also remove
              them.
            </Text>
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

        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editingId !== null ? 'Edit Category' : 'Add Category'}</Dialog.Title>
          <Dialog.Content style={styles.addContent}>
            <TextInput label="Name" value={name} onChangeText={setName} mode="outlined" />
            <TextInput
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
            {addError && <HelperText type="error">{addError}</HelperText>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onPress={submitDialog} loading={submitting} disabled={submitting}>
              {editingId !== null ? 'Save' : 'Add'}
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
  actionErrorContainer: {
    paddingHorizontal: 16,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  pendingSection: {
    gap: 12,
    marginBottom: 4,
  },
  approvedHeader: {
    marginTop: 8,
  },
  card: {
    marginBottom: 12,
  },
  empty: {
    textAlign: 'center',
    marginTop: 32,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  addContent: {
    gap: 12,
  },
});