import { AccountRepository } from '../repositories/AccountRepository';
import { createTestDatabase, resetDatabase, createMockAccount } from './testHelpers';

import type { Database } from '@nozbe/watermelondb';

describe('AccountRepository', () => {
  let database: Database;
  let repository: AccountRepository;

  beforeEach(async () => {
    database = createTestDatabase();
    repository = new AccountRepository(database);
    await resetDatabase(database);
  });

  describe('findById', () => {
    it('returns account when found', async () => {
      const account = await createMockAccount(database, {
        bankCode: 'bancolombia',
        bankName: 'Bancolombia',
      });

      const result = await repository.findById(account.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(account.id);
      expect(result?.bankCode).toBe('bancolombia');
      expect(result?.bankName).toBe('Bancolombia');
    });

    it('returns null when account not found', async () => {
      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns empty array when no accounts exist', async () => {
      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('returns all accounts', async () => {
      await createMockAccount(database, { bankCode: 'bancolombia' });
      await createMockAccount(database, { bankCode: 'nequi' });
      await createMockAccount(database, { bankCode: 'davivienda' });

      const result = await repository.findAll();

      expect(result).toHaveLength(3);
    });
  });

  describe('findActive', () => {
    it('returns only active accounts', async () => {
      await createMockAccount(database, { isActive: true });
      await createMockAccount(database, { isActive: false });
      await createMockAccount(database, { isActive: true });

      const result = await repository.findActive();

      expect(result).toHaveLength(2);
      expect(result.every((a) => a.isActive)).toBe(true);
    });

    it('returns empty array when no active accounts', async () => {
      await createMockAccount(database, { isActive: false });

      const result = await repository.findActive();

      expect(result).toEqual([]);
    });
  });

  describe('findByBankCode', () => {
    it('returns accounts for specific bank', async () => {
      await createMockAccount(database, { bankCode: 'bancolombia' });
      await createMockAccount(database, { bankCode: 'bancolombia' });
      await createMockAccount(database, { bankCode: 'nequi' });

      const result = await repository.findByBankCode('bancolombia');

      expect(result).toHaveLength(2);
      expect(result.every((a) => a.bankCode === 'bancolombia')).toBe(true);
    });

    it('returns empty array when no accounts for bank', async () => {
      const result = await repository.findByBankCode('bbva');

      expect(result).toEqual([]);
    });
  });

  describe('findByAccountNumber', () => {
    it('returns account when found', async () => {
      await createMockAccount(database, { accountNumber: '1234567890' });

      const result = await repository.findByAccountNumber('1234567890');

      expect(result).not.toBeNull();
      expect(result?.accountNumber).toBe('1234567890');
    });

    it('returns null when account number not found', async () => {
      const result = await repository.findByAccountNumber('9999999999');

      expect(result).toBeNull();
    });

    it('returns first account when multiple exist with same number', async () => {
      const first = await createMockAccount(database, { accountNumber: '1234567890' });
      await createMockAccount(database, { accountNumber: '1234567890' });

      const result = await repository.findByAccountNumber('1234567890');

      expect(result?.id).toBe(first.id);
    });
  });

  describe('findByAccountType', () => {
    it('returns accounts of specific type', async () => {
      await createMockAccount(database, { accountType: 'savings' });
      await createMockAccount(database, { accountType: 'checking' });
      await createMockAccount(database, { accountType: 'savings' });

      const result = await repository.findByAccountType('savings');

      expect(result).toHaveLength(2);
      expect(result.every((a) => a.accountType === 'savings')).toBe(true);
    });
  });

  describe('findByFilters', () => {
    beforeEach(async () => {
      await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountType: 'savings',
        balance: 1000000,
        isActive: true,
      });
      await createMockAccount(database, {
        bankCode: 'nequi',
        accountType: 'digital_wallet',
        balance: 500000,
        isActive: true,
      });
      await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountType: 'checking',
        balance: 2000000,
        isActive: false,
      });
    });

    it('filters by bank code', async () => {
      const result = await repository.findByFilters({ bankCode: 'bancolombia' });

      expect(result).toHaveLength(2);
      expect(result.every((a) => a.bankCode === 'bancolombia')).toBe(true);
    });

    it('filters by account type', async () => {
      const result = await repository.findByFilters({ accountType: 'savings' });

      expect(result).toHaveLength(1);
      expect(result[0]?.accountType).toBe('savings');
    });

    it('filters by isActive', async () => {
      const result = await repository.findByFilters({ isActive: true });

      expect(result).toHaveLength(2);
      expect(result.every((a) => a.isActive)).toBe(true);
    });

    it('filters by minimum balance', async () => {
      const result = await repository.findByFilters({ minBalance: 1000000 });

      expect(result).toHaveLength(2);
      expect(result.every((a) => a.balance >= 1000000)).toBe(true);
    });

    it('filters by maximum balance', async () => {
      const result = await repository.findByFilters({ maxBalance: 1000000 });

      expect(result).toHaveLength(2);
      expect(result.every((a) => a.balance <= 1000000)).toBe(true);
    });

    it('filters by multiple conditions', async () => {
      const result = await repository.findByFilters({
        bankCode: 'bancolombia',
        isActive: true,
        minBalance: 500000,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.bankCode).toBe('bancolombia');
      expect(result[0]?.isActive).toBe(true);
      expect(result[0]?.balance).toBeGreaterThanOrEqual(500000);
    });
  });

  describe('create', () => {
    it('creates account with all fields', async () => {
      const account = await repository.create({
        bankCode: 'bancolombia',
        bankName: 'Bancolombia',
        accountNumber: '1234567890',
        accountType: 'savings',
        balance: 1500000,
        isActive: true,
      });

      expect(account.bankCode).toBe('bancolombia');
      expect(account.bankName).toBe('Bancolombia');
      expect(account.accountNumber).toBe('1234567890');
      expect(account.accountType).toBe('savings');
      expect(account.balance).toBe(1500000);
      expect(account.isActive).toBe(true);
    });

    it('creates account with default values', async () => {
      const account = await repository.create({
        bankCode: 'nequi',
        bankName: 'Nequi',
        accountNumber: '3001234567',
        accountType: 'digital_wallet',
      });

      expect(account.balance).toBe(0);
      expect(account.isActive).toBe(true);
    });
  });

  describe('createBatch', () => {
    it('creates multiple accounts', async () => {
      const accounts = await repository.createBatch([
        {
          bankCode: 'bancolombia',
          bankName: 'Bancolombia',
          accountNumber: '1111111111',
          accountType: 'savings',
        },
        {
          bankCode: 'nequi',
          bankName: 'Nequi',
          accountNumber: '2222222222',
          accountType: 'digital_wallet',
        },
      ]);

      expect(accounts).toHaveLength(2);
      expect(accounts[0]?.bankCode).toBe('bancolombia');
      expect(accounts[1]?.bankCode).toBe('nequi');
    });

    it('creates empty array when no data provided', async () => {
      const accounts = await repository.createBatch([]);

      expect(accounts).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates account fields', async () => {
      const account = await createMockAccount(database, {
        bankName: 'Old Name',
        balance: 1000000,
        isActive: true,
      });

      const updated = await repository.update(account.id, {
        bankName: 'New Name',
        balance: 2000000,
        isActive: false,
      });

      expect(updated).not.toBeNull();
      expect(updated?.bankName).toBe('New Name');
      expect(updated?.balance).toBe(2000000);
      expect(updated?.isActive).toBe(false);
    });

    it('updates only specified fields', async () => {
      const account = await createMockAccount(database, {
        bankName: 'Original',
        balance: 1000000,
      });

      const updated = await repository.update(account.id, {
        balance: 1500000,
      });

      expect(updated?.bankName).toBe('Original');
      expect(updated?.balance).toBe(1500000);
    });

    it('returns null when account not found', async () => {
      const result = await repository.update('non-existent-id', {
        balance: 1000000,
      });

      expect(result).toBeNull();
    });
  });

  describe('updateBalance', () => {
    it('updates account balance', async () => {
      const account = await createMockAccount(database, { balance: 1000000 });

      const updated = await repository.updateBalance(account.id, 2500000);

      expect(updated?.balance).toBe(2500000);
    });
  });

  describe('updateLastSynced', () => {
    it('updates lastSyncedAt timestamp', async () => {
      const account = await createMockAccount(database);

      const updated = await repository.updateLastSynced(account.id);

      expect(updated?.lastSyncedAt).toBeDefined();
      expect(updated?.lastSyncedAt).toBeGreaterThan(0);
    });
  });

  describe('deactivate', () => {
    it('sets account to inactive', async () => {
      const account = await createMockAccount(database, { isActive: true });

      const updated = await repository.deactivate(account.id);

      expect(updated?.isActive).toBe(false);
    });
  });

  describe('activate', () => {
    it('sets account to active', async () => {
      const account = await createMockAccount(database, { isActive: false });

      const updated = await repository.activate(account.id);

      expect(updated?.isActive).toBe(true);
    });
  });

  describe('delete', () => {
    it('deletes account', async () => {
      const account = await createMockAccount(database);
      const countBefore = await repository.count();

      const result = await repository.delete(account.id);

      expect(result).toBe(true);

      const countAfter = await repository.count();
      expect(countAfter).toBe(countBefore - 1);
    });

    it('returns false when account not found', async () => {
      const result = await repository.delete('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('getSummary', () => {
    it('calculates summary for multiple accounts', async () => {
      await createMockAccount(database, {
        bankCode: 'bancolombia',
        balance: 1000000,
        isActive: true,
      });
      await createMockAccount(database, {
        bankCode: 'bancolombia',
        balance: 500000,
        isActive: false,
      });
      await createMockAccount(database, {
        bankCode: 'nequi',
        balance: 250000,
        isActive: true,
      });

      const summary = await repository.getSummary();

      expect(summary.totalBalance).toBe(1750000);
      expect(summary.accountCount).toBe(3);
      expect(summary.activeCount).toBe(2);
      expect(summary.byBank.bancolombia).toBe(1500000);
      expect(summary.byBank.nequi).toBe(250000);
    });

    it('returns zeros for empty database', async () => {
      const summary = await repository.getSummary();

      expect(summary.totalBalance).toBe(0);
      expect(summary.accountCount).toBe(0);
      expect(summary.activeCount).toBe(0);
    });
  });

  describe('getTotalBalance', () => {
    it('sums balance of active accounts only', async () => {
      await createMockAccount(database, { balance: 1000000, isActive: true });
      await createMockAccount(database, { balance: 500000, isActive: false });
      await createMockAccount(database, { balance: 300000, isActive: true });

      const total = await repository.getTotalBalance();

      expect(total).toBe(1300000);
    });

    it('returns zero when no active accounts', async () => {
      await createMockAccount(database, { balance: 1000000, isActive: false });

      const total = await repository.getTotalBalance();

      expect(total).toBe(0);
    });
  });

  describe('count', () => {
    it('returns total number of accounts', async () => {
      await createMockAccount(database);
      await createMockAccount(database);
      await createMockAccount(database);

      const count = await repository.count();

      expect(count).toBe(3);
    });
  });

  describe('countActive', () => {
    it('returns number of active accounts', async () => {
      await createMockAccount(database, { isActive: true });
      await createMockAccount(database, { isActive: false });
      await createMockAccount(database, { isActive: true });

      const count = await repository.countActive();

      expect(count).toBe(2);
    });
  });

  describe('countByBankCode', () => {
    it('returns number of accounts for bank', async () => {
      await createMockAccount(database, { bankCode: 'bancolombia' });
      await createMockAccount(database, { bankCode: 'bancolombia' });
      await createMockAccount(database, { bankCode: 'nequi' });

      const count = await repository.countByBankCode('bancolombia');

      expect(count).toBe(2);
    });
  });

  describe('exists', () => {
    it('returns true when account exists', async () => {
      const account = await createMockAccount(database);

      const exists = await repository.exists(account.id);

      expect(exists).toBe(true);
    });

    it('returns false when account does not exist', async () => {
      const exists = await repository.exists('non-existent-id');

      expect(exists).toBe(false);
    });
  });

  describe('existsByAccountNumber', () => {
    it('returns true when account number exists', async () => {
      await createMockAccount(database, { accountNumber: '1234567890' });

      const exists = await repository.existsByAccountNumber('1234567890');

      expect(exists).toBe(true);
    });

    it('returns false when account number does not exist', async () => {
      const exists = await repository.existsByAccountNumber('9999999999');

      expect(exists).toBe(false);
    });
  });

  describe('observeAll', () => {
    it('returns query for all accounts', () => {
      const query = repository.observeAll();

      expect(query).toBeDefined();
    });
  });

  describe('observeActive', () => {
    it('returns query for active accounts', () => {
      const query = repository.observeActive();

      expect(query).toBeDefined();
    });
  });

  describe('observeById', () => {
    it('returns query for specific account', async () => {
      const account = await createMockAccount(database);

      const query = repository.observeById(account.id);

      expect(query).toBeDefined();
    });
  });
});
