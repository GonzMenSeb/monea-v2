import { useMemo } from 'react';

import { useQuery, useQueries } from '@tanstack/react-query';

import { database, TransactionRepository, AccountRepository } from '@/infrastructure/database';

import type Account from '@/infrastructure/database/models/Account';
import type { BankCode, AccountType } from '@/infrastructure/database/models/Account';
import type Transaction from '@/infrastructure/database/models/Transaction';
import type { TransactionSummary, AccountSummary } from '@/infrastructure/database/repositories';

export interface AccountWithBalance {
  id: string;
  bankCode: BankCode;
  bankName: string;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  isActive: boolean;
}

type TimeRange = 'weekly' | 'monthly';

interface SpendingDataPoint {
  label: string;
  income: number;
  expense: number;
}

interface DashboardData {
  totalBalance: number;
  accounts: AccountWithBalance[];
  recentTransactions: Transaction[];
  transactionSummary: TransactionSummary;
  spendingData: SpendingDataPoint[];
  accountSummary: AccountSummary;
  percentageChange: number | undefined;
  trendDirection: 'up' | 'down' | 'neutral';
}

interface UseDashboardDataOptions {
  timeRange?: TimeRange;
  recentTransactionsLimit?: number;
}

interface UseDashboardDataResult {
  data: DashboardData | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  accounts: AccountWithBalance[];
  accountsLoading: boolean;
  accountsError: Error | null;
  recentTransactions: Transaction[];
  transactionsLoading: boolean;
  transactionsError: Error | null;
  spendingData: SpendingDataPoint[];
  spendingLoading: boolean;
}

export const DASHBOARD_QUERY_KEYS = {
  all: ['dashboard'] as const,
  accounts: () => [...DASHBOARD_QUERY_KEYS.all, 'accounts'] as const,
  accountSummary: () => [...DASHBOARD_QUERY_KEYS.all, 'accountSummary'] as const,
  recentTransactions: (limit: number) =>
    [...DASHBOARD_QUERY_KEYS.all, 'recentTransactions', limit] as const,
  transactionSummary: (start: string, end: string) =>
    [...DASHBOARD_QUERY_KEYS.all, 'transactionSummary', start, end] as const,
  previousSummary: (start: string, end: string) =>
    [...DASHBOARD_QUERY_KEYS.all, 'previousSummary', start, end] as const,
  spendingData: (timeRange: TimeRange, start: string, end: string) =>
    [...DASHBOARD_QUERY_KEYS.all, 'spendingData', timeRange, start, end] as const,
} as const;

function createAccountRepository(): AccountRepository {
  return new AccountRepository(database);
}

function createTransactionRepository(): TransactionRepository {
  return new TransactionRepository(database);
}

function getDateRanges(timeRange: TimeRange): {
  currentStart: Date;
  currentEnd: Date;
  previousStart: Date;
  previousEnd: Date;
} {
  const now = new Date();
  const currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (timeRange === 'weekly') {
    const dayOfWeek = now.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const currentStart = new Date(currentEnd);
    currentStart.setDate(currentEnd.getDate() - daysFromMonday);
    currentStart.setHours(0, 0, 0, 0);

    const previousEnd = new Date(currentStart);
    previousEnd.setDate(previousEnd.getDate() - 1);
    previousEnd.setHours(23, 59, 59, 999);

    const previousStart = new Date(previousEnd);
    previousStart.setDate(previousStart.getDate() - 6);
    previousStart.setHours(0, 0, 0, 0);

    return { currentStart, currentEnd, previousStart, previousEnd };
  }

  const currentStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  previousEnd.setHours(23, 59, 59, 999);
  const previousStart = new Date(previousEnd.getFullYear(), previousEnd.getMonth(), 1, 0, 0, 0, 0);

  return { currentStart, currentEnd, previousStart, previousEnd };
}

