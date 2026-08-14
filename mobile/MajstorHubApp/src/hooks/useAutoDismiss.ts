import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

const DEFAULT_DELAY_MS = 3000;

// Clears a transient banner message (success/error HelperText) a few seconds
// after it's set, so the user doesn't have to dismiss it manually. Not for
// messages that gate a whole screen (ErrorView) - those need an explicit retry.
export function useAutoDismiss(
  value: string | null,
  setValue: Dispatch<SetStateAction<string | null>>,
  delay: number = DEFAULT_DELAY_MS,
): void {
  useEffect(() => {
    if (!value) return;
    const timeout = setTimeout(() => setValue(null), delay);
    return () => clearTimeout(timeout);
  }, [value, setValue, delay]);
}