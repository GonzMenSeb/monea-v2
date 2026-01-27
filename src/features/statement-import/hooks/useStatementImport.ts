import { useState, useCallback, useMemo, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { DASHBOARD_QUERY_KEYS } from '@/features/dashboard/hooks';
import { TRANSACTION_QUERY_KEYS } from '@/features/transactions/hooks';
import { database } from '@/infrastructure/database';

import { getStatementImportService } from '../services';

import type {
  ImportProgress,
  ImportResult,
  ImportOptions,
  FileImportInput,
  PeriodOverlapInfo,
} from '../types';
import type { BankCode } from '@/infrastructure/database/models/Account';

export type StatementImportStatus =
  | 'idle'
  | 'reading'
  | 'parsing'
  | 'detecting_duplicates'
  | 'importing'
  | 'updating_balances'
  | 'complete'
  | 'error';

export interface StatementImportState {
  status: StatementImportStatus;
  progress: ImportProgress | null;
  result: ImportResult | null;
  error: string | null;
  isImporting: boolean;
}

export interface StatementImportActions {
  importStatement: (
    input: FileImportInput,
    options?: ImportOptions
  ) => Promise<ImportResult | null>;
  previewImport: (input: FileImportInput) => Promise<ImportResult | null>;
  checkFileAlreadyImported: (data: Buffer) => Promise<boolean>;
  checkPeriodOverlaps: (
    periodStart: Date,
    periodEnd: Date,
    bankCode?: BankCode
  ) => Promise<PeriodOverlapInfo[]>;
  reset: () => void;
  clearError: () => void;
}

export interface UseStatementImportReturn extends StatementImportState, StatementImportActions {}

export function useStatementImport(): UseStatementImportReturn {
  const queryClient = useQueryClient();
  const service = useMemo(() => getStatementImportService(database), []);

  const [status, setStatus] = useState<StatementImportStatus>('idle');
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const isImporting = status !== 'idle' && status !== 'complete' && status !== 'error';

  const invalidateQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: TRANSACTION_QUERY_KEYS.all });
    void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.all });
  }, [queryClient]);

  const handleProgress = useCallback((progressUpdate: ImportProgress): void => {
    if (!mountedRef.current) {
      return;
    }

    setProgress(progressUpdate);

    const phaseToStatus: Record<ImportProgress['phase'], StatementImportStatus> = {
      reading: 'reading',
      parsing: 'parsing',
      detecting_duplicates: 'detecting_duplicates',
      importing: 'importing',
      updating_balances: 'updating_balances',
      complete: 'complete',
    };

    setStatus(phaseToStatus[progressUpdate.phase]);
  }, []);

  const importStatement = useCallback(
    async (input: FileImportInput, options?: ImportOptions): Promise<ImportResult | null> => {
      setStatus('reading');
      setError(null);
      setResult(null);

      try {
        const importResult = await service.importStatement(input, options, handleProgress);

        if (!mountedRef.current) {
          return null;
        }

        setResult(importResult);

        if (importResult.success) {
          setStatus('complete');
          if (importResult.transactions.imported > 0) {
            invalidateQueries();
          }
        } else {
          setStatus('error');
          const firstError = importResult.errors[0];
          if (firstError) {
            setError(firstError.message);
          }
        }

        return importResult;
      } catch (err) {
        if (!mountedRef.current) {
          return null;
        }

        const errorMessage = err instanceof Error ? err.message : 'Import failed';
        setError(errorMessage);
        setStatus('error');
        return null;
      }
    },
    [service, handleProgress, invalidateQueries]
  );

  const previewImport = useCallback(
    async (input: FileImportInput): Promise<ImportResult | null> => {
      setStatus('reading');
      setError(null);
      setResult(null);

      try {
        const previewResult = await service.previewImport(input);

        if (!mountedRef.current) {
          return null;
        }

        setResult(previewResult);
        setStatus(previewResult.success ? 'complete' : 'error');

        if (!previewResult.success) {
          const firstError = previewResult.errors[0];
          if (firstError) {
            setError(firstError.message);
          }
        }

        return previewResult;
      } catch (err) {
        if (!mountedRef.current) {
          return null;
        }

        const errorMessage = err instanceof Error ? err.message : 'Preview failed';
        setError(errorMessage);
        setStatus('error');
        return null;
      }
    },
    [service]
  );

  const checkFileAlreadyImported = useCallback(
    async (data: Buffer): Promise<boolean> => {
      try {
        return await service.checkFileAlreadyImported(data);
      } catch {
        return false;
      }
    },
    [service]
  );

  const checkPeriodOverlaps = useCallback(
    async (
      periodStart: Date,
      periodEnd: Date,
      bankCode?: BankCode
    ): Promise<PeriodOverlapInfo[]> => {
      try {
        return await service.checkPeriodOverlaps(periodStart, periodEnd, bankCode);
      } catch {
        return [];
      }
    },
    [service]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    if (status === 'error') {
      setStatus('idle');
    }
  }, [status]);

  return {
    status,
    progress,
    result,
    error,
    isImporting,
    importStatement,
    previewImport,
    checkFileAlreadyImported,
    checkPeriodOverlaps,
    reset,
    clearError,
  };
}
