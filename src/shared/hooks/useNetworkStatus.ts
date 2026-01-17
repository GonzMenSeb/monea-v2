import { useCallback, useEffect, useState } from 'react';

import * as Network from 'expo-network';

export type NetworkType = 'unknown' | 'none' | 'wifi' | 'cellular';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: NetworkType;
}

interface UseNetworkStatusReturn {
  isOnline: boolean;
  isOffline: boolean;
  networkType: NetworkType;
  checkConnection: () => Promise<boolean>;
}

function mapNetworkType(type: Network.NetworkStateType): NetworkType {
  switch (type) {
    case Network.NetworkStateType.WIFI:
      return 'wifi';
    case Network.NetworkStateType.CELLULAR:
      return 'cellular';
    case Network.NetworkStateType.NONE:
      return 'none';
    default:
      return 'unknown';
  }
}

export function useNetworkStatus(): UseNetworkStatusReturn {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown',
  });

  const checkConnection = useCallback(async (): Promise<boolean> => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const isConnected = networkState.isConnected ?? false;
      const isInternetReachable = networkState.isInternetReachable ?? isConnected;
      const type = mapNetworkType(networkState.type ?? Network.NetworkStateType.UNKNOWN);

      setStatus({
        isConnected,
        isInternetReachable,
        type,
      });

      return isConnected && isInternetReachable;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const updateStatus = async (): Promise<void> => {
      if (!mounted) {
        return;
      }
      await checkConnection();
    };

    void updateStatus();

    const interval = setInterval(() => {
      void updateStatus();
    }, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [checkConnection]);

  return {
    isOnline: status.isConnected && status.isInternetReachable,
    isOffline: !status.isConnected || !status.isInternetReachable,
    networkType: status.type,
    checkConnection,
  };
}
