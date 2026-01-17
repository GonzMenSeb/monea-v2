import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useTransactionStore } from '../../store/transactionStore';
import {
  useTransactions,
  useTransaction,
  useTransactionsByAccount,
  useRecentTransactions,
  useTransactionSummary,
  useAccountTransactionSummary,
  useCreateTransaction,
  useCreateTransactionBatch,
  useUpdateTransaction,
  useDeleteTransaction,
  useSelectedTransaction,
  useFilteredTransactions,
  useInvalidateTransactions,
  TRANSACTION_QUERY_KEYS,
} from '../useTransactions';

import type Transaction from '@/infrastructure/database/models/Transaction';
import type {
  TransactionFilters,
  TransactionSummary,
} from '@/infrastructure/database/repositories/TransactionRepository';
import type { ReactNode, ReactElement } from 'react';

const mockFindAll = jest.fn<Promise<Transaction[]>, []>();
const mockFindById = jest.fn<Promise<Transaction | null>, [string]>();
const mockFindByAccountId = jest.fn<Promise<Transaction[]>, [string]>();
const mockFindByFilters = jest.fn<Promise<Transaction[]>, [TransactionFilters]>();
const mockFindRecentByAccount = jest.fn<Promise<Transaction[]>, [string, number]>();
const mockGetSummaryByDateRange = jest.fn<Promise<TransactionSummary>, [Date, Date]>();
const mockGetSummaryByAccountId = jest.fn<Promise<TransactionSummary>, [string]>();
const mockCreate = jest.fn<Promise<Transaction>, [any]>();
const mockCreateBatch = jest.fn<Promise<Transaction[]>, [any[]]>();
const mockUpdate = jest.fn<Promise<Transaction | null>, [string, any]>();
const mockDelete = jest.fn<Promise<boolean>, [string]>();

jest.mock('@/infrastructure/database', () => ({
  database: {},
  TransactionRepository: jest.fn().mockImplementation(() => ({
    findAll: () => mockFindAll(),
    findById: (id: string) => mockFindById(id),
    findByAccountId: (accountId: string) => mockFindByAccountId(accountId),
    findByFilters: (filters: TransactionFilters) => mockFindByFilters(filters),
    findRecentByAccount: (accountId: string, limit: number) =>
      mockFindRecentByAccount(accountId, limit),
    getSummaryByDateRange: (start: Date, end: Date) => mockGetSummaryByDateRange(start, end),
    getSummaryByAccountId: (accountId: string) => mockGetSummaryByAccountId(accountId),
    create: (data: any) => mockCreate(data),
    createBatch: (dataList: any[]) => mockCreateBatch(dataList),
    update: (id: string, data: any) => mockUpdate(id, data),
    delete: (id: string) => mockDelete(id),
  })),
}));

const mockTransaction = {
  id: 'tx-1',
  accountId: 'acc-1',
  type: 'expense',
  amount: 50000,
  transactionDate: new Date('2024-01-15'),
  merchant: 'Exito',
} as Transaction;

const mockTransactions = [
  mockTransaction,
  { ...mockTransaction, id: 'tx-2', amount: 30000 } as Transaction,
];