function generateSpendingDataPoints(
  transactions: Transaction[],
  timeRange: TimeRange,
  startDate: Date
): SpendingDataPoint[] {
  const dataPoints: SpendingDataPoint[] = [];

  if (timeRange === 'weekly') {
    const dayNames: [string, string, string, string, string, string, string] = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayTransactions = transactions.filter((t) => {
        const tDate = t.transactionDate;
        return tDate >= dayStart && tDate <= dayEnd;
      });

      let income = 0;
      let expense = 0;
      for (const t of dayTransactions) {
        if (t.type === 'income' || t.type === 'transfer_in') {
          income += t.amount;
        } else if (t.type === 'expense' || t.type === 'transfer_out') {
          expense += t.amount;
        }
      }

      const label = dayNames[i as 0 | 1 | 2 | 3 | 4 | 5 | 6];
      dataPoints.push({ label, income, expense });
    }
  } else {
    const weeksInMonth = 4;
    for (let week = 0; week < weeksInMonth; week++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(startDate.getDate() + week * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekTransactions = transactions.filter((t) => {
        const tDate = t.transactionDate;
        return tDate >= weekStart && tDate <= weekEnd;
      });

      let income = 0;
      let expense = 0;
      for (const t of weekTransactions) {
        if (t.type === 'income' || t.type === 'transfer_in') {
          income += t.amount;
        } else if (t.type === 'expense' || t.type === 'transfer_out') {
          expense += t.amount;
        }
      }

      dataPoints.push({ label: `Week ${week + 1}`, income, expense });
    }
  }

  return dataPoints;
}

function calculateTrend(
  currentSummary: TransactionSummary,
  previousSummary: TransactionSummary
): { percentageChange: number | undefined; trendDirection: 'up' | 'down' | 'neutral' } {
  const currentNet = currentSummary.netBalance;
  const previousNet = previousSummary.netBalance;

  if (previousNet === 0 && currentNet === 0) {
    return { percentageChange: undefined, trendDirection: 'neutral' };
  }

  if (previousNet === 0) {
    return {
      percentageChange: 100,
      trendDirection: currentNet > 0 ? 'up' : 'down',
    };
  }

  const change = ((currentNet - previousNet) / Math.abs(previousNet)) * 100;
  const trendDirection = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  return { percentageChange: Math.abs(change), trendDirection };
}

