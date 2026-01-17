import { createContext, useContext, useEffect, useMemo, useRef } from 'react';

import { getSmsSyncService } from '@/features/sms-sync';
import { database } from '@/infrastructure/database';
import { smsPermissions } from '@/infrastructure/sms';

import type { SmsSyncService } from '@/features/sms-sync';
import type { ReactNode } from 'react';

interface SmsSyncContextValue {
  service: SmsSyncService;
}

const SmsSyncContext = createContext<SmsSyncContextValue | null>(null);

interface SmsSyncProviderProps {
  children: ReactNode;
  autoStart?: boolean;
}

export function SmsSyncProvider({
  children,
  autoStart = true,
}: SmsSyncProviderProps): React.ReactElement {
  const service = useMemo(() => getSmsSyncService(database), []);
  const initializingRef = useRef(false);

  useEffect(() => {
    if (!autoStart || initializingRef.current) {
      return;
    }

    initializingRef.current = true;

    const initializeSync = async (): Promise<void> => {
      const result = await smsPermissions.checkPermissionState();

      if (result.state !== 'granted') {
        return;
      }

      if (!service.isRunning()) {
        service.startRealtimeSync();
      }
    };

    void initializeSync();

    return () => {
      service.stopRealtimeSync();
    };
  }, [autoStart, service]);

  const value = useMemo(() => ({ service }), [service]);

  return <SmsSyncContext.Provider value={value}>{children}</SmsSyncContext.Provider>;
}

export function useSmsSyncService(): SmsSyncService {
  const context = useContext(SmsSyncContext);
  if (!context) {
    throw new Error('useSmsSyncService must be used within SmsSyncProvider');
  }
  return context.service;
}
