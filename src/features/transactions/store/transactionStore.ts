import { create } from 'zustand';

import type { TransactionType } from '@/infrastructure/database/models/Transaction';
import type { BaseStoreActions } from '@/shared/store/types';

export type TransactionSortField = 'date' | 'amount' | 'merchant';
export type SortDirection = 'asc' | 'desc';

export interface TransactionFiltersState {
  accountId: string | null;
  categoryId: string | null;
  type: TransactionType | null;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  amountRange: {
    min: number | null;
    max: number | null;
  };
  searchQuery: string;
}

interface TransactionState {
  selectedId: string | null;
  filters: TransactionFiltersState;
  sortField: TransactionSortField;
  sortDirection: SortDirection;
  isRefreshing: boolean;
}

interface TransactionActions extends BaseStoreActions {
  setSelected: (id: string | null) => void;
  setFilters: (filters: Partial<TransactionFiltersState>) => void;
  resetFilters: () => void;
  setSort: (field: TransactionSortField, direction: SortDirection) => void;
  setRefreshing: (isRefreshing: boolean) => void;
  setAccountFilter: (accountId: string | null) => void;
  setCategoryFilter: (categoryId: string | null) => void;
  setTypeFilter: (type: TransactionType | null) => void;
  setDateRangeFilter: (start: Date | null, end: Date | null) => void;
  setAmountRangeFilter: (min: number | null, max: number | null) => void;
  setSearchQuery: (query: string) => void;
}

export type TransactionStore = TransactionState & TransactionActions;

const DEFAULT_FILTERS: TransactionFiltersState = {
  accountId: null,
  categoryId: null,
  type: null,
  dateRange: {
    start: null,
    end: null,
  },
  amountRange: {
    min: null,
    max: null,
  },
  searchQuery: '',
};

const initialState: TransactionState = {
  selectedId: null,
  filters: DEFAULT_FILTERS,
  sortField: 'date',
  sortDirection: 'desc',
  isRefreshing: false,
};

export const useTransactionStore = create<TransactionStore>((set) => ({
  ...initialState,

  setSelected: (id) => set({ selectedId: id }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  setSort: (field, direction) => set({ sortField: field, sortDirection: direction }),

  setRefreshing: (isRefreshing) => set({ isRefreshing }),

  setAccountFilter: (accountId) =>
    set((state) => ({
      filters: { ...state.filters, accountId },
    })),

  setCategoryFilter: (categoryId) =>
    set((state) => ({
      filters: { ...state.filters, categoryId },
    })),

  setTypeFilter: (type) =>
    set((state) => ({
      filters: { ...state.filters, type },
    })),

  setDateRangeFilter: (start, end) =>
    set((state) => ({
      filters: {
        ...state.filters,
        dateRange: { start, end },
      },
    })),

  setAmountRangeFilter: (min, max) =>
    set((state) => ({
      filters: {
        ...state.filters,
        amountRange: { min, max },
      },
    })),

  setSearchQuery: (query) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery: query },
    })),

  reset: () => set(initialState),
}));

export function selectHasActiveFilters(state: TransactionStore): boolean {
  const { filters } = state;
  return (
    filters.accountId !== null ||
    filters.categoryId !== null ||
    filters.type !== null ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null ||
    filters.amountRange.min !== null ||
    filters.amountRange.max !== null ||
    filters.searchQuery !== ''
  );
}

export function selectActiveFilterCount(state: TransactionStore): number {
  const { filters } = state;
  let count = 0;

  if (filters.accountId !== null) {
    count++;
  }
  if (filters.categoryId !== null) {
    count++;
  }
  if (filters.type !== null) {
    count++;
  }
  if (filters.dateRange.start !== null || filters.dateRange.end !== null) {
    count++;
  }
  if (filters.amountRange.min !== null || filters.amountRange.max !== null) {
    count++;
  }
  if (filters.searchQuery !== '') {
    count++;
  }

  return count;
}
