import { createElement } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, act, waitFor } from '@testing-library/react-native';

import type { SyncResult } from '../../services';
import type { PermissionResult } from '@/infrastructure/sms';
import type { ReactNode } from 'react';

const mockCheckPermissionState = jest.fn();
const mockRequestWithRetry = jest.fn();
const mockOpenAppSettings = jest.fn();
const mockIsFullyGranted = jest.fn();
const mockIsRunning = jest.fn(() => false);
const mockStartRealtimeSync = jest.fn();
const mockStopRealtimeSync = jest.fn();
const mockReprocessFailedMessages = jest.fn();
const mockGetUnprocessedSmsCount = jest.fn();
const mockOnMessage = jest.fn(() => jest.fn());
const mockOnError = jest.fn(() => jest.fn());

jest.mock('@/infrastructure/sms', () => ({
  get smsPermissions() {
    return {
      checkPermissionState: mockCheckPermissionState,
      requestWithRetry: mockRequestWithRetry,
      openAppSettings: mockOpenAppSettings,
      isFullyGranted: mockIsFullyGranted,
    };
  },
}));

jest.mock('../../services', () => ({
  getSmsSyncService: () => ({
    isRunning: mockIsRunning,
    startRealtimeSync: mockStartRealtimeSync,
    stopRealtimeSync: mockStopRealtimeSync,
    reprocessFailedMessages: mockReprocessFailedMessages,
    getUnprocessedSmsCount: mockGetUnprocessedSmsCount,
    onMessage: mockOnMessage,
    onError: mockOnError,
  }),
}));

jest.mock('@/infrastructure/database', () => ({
  database: {},
}));

jest.mock('@/features/dashboard/hooks', () => ({
  DASHBOARD_QUERY_KEYS: { all: ['dashboard'] },
}));

jest.mock('@/features/transactions/hooks', () => ({
  TRANSACTION_QUERY_KEYS: { all: ['transactions'] },
}));

// eslint-disable-next-line import/order
import { useSmsSync } from '../useSmsSync';

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

function createPermissionResult(
  state: 'granted' | 'denied' | 'blocked',
  hasRead = false,
  hasReceive = false
): PermissionResult {
  return {
    state,
    status: {
      hasReadSmsPermission: hasRead,
      hasReceiveSmsPermission: hasReceive,
    },
    canRetry: state === 'denied',
  };
}

