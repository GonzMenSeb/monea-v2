import { useState, useCallback, useEffect, useRef } from 'react';

import { AppState } from 'react-native';

import { smsPermissions } from '@/infrastructure/sms';

import type { PermissionState, PermissionResult } from '@/infrastructure/sms';
import type { AppStateStatus } from 'react-native';

interface UseSmsPermissionOptions {
  checkOnMount?: boolean;
  checkOnForeground?: boolean;
}

interface UseSmsPermissionReturn {
  permissionState: PermissionState;
  isLoading: boolean;
  error: Error | null;
  canRetry: boolean;
  hasReadSms: boolean;
  hasReceiveSms: boolean;
  isFullyGranted: boolean;
  checkPermission: () => Promise<PermissionResult>;
  requestPermission: () => Promise<PermissionResult>;
  openSettings: () => Promise<void>;
}

const DEFAULT_OPTIONS: UseSmsPermissionOptions = {
  checkOnMount: true,
  checkOnForeground: true,
};

export function useSmsPermission(
  options: UseSmsPermissionOptions = DEFAULT_OPTIONS
): UseSmsPermissionReturn {
  const { checkOnMount = true, checkOnForeground = true } = options;

  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [hasReadSms, setHasReadSms] = useState(false);
  const [hasReceiveSms, setHasReceiveSms] = useState(false);
  const [canRetry, setCanRetry] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isMounted = useRef(true);
  const previousAppState = useRef<AppStateStatus>(AppState.currentState);

  const updateFromResult = useCallback((result: PermissionResult): void => {
    if (!isMounted.current) {
      return;
    }

    setPermissionState(result.state);
    setHasReadSms(result.status.hasReadSmsPermission);
    setHasReceiveSms(result.status.hasReceiveSmsPermission);
    setCanRetry(result.canRetry);
    setError(null);
  }, []);

  const checkPermission = useCallback(async (): Promise<PermissionResult> => {
    setIsLoading(true);
    setPermissionState('checking');
    setError(null);

    try {
      const result = await smsPermissions.checkPermissionState();
      updateFromResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to check permissions');
      if (isMounted.current) {
        setError(error);
        setPermissionState('unknown');
      }
      throw error;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [updateFromResult]);

  const requestPermission = useCallback(async (): Promise<PermissionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await smsPermissions.requestWithRetry();
      updateFromResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to request permissions');
      if (isMounted.current) {
        setError(error);
      }
      throw error;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [updateFromResult]);

  const openSettings = useCallback(async (): Promise<void> => {
    await smsPermissions.openAppSettings();
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (checkOnMount) {
      checkPermission().catch(() => {});
    }
  }, [checkOnMount, checkPermission]);

  useEffect(() => {
    if (!checkOnForeground) {
      return;
    }

    const handleAppStateChange = (nextAppState: AppStateStatus): void => {
      const wasBackground =
        previousAppState.current === 'background' || previousAppState.current === 'inactive';
      const isNowActive = nextAppState === 'active';

      if (wasBackground && isNowActive) {
        checkPermission().catch(() => {});
      }

      previousAppState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [checkOnForeground, checkPermission]);

  const isFullyGranted = hasReadSms && hasReceiveSms;

  return {
    permissionState,
    isLoading,
    error,
    canRetry,
    hasReadSms,
    hasReceiveSms,
    isFullyGranted,
    checkPermission,
    requestPermission,
    openSettings,
  };
}
