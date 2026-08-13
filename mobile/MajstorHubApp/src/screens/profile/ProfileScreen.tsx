import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Avatar, Card, Divider, HelperText, Icon, List, Menu, Text, TouchableRipple, useTheme } from 'react-native-paper';
import { getMyBookings } from '../../api/bookings';
import { listFavorites } from '../../api/favorites';
import { removeMyPhoto, uploadMyPhoto } from '../../api/users';
import { resolveMediaUrl } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingView } from '../../components/LoadingView';
import { RoleSwitcher } from '../../components/RoleSwitcher';
import { apiErrorMessage, useTranslation } from '../../i18n';
import type { ProfileStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

function initialsOf(fullName: string): string {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return initials.join('') || '?';
}

function StatTile({ label, value, onPress }: { label: string; value: number | null; onPress: () => void }) {
  const theme = useTheme();
  return (
    <TouchableRipple onPress={onPress} borderless style={[styles.statTile, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.statTileContent}>
        <Text variant="titleLarge" style={styles.statValue}>
          {value ?? '–'}
        </Text>
        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
      </View>
    </TouchableRipple>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const { user, token, refreshUser, logout } = useAuth();
  const theme = useTheme();
  const t = useTranslation();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoMenuVisible, setPhotoMenuVisible] = useState(false);
  const [bookingCount, setBookingCount] = useState<number | null>(null);
  const [favoriteCount, setFavoriteCount] = useState<number | null>(null);

  const loadStats = useCallback(() => {
    if (!token || !user) return;
    Promise.all([getMyBookings(token), listFavorites(token)])
      .then(([bookings, favorites]) => {
        setBookingCount(bookings.filter((b) => b.clientId === user.id).length);
        setFavoriteCount(favorites.length);
      })
      .catch(() => {
        // Stat tiles are supplementary; leave them blank rather than blocking the screen.
      });
  }, [token, user]);

  useFocusEffect(loadStats);

  const choosePhoto = async () => {
    setPhotoMenuVisible(false);
    if (!token) return;
    setPhotoError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setPhotoError(t.profile.photoPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setUploadingPhoto(true);
    try {
      await uploadMyPhoto(result.assets[0].uri, token);
      await refreshUser();
    } catch (err) {
      setPhotoError(apiErrorMessage(err, t, t.profile.failedToUpdatePhoto));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    setPhotoMenuVisible(false);
    if (!token) return;
    setPhotoError(null);
    setUploadingPhoto(true);
    try {
      await removeMyPhoto(token);
      await refreshUser();
    } catch (err) {
      setPhotoError(apiErrorMessage(err, t, t.profile.failedToRemovePhoto));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onAvatarPress = () => {
    if (user?.profileImageUrl) {
      setPhotoMenuVisible(true);
    } else {
      choosePhoto();
    }
  };

  if (!user) return <LoadingView />;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Menu
            visible={photoMenuVisible}
            onDismiss={() => setPhotoMenuVisible(false)}
            anchor={
              <TouchableRipple
                onPress={onAvatarPress}
                disabled={uploadingPhoto}
                borderless
                style={styles.avatarTouchable}
              >
                {user.profileImageUrl ? (
                  <Avatar.Image size={88} source={{ uri: resolveMediaUrl(user.profileImageUrl) }} />
                ) : (
                  <Avatar.Text
                    size={88}
                    label={initialsOf(user.fullName)}
                    style={{ backgroundColor: theme.colors.primary }}
                    labelStyle={{ color: theme.colors.onPrimary }}
                  />
                )}
              </TouchableRipple>
            }
          >
            <Menu.Item onPress={choosePhoto} title={t.profile.changePhoto} leadingIcon="image-edit-outline" />
            <Menu.Item onPress={removePhoto} title={t.profile.removePhoto} leadingIcon="delete-outline" />
          </Menu>
          <View style={[styles.avatarBadge, { backgroundColor: theme.colors.primary }]}>
            <Icon source="camera" size={14} color={theme.colors.onPrimary} />
          </View>
        </View>

        <Text variant="titleLarge" style={styles.name}>
          {user.fullName}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {user.email}
        </Text>
        {photoError && <HelperText type="error">{photoError}</HelperText>}

        <View style={styles.roleSwitcherWrap}>
          <RoleSwitcher />
        </View>
      </View>

      <View style={styles.statsRow}>
        <StatTile label={t.profile.bookingsStat} value={bookingCount} onPress={() => navigation.navigate('MyBookings')} />
        <StatTile label={t.profile.savedProsStat} value={favoriteCount} onPress={() => navigation.navigate('Favorites')} />
      </View>

      <Text variant="labelLarge" style={styles.groupLabel}>
        {t.profile.accountGroup}
      </Text>
      <Card style={styles.groupCard} mode="contained">
        <List.Item
          title={t.profile.favoritePros}
          onPress={() => navigation.navigate('Favorites')}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title={t.profile.bookingHistory}
          onPress={() => navigation.navigate('MyBookings')}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
      </Card>

      <Text variant="labelLarge" style={styles.groupLabel}>
        {t.profile.supportGroup}
      </Text>
      <Card style={styles.groupCard} mode="contained">
        <List.Item
          title={t.profile.settings}
          onPress={() => navigation.navigate('Settings')}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item title={t.common.logOut} titleStyle={{ color: theme.colors.error }} onPress={() => logout()} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  avatarWrap: {
    marginBottom: 4,
  },
  avatarTouchable: {
    borderRadius: 44,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontWeight: '700',
    marginTop: 8,
  },
  roleSwitcherWrap: {
    alignSelf: 'stretch',
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statTile: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
  },
  statTileContent: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontWeight: '700',
  },
  groupLabel: {
    marginTop: 8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
});