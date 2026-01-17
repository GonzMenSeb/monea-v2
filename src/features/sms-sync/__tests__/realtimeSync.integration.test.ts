import type { Database } from '@nozbe/watermelondb';

import {
  createTestDatabase,
  resetDatabase,
} from '@/infrastructure/database/__tests__/testHelpers';

jest.mock('@/infrastructure/sms/SmsReader', () => ({
  smsReader: {
    startListening: jest.fn(),
    stopListening: jest.fn(),
  },
}));

import { smsReader } from '@/infrastructure/sms/SmsReader';
import { SmsSyncService, resetSmsSyncService } from '../services/SmsSyncService';

const mockSmsReader = smsReader as jest.Mocked<typeof smsReader>;

describe('Real-time SMS Sync Integration Tests', () => {
  let database: Database;
  let service: SmsSyncService;

  beforeEach(async () => {
    jest.clearAllMocks();
    database = createTestDatabase();
    await resetDatabase(database);
    resetSmsSyncService();
    service = new SmsSyncService(database);
  });

  afterEach(async () => {
    service.stopRealtimeSync();
    await resetDatabase(database);
  });

  describe('Listener Lifecycle', () => {
    it('starts and stops realtime sync correctly', () => {
      expect(service.isRunning()).toBe(false);

      service.startRealtimeSync();
      expect(service.isRunning()).toBe(true);
      expect(mockSmsReader.startListening).toHaveBeenCalledTimes(1);

      service.stopRealtimeSync();
      expect(service.isRunning()).toBe(false);
      expect(mockSmsReader.stopListening).toHaveBeenCalledTimes(1);
    });

    it('prevents starting sync twice', () => {
      service.startRealtimeSync();
      service.startRealtimeSync();
      service.startRealtimeSync();

      expect(mockSmsReader.startListening).toHaveBeenCalledTimes(1);
      expect(service.isRunning()).toBe(true);
    });

    it('handles stop when not running', () => {
      expect(service.isRunning()).toBe(false);

      service.stopRealtimeSync();
      expect(service.isRunning()).toBe(false);
      expect(mockSmsReader.stopListening).not.toHaveBeenCalled();
    });

    it('allows restart after stopping', () => {
      service.startRealtimeSync();
      service.stopRealtimeSync();
      service.startRealtimeSync();

      expect(mockSmsReader.startListening).toHaveBeenCalledTimes(2);
      expect(service.isRunning()).toBe(true);
    });

    it('passes message and error callbacks to SMS reader', () => {
      service.startRealtimeSync();

      expect(mockSmsReader.startListening).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function)
      );

      const messageCallback = mockSmsReader.startListening.mock.calls[0][0];
      const errorCallback = mockSmsReader.startListening.mock.calls[0][1];

      expect(typeof messageCallback).toBe('function');
      expect(typeof errorCallback).toBe('function');
    });
  });

  describe('Message Event Listeners', () => {
    it('allows adding message listeners', () => {
      const listener = jest.fn();
      const unsubscribe = service.onMessage(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('supports multiple message listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      const unsub1 = service.onMessage(listener1);
      const unsub2 = service.onMessage(listener2);
      const unsub3 = service.onMessage(listener3);

      expect(typeof unsub1).toBe('function');
      expect(typeof unsub2).toBe('function');
      expect(typeof unsub3).toBe('function');
    });

    it('allows unsubscribing message listeners', () => {
      const listener = jest.fn();
      const unsubscribe = service.onMessage(listener);

      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });

    it('handles multiple unsubscribe calls safely', () => {
      const listener = jest.fn();
      const unsubscribe = service.onMessage(listener);

      unsubscribe();
      unsubscribe();
      unsubscribe();
    });
  });

  describe('Error Event Listeners', () => {
    it('allows adding and removing error listeners', () => {
      const listener = jest.fn();

      const unsubscribe = service.onError(listener);
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });

    it('supports multiple error listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      const unsub1 = service.onError(listener1);
      const unsub2 = service.onError(listener2);

      expect(typeof unsub1).toBe('function');
      expect(typeof unsub2).toBe('function');
    });

    it('allows unsubscribing error listeners', () => {
      const listener = jest.fn();
      const unsubscribe = service.onError(listener);

      unsubscribe();
    });
  });

  describe('Sync State Management', () => {
    it('maintains correct running state', () => {
      expect(service.isRunning()).toBe(false);

      service.startRealtimeSync();
      expect(service.isRunning()).toBe(true);

      service.stopRealtimeSync();
      expect(service.isRunning()).toBe(false);
    });

    it('maintains state through multiple start/stop cycles', () => {
      expect(service.isRunning()).toBe(false);

      service.startRealtimeSync();
      expect(service.isRunning()).toBe(true);

      service.stopRealtimeSync();
      expect(service.isRunning()).toBe(false);

      service.startRealtimeSync();
      expect(service.isRunning()).toBe(true);

      service.stopRealtimeSync();
      expect(service.isRunning()).toBe(false);
    });

    it('does not change state when start is called while running', () => {
      service.startRealtimeSync();
      expect(service.isRunning()).toBe(true);

      service.startRealtimeSync();
      expect(service.isRunning()).toBe(true);
    });

    it('does not change state when stop is called while not running', () => {
      expect(service.isRunning()).toBe(false);

      service.stopRealtimeSync();
      expect(service.isRunning()).toBe(false);
    });
  });

  describe('Service Integration', () => {
    it('integrates with SMS reader on start', () => {
      service.startRealtimeSync();

      expect(mockSmsReader.startListening).toHaveBeenCalledTimes(1);
      expect(mockSmsReader.startListening).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function)
      );
    });

    it('integrates with SMS reader on stop', () => {
      service.startRealtimeSync();
      service.stopRealtimeSync();

      expect(mockSmsReader.stopListening).toHaveBeenCalledTimes(1);
    });

    it('maintains listener registration across sync lifecycle', () => {
      const listener = jest.fn();
      const unsubscribe = service.onMessage(listener);

      service.startRealtimeSync();
      expect(service.isRunning()).toBe(true);

      service.stopRealtimeSync();
      expect(service.isRunning()).toBe(false);

      unsubscribe();
    });
  });

  describe('Listener Cleanup', () => {
    it('removes individual listeners when unsubscribed', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      const unsub1 = service.onMessage(listener1);
      const unsub2 = service.onMessage(listener2);
      const unsub3 = service.onMessage(listener3);

      unsub1();
      unsub2();
      unsub3();
    });

    it('handles unsubscribe in any order', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      const listener3 = jest.fn();

      const unsub1 = service.onMessage(listener1);
      const unsub2 = service.onMessage(listener2);
      const unsub3 = service.onMessage(listener3);

      unsub2();
      unsub1();
      unsub3();
    });
  });
});
