# Generate Zustand Store

Create a Zustand store following project conventions.

## Arguments
- `$ARGUMENTS` - Store name and feature location (e.g., "transactions features/transactions")

## Instructions

Parse arguments to extract store name and location.

### Store File: `src/{location}/store/{storeName}Store.ts`

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface {StoreName}State {
  // State properties
  items: {EntityType}[];
  selectedId: string | null;
  isLoading: boolean;
  error: string | null;
}

interface {StoreName}Actions {
  // Action methods
  setSelected: (id: string | null) => void;
  setItems: (items: {EntityType}[]) => void;
  addItem: (item: {EntityType}) => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

type {StoreName}Store = {StoreName}State & {StoreName}Actions;

const initialState: {StoreName}State = {
  items: [],
  selectedId: null,
  isLoading: false,
  error: null,
};

export const use{StoreName}Store = create<{StoreName}Store>()(
  immer((set) => ({
    ...initialState,

    setSelected: (id) => set((state) => {
      state.selectedId = id;
    }),

    setItems: (items) => set((state) => {
      state.items = items;
    }),

    addItem: (item) => set((state) => {
      state.items.push(item);
    }),

    removeItem: (id) => set((state) => {
      state.items = state.items.filter((i) => i.id !== id);
    }),

    reset: () => set(initialState),
  }))
);
```

### Test File: `src/{location}/store/{storeName}Store.test.ts`

```typescript
import { act } from '@testing-library/react-native';

import { use{StoreName}Store } from './{storeName}Store';

describe('use{StoreName}Store', () => {
  beforeEach(() => {
    use{StoreName}Store.getState().reset();
  });

  it('has correct initial state', () => {
    const state = use{StoreName}Store.getState();
    expect(state.items).toEqual([]);
    expect(state.selectedId).toBeNull();
  });

  it('sets selected id', () => {
    act(() => {
      use{StoreName}Store.getState().setSelected('123');
    });
    expect(use{StoreName}Store.getState().selectedId).toBe('123');
  });

  it('adds item to store', () => {
    const item = { id: '1', name: 'Test' };
    act(() => {
      use{StoreName}Store.getState().addItem(item);
    });
    expect(use{StoreName}Store.getState().items).toContainEqual(item);
  });

  it('removes item from store', () => {
    const item = { id: '1', name: 'Test' };
    act(() => {
      use{StoreName}Store.getState().addItem(item);
      use{StoreName}Store.getState().removeItem('1');
    });
    expect(use{StoreName}Store.getState().items).toEqual([]);
  });
});
```

### Update barrel export: `src/{location}/store/index.ts`

Add: `export { use{StoreName}Store } from './{storeName}Store';`

## Store Patterns

### With Persistence
```typescript
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // ... store implementation
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

### With Computed Values (Selectors)
```typescript
export const useTransactionTotals = () =>
  useTransactionStore((state) => ({
    totalIncome: state.items
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpense: state.items
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
  }));
```

## Conventions
- Store hook: `use{Name}Store`
- Separate state interface from actions interface
- Always include `reset()` action for testing
- Use immer middleware for nested state updates
