import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useDashboardData, DASHBOARD_QUERY_KEYS } from '../hooks/useDashboardData';

import type { TransactionSummary, AccountSummary } from '@/infrastructure/database/repositories';
import type { ReactNode } from 'react';

const mockAccounts = [
  {
    id: '1',
    bankCode: 'bancolombia',
    bankName: 'Bancolombia',
    accountNumber: '****1234',
    accountType: 'savings',
    balance: 5000000,
    isActive: true,
  },
  {
    id: '2',
    bankCode: 'nequi',
    bankName: 'Nequi',
    accountNumber: '****5678',
    accountType: 'savings',
    balance: 1500000,
    isActive: true,
  },
];

const mockTransactions = [
  {
    id: 't1',
    accountId: '1',
    type: 'expense',
    amount: 50000,
    transactionDate: new Date(),
    merchant: 'Restaurant',
    description: 'Lunch',
  },
  {
    id: 't2',
    accountId: '1',
    type: 'income',
    amount: 200000,
    transactionDate: new Date(),
    merchant: 'Company',
    description: 'Payment',
  },
];

const mockAccountSummary: AccountSummary = {
  totalBalance: 6500000,
  accountCount: 2,
  activeCount: 2,
  byBank: {
    bancolombia: 5000000,
    nequi: 1500000,
    davivienda: 0,
    bbva: 0,
    daviplata: 0,
    bancoomeva: 0,
  },
};

const mockTransactionSummary: TransactionSummary = {
  totalIncome: 200000,
  totalExpense: 50000,
  netBalance: 150000,
  transactionCount: 2,
};

const mockPreviousSummary: TransactionSummary = {
  totalIncome: 180000,
  totalExpense: 60000,
  netBalance: 120000,
  transactionCount: 2,
};

const mockFindActive = jest.fn().mockResolvedValue(mockAccounts);
const mockFindAll = jest.fn().mockResolvedValue(mockAccounts);
const mockGetSummary = jest.fn().mockResolvedValue(mockAccountSummary);
const mockFindByDateRange = jest.fn().mockResolvedValue(mockTransactions);
const mockGetSummaryByDateRange = jest.fn();
const mockGetBalancesByAccountIds = jest.fn().mockResolvedValue(
  new Map([
    ['1', 5000000],
    ['2', 1500000],
  ])
);

jest.mock('@/infrastructure/database', () => ({
  database: {},
  AccountRepository: jest.fn().mockImplementation(() => ({
    findActive: mockFindActive,
    findAll: mockFindAll,
    getSummary: mockGetSummary,
  })),
  TransactionRepository: jest.fn().mockImplementation(() => ({
    findByDateRange: mockFindByDateRange,
    getSummaryByDateRange: mockGetSummaryByDateRange,
    getBalancesByAccountIds: mockGetBalancesByAccountIds,
  })),
}));

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useDashboardData', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();

    mockGetSummaryByDateRange
      .mockResolvedValueOnce(mockTransactionSummary)
      .mockResolvedValueOnce(mockPreviousSummary);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('returns loading state initially', () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('fetches and returns aggregated dashboard data', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.totalBalance).toBe(6500000);
    expect(result.current.data?.accounts).toHaveLength(2);
    expect(result.current.data?.recentTransactions).toHaveLength(2);
  });

  it('calculates percentage change and trend direction', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.trendDirection).toBe('up');
    expect(result.current.data?.percentageChange).toBeGreaterThan(0);
  });

  it('respects time range option', async () => {
    const { result } = renderHook(() => useDashboardData({ timeRange: 'monthly' }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockFindByDateRange).toHaveBeenCalled();
  });

  it('respects recent transactions limit', async () => {
    const manyTransactions = Array.from({ length: 10 }, (_, i) => ({
      ...mockTransactions[0],
      id: `t${i}`,
    }));
    mockFindByDateRange.mockResolvedValue(manyTransactions);

    const { result } = renderHook(() => useDashboardData({ recentTransactionsLimit: 3 }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recentTransactions).toHaveLength(3);
  });

  it('provides individual loading states', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.accountsLoading).toBe(false);
      expect(result.current.transactionsLoading).toBe(false);
      expect(result.current.spendingLoading).toBe(false);
    });
  });

  it('returns empty arrays when no data', async () => {
    mockFindActive.mockResolvedValueOnce([]);
    mockFindByDateRange.mockResolvedValueOnce([]);

    const freshClient = createTestQueryClient();
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(freshClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.accounts).toEqual([]);
  });

  it('handles error state', async () => {
    const error = new Error('Database error');
    mockFindActive.mockRejectedValueOnce(error);

    const freshClient = createTestQueryClient();
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(freshClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.accountsError).toBeTruthy();
  });

  it('provides refetch function', async () => {
    const { result } = renderHook(() => useDashboardData(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe('function');
  });
});

describe('DASHBOARD_QUERY_KEYS', () => {
  it('generates correct keys for accounts', () => {
    expect(DASHBOARD_QUERY_KEYS.accounts()).toEqual(['dashboard', 'accounts']);
  });

  it('generates correct keys for account summary', () => {
    expect(DASHBOARD_QUERY_KEYS.accountSummary()).toEqual(['dashboard', 'accountSummary']);
  });

  it('generates correct keys for recent transactions', () => {
    expect(DASHBOARD_QUERY_KEYS.recentTransactions(5)).toEqual([
      'dashboard',
      'recentTransactions',
      5,
    ]);
  });

  it('generates correct keys for transaction summary', () => {
    expect(DASHBOARD_QUERY_KEYS.transactionSummary('2024-01-01', '2024-01-31')).toEqual([
      'dashboard',
      'transactionSummary',
      '2024-01-01',
      '2024-01-31',
    ]);
  });

  it('generates correct keys for spending data', () => {
    expect(DASHBOARD_QUERY_KEYS.spendingData('weekly', '2024-01-01', '2024-01-07')).toEqual([
      'dashboard',
      'spendingData',
      'weekly',
      '2024-01-01',
      '2024-01-07',
    ]);
  });
});
