import type { Database } from '@nozbe/watermelondb';

import {
  createTestDatabase,
  resetDatabase,
  createMockAccount,
} from '@/infrastructure/database/__tests__/testHelpers';

import type Account from '@/infrastructure/database/models/Account';
import type { ParsedSmsMessage } from '@/infrastructure/sms/types';

jest.mock('@/infrastructure/sms/SmsReader', () => ({
  smsReader: {
    startListening: jest.fn(),
    stopListening: jest.fn(),
  },
}));

import { smsReader } from '@/infrastructure/sms/SmsReader';

import { SmsSyncService, resetSmsSyncService } from '../SmsSyncService';

const mockSmsReader = smsReader as jest.Mocked<typeof smsReader>;

describe('SmsSyncService', () => {
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

  describe('processMessage', () => {
    const validBancolombiaMessage: ParsedSmsMessage = {
      sender: 'Bancolombia',
      body: 'Bancolombia le informa compra por $50.000 en EXITO COLOMBIA. T.*1234. Saldo: $950.000',
      rawMessage:
        '[Bancolombia, Bancolombia le informa compra por $50.000 en EXITO COLOMBIA. T.*1234. Saldo: $950.000]',
    };

    const nonBankMessage: ParsedSmsMessage = {
      sender: 'Rappi',
      body: 'Tu pedido #123 ha sido entregado',
      rawMessage: '[Rappi, Tu pedido #123 ha sido entregado]',
    };

    it('returns not_bank_sms for non-bank messages', async () => {
      const result = await service.processMessage(nonBankMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('not_bank_sms');
      }
    });

    it('creates account when processing first bank message', async () => {
      const accountCollection = database.get('accounts');
      const initialCount = await accountCollection.query().fetchCount();
      expect(initialCount).toBe(0);

      await service.processMessage(validBancolombiaMessage);

      const finalCount = await accountCollection.query().fetchCount();
      expect(finalCount).toBe(1);
    });

    it('reuses existing account for same bank and account number', async () => {
      await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: '1234',
      });

      const accountCollection = database.get('accounts');
      const initialCount = await accountCollection.query().fetchCount();

      await service.processMessage(validBancolombiaMessage);

      const finalCount = await accountCollection.query().fetchCount();
      expect(finalCount).toBe(initialCount);
    });

    it('creates transaction from valid bank SMS', async () => {
      const result = await service.processMessage(validBancolombiaMessage);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transactionId).toBeDefined();
        expect(result.accountId).toBeDefined();
      }
    });

    it('stores SMS message in database', async () => {
      const smsCollection = database.get('sms_messages');
      const initialCount = await smsCollection.query().fetchCount();

      await service.processMessage(validBancolombiaMessage);

      const finalCount = await smsCollection.query().fetchCount();
      expect(finalCount).toBe(initialCount + 1);
    });

    it('returns duplicate when processing same message twice', async () => {
      const firstResult = await service.processMessage(validBancolombiaMessage);
      expect(firstResult.success).toBe(true);

      const secondResult = await service.processMessage(validBancolombiaMessage);
      expect(secondResult.success).toBe(false);
      if (!secondResult.success) {
        expect(secondResult.reason).toBe('duplicate');
      }
    });

    it('updates account balance after transaction', async () => {
      const result = await service.processMessage(validBancolombiaMessage);
      expect(result.success).toBe(true);

      if (result.success) {
        const accountCollection = database.get<Account>('accounts');
        const account = await accountCollection.find(result.accountId);
        expect(account.balance).toBe(950000);
      }
    });
  });

  describe('realtime sync', () => {
    it('starts in stopped state', () => {
      expect(service.isRunning()).toBe(false);
    });

    it('starts listening when startRealtimeSync is called', () => {
      service.startRealtimeSync();

      expect(mockSmsReader.startListening).toHaveBeenCalled();
      expect(service.isRunning()).toBe(true);
    });

    it('stops listening when stopRealtimeSync is called', () => {
      service.startRealtimeSync();
      service.stopRealtimeSync();

      expect(mockSmsReader.stopListening).toHaveBeenCalled();
      expect(service.isRunning()).toBe(false);
    });

    it('does not start twice when already running', () => {
      service.startRealtimeSync();
      service.startRealtimeSync();

      expect(mockSmsReader.startListening).toHaveBeenCalledTimes(1);
    });
  });

  describe('message listeners', () => {
    it('allows adding and removing message listeners', () => {
      const listener = jest.fn();

      const unsubscribe = service.onMessage(listener);
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });

    it('allows adding and removing error listeners', () => {
      const listener = jest.fn();

      const unsubscribe = service.onError(listener);
      expect(typeof unsubscribe).toBe('function');

      unsubscribe();
    });
  });

  describe('getUnprocessedSmsCount', () => {
    it('returns 0 when no unprocessed messages exist', async () => {
      const count = await service.getUnprocessedSmsCount();
      expect(count).toBe(0);
    });
  });

  describe('reprocessFailedMessages', () => {
    it('returns empty result when no failed messages exist', async () => {
      const result = await service.reprocessFailedMessages();

      expect(result.processed).toBe(0);
      expect(result.created).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
