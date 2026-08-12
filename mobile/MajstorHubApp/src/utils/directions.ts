import { Linking } from 'react-native';

// The generic Google Maps web URL opens the native Maps app on both iOS and
// Android when installed, and falls back to the browser otherwise - no need
// for platform-specific url schemes.
export function openDirections(latitude?: number, longitude?: number, address?: string): void {
  const destination =
    latitude != null && longitude != null ? `${latitude},${longitude}` : encodeURIComponent(address ?? '');
  if (!destination) return;
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
}