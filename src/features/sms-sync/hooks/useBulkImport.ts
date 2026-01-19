import { useState, useCallback, useRef, useMemo } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { smsPermissions } from '@/infrastructure/sms';
import { useAppStore } from '@/shared/store';

import { bulkImportService } from '../services';

import type { BulkImportProgress, BulkImportResult } from '../services';
import type { HistoricalSmsOptions } from '@/infrastructure/sms';

const IMPORT_TIERS = [200, 500, 1000, 5000] as const;

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
  currentLimit: number;
  canImportMore: boolean;
  hasPermission: boolean | null;
  checkPermission: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  getEstimatedCount: () => Promise<void>;
  startImport: (options?: HistoricalSmsOptions) => Promise<void>;
  cancelImport: () => void;
  reset: () => void;
  prepareForMore: () => void;
}

export function useBulkImport(): UseBulkImportReturn {
  const queryClient = useQueryClient();
  const tierIndex = useAppStore((state) => state.importTierIndex);
  const advanceImportTier = useAppStore((state) => state.advanceImportTier);
  const [status, setStatus] = useState<BulkImportStatus>('idle');
  const [progress, setProgress] = useState<BulkImportProgress | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedCount, setEstimatedCount] = useState<number | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const importServiceRef = useRef(bulkImportService);

  const currentLimit = useMemo((): number => {
    const maxTier = IMPORT_TIERS[IMPORT_TIERS.length - 1] as number;
    const tierLimit = IMPORT_TIERS[tierIndex] ?? maxTier;
    if (estimatedCount === null) {
      return tierLimit;
    }
    return Math.min(tierLimit, estimatedCount);
  }, [tierIndex, estimatedCount]);

  const canImportMore = tierIndex < IMPORT_TIERS.length - 1;

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

      const tierLimit = IMPORT_TIERS[tierIndex] ?? IMPORT_TIERS[IMPORT_TIERS.length - 1];

      try {
        const importResult = await importServiceRef.current.importHistoricalSms(
          { ...options, limit: tierLimit },
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

        if (importResult.success && tierIndex < IMPORT_TIERS.length - 1) {
          advanceImportTier();
        }

        void queryClient.invalidateQueries();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed');
        setStatus('error');
      }
    },
    [queryClient, tierIndex, advanceImportTier]
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

  const prepareForMore = useCallback(() => {
    setStatus('idle');
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    status,
    progress,
    result,
    error,
    estimatedCount,
    currentLimit,
    canImportMore,
    hasPermission,
    checkPermission,
    requestPermission,
    getEstimatedCount,
    startImport,
    cancelImport,
    reset,
    prepareForMore,
  };
}
