import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { DASHBOARD_QUERY_KEYS } from '@/features/dashboard/hooks';
import { TRANSACTION_QUERY_KEYS } from '@/features/transactions/hooks';
import { database } from '@/infrastructure/database';
import { smsPermissions } from '@/infrastructure/sms';

import { getSmsSyncService } from '../services';

import type { ProcessResult, SyncResult } from '../services';
import type { PermissionState, SmsPermissionStatus } from '@/infrastructure/sms';

export interface SmsSyncState {
  isSyncing: boolean;
  isListening: boolean;
  permissionState: PermissionState;
  permissionStatus: SmsPermissionStatus | null;
  lastSyncResult: SyncResult | null;
  lastProcessResult: ProcessResult | null;
  error: Error | null;
  unprocessedCount: number;
}

export interface SmsSyncActions {
  startListening: () => void;
  stopListening: () => void;
  checkPermissions: () => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  openSettings: () => Promise<void>;
  reprocessFailed: () => Promise<SyncResult>;
  refreshUnprocessedCount: () => Promise<void>;
}

export interface UseSmsSyncResult extends SmsSyncState, SmsSyncActions {}

const INITIAL_PERMISSION_STATUS: SmsPermissionStatus = {
  hasReadSmsPermission: false,
  hasReceiveSmsPermission: false,
};

export function useSmsSync(): UseSmsSyncResult {
  const queryClient = useQueryClient();
  const smsSyncService = useMemo(() => getSmsSyncService(database), []);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isListening, setIsListening] = useState(smsSyncService.isRunning());
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [permissionStatus, setPermissionStatus] = useState<SmsPermissionStatus | null>(null);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [lastProcessResult, setLastProcessResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [unprocessedCount, setUnprocessedCount] = useState(0);

  const mountedRef = useRef(true);

  const invalidateQueries = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: TRANSACTION_QUERY_KEYS.all });
    void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.all });
  }, [queryClient]);

  const refreshUnprocessedCount = useCallback(async (): Promise<void> => {
    const count = await smsSyncService.getUnprocessedSmsCount();
    if (mountedRef.current) {
      setUnprocessedCount(count);
    }
  }, [smsSyncService]);

  const checkPermissions = useCallback(async (): Promise<void> => {
    setPermissionState('checking');
    setError(null);

    const result = await smsPermissions.checkPermissionState();

    if (mountedRef.current) {
      setPermissionState(result.state);
      setPermissionStatus(result.status);
    }
  }, []);

  const requestPermissions = useCallback(async (): Promise<boolean> => {
    setPermissionState('checking');
    setError(null);

    const result = await smsPermissions.requestWithRetry();

    if (mountedRef.current) {
      setPermissionState(result.state);
      setPermissionStatus(result.status);
    }

    return result.state === 'granted';
  }, []);

  const openSettings = useCallback(async (): Promise<void> => {
    await smsPermissions.openAppSettings();
  }, []);

  const startListening = useCallback((): void => {
    if (permissionState !== 'granted') {
      setError(new Error('SMS permissions not granted'));
      return;
    }

    if (smsSyncService.isRunning()) {
      return;
    }

    smsSyncService.startRealtimeSync();
    setIsListening(true);
    setError(null);
  }, [smsSyncService, permissionState]);

  const stopListening = useCallback((): void => {
    smsSyncService.stopRealtimeSync();
    setIsListening(false);
  }, [smsSyncService]);

  const reprocessFailed = useCallback(async (): Promise<SyncResult> => {
    setIsSyncing(true);
    setError(null);

    try {
      const result = await smsSyncService.reprocessFailedMessages();

      if (mountedRef.current) {
        setLastSyncResult(result);
        setIsSyncing(false);

        if (result.created > 0) {
          invalidateQueries();
        }

        await refreshUnprocessedCount();
      }

      return result;
    } catch (err) {
      const syncError = err instanceof Error ? err : new Error(String(err));
      if (mountedRef.current) {
        setError(syncError);
        setIsSyncing(false);
      }
      throw syncError;
    }
  }, [smsSyncService, invalidateQueries, refreshUnprocessedCount]);

  useEffect(() => {
    mountedRef.current = true;

    const initializeSync = async (): Promise<void> => {
      await checkPermissions();
      await refreshUnprocessedCount();
    };

    void initializeSync();

    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [checkPermissions, refreshUnprocessedCount]);

  useEffect(() => {
    const unsubscribeMessage = smsSyncService.onMessage((result) => {
      if (mountedRef.current) {
        setLastProcessResult(result);

        if (result.success) {
          invalidateQueries();
        }
      }
    });

    const unsubscribeError = smsSyncService.onError((err) => {
      if (mountedRef.current) {
        setError(err);
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeError();
    };
  }, [smsSyncService, invalidateQueries]);

  useEffect(() => {
    const interval = setInterval(() => {
      void refreshUnprocessedCount();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [refreshUnprocessedCount]);

  return {
    isSyncing,
    isListening,
    permissionState,
    permissionStatus: permissionStatus ?? INITIAL_PERMISSION_STATUS,
    lastSyncResult,
    lastProcessResult,
    error,
    unprocessedCount,
    startListening,
    stopListening,
    checkPermissions,
    requestPermissions,
    openSettings,
    reprocessFailed,
    refreshUnprocessedCount,
  };
}
