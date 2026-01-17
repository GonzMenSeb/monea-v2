import { useCallback, useMemo } from 'react';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';

import { database, TransactionRepository } from '@/infrastructure/database';

import { useTransactionStore } from '../store/transactionStore';

import type {
  CreateTransactionData,
  UpdateTransactionData,
  TransactionFilters,
  TransactionSummary,
} from '@/infrastructure/database';
import type Transaction from '@/infrastructure/database/models/Transaction';

export const TRANSACTION_QUERY_KEYS = {
  all: ['transactions'] as const,
  lists: () => [...TRANSACTION_QUERY_KEYS.all, 'list'] as const,
  list: (filters: TransactionFilters) => [...TRANSACTION_QUERY_KEYS.lists(), filters] as const,
  details: () => [...TRANSACTION_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TRANSACTION_QUERY_KEYS.details(), id] as const,
  byAccount: (accountId: string) => [...TRANSACTION_QUERY_KEYS.all, 'account', accountId] as const,
  recent: (accountId: string, limit: number) =>
    [...TRANSACTION_QUERY_KEYS.all, 'recent', accountId, limit] as const,
  summary: (startDate: Date, endDate: Date) =>
    [
      ...TRANSACTION_QUERY_KEYS.all,
      'summary',
      startDate.toISOString(),
      endDate.toISOString(),
    ] as const,
  accountSummary: (accountId: string) =>
    [...TRANSACTION_QUERY_KEYS.all, 'accountSummary', accountId] as const,
} as const;

function createRepository(): TransactionRepository {
  return new TransactionRepository(database);
}

export function useTransactions(
  filters?: TransactionFilters
): UseQueryResult<Transaction[], Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: TRANSACTION_QUERY_KEYS.list(filters ?? {}),
    queryFn: async (): Promise<Transaction[]> => {
      if (filters && Object.keys(filters).length > 0) {
        return repository.findByFilters(filters);
      }
      return repository.findAll();
    },
  });
}

export function useTransaction(id: string | null): UseQueryResult<Transaction | null, Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: TRANSACTION_QUERY_KEYS.detail(id ?? ''),
    queryFn: async (): Promise<Transaction | null> => {
      if (!id) {
        return null;
      }
      return repository.findById(id);
    },
    enabled: id !== null,
  });
}

export function useTransactionsByAccount(
  accountId: string | null
): UseQueryResult<Transaction[], Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: TRANSACTION_QUERY_KEYS.byAccount(accountId ?? ''),
    queryFn: async (): Promise<Transaction[]> => {
      if (!accountId) {
        return [];
      }
      return repository.findByAccountId(accountId);
    },
    enabled: accountId !== null,
  });
}

interface UseRecentTransactionsOptions {
  accountId: string;
  limit?: number;
}

export function useRecentTransactions({
  accountId,
  limit = 10,
}: UseRecentTransactionsOptions): UseQueryResult<Transaction[], Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: TRANSACTION_QUERY_KEYS.recent(accountId, limit),
    queryFn: async (): Promise<Transaction[]> => {
      return repository.findRecentByAccount(accountId, limit);
    },
    enabled: accountId !== '',
  });
}

interface UseTransactionSummaryOptions {
  startDate: Date;
  endDate: Date;
}

export function useTransactionSummary({
  startDate,
  endDate,
}: UseTransactionSummaryOptions): UseQueryResult<TransactionSummary, Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: TRANSACTION_QUERY_KEYS.summary(startDate, endDate),
    queryFn: async (): Promise<TransactionSummary> => {
      return repository.getSummaryByDateRange(startDate, endDate);
    },
  });
}

export function useAccountTransactionSummary(
  accountId: string | null
): UseQueryResult<TransactionSummary, Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: TRANSACTION_QUERY_KEYS.accountSummary(accountId ?? ''),
    queryFn: async (): Promise<TransactionSummary> => {
      if (!accountId) {
        return { totalIncome: 0, totalExpense: 0, netBalance: 0, transactionCount: 0 };
      }
      return repository.getSummaryByAccountId(accountId);
    },
    enabled: accountId !== null,
  });
}

export function useCreateTransaction(): UseMutationResult<
  Transaction,
  Error,
  CreateTransactionData
> {
  const queryClient = useQueryClient();
  const repository = useMemo(() => createRepository(), []);

  return useMutation({
    mutationFn: async (data: CreateTransactionData): Promise<Transaction> => {
      return repository.create(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRANSACTION_QUERY_KEYS.all });
    },
  });
}

export function useCreateTransactionBatch(): UseMutationResult<
  Transaction[],
  Error,
  CreateTransactionData[]
> {
  const queryClient = useQueryClient();
  const repository = useMemo(() => createRepository(), []);

  return useMutation({
    mutationFn: async (dataList: CreateTransactionData[]): Promise<Transaction[]> => {
      return repository.createBatch(dataList);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRANSACTION_QUERY_KEYS.all });
    },
  });
}

interface UpdateTransactionVariables {
  id: string;
  data: UpdateTransactionData;
}

export function useUpdateTransaction(): UseMutationResult<
  Transaction | null,
  Error,
  UpdateTransactionVariables
> {
  const queryClient = useQueryClient();
  const repository = useMemo(() => createRepository(), []);

  return useMutation({
    mutationFn: async ({ id, data }: UpdateTransactionVariables): Promise<Transaction | null> => {
      return repository.update(id, data);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: TRANSACTION_QUERY_KEYS.detail(variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: TRANSACTION_QUERY_KEYS.lists() });
    },
  });
}

export function useDeleteTransaction(): UseMutationResult<boolean, Error, string> {
  const queryClient = useQueryClient();
  const repository = useMemo(() => createRepository(), []);

  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      return repository.delete(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TRANSACTION_QUERY_KEYS.all });
    },
  });
}

export function useSelectedTransaction(): UseQueryResult<Transaction | null, Error> {
  const selectedId = useTransactionStore((state) => state.selectedId);
  return useTransaction(selectedId);
}

export function useFilteredTransactions(): UseQueryResult<Transaction[], Error> {
  const filters = useTransactionStore((state) => state.filters);

  const mappedFilters = useMemo((): TransactionFilters => {
    const result: TransactionFilters = {};

    if (filters.accountId) {
      result.accountId = filters.accountId;
    }
    if (filters.categoryId) {
      result.categoryId = filters.categoryId;
    }
    if (filters.type) {
      result.type = filters.type;
    }
    if (filters.dateRange.start) {
      result.startDate = filters.dateRange.start;
    }
    if (filters.dateRange.end) {
      result.endDate = filters.dateRange.end;
    }
    if (filters.amountRange.min !== null) {
      result.minAmount = filters.amountRange.min;
    }
    if (filters.amountRange.max !== null) {
      result.maxAmount = filters.amountRange.max;
    }

    return result;
  }, [filters]);

  return useTransactions(mappedFilters);
}

export function useInvalidateTransactions(): () => void {
  const queryClient = useQueryClient();

  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: TRANSACTION_QUERY_KEYS.all });
  }, [queryClient]);
}
