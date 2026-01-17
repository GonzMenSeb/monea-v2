import {
  createTestDatabase,
  resetDatabase,
  createMockAccount,
  createMockTransaction,
  createMockCategory,
} from './testHelpers';
import { TransactionRepository } from '../repositories/TransactionRepository';

import type { Database } from '@nozbe/watermelondb';

describe('TransactionRepository', () => {
  let database: Database;
  let repository: TransactionRepository;
  let accountId: string;

  beforeEach(async () => {
    database = createTestDatabase();
    repository = new TransactionRepository(database);
    await resetDatabase(database);

    const account = await createMockAccount(database);
    accountId = account.id;
  });

  describe('findById', () => {
    it('returns transaction when found', async () => {
      const transaction = await createMockTransaction(database, {
        accountId,
        amount: 50000,
        type: 'expense',
      });

      const result = await repository.findById(transaction.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(transaction.id);
      expect(result?.amount).toBe(50000);
      expect(result?.type).toBe('expense');
    });

    it('returns null when transaction not found', async () => {
      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns empty array when no transactions exist', async () => {
      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('returns all transactions', async () => {
      await createMockTransaction(database, { accountId, amount: 100000 });
      await createMockTransaction(database, { accountId, amount: 200000 });
      await createMockTransaction(database, { accountId, amount: 300000 });

      const result = await repository.findAll();

      expect(result).toHaveLength(3);
    });
  });

  describe('findByAccountId', () => {
    it('returns transactions for specific account', async () => {
      const account2 = await createMockAccount(database);

      await createMockTransaction(database, { accountId, amount: 100000 });
      await createMockTransaction(database, { accountId, amount: 200000 });
      await createMockTransaction(database, { accountId: account2.id, amount: 300000 });

      const result = await repository.findByAccountId(accountId);

      expect(result).toHaveLength(2);
      expect(result.every((t) => t.accountId === accountId)).toBe(true);
    });

    it('returns empty array when no transactions for account', async () => {
      const result = await repository.findByAccountId(accountId);

      expect(result).toEqual([]);
    });
  });

  describe('findByCategoryId', () => {
    it('returns transactions for specific category', async () => {
      const category = await createMockCategory(database);

      await createMockTransaction(database, { accountId, categoryId: category.id });
      await createMockTransaction(database, { accountId, categoryId: category.id });
      await createMockTransaction(database, { accountId });

      const result = await repository.findByCategoryId(category.id);

      expect(result).toHaveLength(2);
      expect(result.every((t) => t.categoryId === category.id)).toBe(true);
    });
  });

  describe('findBySmsId', () => {
    it('returns transaction when found', async () => {
      await createMockTransaction(database, { accountId, smsId: 'sms-123' });

      const result = await repository.findBySmsId('sms-123');

      expect(result).not.toBeNull();
      expect(result?.smsId).toBe('sms-123');
    });

    it('returns null when sms id not found', async () => {
      const result = await repository.findBySmsId('non-existent');

      expect(result).toBeNull();
    });

    it('returns first transaction when multiple exist with same sms id', async () => {
      const first = await createMockTransaction(database, { accountId, smsId: 'sms-123' });
      await createMockTransaction(database, { accountId, smsId: 'sms-123' });

      const result = await repository.findBySmsId('sms-123');

      expect(result?.id).toBe(first.id);
    });
  });

  describe('findByFilters', () => {
    beforeEach(async () => {
      const category1 = await createMockCategory(database, { name: 'Food' });
      const category2 = await createMockCategory(database, { name: 'Transport' });

      await createMockTransaction(database, {
        accountId,
        type: 'expense',
        amount: 50000,
        categoryId: category1.id,
        transactionDate: new Date('2024-01-15'),
        merchant: 'Exito',
      });
      await createMockTransaction(database, {
        accountId,
        type: 'income',
        amount: 1000000,
        categoryId: category2.id,
        transactionDate: new Date('2024-01-20'),
        merchant: 'Employer',
      });
      await createMockTransaction(database, {
        accountId,
        type: 'expense',
        amount: 30000,
        categoryId: category1.id,
        transactionDate: new Date('2024-02-01'),
        merchant: 'Carulla',
      });
    });

    it('filters by account id', async () => {
      const result = await repository.findByFilters({ accountId });

      expect(result).toHaveLength(3);
      expect(result.every((t) => t.accountId === accountId)).toBe(true);
    });

    it('filters by category id', async () => {
      const category = await createMockCategory(database, { name: 'Food' });
      await createMockTransaction(database, { accountId, categoryId: category.id });

      const result = await repository.findByFilters({ categoryId: category.id });

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((t) => t.categoryId === category.id)).toBe(true);
    });

    it('filters by transaction type', async () => {
      const result = await repository.findByFilters({ type: 'expense' });

      expect(result).toHaveLength(2);
      expect(result.every((t) => t.type === 'expense')).toBe(true);
    });

    it('filters by start date', async () => {
      const result = await repository.findByFilters({
        startDate: new Date('2024-01-20'),
      });

      expect(result).toHaveLength(2);
    });

    it('filters by end date', async () => {
      const result = await repository.findByFilters({
        endDate: new Date('2024-01-20'),
      });

      expect(result).toHaveLength(2);
    });

    it('filters by minimum amount', async () => {
      const result = await repository.findByFilters({ minAmount: 50000 });

      expect(result).toHaveLength(2);
      expect(result.every((t) => t.amount >= 50000)).toBe(true);
    });

    it('filters by maximum amount', async () => {
      const result = await repository.findByFilters({ maxAmount: 50000 });

      expect(result).toHaveLength(2);
      expect(result.every((t) => t.amount <= 50000)).toBe(true);
    });

    it('filters by merchant', async () => {
      const result = await repository.findByFilters({ merchant: 'Exito' });

      expect(result).toHaveLength(1);
      expect(result[0]?.merchant).toBe('Exito');
    });

    it('filters by multiple conditions', async () => {
      const result = await repository.findByFilters({
        type: 'expense',
        minAmount: 40000,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.amount).toBe(50000);
    });
  });

  describe('findRecentByAccount', () => {
    it('returns recent transactions sorted by date', async () => {
      await createMockTransaction(database, {
        accountId,
        transactionDate: new Date('2024-01-10'),
      });
      await createMockTransaction(database, {
        accountId,
        transactionDate: new Date('2024-01-20'),
      });
      await createMockTransaction(database, {
        accountId,
        transactionDate: new Date('2024-01-15'),
      });

      const result = await repository.findRecentByAccount(accountId, 10);

      expect(result).toHaveLength(3);
      expect(result[0]?.transactionDate.getTime()).toBeGreaterThan(
        result[1]?.transactionDate.getTime() ?? 0
      );
    });

    it('limits results to specified count', async () => {
      await createMockTransaction(database, { accountId });
      await createMockTransaction(database, { accountId });
      await createMockTransaction(database, { accountId });

      const result = await repository.findRecentByAccount(accountId, 2);

      expect(result).toHaveLength(2);
    });
  });

  describe('findByDateRange', () => {
    beforeEach(async () => {
      await createMockTransaction(database, {
        accountId,
        transactionDate: new Date('2024-01-05'),
      });
      await createMockTransaction(database, {
        accountId,
        transactionDate: new Date('2024-01-15'),
      });
      await createMockTransaction(database, {
        accountId,
        transactionDate: new Date('2024-01-25'),
      });
      await createMockTransaction(database, {
        accountId,
        transactionDate: new Date('2024-02-05'),
      });
    });

    it('returns transactions within date range', async () => {
      const result = await repository.findByDateRange(
        new Date('2024-01-10'),
        new Date('2024-01-31')
      );

      expect(result).toHaveLength(2);
    });

    it('includes transactions on boundary dates', async () => {
      const result = await repository.findByDateRange(
        new Date('2024-01-15'),
        new Date('2024-01-25')
      );

      expect(result).toHaveLength(2);
    });

    it('returns empty array when no transactions in range', async () => {
      const result = await repository.findByDateRange(
        new Date('2024-03-01'),
        new Date('2024-03-31')
      );

      expect(result).toEqual([]);
    });
  });

  describe('create', () => {
    it('creates transaction with all fields', async () => {
      const category = await createMockCategory(database);

      const transaction = await repository.create({
        accountId,
        type: 'expense',
        amount: 75000,
        transactionDate: new Date('2024-01-20'),
        categoryId: category.id,
        balanceAfter: 925000,
        merchant: 'Store',
        description: 'Purchase',
        reference: 'REF123',
        smsId: 'sms-456',
        rawSms: 'Raw SMS content',
      });

      expect(transaction.accountId).toBe(accountId);
      expect(transaction.type).toBe('expense');
      expect(transaction.amount).toBe(75000);
      expect(transaction.categoryId).toBe(category.id);
      expect(transaction.balanceAfter).toBe(925000);
      expect(transaction.merchant).toBe('Store');
      expect(transaction.description).toBe('Purchase');
      expect(transaction.reference).toBe('REF123');
      expect(transaction.smsId).toBe('sms-456');
      expect(transaction.rawSms).toBe('Raw SMS content');
    });

    it('creates transaction with required fields only', async () => {
      const transaction = await repository.create({
        accountId,
        type: 'income',
        amount: 1000000,
        transactionDate: new Date('2024-01-15'),
      });

      expect(transaction.accountId).toBe(accountId);
      expect(transaction.type).toBe('income');
      expect(transaction.amount).toBe(1000000);
      expect(transaction.categoryId).toBeFalsy();
      expect(transaction.merchant).toBeFalsy();
    });
  });

  describe('createBatch', () => {
    it('creates multiple transactions', async () => {
      const transactions = await repository.createBatch([
        {
          accountId,
          type: 'expense',
          amount: 50000,
          transactionDate: new Date('2024-01-15'),
        },
        {
          accountId,
          type: 'income',
          amount: 1000000,
          transactionDate: new Date('2024-01-20'),
        },
      ]);

      expect(transactions).toHaveLength(2);
      expect(transactions[0]?.amount).toBe(50000);
      expect(transactions[1]?.amount).toBe(1000000);
    });

    it('creates empty array when no data provided', async () => {
      const transactions = await repository.createBatch([]);

      expect(transactions).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates transaction fields', async () => {
      const category = await createMockCategory(database);
      const transaction = await createMockTransaction(database, {
        accountId,
        merchant: 'Old Merchant',
        description: 'Old Description',
      });

      const updated = await repository.update(transaction.id, {
        categoryId: category.id,
        merchant: 'New Merchant',
        description: 'New Description',
      });

      expect(updated).not.toBeNull();
      expect(updated?.categoryId).toBe(category.id);
      expect(updated?.merchant).toBe('New Merchant');
      expect(updated?.description).toBe('New Description');
    });

    it('updates only specified fields', async () => {
      const transaction = await createMockTransaction(database, {
        accountId,
        merchant: 'Original',
        description: 'Original Description',
      });

      const updated = await repository.update(transaction.id, {
        merchant: 'Updated Merchant',
      });

      expect(updated?.merchant).toBe('Updated Merchant');
      expect(updated?.description).toBe('Original Description');
    });

    it('returns null when transaction not found', async () => {
      const result = await repository.update('non-existent-id', {
        merchant: 'Test',
      });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('deletes transaction', async () => {
      const transaction = await createMockTransaction(database, { accountId });
      const countBefore = await repository.count();

      const result = await repository.delete(transaction.id);

      expect(result).toBe(true);

      const countAfter = await repository.count();
      expect(countAfter).toBe(countBefore - 1);
    });

    it('returns false when transaction not found', async () => {
      const result = await repository.delete('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('deleteByAccountId', () => {
    it('deletes all transactions for account', async () => {
      await createMockTransaction(database, { accountId });
      await createMockTransaction(database, { accountId });
      await createMockTransaction(database, { accountId });

      const deletedCount = await repository.deleteByAccountId(accountId);

      expect(deletedCount).toBe(3);

      const remaining = await repository.findByAccountId(accountId);
      expect(remaining).toEqual([]);
    });

    it('returns zero when no transactions for account', async () => {
      const deletedCount = await repository.deleteByAccountId(accountId);

      expect(deletedCount).toBe(0);
    });

    it('does not delete transactions from other accounts', async () => {
      const account2 = await createMockAccount(database);

      await createMockTransaction(database, { accountId });
      await createMockTransaction(database, { accountId: account2.id });

      await repository.deleteByAccountId(accountId);

      const remaining = await repository.findByAccountId(account2.id);
      expect(remaining).toHaveLength(1);
    });
  });

  describe('getSummaryByDateRange', () => {
    beforeEach(async () => {
      await createMockTransaction(database, {
        accountId,
        type: 'income',
        amount: 1000000,
        transactionDate: new Date('2024-01-15'),
      });
      await createMockTransaction(database, {
        accountId,
        type: 'expense',
        amount: 50000,
        transactionDate: new Date('2024-01-20'),
      });
      await createMockTransaction(database, {
        accountId,
        type: 'expense',
        amount: 30000,
        transactionDate: new Date('2024-01-25'),
      });
      await createMockTransaction(database, {
        accountId,
        type: 'transfer_in',
        amount: 100000,
        transactionDate: new Date('2024-01-28'),
      });
      await createMockTransaction(database, {
        accountId,
        type: 'transfer_out',
        amount: 20000,
        transactionDate: new Date('2024-01-29'),
      });
      await createMockTransaction(database, {
        accountId,
        type: 'income',
        amount: 500000,
        transactionDate: new Date('2024-02-05'),
      });
    });

    it('calculates summary for date range', async () => {
      const summary = await repository.getSummaryByDateRange(
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(summary.totalIncome).toBe(1100000);
      expect(summary.totalExpense).toBe(100000);
      expect(summary.netBalance).toBe(1000000);
      expect(summary.transactionCount).toBe(5);
    });

    it('excludes transactions outside date range', async () => {
      const summary = await repository.getSummaryByDateRange(
        new Date('2024-02-01'),
        new Date('2024-02-28')
      );

      expect(summary.totalIncome).toBe(500000);
      expect(summary.totalExpense).toBe(0);
      expect(summary.transactionCount).toBe(1);
    });

    it('returns zeros for empty date range', async () => {
      const summary = await repository.getSummaryByDateRange(
        new Date('2024-03-01'),
        new Date('2024-03-31')
      );

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpense).toBe(0);
      expect(summary.netBalance).toBe(0);
      expect(summary.transactionCount).toBe(0);
    });
  });

  describe('getSummaryByAccountId', () => {
    it('calculates summary for account', async () => {
      await createMockTransaction(database, {
        accountId,
        type: 'income',
        amount: 2000000,
      });
      await createMockTransaction(database, {
        accountId,
        type: 'expense',
        amount: 150000,
      });
      await createMockTransaction(database, {
        accountId,
        type: 'expense',
        amount: 80000,
      });

      const summary = await repository.getSummaryByAccountId(accountId);

      expect(summary.totalIncome).toBe(2000000);
      expect(summary.totalExpense).toBe(230000);
      expect(summary.netBalance).toBe(1770000);
      expect(summary.transactionCount).toBe(3);
    });

    it('returns zeros for account with no transactions', async () => {
      const summary = await repository.getSummaryByAccountId(accountId);

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalExpense).toBe(0);
      expect(summary.netBalance).toBe(0);
      expect(summary.transactionCount).toBe(0);
    });
  });

  describe('count', () => {
    it('returns total number of transactions', async () => {
      await createMockTransaction(database, { accountId });
      await createMockTransaction(database, { accountId });
      await createMockTransaction(database, { accountId });

      const count = await repository.count();

      expect(count).toBe(3);
    });
  });

  describe('countByAccountId', () => {
    it('returns number of transactions for account', async () => {
      const account2 = await createMockAccount(database);

      await createMockTransaction(database, { accountId });
      await createMockTransaction(database, { accountId });
      await createMockTransaction(database, { accountId: account2.id });

      const count = await repository.countByAccountId(accountId);

      expect(count).toBe(2);
    });
  });

  describe('exists', () => {
    it('returns true when transaction exists', async () => {
      const transaction = await createMockTransaction(database, { accountId });

      const exists = await repository.exists(transaction.id);

      expect(exists).toBe(true);
    });

    it('returns false when transaction does not exist', async () => {
      const exists = await repository.exists('non-existent-id');

      expect(exists).toBe(false);
    });
  });

  describe('existsBySmsId', () => {
    it('returns true when sms id exists', async () => {
      await createMockTransaction(database, { accountId, smsId: 'sms-789' });

      const exists = await repository.existsBySmsId('sms-789');

      expect(exists).toBe(true);
    });

    it('returns false when sms id does not exist', async () => {
      const exists = await repository.existsBySmsId('non-existent');

      expect(exists).toBe(false);
    });
  });

  describe('observeByAccountId', () => {
    it('returns query for account transactions', async () => {
      const query = repository.observeByAccountId(accountId);

      expect(query).toBeDefined();
    });
  });

  describe('observeRecent', () => {
    it('returns query for recent transactions', () => {
      const query = repository.observeRecent(20);

      expect(query).toBeDefined();
    });
  });
});