describe('useSmsSync', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    queryClient = createQueryClient();

    mockCheckPermissionState.mockResolvedValue(createPermissionResult('denied', false, false));
    mockGetUnprocessedSmsCount.mockResolvedValue(0);
    mockIsRunning.mockReturnValue(false);
  });

  afterEach(() => {
    queryClient.clear();
    jest.useRealTimers();
  });

  describe('initialization', () => {
    it('checks permissions on mount', async () => {
      jest.useRealTimers();
      renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(mockCheckPermissionState).toHaveBeenCalledTimes(1);
      });
    });

    it('refreshes unprocessed count on mount', async () => {
      jest.useRealTimers();
      renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(mockGetUnprocessedSmsCount).toHaveBeenCalled();
      });
    });

    it('returns initial state correctly', () => {
      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isSyncing).toBe(false);
      expect(result.current.lastSyncResult).toBeNull();
      expect(result.current.lastProcessResult).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('sets permission state after checking', async () => {
      jest.useRealTimers();
      mockCheckPermissionState.mockResolvedValue(createPermissionResult('granted', true, true));

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.permissionState).toBe('granted');
      });
    });
  });

  describe('permission handling', () => {
    it('requests permissions and updates state on success', async () => {
      jest.useRealTimers();
      mockRequestWithRetry.mockResolvedValue(createPermissionResult('granted', true, true));

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.requestPermissions();
      });

      expect(granted).toBe(true);
      expect(result.current.permissionState).toBe('granted');
    });

    it('requests permissions and updates state on denial', async () => {
      jest.useRealTimers();
      mockRequestWithRetry.mockResolvedValue(createPermissionResult('denied', false, false));

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      let granted: boolean | undefined;
      await act(async () => {
        granted = await result.current.requestPermissions();
      });

      expect(granted).toBe(false);
      expect(result.current.permissionState).toBe('denied');
    });

    it('opens app settings', async () => {
      jest.useRealTimers();
      mockOpenAppSettings.mockResolvedValue(undefined);

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        await result.current.openSettings();
      });

      expect(mockOpenAppSettings).toHaveBeenCalled();
    });
  });

  describe('listening control', () => {
    it('prevents starting listener without permissions', async () => {
      jest.useRealTimers();
      mockCheckPermissionState.mockResolvedValue(createPermissionResult('denied', false, false));

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.permissionState).toBe('denied');
      });

      act(() => {
        result.current.startListening();
      });

      expect(mockStartRealtimeSync).not.toHaveBeenCalled();
      expect(result.current.error).not.toBeNull();
    });

    it('starts listener when permissions granted', async () => {
      jest.useRealTimers();
      mockCheckPermissionState.mockResolvedValue(createPermissionResult('granted', true, true));

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.permissionState).toBe('granted');
      });

      act(() => {
        result.current.startListening();
      });

      expect(mockStartRealtimeSync).toHaveBeenCalled();
      expect(result.current.isListening).toBe(true);
    });

    it('stops listener', async () => {
      jest.useRealTimers();
      mockCheckPermissionState.mockResolvedValue(createPermissionResult('granted', true, true));

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.permissionState).toBe('granted');
      });

      act(() => {
        result.current.startListening();
      });

      act(() => {
        result.current.stopListening();
      });

      expect(mockStopRealtimeSync).toHaveBeenCalled();
      expect(result.current.isListening).toBe(false);
    });

    it('does not start if already running', async () => {
      jest.useRealTimers();
      mockCheckPermissionState.mockResolvedValue(createPermissionResult('granted', true, true));
      mockIsRunning.mockReturnValue(true);

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.permissionState).toBe('granted');
      });

      act(() => {
        result.current.startListening();
      });

      expect(mockStartRealtimeSync).not.toHaveBeenCalled();
    });
  });

  describe('reprocessing', () => {
    it('reprocesses failed messages and updates state', async () => {
      jest.useRealTimers();
      const syncResult: SyncResult = {
        processed: 5,
        created: 3,
        skipped: 1,
        errors: [],
      };
      mockReprocessFailedMessages.mockResolvedValue(syncResult);

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      let returnedResult: SyncResult | undefined;
      await act(async () => {
        returnedResult = await result.current.reprocessFailed();
      });

      expect(returnedResult).toEqual(syncResult);
      expect(result.current.lastSyncResult).toEqual(syncResult);
      expect(result.current.isSyncing).toBe(false);
    });

    it('sets syncing state during reprocess', async () => {
      jest.useRealTimers();
      let resolvePromise: (value: SyncResult) => void;
      const pendingPromise = new Promise<SyncResult>((resolve) => {
        resolvePromise = resolve;
      });
      mockReprocessFailedMessages.mockReturnValue(pendingPromise);

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        void result.current.reprocessFailed();
      });

      expect(result.current.isSyncing).toBe(true);

      await act(() => {
        resolvePromise!({ processed: 0, created: 0, skipped: 0, errors: [] });
        return Promise.resolve();
      });

      expect(result.current.isSyncing).toBe(false);
    });

    it('handles reprocess errors', async () => {
      jest.useRealTimers();
      const testError = new Error('Reprocess failed');
      mockReprocessFailedMessages.mockRejectedValue(testError);

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        try {
          await result.current.reprocessFailed();
        } catch {
          // Expected
        }
      });

      expect(result.current.error?.message).toBe('Reprocess failed');
      expect(result.current.isSyncing).toBe(false);
    });
  });

  describe('event listeners', () => {
    it('subscribes to message events', () => {
      renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      expect(mockOnMessage).toHaveBeenCalled();
    });

    it('subscribes to error events', () => {
      renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      expect(mockOnError).toHaveBeenCalled();
    });

    it('unsubscribes on unmount', () => {
      const unsubscribeMessage = jest.fn();
      const unsubscribeError = jest.fn();
      mockOnMessage.mockReturnValue(unsubscribeMessage);
      mockOnError.mockReturnValue(unsubscribeError);

      const { unmount } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      unmount();

      expect(unsubscribeMessage).toHaveBeenCalled();
      expect(unsubscribeError).toHaveBeenCalled();
    });
  });

  describe('unprocessed count', () => {
    it('updates unprocessed count', async () => {
      jest.useRealTimers();
      mockGetUnprocessedSmsCount.mockResolvedValue(5);

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.unprocessedCount).toBe(5);
      });
    });

    it('refreshes count manually', async () => {
      jest.useRealTimers();
      mockGetUnprocessedSmsCount.mockResolvedValueOnce(0).mockResolvedValueOnce(10);

      const { result } = renderHook(() => useSmsSync(), {
        wrapper: createWrapper(queryClient),
      });

      await waitFor(() => {
        expect(result.current.unprocessedCount).toBe(0);
      });

      await act(async () => {
        await result.current.refreshUnprocessedCount();
      });

      expect(result.current.unprocessedCount).toBe(10);
    });
  });
});
