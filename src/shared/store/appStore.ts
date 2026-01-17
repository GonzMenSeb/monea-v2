import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { BaseStoreActions } from './types';

type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  themeMode: ThemeMode;
  hasCompletedOnboarding: boolean;
  lastSyncTimestamp: number | null;
}

interface AppActions extends BaseStoreActions {
  setThemeMode: (mode: ThemeMode) => void;
  completeOnboarding: () => void;
  updateLastSyncTimestamp: () => void;
}

export type AppStore = AppState & AppActions;

const initialState: AppState = {
  themeMode: 'system',
  hasCompletedOnboarding: false,
  lastSyncTimestamp: null,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,

      setThemeMode: (mode) => set({ themeMode: mode }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      updateLastSyncTimestamp: () => set({ lastSyncTimestamp: Date.now() }),

      reset: () => set(initialState),
    }),
    {
      name: 'monea-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        lastSyncTimestamp: state.lastSyncTimestamp,
      }),
    }
  )
);
