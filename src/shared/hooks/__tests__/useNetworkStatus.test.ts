import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as Network from 'expo-network';

import { useNetworkStatus } from '../useNetworkStatus';

jest.mock('expo-network');

const mockNetwork = Network as jest.Mocked<typeof Network>;

describe('useNetworkStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('starts with online status by default', () => {
      mockNetwork.getNetworkStateAsync.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: Network.NetworkStateType.WIFI,
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
    });
  });

  describe('network state detection', () => {
    it('detects online wifi connection', async () => {
      mockNetwork.getNetworkStateAsync.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: Network.NetworkStateType.WIFI,
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
        expect(result.current.networkType).toBe('wifi');
      });
    });

    it('detects online cellular connection', async () => {
      mockNetwork.getNetworkStateAsync.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: Network.NetworkStateType.CELLULAR,
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
        expect(result.current.networkType).toBe('cellular');
      });
    });

    it('detects offline state', async () => {
      mockNetwork.getNetworkStateAsync.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: Network.NetworkStateType.NONE,
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
        expect(result.current.isOffline).toBe(true);
        expect(result.current.networkType).toBe('none');
      });
    });

    it('detects unreachable internet', async () => {
      mockNetwork.getNetworkStateAsync.mockResolvedValue({
        isConnected: true,
        isInternetReachable: false,
        type: Network.NetworkStateType.WIFI,
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isOnline).toBe(false);
        expect(result.current.isOffline).toBe(true);
      });
    });
  });

  describe('checkConnection', () => {
    it('returns true when connected', async () => {
      mockNetwork.getNetworkStateAsync.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: Network.NetworkStateType.WIFI,
      });

      const { result } = renderHook(() => useNetworkStatus());

      let isConnected: boolean;
      await act(async () => {
        isConnected = await result.current.checkConnection();
      });

      expect(isConnected!).toBe(true);
    });

    it('returns false when disconnected', async () => {
      mockNetwork.getNetworkStateAsync.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: Network.NetworkStateType.NONE,
      });

      const { result } = renderHook(() => useNetworkStatus());

      let isConnected: boolean;
      await act(async () => {
        isConnected = await result.current.checkConnection();
      });

      expect(isConnected!).toBe(false);
    });

    it('returns false on error', async () => {
      mockNetwork.getNetworkStateAsync.mockRejectedValue(new Error('Network check failed'));

      const { result } = renderHook(() => useNetworkStatus());

      let isConnected: boolean;
      await act(async () => {
        isConnected = await result.current.checkConnection();
      });

      expect(isConnected!).toBe(false);
    });
  });

  describe('polling', () => {
    it('checks connection periodically', async () => {
      mockNetwork.getNetworkStateAsync.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: Network.NetworkStateType.WIFI,
      });

      renderHook(() => useNetworkStatus());

      expect(mockNetwork.getNetworkStateAsync).toHaveBeenCalledTimes(1);

      await act(() => {
        jest.advanceTimersByTime(30000);
        return Promise.resolve();
      });

      expect(mockNetwork.getNetworkStateAsync).toHaveBeenCalledTimes(2);

      await act(() => {
        jest.advanceTimersByTime(30000);
        return Promise.resolve();
      });

      expect(mockNetwork.getNetworkStateAsync).toHaveBeenCalledTimes(3);
    });

    it('cleans up interval on unmount', async () => {
      mockNetwork.getNetworkStateAsync.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: Network.NetworkStateType.WIFI,
      });

      const { unmount } = renderHook(() => useNetworkStatus());

      unmount();

      await act(() => {
        jest.advanceTimersByTime(60000);
        return Promise.resolve();
      });

      expect(mockNetwork.getNetworkStateAsync).toHaveBeenCalledTimes(1);
    });
  });
});
