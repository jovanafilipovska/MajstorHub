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
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAutoDismiss } from '../../hooks/useAutoDismiss';
import { LoadingView } from '../../components/LoadingView';
import { ErrorView } from '../../components/ErrorView';
import { apiErrorMessage, useTranslation } from '../../i18n';
import { getCategoryDescription, getCategoryName } from '../../utils/categoryName';
import type { ServiceCategoryResponse } from '../../types/api';

export function AdminCategoriesScreen() {
  const { token } = useAuth();
  const t = useTranslation();
  const { language } = useLanguage();
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

  useAutoDismiss(actionError, setActionError);
  useAutoDismiss(addError, setAddError);

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
        setError(apiErrorMessage(err, t, t.adminCategories.failedToLoad));
      });
    return () => controller.abort();
  }, [token, t]);

  useFocusEffect(load);

  const confirmDelete = async () => {
    if (!token || pendingDeleteId === null) return;
    setActionError(null);
    setDeleting(true);
    try {
      await deleteServiceCategory(pendingDeleteId, token);
      setCategories((prev) => prev?.filter((c) => c.id !== pendingDeleteId) ?? null);
    } catch (err) {
      setActionError(apiErrorMessage(err, t, t.adminCategories.failedToDelete));
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
      setActionError(apiErrorMessage(err, t, t.adminCategories.failedToApprove));
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
      setActionError(apiErrorMessage(err, t, t.adminCategories.failedToReject));
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
    setName(category.nameEn);
    setDescription(category.descriptionEn ?? '');
    setAddError(null);
    setDialogVisible(true);
  };

  const submitDialog = async () => {
    if (!token) return;
    if (name.trim().length === 0) {
      setAddError(t.adminCategories.categoryNameRequired);
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
      setAddError(apiErrorMessage(err, t, t.adminCategories.failedToSave));
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
              <Text variant="titleMedium">{t.adminCategories.pendingApproval}</Text>
              {pending.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <Card.Title title={getCategoryName(item, language)} subtitle={getCategoryDescription(item, language)} />
                  <Card.Actions>
                    <Button
                      onPress={() => reject(item.id)}
                      loading={rejectingId === item.id}
                      disabled={rejectingId === item.id || approvingId === item.id}
                    >
                      {t.adminCategories.reject}
                    </Button>
                    <Button
                      mode="contained"
                      onPress={() => approve(item.id)}
                      loading={approvingId === item.id}
                      disabled={approvingId === item.id || rejectingId === item.id}
                    >
                      {t.adminCategories.approve}
                    </Button>
                  </Card.Actions>
                </Card>
              ))}
              <Text variant="titleMedium" style={styles.approvedHeader}>
                {t.adminCategories.categoriesHeader}
              </Text>
            </View>
          ) : null
        }
        ListEmptyComponent={<Text style={styles.empty}>{t.adminCategories.empty}</Text>}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => openEdit(item)}>
            <Card.Title
              title={getCategoryName(item, language)}
              subtitle={getCategoryDescription(item, language)}
              right={(props) => (
                <IconButton {...props} icon="delete" onPress={() => setPendingDeleteId(item.id)} />
              )}
            />
          </Card>
        )}
      />

      <FAB icon="plus" style={styles.fab} onPress={openAdd} label={t.adminCategories.addCategoryFab} />

      <Portal>
        <Dialog visible={pendingDeleteId !== null} onDismiss={() => setPendingDeleteId(null)}>
          <Dialog.Title>{t.adminCategories.deleteDialog.title}</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">{t.adminCategories.deleteDialog.body}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setPendingDeleteId(null)} disabled={deleting}>
              {t.common.cancel}
            </Button>
            <Button onPress={confirmDelete} loading={deleting} disabled={deleting}>
              {t.common.delete}
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>
            {editingId !== null ? t.adminCategories.editDialog.editTitle : t.adminCategories.editDialog.addTitle}
          </Dialog.Title>
          <Dialog.Content style={styles.addContent}>
            <TextInput label={t.adminCategories.editDialog.nameLabel} value={name} onChangeText={setName} mode="outlined" />
            <TextInput
              label={t.adminCategories.editDialog.descriptionLabel}
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
              {t.common.cancel}
            </Button>
            <Button onPress={submitDialog} loading={submitting} disabled={submitting}>
              {editingId !== null ? t.adminCategories.editDialog.save : t.adminCategories.editDialog.add}
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