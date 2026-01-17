import {
  useTransactionStore,
  selectHasActiveFilters,
  selectActiveFilterCount,
} from '../transactionStore';

describe('transactionStore', () => {
  beforeEach(() => {
    useTransactionStore.getState().reset();
  });

  describe('selection', () => {
    it('should have null selectedId by default', () => {
      expect(useTransactionStore.getState().selectedId).toBeNull();
    });

    it('should set selected transaction id', () => {
      useTransactionStore.getState().setSelected('tx-123');
      expect(useTransactionStore.getState().selectedId).toBe('tx-123');
    });

    it('should clear selection when set to null', () => {
      useTransactionStore.getState().setSelected('tx-123');
      useTransactionStore.getState().setSelected(null);
      expect(useTransactionStore.getState().selectedId).toBeNull();
    });
  });

  describe('filters', () => {
    it('should have default filter values', () => {
      const { filters } = useTransactionStore.getState();
      expect(filters.accountId).toBeNull();
      expect(filters.categoryId).toBeNull();
      expect(filters.type).toBeNull();
      expect(filters.dateRange.start).toBeNull();
      expect(filters.dateRange.end).toBeNull();
      expect(filters.amountRange.min).toBeNull();
      expect(filters.amountRange.max).toBeNull();
      expect(filters.searchQuery).toBe('');
    });

    it('should set partial filters', () => {
      useTransactionStore.getState().setFilters({
        accountId: 'acc-1',
        searchQuery: 'coffee',
      });

      const { filters } = useTransactionStore.getState();
      expect(filters.accountId).toBe('acc-1');
      expect(filters.searchQuery).toBe('coffee');
      expect(filters.categoryId).toBeNull();
    });

    it('should set account filter', () => {
      useTransactionStore.getState().setAccountFilter('acc-1');
      expect(useTransactionStore.getState().filters.accountId).toBe('acc-1');
    });

    it('should set category filter', () => {
      useTransactionStore.getState().setCategoryFilter('cat-1');
      expect(useTransactionStore.getState().filters.categoryId).toBe('cat-1');
    });

    it('should set type filter', () => {
      useTransactionStore.getState().setTypeFilter('expense');
      expect(useTransactionStore.getState().filters.type).toBe('expense');
    });

    it('should set date range filter', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      useTransactionStore.getState().setDateRangeFilter(start, end);

      const { dateRange } = useTransactionStore.getState().filters;
      expect(dateRange.start).toEqual(start);
      expect(dateRange.end).toEqual(end);
    });

    it('should set amount range filter', () => {
      useTransactionStore.getState().setAmountRangeFilter(1000, 50000);

      const { amountRange } = useTransactionStore.getState().filters;
      expect(amountRange.min).toBe(1000);
      expect(amountRange.max).toBe(50000);
    });

    it('should set search query', () => {
      useTransactionStore.getState().setSearchQuery('groceries');
      expect(useTransactionStore.getState().filters.searchQuery).toBe('groceries');
    });

    it('should reset filters to defaults', () => {
      useTransactionStore.getState().setFilters({
        accountId: 'acc-1',
        categoryId: 'cat-1',
        type: 'expense',
        searchQuery: 'test',
      });
      useTransactionStore.getState().resetFilters();

      const { filters } = useTransactionStore.getState();
      expect(filters.accountId).toBeNull();
      expect(filters.categoryId).toBeNull();
      expect(filters.type).toBeNull();
      expect(filters.searchQuery).toBe('');
    });
  });

  describe('sorting', () => {
    it('should have default sort by date descending', () => {
      const state = useTransactionStore.getState();
      expect(state.sortField).toBe('date');
      expect(state.sortDirection).toBe('desc');
    });

    it('should set sort field and direction', () => {
      useTransactionStore.getState().setSort('amount', 'asc');

      const state = useTransactionStore.getState();
      expect(state.sortField).toBe('amount');
      expect(state.sortDirection).toBe('asc');
    });
  });

  describe('refreshing', () => {
    it('should have isRefreshing false by default', () => {
      expect(useTransactionStore.getState().isRefreshing).toBe(false);
    });

    it('should set refreshing state', () => {
      useTransactionStore.getState().setRefreshing(true);
      expect(useTransactionStore.getState().isRefreshing).toBe(true);

      useTransactionStore.getState().setRefreshing(false);
      expect(useTransactionStore.getState().isRefreshing).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      useTransactionStore.getState().setSelected('tx-1');
      useTransactionStore.getState().setFilters({ accountId: 'acc-1' });
      useTransactionStore.getState().setSort('amount', 'asc');
      useTransactionStore.getState().setRefreshing(true);

      useTransactionStore.getState().reset();

      const state = useTransactionStore.getState();
      expect(state.selectedId).toBeNull();
      expect(state.filters.accountId).toBeNull();
      expect(state.sortField).toBe('date');
      expect(state.sortDirection).toBe('desc');
      expect(state.isRefreshing).toBe(false);
    });
  });
});

describe('selectors', () => {
  beforeEach(() => {
    useTransactionStore.getState().reset();
  });

  describe('selectHasActiveFilters', () => {
    it('should return false when no filters are active', () => {
      expect(selectHasActiveFilters(useTransactionStore.getState())).toBe(false);
    });

    it('should return true when account filter is set', () => {
      useTransactionStore.getState().setAccountFilter('acc-1');
      expect(selectHasActiveFilters(useTransactionStore.getState())).toBe(true);
    });

    it('should return true when category filter is set', () => {
      useTransactionStore.getState().setCategoryFilter('cat-1');
      expect(selectHasActiveFilters(useTransactionStore.getState())).toBe(true);
    });

    it('should return true when type filter is set', () => {
      useTransactionStore.getState().setTypeFilter('income');
      expect(selectHasActiveFilters(useTransactionStore.getState())).toBe(true);
    });

    it('should return true when date range is set', () => {
      useTransactionStore.getState().setDateRangeFilter(new Date(), null);
      expect(selectHasActiveFilters(useTransactionStore.getState())).toBe(true);
    });

    it('should return true when amount range is set', () => {
      useTransactionStore.getState().setAmountRangeFilter(1000, null);
      expect(selectHasActiveFilters(useTransactionStore.getState())).toBe(true);
    });

    it('should return true when search query is not empty', () => {
      useTransactionStore.getState().setSearchQuery('test');
      expect(selectHasActiveFilters(useTransactionStore.getState())).toBe(true);
    });
  });

  describe('selectActiveFilterCount', () => {
    it('should return 0 when no filters are active', () => {
      expect(selectActiveFilterCount(useTransactionStore.getState())).toBe(0);
    });

    it('should count each active filter', () => {
      useTransactionStore.getState().setAccountFilter('acc-1');
      expect(selectActiveFilterCount(useTransactionStore.getState())).toBe(1);

      useTransactionStore.getState().setCategoryFilter('cat-1');
      expect(selectActiveFilterCount(useTransactionStore.getState())).toBe(2);

      useTransactionStore.getState().setTypeFilter('expense');
      expect(selectActiveFilterCount(useTransactionStore.getState())).toBe(3);
    });

    it('should count date range as one filter', () => {
      useTransactionStore.getState().setDateRangeFilter(new Date(), new Date());
      expect(selectActiveFilterCount(useTransactionStore.getState())).toBe(1);
    });

    it('should count amount range as one filter', () => {
      useTransactionStore.getState().setAmountRangeFilter(1000, 50000);
      expect(selectActiveFilterCount(useTransactionStore.getState())).toBe(1);
    });
  });
});
