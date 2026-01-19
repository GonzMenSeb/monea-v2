import { create } from 'zustand';

import type { BaseStoreActions } from '@/shared/store/types';

interface CategoryState {
  selectedId: string | null;
  editingId: string | null;
  filterByIncome: boolean | null;
  isFormOpen: boolean;
}

interface CategoryActions extends BaseStoreActions {
  setSelected: (id: string | null) => void;
  setEditing: (id: string | null) => void;
  setFilterByIncome: (isIncome: boolean | null) => void;
  openForm: (editId?: string) => void;
  closeForm: () => void;
}

export type CategoryStore = CategoryState & CategoryActions;

const initialState: CategoryState = {
  selectedId: null,
  editingId: null,
  filterByIncome: null,
  isFormOpen: false,
};

export const useCategoryStore = create<CategoryStore>((set) => ({
  ...initialState,

  setSelected: (id) => set({ selectedId: id }),

  setEditing: (id) => set({ editingId: id }),

  setFilterByIncome: (isIncome) => set({ filterByIncome: isIncome }),

  openForm: (editId) => set({ isFormOpen: true, editingId: editId ?? null }),

  closeForm: () => set({ isFormOpen: false, editingId: null }),

  reset: () => set(initialState),
}));