export function useDashboardData(options: UseDashboardDataOptions = {}): UseDashboardDataResult {
  const { timeRange = 'weekly', recentTransactionsLimit = 5 } = options;

  const accountRepository = useMemo(() => createAccountRepository(), []);
  const transactionRepository = useMemo(() => createTransactionRepository(), []);

  const dateRanges = useMemo(() => getDateRanges(timeRange), [timeRange]);

  const accountsQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.accounts(),
    queryFn: async (): Promise<AccountWithBalance[]> => {
      const accounts = await accountRepository.findActive();

      if (accounts.length === 0) {
        return [];
      }

      const accountIds = accounts.map((a) => a.id);
      const balances = await transactionRepository.getBalancesByAccountIds(accountIds);

      return accounts.map((account) => ({
        id: account.id,
        bankCode: account.bankCode,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: balances.get(account.id) ?? 0,
        isActive: account.isActive,
      }));
    },
  });

  const accountSummaryQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.accountSummary(),
    queryFn: async (): Promise<AccountSummary> => {
      const summary = await accountRepository.getSummary();
      const accounts = await accountRepository.findAll();

      if (accounts.length === 0) {
        return summary;
      }

      const accountIds = accounts.map((a) => a.id);
      const balances = await transactionRepository.getBalancesByAccountIds(accountIds);

      let totalBalance = 0;
      const byBank = { ...summary.byBank };

      for (const bankCode of Object.keys(byBank)) {
        byBank[bankCode as keyof typeof byBank] = 0;
      }

      for (const account of accounts) {
        const balance = balances.get(account.id) ?? 0;
        totalBalance += balance;
        byBank[account.bankCode] = (byBank[account.bankCode] ?? 0) + balance;
      }

      return {
        ...summary,
        totalBalance,
        byBank,
      };
    },
  });

  const recentTransactionsQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.recentTransactions(recentTransactionsLimit),
    queryFn: async (): Promise<Transaction[]> => {
      const transactions = await transactionRepository.findByDateRange(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date()
      );
      return transactions.slice(0, recentTransactionsLimit);
    },
  });

  const [currentSummaryQuery, previousSummaryQuery] = useQueries({
    queries: [
      {
        queryKey: DASHBOARD_QUERY_KEYS.transactionSummary(
          dateRanges.currentStart.toISOString(),
          dateRanges.currentEnd.toISOString()
        ),
        queryFn: async (): Promise<TransactionSummary> => {
          return transactionRepository.getSummaryByDateRange(
            dateRanges.currentStart,
            dateRanges.currentEnd
          );
        },
      },
      {
        queryKey: DASHBOARD_QUERY_KEYS.previousSummary(
          dateRanges.previousStart.toISOString(),
          dateRanges.previousEnd.toISOString()
        ),
        queryFn: async (): Promise<TransactionSummary> => {
          return transactionRepository.getSummaryByDateRange(
            dateRanges.previousStart,
            dateRanges.previousEnd
          );
        },
      },
    ],
  });

  const spendingDataQuery = useQuery({
    queryKey: DASHBOARD_QUERY_KEYS.spendingData(
      timeRange,
      dateRanges.currentStart.toISOString(),
      dateRanges.currentEnd.toISOString()
    ),
    queryFn: async (): Promise<SpendingDataPoint[]> => {
      const transactions = await transactionRepository.findByDateRange(
        dateRanges.currentStart,
        dateRanges.currentEnd
      );
      return generateSpendingDataPoints(transactions, timeRange, dateRanges.currentStart);
    },
  });

  const isLoading =
    accountsQuery.isLoading ||
    accountSummaryQuery.isLoading ||
    recentTransactionsQuery.isLoading ||
    currentSummaryQuery.isLoading ||
    previousSummaryQuery.isLoading ||
    spendingDataQuery.isLoading;

  const error =
    accountsQuery.error ||
    accountSummaryQuery.error ||
    recentTransactionsQuery.error ||
    currentSummaryQuery.error ||
    previousSummaryQuery.error ||
    spendingDataQuery.error;

  const data = useMemo((): DashboardData | undefined => {
    if (
      !accountsQuery.data ||
      !accountSummaryQuery.data ||
      !recentTransactionsQuery.data ||
      !currentSummaryQuery.data ||
      !previousSummaryQuery.data ||
      !spendingDataQuery.data
    ) {
      return undefined;
    }

    const { percentageChange, trendDirection } = calculateTrend(
      currentSummaryQuery.data,
      previousSummaryQuery.data
    );

    return {
      totalBalance: accountSummaryQuery.data.totalBalance,
      accounts: accountsQuery.data,
      recentTransactions: recentTransactionsQuery.data,
      transactionSummary: currentSummaryQuery.data,
      spendingData: spendingDataQuery.data,
      accountSummary: accountSummaryQuery.data,
      percentageChange,
      trendDirection,
    };
  }, [
    accountsQuery.data,
    accountSummaryQuery.data,
    recentTransactionsQuery.data,
    currentSummaryQuery.data,
    previousSummaryQuery.data,
    spendingDataQuery.data,
  ]);

  const refetch = (): void => {
    void accountsQuery.refetch();
    void accountSummaryQuery.refetch();
    void recentTransactionsQuery.refetch();
    void currentSummaryQuery.refetch();
    void previousSummaryQuery.refetch();
    void spendingDataQuery.refetch();
  };

  return {
    data,
    isLoading,
    error: error ?? null,
    refetch,
    accounts: accountsQuery.data ?? [],
    accountsLoading: accountsQuery.isLoading,
    accountsError: accountsQuery.error ?? null,
    recentTransactions: recentTransactionsQuery.data ?? [],
    transactionsLoading: recentTransactionsQuery.isLoading,
    transactionsError: recentTransactionsQuery.error ?? null,
    spendingData: spendingDataQuery.data ?? [],
    spendingLoading: spendingDataQuery.isLoading,
  };
}
