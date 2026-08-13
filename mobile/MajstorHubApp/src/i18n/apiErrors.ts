import { ApiError } from '../api/client';
import type { Translations } from './types';

// Matches known backend messages (exact text, or a stable prefix for messages
// that interpolate request data like an email or category name) to their
// translated equivalent. Unmapped ApiErrors fall back to the raw backend text
// - always English, but better shown than swallowed.
function lookup(message: string, t: Translations): string | undefined {
  switch (message) {
    case 'Invalid email or password.':
      return t.apiErrors.invalidCredentials;
    case 'Current password is incorrect.':
      return t.apiErrors.currentPasswordIncorrect;
    case 'New password must be different from the current password.':
      return t.apiErrors.newPasswordSameAsCurrent;
    case 'Only JPG and PNG images are supported.':
      return t.apiErrors.unsupportedImageType;
    case 'This craftsman is not currently available.':
      return t.apiErrors.craftsmanUnavailable;
    case 'You cannot book your own craftsman profile.':
      return t.apiErrors.cannotBookOwnProfile;
    case 'This booking has already been reviewed.':
      return t.apiErrors.bookingAlreadyReviewed;
    case 'A craftsman profile already exists for this user.':
      return t.apiErrors.craftsmanProfileAlreadyExists;
    case 'You cannot favorite yourself.':
      return t.apiErrors.cannotFavoriteSelf;
    case 'This user cannot be deleted because they have existing bookings or reviews.':
      return t.apiErrors.userDeleteBlocked;
    case 'This category cannot be deleted because craftsmen or bookings still reference it.':
      return t.apiErrors.categoryDeleteBlocked;
    default:
      if (message.startsWith('A user with email')) return t.apiErrors.emailAlreadyExists;
      if (message.startsWith('A service category named')) return t.apiErrors.categoryNameAlreadyExists;
      return undefined;
  }
}

/**
 * Resolves the message to show for a caught error: a translated match for
 * known backend errors, the raw backend text for unmapped ApiErrors, or the
 * given translated fallback for anything that isn't an ApiError at all
 * (network failure, timeout, etc).
 */
export function apiErrorMessage(err: unknown, t: Translations, fallback: string): string {
  if (!(err instanceof ApiError)) return fallback;
  return lookup(err.message, t) ?? err.message;
}