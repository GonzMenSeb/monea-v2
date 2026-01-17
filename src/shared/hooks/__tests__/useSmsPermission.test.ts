import { AppState } from 'react-native';

import { renderHook, act, waitFor } from '@testing-library/react-native';

import { useSmsPermission } from '../useSmsPermission';

import type { AppStateStatus } from 'react-native';

type PermissionState = 'unknown' | 'checking' | 'granted' | 'denied' | 'blocked';

interface SmsPermissionStatus {
  hasReceiveSmsPermission: boolean;
  hasReadSmsPermission: boolean;
}

interface PermissionResult {
  state: PermissionState;
  status: SmsPermissionStatus;
  canRetry: boolean;
}

const mockCheckPermissionState = jest.fn<Promise<PermissionResult>, []>();
const mockRequestWithRetry = jest.fn<Promise<PermissionResult>, []>();
const mockOpenAppSettings = jest.fn<Promise<void>, []>();

jest.mock('@/infrastructure/sms', () => ({
  smsPermissions: {
    checkPermissionState: () => mockCheckPermissionState(),
    requestWithRetry: () => mockRequestWithRetry(),
    openAppSettings: () => mockOpenAppSettings(),
  },
}));

const mockGrantedResult: PermissionResult = {
  state: 'granted',
  status: { hasReadSmsPermission: true, hasReceiveSmsPermission: true },
  canRetry: false,
};

const mockDeniedResult: PermissionResult = {
  state: 'denied',
  status: { hasReadSmsPermission: false, hasReceiveSmsPermission: false },
  canRetry: true,
};

const mockBlockedResult: PermissionResult = {
  state: 'blocked',
  status: { hasReadSmsPermission: false, hasReceiveSmsPermission: false },
  canRetry: false,
};

