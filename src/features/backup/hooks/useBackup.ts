import { useState, useCallback } from 'react';

import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { backupService } from '../services';

import type { BackupStats, BackupData, ImportResult, ImportStrategy } from '../types';

export const BACKUP_QUERY_KEYS = {
  all: ['backup'] as const,
  stats: () => [...BACKUP_QUERY_KEYS.all, 'stats'] as const,
} as const;

export type BackupStatus = 'idle' | 'exporting' | 'importing' | 'success' | 'error';

interface UseBackupReturn {
  stats: UseQueryResult<BackupStats, Error>;
  status: BackupStatus;
  error: string | null;
  importResult: ImportResult | null;
  exportData: () => Promise<void>;
  importData: (strategy?: ImportStrategy) => Promise<void>;
  resetStatus: () => void;
}

export function useBackup(): UseBackupReturn {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<BackupStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const stats = useQuery({
    queryKey: BACKUP_QUERY_KEYS.stats(),
    queryFn: async (): Promise<BackupStats> => {
      return backupService.getBackupStats();
    },
  });

  const exportData = useCallback(async () => {
    setStatus('exporting');
    setError(null);

    try {
      await backupService.exportAndShare();
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
      setStatus('error');
    }
  }, []);

  const importData = useCallback(
    async (strategy: ImportStrategy = 'merge') => {
      setStatus('importing');
      setError(null);
      setImportResult(null);

      try {
        const fileUri = await backupService.pickBackupFile();
        if (!fileUri) {
          setStatus('idle');
          return;
        }

        const backupData: BackupData = await backupService.readBackupFile(fileUri);
        const result = await backupService.importFromBackup(backupData, strategy);

        setImportResult(result);
        setStatus(result.success ? 'success' : 'error');

        if (!result.success && result.errors.length > 0) {
          setError(result.errors[0] ?? null);
        }

        void queryClient.invalidateQueries();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
        setStatus('error');
      }
    },
    [queryClient]
  );

  const resetStatus = useCallback(() => {
    setStatus('idle');
    setError(null);
    setImportResult(null);
  }, []);

  return {
    stats,
    status,
    error,
    importResult,
    exportData,
    importData,
    resetStatus,
  };
}
