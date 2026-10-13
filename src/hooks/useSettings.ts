import { useSyncExternalStore } from 'react';
import { settingsStore, type AppSettings } from '@/lib/settings';

export function useAppSettings(): AppSettings {
  return useSyncExternalStore(settingsStore.subscribe, settingsStore.getSnapshot);
}
