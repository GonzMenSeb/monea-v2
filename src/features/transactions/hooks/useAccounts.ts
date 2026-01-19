import { useMemo } from 'react';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { database, AccountRepository } from '@/infrastructure/database';

import type Account from '@/infrastructure/database/models/Account';

export const ACCOUNT_QUERY_KEYS = {
  all: ['accounts'] as const,
  lists: () => [...ACCOUNT_QUERY_KEYS.all, 'list'] as const,
  active: () => [...ACCOUNT_QUERY_KEYS.all, 'active'] as const,
  detail: (id: string) => [...ACCOUNT_QUERY_KEYS.all, 'detail', id] as const,
} as const;

function createRepository(): AccountRepository {
  return new AccountRepository(database);
}

export function useAccounts(): UseQueryResult<Account[], Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.lists(),
    queryFn: async (): Promise<Account[]> => {
      return repository.findAll();
    },
  });
}

export function useActiveAccounts(): UseQueryResult<Account[], Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.active(),
    queryFn: async (): Promise<Account[]> => {
      return repository.findActive();
    },
  });
}

export function useAccount(id: string | null): UseQueryResult<Account | null, Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.detail(id ?? ''),
    queryFn: async (): Promise<Account | null> => {
      if (!id) {
        return null;
      }
      return repository.findById(id);
    },
    enabled: id !== null,
  });
}
