import { useState, useCallback, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { smsPermissions } from '@/infrastructure/sms';

import { bulkImportService } from '../services';

import type { BulkImportProgress, BulkImportResult } from '../services';
import type { HistoricalSmsOptions } from '@/infrastructure/sms';

export type BulkImportStatus =
  | 'idle'
  | 'checking'
  | 'preparing'
  | 'importing'
  | 'complete'
  | 'cancelled'
  | 'error';

interface UseBulkImportReturn {
  status: BulkImportStatus;
  progress: BulkImportProgress | null;
  result: BulkImportResult | null;
  error: string | null;
  estimatedCount: number | null;
  hasPermission: boolean | null;
  checkPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  getEstimatedCount: () => Promise<void>;
  startImport: (options?: HistoricalSmsOptions) => Promise<void>;
  cancelImport: () => void;
  reset: () => void;
}

export function useBulkImport(): UseBulkImportReturn {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<BulkImportStatus>('idle');
  const [progress, setProgress] = useState<BulkImportProgress | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const importServiceRef = useRef(bulkImportService);

  const checkPermission = useCallback(async (): Promise<boolean> => {
    setStatus('checking');
    try {
      const permResult = await smsPermissions.checkPermissionState();
      const hasPerm = permResult.state === 'granted';
      setHasPermission(hasPerm);
      setStatus('idle');
      return hasPerm;
    } catch {
      setHasPermission(false);
      setStatus('idle');
      return false;
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const result = await smsPermissions.requestWithRetry();
      const granted = result.state === 'granted';
      setHasPermission(granted);
      return granted;
    } catch {
      setHasPermission(false);
      return false;
    }
  }, []);

  const getEstimatedCount = useCallback(async () => {
    setStatus('preparing');
    try {
      const count = await importServiceRef.current.getEstimatedCount();
      setEstimatedCount(count);
      setStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get message count');
      setStatus('error');
    }
  }, []);

  const startImport = useCallback(
    async (options?: HistoricalSmsOptions) => {
      setStatus('importing');
      setError(null);
      setResult(null);

      try {
        const importResult = await importServiceRef.current.importHistoricalSms(
          options,
          (progressUpdate) => {
            setProgress(progressUpdate);
            if (progressUpdate.phase === 'complete') {
              setStatus('complete');
            }
          }
        );

        setResult(importResult);
        setStatus(importResult.success ? 'complete' : 'error');

        if (!importResult.success && importResult.errorMessages.length > 0) {
          setError(importResult.errorMessages[0] ?? null);
        }

        void queryClient.invalidateQueries();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
        setStatus('error');
      }
    },
    [queryClient]
  );

  const cancelImport = useCallback(() => {
    importServiceRef.current.cancel();
    setStatus('cancelled');
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(null);
    setResult(null);
    setError(null);
    setEstimatedCount(null);
  }, []);

  return {
    status,
    progress,
    result,
    error,
    estimatedCount,
    hasPermission,
    checkPermission,
    requestPermission,
    getEstimatedCount,
    startImport,
    cancelImport,
    reset,
  };
}
