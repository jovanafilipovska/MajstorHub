import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Button, Card, Dialog, FAB, HelperText, IconButton, Portal, Text, TextInput } from 'react-native-paper';
import { createServiceCategory, deleteServiceCategory, listServiceCategories } from '../../api/serviceCategories';
import { ApiError } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import type { ServiceCategoryResponse } from '../../types/api';

export function AdminCategoriesScreen() {
  const { token } = useAuth();
  const [categories, setCategories] = useState<ServiceCategoryResponse[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [addVisible, setAddVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    setError(null);
    const controller = new AbortController();
    listServiceCategories(controller.signal)
      .then(setCategories)
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Failed to load categories.');
      });
    return () => controller.abort();
  }, []);

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

  const openAdd = () => {
    setName('');
    setDescription('');
    setAddError(null);
    setAddVisible(true);
  };

  const submitAdd = async () => {
    if (!token) return;
    if (name.trim().length === 0) {
      setAddError('Category name is required.');
      return;
    }
    setAddError(null);
    setSubmitting(true);
    try {
      const created = await createServiceCategory(
        { name: name.trim(), description: description.trim() || undefined },
        token,
      );
      setCategories((prev) => (prev ? [...prev, created] : [created]));
      setAddVisible(false);
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Failed to create category.');
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
        ListEmptyComponent={<Text style={styles.empty}>No categories yet.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card}>
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

        <Dialog visible={addVisible} onDismiss={() => setAddVisible(false)}>
          <Dialog.Title>Add Category</Dialog.Title>
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
            <Button onPress={() => setAddVisible(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onPress={submitAdd} loading={submitting} disabled={submitting}>
              Add
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
