import type { Database } from '@nozbe/watermelondb';

import {
  createTestDatabase,
  resetDatabase,
  createMockAccount,
} from '@/infrastructure/database/__tests__/testHelpers';

import type Account from '@/infrastructure/database/models/Account';
import type SmsMessage from '@/infrastructure/database/models/SmsMessage';
import type Transaction from '@/infrastructure/database/models/Transaction';
import type { ParsedSmsMessage } from '@/infrastructure/sms/types';

jest.mock('@/infrastructure/sms/SmsReader', () => ({
  smsReader: {
    startListening: jest.fn(),
    stopListening: jest.fn(),
  },
}));

import { SmsSyncService, resetSmsSyncService } from '../services/SmsSyncService';

describe('SMS Sync Error Handling Integration Tests', () => {
  let database: Database;
  let service: SmsSyncService;
  let accountsCollection: ReturnType<Database['get']>;
  let transactionsCollection: ReturnType<Database['get']>;
  let smsCollection: ReturnType<Database['get']>;

  beforeEach(async () => {
    jest.clearAllMocks();
    database = createTestDatabase();
    await resetDatabase(database);
    resetSmsSyncService();
    service = new SmsSyncService(database);
    accountsCollection = database.get<Account>('accounts');
    transactionsCollection = database.get<Transaction>('transactions');
    smsCollection = database.get<SmsMessage>('sms_messages');
  });

  afterEach(async () => {
    service.stopRealtimeSync();
    await resetDatabase(database);
  });

  describe('Non-Bank SMS Handling', () => {
    it('rejects messages from unknown senders', async () => {
      const unknownMessage: ParsedSmsMessage = {
        sender: 'RandomCompany',
        body: 'Your order has been shipped',
        rawMessage: '[RandomCompany, Your order has been shipped]',
      };

      const result = await service.processMessage(unknownMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('not_bank_sms');
        expect(result.error).toBeDefined();
      }

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions).toHaveLength(0);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(0);
    });

    it('rejects bank sender with invalid message format', async () => {
      const invalidFormatMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Este es un mensaje informativo de Bancolombia',
        rawMessage: '[Bancolombia, Este es un mensaje informativo de Bancolombia]',
      };

      const result = await service.processMessage(invalidFormatMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('not_bank_sms');
      }

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions).toHaveLength(0);
    });

    it('handles empty message body', async () => {
      const emptyMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: '',
        rawMessage: '[Bancolombia, ]',
      };

      const result = await service.processMessage(emptyMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('not_bank_sms');
      }
    });

    it('handles message with only whitespace', async () => {
      const whitespaceMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: '    ',
        rawMessage: '[Bancolombia,     ]',
      };

      const result = await service.processMessage(whitespaceMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('not_bank_sms');
      }
    });
  });

  describe('Malformed Bank SMS', () => {
    it('handles message with missing amount', async () => {
      const noAmountMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra en STORE. Saldo: $500.000',
        rawMessage: '[Bancolombia, Bancolombia le informa compra en STORE. Saldo: $500.000]',
      };

      const result = await service.processMessage(noAmountMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('not_bank_sms');
      }
    });

    it('handles message with corrupted merchant name', async () => {
      const validMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en @#$%^&. Saldo: $500.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en @#$%^&. Saldo: $500.000]',
      };

      const result = await service.processMessage(validMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('not_bank_sms');
      }
    });
  });

  describe('Duplicate Message Scenarios', () => {
    it('correctly identifies exact duplicate messages', async () => {
      const message: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000]',
      };

      await service.processMessage(message);
      const result = await service.processMessage(message);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('duplicate');
      }

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions).toHaveLength(1);

      const smsMessages = await smsCollection.query().fetch();
      expect(smsMessages).toHaveLength(1);
    });

    it('processes similar but different messages', async () => {
      const message1: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000]',
      };

      const message2: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $450.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $450.000]',
      };

      const result1 = await service.processMessage(message1);
      const result2 = await service.processMessage(message2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions).toHaveLength(2);
    });

    it('handles duplicate processing attempts', async () => {
      const message: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000]',
      };

      await service.processMessage(message);
      await service.processMessage(message);
      await service.processMessage(message);

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions).toHaveLength(1);
    });
  });

  describe('SMS Message Persistence', () => {
    it('marks SMS as processed on success', async () => {
      const message: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000]',
      };

      await service.processMessage(message);

      const smsMessages = await smsCollection.query().fetch();
      expect(smsMessages).toHaveLength(1);
      expect(smsMessages[0].isProcessed).toBe(true);
      expect(smsMessages[0].processingError).toBeNull();
    });

    it('stores SMS message even for non-bank messages', async () => {
      const nonBankMessage: ParsedSmsMessage = {
        sender: 'Unknown',
        body: 'Not a bank message',
        rawMessage: '[Unknown, Not a bank message]',
      };

      await service.processMessage(nonBankMessage);

      const smsMessages = await smsCollection.query().fetch();
      expect(smsMessages).toHaveLength(0);
    });

    it('maintains SMS processing metadata', async () => {
      const message: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000]',
      };

      await service.processMessage(message);

      const smsMessages = await smsCollection.query().fetch();
      expect(smsMessages[0].address).toBe('Bancolombia');
      expect(smsMessages[0].body).toBe(message.body);
      expect(smsMessages[0].date).toBeInstanceOf(Date);
    });
  });

  describe('Edge Cases', () => {
    it('handles very large transaction amounts', async () => {
      const largeAmountMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa transferencia recibida por $999.999.999 de EMPRESA. Saldo: $1.000.000.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa transferencia recibida por $999.999.999 de EMPRESA. Saldo: $1.000.000.000]',
      };

      const result = await service.processMessage(largeAmountMessage);

      expect(result.success).toBe(true);

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions[0].amount).toBe(999999999);
      expect(transactions[0].balanceAfter).toBe(1000000000);
    });

    it('handles small transaction amounts', async () => {
      const smallAmountMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $100 en TIENDA. Saldo: $500.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $100 en TIENDA. Saldo: $500.000]',
      };

      const result = await service.processMessage(smallAmountMessage);

      expect(result.success).toBe(true);

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions[0].amount).toBe(100);
    });

    it('handles messages with special characters in merchant name', async () => {
      const specialCharsMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en EXITO COLOMBIA S A. Saldo: $500.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en EXITO COLOMBIA S A. Saldo: $500.000]',
      };

      const result = await service.processMessage(specialCharsMessage);

      expect(result.success).toBe(true);

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions[0].merchant).toBe('EXITO COLOMBIA S A');
    });

    it('handles account number variations', async () => {
      const message1: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. T.*1234. Saldo: $500.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. T.*1234. Saldo: $500.000]',
      };

      const message2: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $30.000 en SHOP. T.**5678. Saldo: $470.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $30.000 en SHOP. T.**5678. Saldo: $470.000]',
      };

      await service.processMessage(message1);
      await service.processMessage(message2);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(2);
      expect(accounts.map((a) => a.accountNumber).sort()).toEqual(['1234', '5678']);
    });
  });

  describe('Account Creation Edge Cases', () => {
    it('creates account with unknown number when not provided', async () => {
      const noAccountMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa transferencia recibida por $100.000. Saldo: $600.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa transferencia recibida por $100.000. Saldo: $600.000]',
      };

      const result = await service.processMessage(noAccountMessage);

      expect(result.success).toBe(true);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].accountNumber).toBe('unknown');
    });

    it('reuses account when both messages have no account number', async () => {
      const message1: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa transferencia recibida por $100.000. Saldo: $600.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa transferencia recibida por $100.000. Saldo: $600.000]',
      };

      const message2: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $550.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $550.000]',
      };

      await service.processMessage(message1);
      await service.processMessage(message2);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].balance).toBe(550000);
    });

    it('sets correct account type for digital wallets', async () => {
      const nequiMessage: ParsedSmsMessage = {
        sender: '85432',
        body: 'Nequi: Recibiste $50.000 de Juan. Saldo: $150.000',
        rawMessage: '[85432, Nequi: Recibiste $50.000 de Juan. Saldo: $150.000]',
      };

      const daviplataMessage: ParsedSmsMessage = {
        sender: 'Daviplata',
        body: 'DaviPlata: Recibiste $30.000 de Maria. Saldo: $80.000',
        rawMessage: '[Daviplata, DaviPlata: Recibiste $30.000 de Maria. Saldo: $80.000]',
      };

      await service.processMessage(nequiMessage);
      await service.processMessage(daviplataMessage);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(2);
      expect(accounts.every((a) => a.accountType === 'digital_wallet')).toBe(true);
    });

    it('sets savings account type for traditional banks', async () => {
      const bancolombiaMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000]',
      };

      await service.processMessage(bancolombiaMessage);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].accountType).toBe('savings');
    });
  });

  describe('Balance Management', () => {
    it('handles missing balance in SMS', async () => {
      const noBalanceMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa transferencia enviada por $50.000 a JUAN PEREZ',
        rawMessage:
          '[Bancolombia, Bancolombia le informa transferencia enviada por $50.000 a JUAN PEREZ]',
      };

      const result = await service.processMessage(noBalanceMessage);

      expect(result.success).toBe(true);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts[0].balance).toBe(0);
    });

    it('updates account balance when provided', async () => {
      await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: 'unknown',
        balance: 1000000,
      });

      const message: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $950.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $950.000]',
      };

      await service.processMessage(message);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].balance).toBe(950000);
    });
  });

  describe('Unprocessed Message Tracking', () => {
    it('counts unprocessed messages correctly', async () => {
      const initialCount = await service.getUnprocessedSmsCount();
      expect(initialCount).toBe(0);

      const message: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000]',
      };

      await service.processMessage(message);

      const finalCount = await service.getUnprocessedSmsCount();
      expect(finalCount).toBe(0);
    });
  });
});
