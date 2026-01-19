import { useMemo } from 'react';

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';

import { database, CategoryRepository } from '@/infrastructure/database';

import { useCategoryStore } from '../store/categoryStore';

import type {
  CreateCategoryData,
  UpdateCategoryData,
  CategoryFilters,
} from '@/infrastructure/database';
import type Category from '@/infrastructure/database/models/Category';

export const CATEGORY_QUERY_KEYS = {
  all: ['categories'] as const,
  lists: () => [...CATEGORY_QUERY_KEYS.all, 'list'] as const,
  list: (filters: CategoryFilters) => [...CATEGORY_QUERY_KEYS.lists(), filters] as const,
  details: () => [...CATEGORY_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...CATEGORY_QUERY_KEYS.details(), id] as const,
  byType: (isIncome: boolean) => [...CATEGORY_QUERY_KEYS.all, 'type', isIncome] as const,
  system: () => [...CATEGORY_QUERY_KEYS.all, 'system'] as const,
  custom: () => [...CATEGORY_QUERY_KEYS.all, 'custom'] as const,
  transactionCount: (id: string) => [...CATEGORY_QUERY_KEYS.all, 'count', id] as const,
} as const;

function createRepository(): CategoryRepository {
  return new CategoryRepository(database);
}

export function useCategories(filters?: CategoryFilters): UseQueryResult<Category[], Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.list(filters ?? {}),
    queryFn: async (): Promise<Category[]> => {
      if (filters && Object.keys(filters).length > 0) {
        return repository.findByFilters(filters);
      }
      return repository.findAll();
    },
  });
}

export function useCategory(id: string | null): UseQueryResult<Category | null, Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.detail(id ?? ''),
    queryFn: async (): Promise<Category | null> => {
      if (!id) {
        return null;
      }
      return repository.findById(id);
    },
    enabled: id !== null,
  });
}

export function useCategoriesByType(isIncome: boolean): UseQueryResult<Category[], Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.byType(isIncome),
    queryFn: async (): Promise<Category[]> => {
      return repository.findByType(isIncome);
    },
  });
}

export function useSystemCategories(): UseQueryResult<Category[], Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.system(),
    queryFn: async (): Promise<Category[]> => {
      return repository.findSystemCategories();
    },
  });
}

export function useCustomCategories(): UseQueryResult<Category[], Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.custom(),
    queryFn: async (): Promise<Category[]> => {
      return repository.findCustomCategories();
    },
  });
}

export function useCategoryTransactionCount(
  categoryId: string | null
): UseQueryResult<number, Error> {
  const repository = useMemo(() => createRepository(), []);

  return useQuery({
    queryKey: CATEGORY_QUERY_KEYS.transactionCount(categoryId ?? ''),
    queryFn: async (): Promise<number> => {
      if (!categoryId) {
        return 0;
      }
      return repository.getTransactionCount(categoryId);
    },
    enabled: categoryId !== null,
  });
}

export function useCreateCategory(): UseMutationResult<Category, Error, CreateCategoryData> {
  const queryClient = useQueryClient();
  const repository = useMemo(() => createRepository(), []);

  return useMutation({
    mutationFn: async (data: CreateCategoryData): Promise<Category> => {
      return repository.create(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.all });
    },
  });
}

interface UpdateCategoryVariables {
  id: string;
  data: UpdateCategoryData;
}

export function useUpdateCategory(): UseMutationResult<
  Category | null,
  Error,
  UpdateCategoryVariables
> {
  const queryClient = useQueryClient();
  const repository = useMemo(() => createRepository(), []);

  return useMutation({
    mutationFn: async ({ id, data }: UpdateCategoryVariables): Promise<Category | null> => {
      return repository.update(id, data);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: CATEGORY_QUERY_KEYS.detail(variables.id),
      });
      void queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.lists() });
    },
  });
}

export function useDeleteCategory(): UseMutationResult<boolean, Error, string> {
  const queryClient = useQueryClient();
  const repository = useMemo(() => createRepository(), []);

  return useMutation({
    mutationFn: async (id: string): Promise<boolean> => {
      return repository.delete(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CATEGORY_QUERY_KEYS.all });
    },
  });
}

export function useSelectedCategory(): UseQueryResult<Category | null, Error> {
  const selectedId = useCategoryStore((state) => state.selectedId);
  return useCategory(selectedId);
}

export function useFilteredCategories(): UseQueryResult<Category[], Error> {
  const filterByIncome = useCategoryStore((state) => state.filterByIncome);

  const filters = useMemo((): CategoryFilters => {
    const result: CategoryFilters = {};
    if (filterByIncome !== null) {
      result.isIncome = filterByIncome;
    }
    return result;
  }, [filterByIncome]);

  return useCategories(filters);
}
