import type { Database } from '@nozbe/watermelondb';

import {
  createTestDatabase,
  resetDatabase,
  createMockAccount,
} from '@/infrastructure/database/__tests__/testHelpers';

import Account from '@/infrastructure/database/models/Account';
import SmsMessage from '@/infrastructure/database/models/SmsMessage';
import Transaction from '@/infrastructure/database/models/Transaction';

import type { ParsedSmsMessage } from '@/infrastructure/sms/types';

jest.mock('@/infrastructure/sms/SmsReader', () => ({
  smsReader: {
    startListening: jest.fn(),
    stopListening: jest.fn(),
  },
}));

import { SmsSyncService, resetSmsSyncService } from '../services/SmsSyncService';

describe('SMS Sync Integration Tests', () => {
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

  describe('End-to-End Flow: SMS to Database', () => {
    it('processes Bancolombia expense SMS and creates all database records', async () => {
      const smsMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $75.500 en EXITO CENTRO. T.*5432. Saldo: $1.250.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $75.500 en EXITO CENTRO. T.*5432. Saldo: $1.250.000]',
      };

      const result = await service.processMessage(smsMessage);

      expect(result.success).toBe(true);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].bankCode).toBe('bancolombia');
      expect(accounts[0].accountNumber).toBe('5432');
      expect(accounts[0].balance).toBe(1250000);

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('expense');
      expect(transactions[0].amount).toBe(75500);
      expect(transactions[0].merchant).toBe('EXITO CENTRO');
      expect(transactions[0].balanceAfter).toBe(1250000);

      const smsMessages = await smsCollection.query().fetch();
      expect(smsMessages).toHaveLength(1);
      expect(smsMessages[0].isProcessed).toBe(true);
      expect(smsMessages[0].processingError).toBeNull();
    });

    it('processes Nequi income SMS and creates digital wallet account', async () => {
      const smsMessage: ParsedSmsMessage = {
        sender: '85432',
        body: 'Nequi: Recibiste $50.000 de Juan Perez. Saldo: $150.000',
        rawMessage: '[85432, Nequi: Recibiste $50.000 de Juan Perez. Saldo: $150.000]',
      };

      const result = await service.processMessage(smsMessage);

      expect(result.success).toBe(true);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].bankCode).toBe('nequi');
      expect(accounts[0].accountType).toBe('digital_wallet');
      expect(accounts[0].balance).toBe(150000);

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('income');
      expect(transactions[0].amount).toBe(50000);
      expect(transactions[0].merchant).toBe('Juan Perez');
    });

    it('processes Daviplata transfer and creates digital wallet account', async () => {
      const smsMessage: ParsedSmsMessage = {
        sender: 'Daviplata',
        body: 'DaviPlata: Enviaste $30.000 a Maria Lopez. Saldo: $120.000',
        rawMessage: '[Daviplata, DaviPlata: Enviaste $30.000 a Maria Lopez. Saldo: $120.000]',
      };

      const result = await service.processMessage(smsMessage);

      expect(result.success).toBe(true);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].bankCode).toBe('daviplata');
      expect(accounts[0].accountType).toBe('digital_wallet');
      expect(accounts[0].balance).toBe(120000);

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions).toHaveLength(1);
      expect(transactions[0].type).toBe('transfer_out');
      expect(transactions[0].amount).toBe(30000);
    });
  });

  describe('Multi-Bank Account Management', () => {
    it('creates separate accounts for different banks', async () => {
      const bancolombiaMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000',
        rawMessage: '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000]',
      };

      const daviplataMessage: ParsedSmsMessage = {
        sender: 'Daviplata',
        body: 'DaviPlata: Recibiste $25.000 de Pedro. Saldo: $100.000',
        rawMessage: '[Daviplata, DaviPlata: Recibiste $25.000 de Pedro. Saldo: $100.000]',
      };

      await service.processMessage(bancolombiaMessage);
      await service.processMessage(daviplataMessage);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(2);

      const bancolombiaAccount = accounts.find((a) => a.bankCode === 'bancolombia');
      const daviplataAccount = accounts.find((a) => a.bankCode === 'daviplata');

      expect(bancolombiaAccount).toBeDefined();
      expect(daviplataAccount).toBeDefined();
      expect(bancolombiaAccount?.balance).toBe(500000);
      expect(daviplataAccount?.balance).toBe(100000);
    });

    it('creates separate accounts for same bank with different account numbers', async () => {
      const account1Message: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. T.*1234. Saldo: $500.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. T.*1234. Saldo: $500.000]',
      };

      const account2Message: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $25.000 en SHOP. T.*5678. Saldo: $300.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $25.000 en SHOP. T.*5678. Saldo: $300.000]',
      };

      await service.processMessage(account1Message);
      await service.processMessage(account2Message);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(2);

      const account1 = accounts.find((a) => a.accountNumber === '1234');
      const account2 = accounts.find((a) => a.accountNumber === '5678');

      expect(account1).toBeDefined();
      expect(account2).toBeDefined();
      expect(account1?.balance).toBe(500000);
      expect(account2?.balance).toBe(300000);
    });

    it('reuses existing account for same bank and account number', async () => {
      await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: '1234',
        balance: 1000000,
      });

      const newMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. T.*1234. Saldo: $950.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. T.*1234. Saldo: $950.000]',
      };

      await service.processMessage(newMessage);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].balance).toBe(950000);
    });
  });

  describe('Transaction History Building', () => {
    it('creates sequential transaction history from multiple SMS', async () => {
      const messages: ParsedSmsMessage[] = [
        {
          sender: 'Bancolombia',
          body: 'Bancolombia le informa transferencia recibida por $500.000. Saldo: $500.000',
          rawMessage:
            '[Bancolombia, Bancolombia le informa transferencia recibida por $500.000. Saldo: $500.000]',
        },
        {
          sender: 'Bancolombia',
          body: 'Bancolombia le informa compra por $50.000 en EXITO. Saldo: $450.000',
          rawMessage: '[Bancolombia, Bancolombia le informa compra por $50.000 en EXITO. Saldo: $450.000]',
        },
        {
          sender: 'Bancolombia',
          body: 'Bancolombia le informa compra por $100.000 en ALMACEN. Saldo: $350.000',
          rawMessage:
            '[Bancolombia, Bancolombia le informa compra por $100.000 en ALMACEN. Saldo: $350.000]',
        },
      ];

      for (const msg of messages) {
        await service.processMessage(msg);
      }

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions).toHaveLength(3);

      const income = transactions.find((t) => t.type === 'income');
      const expenses = transactions.filter((t) => t.type === 'expense');

      expect(income).toBeDefined();
      expect(income?.amount).toBe(500000);
      expect(expenses).toHaveLength(2);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].balance).toBe(350000);
    });
  });

  describe('Duplicate Detection', () => {
    it('prevents duplicate transactions from identical SMS', async () => {
      const smsMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000',
        rawMessage: '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000]',
      };

      const firstResult = await service.processMessage(smsMessage);
      expect(firstResult.success).toBe(true);

      const secondResult = await service.processMessage(smsMessage);
      expect(secondResult.success).toBe(false);
      if (!secondResult.success) {
        expect(secondResult.reason).toBe('duplicate');
      }

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions).toHaveLength(1);

      const smsMessages = await smsCollection.query().fetch();
      expect(smsMessages).toHaveLength(1);
    });

    it('only stores one SMS record for duplicates', async () => {
      const smsMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000',
        rawMessage: '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000]',
      };

      await service.processMessage(smsMessage);
      await service.processMessage(smsMessage);
      await service.processMessage(smsMessage);

      const smsMessages = await smsCollection.query().fetch();
      expect(smsMessages).toHaveLength(1);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('stores non-bank SMS without creating transactions', async () => {
      const nonBankMessage: ParsedSmsMessage = {
        sender: 'Rappi',
        body: 'Tu pedido #12345 ha sido entregado',
        rawMessage: '[Rappi, Tu pedido #12345 ha sido entregado]',
      };

      const result = await service.processMessage(nonBankMessage);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.reason).toBe('not_bank_sms');
      }

      const transactions = await transactionsCollection.query().fetch();
      expect(transactions).toHaveLength(0);

      const accounts = await accountsCollection.query().fetch();
      expect(accounts).toHaveLength(0);
    });

    it('tracks unprocessed SMS count', async () => {
      const initialCount = await service.getUnprocessedSmsCount();
      expect(initialCount).toBe(0);

      const smsMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000',
        rawMessage: '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $500.000]',
      };

      await service.processMessage(smsMessage);

      const finalCount = await service.getUnprocessedSmsCount();
      expect(finalCount).toBe(0);
    });
  });

  describe('Balance Updates', () => {
    it('updates account balance when transaction includes balance', async () => {
      const smsMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en STORE. Saldo: $750.000',
        rawMessage: '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE. Saldo: $750.000]',
      };

      const result = await service.processMessage(smsMessage);
      expect(result.success).toBe(true);

      if (result.success) {
        const account = await accountsCollection.find(result.accountId);
        expect(account.balance).toBe(750000);
      }
    });

    it('updates balance sequentially with multiple transactions', async () => {
      const messages: ParsedSmsMessage[] = [
        {
          sender: 'Bancolombia',
          body: 'Bancolombia le informa transferencia recibida por $1.000.000. Saldo: $1.000.000',
          rawMessage:
            '[Bancolombia, Bancolombia le informa transferencia recibida por $1.000.000. Saldo: $1.000.000]',
        },
        {
          sender: 'Bancolombia',
          body: 'Bancolombia le informa compra por $250.000 en ALMACEN. Saldo: $750.000',
          rawMessage:
            '[Bancolombia, Bancolombia le informa compra por $250.000 en ALMACEN. Saldo: $750.000]',
        },
        {
          sender: 'Bancolombia',
          body: 'Bancolombia le informa compra por $150.000 en TIENDA. Saldo: $600.000',
          rawMessage: '[Bancolombia, Bancolombia le informa compra por $150.000 en TIENDA. Saldo: $600.000]',
        },
      ];

      let accountId: string | undefined;

      for (const msg of messages) {
        const result = await service.processMessage(msg);
        expect(result.success).toBe(true);
        if (result.success) {
          accountId = result.accountId;
        }
      }

      expect(accountId).toBeDefined();
      if (accountId) {
        const account = await accountsCollection.find(accountId);
        expect(account.balance).toBe(600000);
      }
    });
  });

  describe('Transaction Metadata', () => {
    it('stores complete transaction metadata including SMS reference', async () => {
      const smsMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $75.500 en EXITO COLOMBIA. T.*1234. Saldo: $925.000',
        rawMessage:
          '[Bancolombia, Bancolombia le informa compra por $75.500 en EXITO COLOMBIA. T.*1234. Saldo: $925.000]',
      };

      const result = await service.processMessage(smsMessage);
      expect(result.success).toBe(true);

      if (result.success) {
        const transaction = await transactionsCollection.find(result.transactionId);

        expect(transaction.accountId).toBe(result.accountId);
        expect(transaction.amount).toBe(75500);
        expect(transaction.type).toBe('expense');
        expect(transaction.merchant).toBe('EXITO COLOMBIA');
        expect(transaction.balanceAfter).toBe(925000);
        expect(transaction.smsId).toBeDefined();
        expect(transaction.rawSms).toBe(smsMessage.rawMessage);
      }
    });

    it('stores merchant information correctly', async () => {
      const smsMessage: ParsedSmsMessage = {
        sender: 'Bancolombia',
        body: 'Bancolombia le informa compra por $125.000 en TIENDA D1. Saldo: $500.000',
        rawMessage: '[Bancolombia, Bancolombia le informa compra por $125.000 en TIENDA D1. Saldo: $500.000]',
      };

      const result = await service.processMessage(smsMessage);
      expect(result.success).toBe(true);

      if (result.success) {
        const transaction = await transactionsCollection.find(result.transactionId);
        expect(transaction.merchant).toBe('TIENDA D1');
      }
    });
  });

  describe('Cross-Component Integration', () => {
    it('integrates parser, service, and repositories correctly', async () => {
      const smsMessage: ParsedSmsMessage = {
        sender: '85432',
        body: 'Nequi: Recibiste $100.000 de Carlos Martinez. Saldo: $450.000',
        rawMessage: '[85432, Nequi: Recibiste $100.000 de Carlos Martinez. Saldo: $450.000]',
      };

      const result = await service.processMessage(smsMessage);
      expect(result.success).toBe(true);

      const accounts = await accountsCollection.query().fetch();
      const transactions = await transactionsCollection.query().fetch();
      const smsMessages = await smsCollection.query().fetch();

      expect(accounts).toHaveLength(1);
      expect(transactions).toHaveLength(1);
      expect(smsMessages).toHaveLength(1);

      expect(accounts[0].bankCode).toBe('nequi');
      expect(transactions[0].accountId).toBe(accounts[0].id);
      expect(transactions[0].smsId).toBe(smsMessages[0].id);
      expect(smsMessages[0].isProcessed).toBe(true);
    });

    it('handles full sync flow with mixed bank messages', async () => {
      const messages: ParsedSmsMessage[] = [
        {
          sender: 'Bancolombia',
          body: 'Bancolombia le informa compra por $50.000 en STORE1. Saldo: $500.000',
          rawMessage: '[Bancolombia, Bancolombia le informa compra por $50.000 en STORE1. Saldo: $500.000]',
        },
        {
          sender: '85432',
          body: 'Nequi: Recibiste $30.000 de Juan. Saldo: $130.000',
          rawMessage: '[85432, Nequi: Recibiste $30.000 de Juan. Saldo: $130.000]',
        },
        {
          sender: 'Daviplata',
          body: 'DaviPlata: Enviaste $20.000 a Maria. Saldo: $80.000',
          rawMessage: '[Daviplata, DaviPlata: Enviaste $20.000 a Maria. Saldo: $80.000]',
        },
        {
          sender: 'Bancolombia',
          body: 'Bancolombia le informa compra por $25.000 en STORE2. Saldo: $475.000',
          rawMessage: '[Bancolombia, Bancolombia le informa compra por $25.000 en STORE2. Saldo: $475.000]',
        },
      ];

      for (const msg of messages) {
        const result = await service.processMessage(msg);
        expect(result.success).toBe(true);
      }

      const accounts = await accountsCollection.query().fetch();
      const transactions = await transactionsCollection.query().fetch();

      expect(accounts).toHaveLength(3);
      expect(transactions).toHaveLength(4);

      const bancolombiaAccount = accounts.find((a) => a.bankCode === 'bancolombia');
      const nequiAccount = accounts.find((a) => a.bankCode === 'nequi');
      const daviplataAccount = accounts.find((a) => a.bankCode === 'daviplata');

      expect(bancolombiaAccount?.balance).toBe(475000);
      expect(nequiAccount?.balance).toBe(130000);
      expect(daviplataAccount?.balance).toBe(80000);
    });
  });

  describe('Reprocessing Failed Messages', () => {
    it('returns empty result when no failed messages exist', async () => {
      const result = await service.reprocessFailedMessages();

      expect(result.processed).toBe(0);
      expect(result.created).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
