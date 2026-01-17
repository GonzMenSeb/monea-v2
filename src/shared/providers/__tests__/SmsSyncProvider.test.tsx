import { createElement } from 'react';

import { Text } from 'react-native';

import { renderHook, waitFor, render } from '@testing-library/react-native';

import type { PermissionResult } from '@/infrastructure/sms';
import type { ReactNode } from 'react';

const mockCheckPermissionState = jest.fn();
const mockIsRunning = jest.fn(() => false);
const mockStartRealtimeSync = jest.fn();
const mockStopRealtimeSync = jest.fn();
const mockOnMessage = jest.fn(() => jest.fn());
const mockOnError = jest.fn(() => jest.fn());
const mockGetUnprocessedSmsCount = jest.fn(() => Promise.resolve(0));

jest.mock('@/infrastructure/sms', () => ({
  get smsPermissions() {
    return {
      checkPermissionState: mockCheckPermissionState,
    };
  },
}));

jest.mock('@/features/sms-sync', () => ({
  getSmsSyncService: () => ({
    isRunning: mockIsRunning,
    startRealtimeSync: mockStartRealtimeSync,
    stopRealtimeSync: mockStopRealtimeSync,
    onMessage: mockOnMessage,
    onError: mockOnError,
    getUnprocessedSmsCount: mockGetUnprocessedSmsCount,
  }),
}));

jest.mock('@/infrastructure/database', () => ({
  database: {},
}));

// eslint-disable-next-line import/order
import { SmsSyncProvider, useSmsSyncService } from '../SmsSyncProvider';

function createPermissionResult(state: 'granted' | 'denied' | 'blocked'): PermissionResult {
  return {
    state,
    status: {
      hasReadSmsPermission: state === 'granted',
      hasReceiveSmsPermission: state === 'granted',
    },
    canRetry: state === 'denied',
  };
}

function createWrapper(autoStart = true) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(SmsSyncProvider, { autoStart }, children);
  };
}

describe('SmsSyncProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckPermissionState.mockResolvedValue(createPermissionResult('denied'));
    mockIsRunning.mockReturnValue(false);
  });

  describe('auto-start behavior', () => {
    it('starts sync automatically when permissions granted', async () => {
      mockCheckPermissionState.mockResolvedValue(createPermissionResult('granted'));

      render(
        createElement(SmsSyncProvider, { autoStart: true }, createElement(Text, null, 'Test'))
      );

      await waitFor(() => {
        expect(mockStartRealtimeSync).toHaveBeenCalled();
      });
    });

    it('does not start sync when permissions denied', async () => {
      mockCheckPermissionState.mockResolvedValue(createPermissionResult('denied'));

      render(
        createElement(SmsSyncProvider, { autoStart: true }, createElement(Text, null, 'Test'))
      );

      await waitFor(() => {
        expect(mockCheckPermissionState).toHaveBeenCalled();
      });

      expect(mockStartRealtimeSync).not.toHaveBeenCalled();
    });

    it('does not start sync when autoStart is false', async () => {
      mockCheckPermissionState.mockResolvedValue(createPermissionResult('granted'));

      render(
        createElement(SmsSyncProvider, { autoStart: false }, createElement(Text, null, 'Test'))
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockCheckPermissionState).not.toHaveBeenCalled();
      expect(mockStartRealtimeSync).not.toHaveBeenCalled();
    });

    it('does not start if already running', async () => {
      mockCheckPermissionState.mockResolvedValue(createPermissionResult('granted'));
      mockIsRunning.mockReturnValue(true);

      render(
        createElement(SmsSyncProvider, { autoStart: true }, createElement(Text, null, 'Test'))
      );

      await waitFor(() => {
        expect(mockCheckPermissionState).toHaveBeenCalled();
      });

      expect(mockStartRealtimeSync).not.toHaveBeenCalled();
    });

    it('stops sync on unmount', async () => {
      mockCheckPermissionState.mockResolvedValue(createPermissionResult('granted'));

      const { unmount } = render(
        createElement(SmsSyncProvider, { autoStart: true }, createElement(Text, null, 'Test'))
      );

      await waitFor(() => {
        expect(mockStartRealtimeSync).toHaveBeenCalled();
      });

      unmount();

      expect(mockStopRealtimeSync).toHaveBeenCalled();
    });
  });

  describe('useSmsSyncService hook', () => {
    it('provides service through context', () => {
      const { result } = renderHook(() => useSmsSyncService(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(typeof result.current.isRunning).toBe('function');
      expect(typeof result.current.startRealtimeSync).toBe('function');
      expect(typeof result.current.stopRealtimeSync).toBe('function');
    });

    it('throws error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useSmsSyncService());
      }).toThrow('useSmsSyncService must be used within SmsSyncProvider');

      consoleSpy.mockRestore();
    });
  });
});
