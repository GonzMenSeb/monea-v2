import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import {
  useTransactions,
  useTransaction,
  useTransactionsByAccount,
  useRecentTransactions,
  useTransactionSummary,
  useAccountTransactionSummary,
  TRANSACTION_QUERY_KEYS,
} from '../useTransactions';
import { useTransactionStore } from '../../store/transactionStore';

import type { ReactNode, ReactElement } from 'react';
import type Transaction from '@/infrastructure/database/models/Transaction';
import type {
  TransactionFilters,
  TransactionSummary,
} from '@/infrastructure/database/repositories/TransactionRepository';

const mockFindAll = jest.fn<Promise<Transaction[]>, []>();
const mockFindById = jest.fn<Promise<Transaction | null>, [string]>();
const mockFindByAccountId = jest.fn<Promise<Transaction[]>, [string]>();
const mockFindByFilters = jest.fn<Promise<Transaction[]>, [TransactionFilters]>();
const mockFindRecentByAccount = jest.fn<Promise<Transaction[]>, [string, number]>();
const mockGetSummaryByDateRange = jest.fn<Promise<TransactionSummary>, [Date, Date]>();
const mockGetSummaryByAccountId = jest.fn<Promise<TransactionSummary>, [string]>();

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
    create: jest.fn(),
    createBatch: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
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
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
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
      const { result } = renderHook(
        () => useRecentTransactions({ accountId: 'acc-1' }),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindRecentByAccount).toHaveBeenCalledWith('acc-1', 10);
    });

    it('fetches recent transactions with custom limit', async () => {
      const { result } = renderHook(
        () => useRecentTransactions({ accountId: 'acc-1', limit: 5 }),
        { wrapper: createWrapper(queryClient) }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockFindRecentByAccount).toHaveBeenCalledWith('acc-1', 5);
    });

    it('does not fetch when accountId is empty', () => {
      const { result } = renderHook(
        () => useRecentTransactions({ accountId: '' }),
        { wrapper: createWrapper(queryClient) }
      );

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

      const { result } = renderHook(
        () => useTransactionSummary({ startDate, endDate }),
        { wrapper: createWrapper(queryClient) }
      );

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
    expect(TRANSACTION_QUERY_KEYS.byAccount('acc-1')).toEqual([
      'transactions',
      'account',
      'acc-1',
    ]);
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