const mockSummary: TransactionSummary = {
  totalIncome: 1000000,
  totalExpense: 500000,
  netBalance: 500000,
  transactionCount: 10,
};

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }): ReactElement {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useTransactions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
    useTransactionStore.getState().reset();
    mockFindAll.mockResolvedValue(mockTransactions);
    mockFindByFilters.mockResolvedValue(mockTransactions);
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe('useTransactions', () => {
    it('fetches all transactions when no filters provided', async () => {
      const { result } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindAll).toHaveBeenCalled();
      expect(result.current.data).toEqual(mockTransactions);
    });

    it('fetches transactions with filters when provided', async () => {
      const filters: TransactionFilters = { accountId: 'acc-1' };

      const { result } = renderHook(() => useTransactions(filters), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindByFilters).toHaveBeenCalledWith(filters);
      expect(result.current.data).toEqual(mockTransactions);
    });

    it('starts in loading state', () => {
      mockFindAll.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('useTransaction', () => {
    beforeEach(() => {
      mockFindById.mockResolvedValue(mockTransaction);
    });

    it('fetches a single transaction by id', async () => {
      const { result } = renderHook(() => useTransaction('tx-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindById).toHaveBeenCalledWith('tx-1');
      expect(result.current.data).toEqual(mockTransaction);
    });

    it('does not fetch when id is null', async () => {
      const { result } = renderHook(() => useTransaction(null), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockFindById).not.toHaveBeenCalled();
    });

    it('returns null when transaction not found', async () => {
      mockFindById.mockResolvedValue(null);

      const { result } = renderHook(() => useTransaction('non-existent'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('useTransactionsByAccount', () => {
    beforeEach(() => {
      mockFindByAccountId.mockResolvedValue(mockTransactions);
    });

    it('fetches transactions for an account', async () => {
      const { result } = renderHook(() => useTransactionsByAccount('acc-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindByAccountId).toHaveBeenCalledWith('acc-1');
      expect(result.current.data).toEqual(mockTransactions);
    });

    it('does not fetch when accountId is null', async () => {
      const { result } = renderHook(() => useTransactionsByAccount(null), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockFindByAccountId).not.toHaveBeenCalled();
    });
  });

  describe('useRecentTransactions', () => {
    beforeEach(() => {
      mockFindRecentByAccount.mockResolvedValue(mockTransactions);
    });

    it('fetches recent transactions with default limit', async () => {
      const { result } = renderHook(() => useRecentTransactions({ accountId: 'acc-1' }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindRecentByAccount).toHaveBeenCalledWith('acc-1', 10);
    });

    it('fetches recent transactions with custom limit', async () => {
      const { result } = renderHook(() => useRecentTransactions({ accountId: 'acc-1', limit: 5 }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindRecentByAccount).toHaveBeenCalledWith('acc-1', 5);
    });

    it('does not fetch when accountId is empty', () => {
      const { result } = renderHook(() => useRecentTransactions({ accountId: '' }), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useTransactionSummary', () => {
    beforeEach(() => {
      mockGetSummaryByDateRange.mockResolvedValue(mockSummary);
    });

    it('fetches summary for date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const { result } = renderHook(() => useTransactionSummary({ startDate, endDate }), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGetSummaryByDateRange).toHaveBeenCalledWith(startDate, endDate);
      expect(result.current.data).toEqual(mockSummary);
    });
  });

  describe('useAccountTransactionSummary', () => {
    beforeEach(() => {
      mockGetSummaryByAccountId.mockResolvedValue(mockSummary);
    });

    it('fetches summary for an account', async () => {
      const { result } = renderHook(() => useAccountTransactionSummary('acc-1'), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockGetSummaryByAccountId).toHaveBeenCalledWith('acc-1');
      expect(result.current.data).toEqual(mockSummary);
    });

    it('returns empty summary when accountId is null', async () => {
      const { result } = renderHook(() => useAccountTransactionSummary(null), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockGetSummaryByAccountId).not.toHaveBeenCalled();
    });
  });

  describe('useCreateTransaction', () => {
    beforeEach(() => {
      const createdTransaction = { ...mockTransaction, id: 'tx-created' } as Transaction;
      mockCreate.mockResolvedValue(createdTransaction);
    });

    it('creates a transaction', async () => {
      const { result } = renderHook(() => useCreateTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      const createData = {
        accountId: 'acc-1',
        type: 'expense' as const,
        amount: 50000,
        transactionDate: new Date('2024-01-15'),
      };

      result.current.mutate(createData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCreate).toHaveBeenCalledWith(createData);
      expect(result.current.data?.id).toBe('tx-created');
    });

    it('invalidates queries after successful creation', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      const createData = {
        accountId: 'acc-1',
        type: 'expense' as const,
        amount: 50000,
        transactionDate: new Date('2024-01-15'),
      };

      result.current.mutate(createData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: TRANSACTION_QUERY_KEYS.all });
    });
  });

  describe('useCreateTransactionBatch', () => {
    beforeEach(() => {
      const createdTransactions = [
        { ...mockTransaction, id: 'tx-batch-1' } as Transaction,
        { ...mockTransaction, id: 'tx-batch-2' } as Transaction,
      ];
      mockCreateBatch.mockResolvedValue(createdTransactions);
    });

    it('creates multiple transactions', async () => {
      const { result } = renderHook(() => useCreateTransactionBatch(), {
        wrapper: createWrapper(queryClient),
      });

      const createDataList = [
        {
          accountId: 'acc-1',
          type: 'expense' as const,
          amount: 50000,
          transactionDate: new Date('2024-01-15'),
        },
        {
          accountId: 'acc-1',
          type: 'income' as const,
          amount: 100000,
          transactionDate: new Date('2024-01-16'),
        },
      ];

      result.current.mutate(createDataList);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockCreateBatch).toHaveBeenCalledWith(createDataList);
      expect(result.current.data?.length).toBe(2);
    });

    it('invalidates queries after successful batch creation', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateTransactionBatch(), {
        wrapper: createWrapper(queryClient),
      });

      const createDataList = [
        {
          accountId: 'acc-1',
          type: 'expense' as const,
          amount: 50000,
          transactionDate: new Date('2024-01-15'),
        },
      ];

      result.current.mutate(createDataList);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: TRANSACTION_QUERY_KEYS.all });
    });
  });

  describe('useUpdateTransaction', () => {
    beforeEach(() => {
      const updatedTransaction = { ...mockTransaction, amount: 75000 } as Transaction;
      mockUpdate.mockResolvedValue(updatedTransaction);
    });

    it('updates a transaction', async () => {
      const { result } = renderHook(() => useUpdateTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      const updateData = {
        id: 'tx-1',
        data: { amount: 75000 },
      };

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockUpdate).toHaveBeenCalledWith('tx-1', { amount: 75000 });
      expect(result.current.data?.amount).toBe(75000);
    });

    it('invalidates specific transaction and list queries after update', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdateTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      const updateData = {
        id: 'tx-1',
        data: { amount: 75000 },
      };

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: TRANSACTION_QUERY_KEYS.detail('tx-1'),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: TRANSACTION_QUERY_KEYS.lists() });
    });

    it('returns null when transaction not found', async () => {
      mockUpdate.mockResolvedValue(null);

      const { result } = renderHook(() => useUpdateTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      const updateData = {
        id: 'non-existent',
        data: { amount: 75000 },
      };

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });
  });

  describe('useDeleteTransaction', () => {
    beforeEach(() => {
      mockDelete.mockResolvedValue(true);
    });

    it('deletes a transaction', async () => {
      const { result } = renderHook(() => useDeleteTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate('tx-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockDelete).toHaveBeenCalledWith('tx-1');
      expect(result.current.data).toBe(true);
    });

    it('invalidates queries after successful deletion', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate('tx-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: TRANSACTION_QUERY_KEYS.all });
    });

    it('returns false when transaction not found', async () => {
      mockDelete.mockResolvedValue(false);

      const { result } = renderHook(() => useDeleteTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate('non-existent');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBe(false);
    });
  });

  describe('useSelectedTransaction', () => {
    beforeEach(() => {
      mockFindById.mockResolvedValue(mockTransaction);
    });

    it('fetches the selected transaction from store', async () => {
      useTransactionStore.getState().setSelected('tx-1');

      const { result } = renderHook(() => useSelectedTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindById).toHaveBeenCalledWith('tx-1');
      expect(result.current.data).toEqual(mockTransaction);
    });

    it('does not fetch when no transaction is selected', () => {
      useTransactionStore.getState().setSelected(null);

      const { result } = renderHook(() => useSelectedTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.fetchStatus).toBe('idle');
      expect(mockFindById).not.toHaveBeenCalled();
    });

    it('updates when selected id changes', async () => {
      useTransactionStore.getState().setSelected('tx-1');

      const { result, rerender } = renderHook(() => useSelectedTransaction(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const anotherTransaction = { ...mockTransaction, id: 'tx-2' } as Transaction;
      mockFindById.mockResolvedValue(anotherTransaction);

      useTransactionStore.getState().setSelected('tx-2');
      rerender();

      await waitFor(() => {
        expect(mockFindById).toHaveBeenCalledWith('tx-2');
      });
    });
  });

  describe('useFilteredTransactions', () => {
    beforeEach(() => {
      mockFindByFilters.mockResolvedValue(mockTransactions);
    });

    it('fetches transactions with mapped filters from store', async () => {
      useTransactionStore.getState().setFilters({
        accountId: 'acc-1',
        type: 'expense',
      });

      const { result } = renderHook(() => useFilteredTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindByFilters).toHaveBeenCalledWith({
        accountId: 'acc-1',
        type: 'expense',
      });
    });

    it('maps date range filters correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      useTransactionStore.getState().setDateRangeFilter(startDate, endDate);

      const { result } = renderHook(() => useFilteredTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindByFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate,
          endDate,
        })
      );
    });

    it('maps amount range filters correctly', async () => {
      useTransactionStore.getState().setAmountRangeFilter(1000, 50000);

      const { result } = renderHook(() => useFilteredTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindByFilters).toHaveBeenCalledWith(
        expect.objectContaining({
          minAmount: 1000,
          maxAmount: 50000,
        })
      );
    });

    it('fetches all transactions when no filters are set', async () => {
      mockFindAll.mockResolvedValue(mockTransactions);
      useTransactionStore.getState().resetFilters();

      const { result } = renderHook(() => useFilteredTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindAll).toHaveBeenCalled();
    });
  });

  describe('useInvalidateTransactions', () => {
    it('returns a function that invalidates transaction queries', async () => {
      const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useInvalidateTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      result.current();

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: TRANSACTION_QUERY_KEYS.all });
      });
    });

    it('returns the same function reference on re-render', () => {
      const { result, rerender } = renderHook(() => useInvalidateTransactions(), {
        wrapper: createWrapper(queryClient),
      });

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });
  });
});

describe('TRANSACTION_QUERY_KEYS', () => {
  it('generates correct all key', () => {
    expect(TRANSACTION_QUERY_KEYS.all).toEqual(['transactions']);
  });

  it('generates correct list keys', () => {
    expect(TRANSACTION_QUERY_KEYS.lists()).toEqual(['transactions', 'list']);
    expect(TRANSACTION_QUERY_KEYS.list({ accountId: 'acc-1' })).toEqual([
      'transactions',
      'list',
      { accountId: 'acc-1' },
    ]);
  });

  it('generates correct detail keys', () => {
    expect(TRANSACTION_QUERY_KEYS.details()).toEqual(['transactions', 'detail']);
    expect(TRANSACTION_QUERY_KEYS.detail('tx-1')).toEqual(['transactions', 'detail', 'tx-1']);
  });

  it('generates correct account keys', () => {
    expect(TRANSACTION_QUERY_KEYS.byAccount('acc-1')).toEqual(['transactions', 'account', 'acc-1']);
  });

  it('generates correct recent keys', () => {
    expect(TRANSACTION_QUERY_KEYS.recent('acc-1', 10)).toEqual([
      'transactions',
      'recent',
      'acc-1',
      10,
    ]);
  });

  it('generates correct summary keys', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-31');
    expect(TRANSACTION_QUERY_KEYS.summary(start, end)).toEqual([
      'transactions',
      'summary',
      start.toISOString(),
      end.toISOString(),
    ]);
  });

  it('generates correct account summary keys', () => {
    expect(TRANSACTION_QUERY_KEYS.accountSummary('acc-1')).toEqual([
      'transactions',
      'accountSummary',
      'acc-1',
    ]);
  });
});
