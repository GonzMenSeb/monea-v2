import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { StateCreator, StoreApi, UseBoundStore } from 'zustand';
import type { PersistOptions } from 'zustand/middleware';

type AsyncStorageType = typeof AsyncStorage;

export type PersistedStoreOptions<T> = Omit<PersistOptions<T, T>, 'storage'> & {
  storage?: AsyncStorageType;
};

export function createPersistedStore<T extends object>(
  initializer: StateCreator<T, [], [['zustand/persist', T]]>,
  options: PersistedStoreOptions<T>
): UseBoundStore<StoreApi<T>> {
  const { storage = AsyncStorage, ...persistOptions } = options;

  return create<T>()(
    persist(initializer, {
      ...persistOptions,
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          const value = await storage.getItem(name);
          return value;
        },
        setItem: async (name: string, value: string) => {
          await storage.setItem(name, value);
        },
        removeItem: async (name: string) => {
          await storage.removeItem(name);
        },
      })),
    })
  );
}