describe('useSmsPermission', () => {
  let appStateCallback: ((state: AppStateStatus) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    appStateCallback = null;

    jest.spyOn(AppState, 'addEventListener').mockImplementation((_, callback) => {
      appStateCallback = callback as (state: AppStateStatus) => void;
      return { remove: jest.fn() };
    });

    Object.defineProperty(AppState, 'currentState', {
      get: () => 'active',
      configurable: true,
    });

    mockCheckPermissionState.mockResolvedValue(mockDeniedResult);
  });

  describe('initialization', () => {
    it('starts with unknown state', () => {
      mockCheckPermissionState.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() =>
        useSmsPermission({ checkOnMount: false, checkOnForeground: false })
      );

      expect(result.current.permissionState).toBe('unknown');
      expect(result.current.isLoading).toBe(false);
    });

    it('checks permission on mount by default', async () => {
      mockCheckPermissionState.mockResolvedValue(mockGrantedResult);

      const { result } = renderHook(() => useSmsPermission());

      await waitFor(() => {
        expect(result.current.permissionState).toBe('granted');
      });

      expect(mockCheckPermissionState).toHaveBeenCalledTimes(1);
    });

    it('skips mount check when checkOnMount is false', () => {
      renderHook(() => useSmsPermission({ checkOnMount: false }));

      expect(mockCheckPermissionState).not.toHaveBeenCalled();
    });
  });

  describe('checkPermission', () => {
    it('updates state when granted', async () => {
      mockCheckPermissionState.mockResolvedValue(mockGrantedResult);

      const { result } = renderHook(() =>
        useSmsPermission({ checkOnMount: false, checkOnForeground: false })
      );

      await act(async () => {
        await result.current.checkPermission();
      });

      expect(result.current.permissionState).toBe('granted');
      expect(result.current.hasReadSms).toBe(true);
      expect(result.current.hasReceiveSms).toBe(true);
      expect(result.current.isFullyGranted).toBe(true);
      expect(result.current.canRetry).toBe(false);
    });

    it('updates state when denied', async () => {
      mockCheckPermissionState.mockResolvedValue(mockDeniedResult);

      const { result } = renderHook(() =>
        useSmsPermission({ checkOnMount: false, checkOnForeground: false })
      );

      await act(async () => {
        await result.current.checkPermission();
      });

      expect(result.current.permissionState).toBe('denied');
      expect(result.current.hasReadSms).toBe(false);
      expect(result.current.hasReceiveSms).toBe(false);
      expect(result.current.isFullyGranted).toBe(false);
      expect(result.current.canRetry).toBe(true);
    });

    it('sets loading state during check', async () => {
      let resolveCheck: (value: PermissionResult) => void;
      mockCheckPermissionState.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCheck = resolve;
          })
      );

      const { result } = renderHook(() =>
        useSmsPermission({ checkOnMount: false, checkOnForeground: false })
      );

      let checkPromise: Promise<PermissionResult>;
      act(() => {
        checkPromise = result.current.checkPermission();
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.permissionState).toBe('checking');

      await act(async () => {
        resolveCheck!(mockGrantedResult);
        await checkPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('handles errors gracefully', async () => {
      mockCheckPermissionState.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() =>
        useSmsPermission({ checkOnMount: false, checkOnForeground: false })
      );

      await act(async () => {
        try {
          await result.current.checkPermission();
        } catch {
          // Expected
        }
      });

      expect(result.current.error?.message).toBe('Test error');
      expect(result.current.permissionState).toBe('unknown');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('requestPermission', () => {
    it('updates state after successful request', async () => {
      mockRequestWithRetry.mockResolvedValue(mockGrantedResult);

      const { result } = renderHook(() =>
        useSmsPermission({ checkOnMount: false, checkOnForeground: false })
      );

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionState).toBe('granted');
      expect(result.current.isFullyGranted).toBe(true);
    });

    it('updates state when request is denied', async () => {
      mockRequestWithRetry.mockResolvedValue(mockBlockedResult);

      const { result } = renderHook(() =>
        useSmsPermission({ checkOnMount: false, checkOnForeground: false })
      );

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionState).toBe('blocked');
      expect(result.current.canRetry).toBe(false);
    });

    it('sets loading state during request', async () => {
      let resolveRequest: (value: PermissionResult) => void;
      mockRequestWithRetry.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          })
      );

      const { result } = renderHook(() =>
        useSmsPermission({ checkOnMount: false, checkOnForeground: false })
      );

      let requestPromise: Promise<PermissionResult>;
      act(() => {
        requestPromise = result.current.requestPermission();
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        resolveRequest!(mockGrantedResult);
        await requestPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('handles request errors', async () => {
      mockRequestWithRetry.mockRejectedValue(new Error('Request failed'));

      const { result } = renderHook(() =>
        useSmsPermission({ checkOnMount: false, checkOnForeground: false })
      );

      await act(async () => {
        try {
          await result.current.requestPermission();
        } catch {
          // Expected
        }
      });

      expect(result.current.error?.message).toBe('Request failed');
    });
  });

  describe('openSettings', () => {
    it('calls smsPermissions.openAppSettings', async () => {
      mockOpenAppSettings.mockResolvedValue(undefined);

      const { result } = renderHook(() =>
        useSmsPermission({ checkOnMount: false, checkOnForeground: false })
      );

      await act(async () => {
        await result.current.openSettings();
      });

      expect(mockOpenAppSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('foreground check', () => {
    it('checks permission when app returns from background', async () => {
      mockCheckPermissionState.mockResolvedValue(mockDeniedResult);

      renderHook(() => useSmsPermission({ checkOnMount: false, checkOnForeground: true }));

      Object.defineProperty(AppState, 'currentState', {
        get: () => 'background',
        configurable: true,
      });

      mockCheckPermissionState.mockClear();
      mockCheckPermissionState.mockResolvedValue(mockGrantedResult);

      act(() => {
        if (appStateCallback) {
          appStateCallback('background');
          appStateCallback('active');
        }
      });

      await waitFor(() => {
        expect(mockCheckPermissionState).toHaveBeenCalled();
      });
    });

    it('does not check when checkOnForeground is false', () => {
      mockCheckPermissionState.mockResolvedValue(mockDeniedResult);

      renderHook(() => useSmsPermission({ checkOnMount: false, checkOnForeground: false }));

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(AppState.addEventListener).not.toHaveBeenCalled();
    });
  });
});
