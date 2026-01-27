import { createTestDatabase, resetDatabase, createMockStatementImport } from './testHelpers';
import { StatementImportRepository } from '../repositories/StatementImportRepository';

import type { Database } from '@nozbe/watermelondb';

describe('StatementImportRepository', () => {
  let database: Database;
  let repository: StatementImportRepository;

  beforeEach(async () => {
    database = createTestDatabase();
    repository = new StatementImportRepository(database);
    await resetDatabase(database);
  });

  describe('findById', () => {
    it('returns statement import when found', async () => {
      const statementImport = await createMockStatementImport(database, {
        fileName: 'statement_202401.xlsx',
        bankCode: 'bancolombia',
      });

      const result = await repository.findById(statementImport.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(statementImport.id);
      expect(result?.fileName).toBe('statement_202401.xlsx');
      expect(result?.bankCode).toBe('bancolombia');
    });

    it('returns null when not found', async () => {
      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('returns empty array when no imports exist', async () => {
      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('returns all imports sorted by imported_at descending', async () => {
      const older = await createMockStatementImport(database, {
        fileName: 'old.xlsx',
        importedAt: new Date('2024-01-01'),
      });
      const newer = await createMockStatementImport(database, {
        fileName: 'new.xlsx',
        importedAt: new Date('2024-02-01'),
      });

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe(newer.id);
      expect(result[1]?.id).toBe(older.id);
    });
  });

  describe('findByFileHash', () => {
    it('returns import when hash matches', async () => {
      await createMockStatementImport(database, {
        fileHash: 'unique-hash-123',
      });

      const result = await repository.findByFileHash('unique-hash-123');

      expect(result).not.toBeNull();
      expect(result?.fileHash).toBe('unique-hash-123');
    });

    it('returns null when hash not found', async () => {
      const result = await repository.findByFileHash('non-existent-hash');

      expect(result).toBeNull();
    });

    it('returns one import when multiple have same hash', async () => {
      await createMockStatementImport(database, {
        fileHash: 'duplicate-hash',
      });
      await createMockStatementImport(database, {
        fileHash: 'duplicate-hash',
      });

      const result = await repository.findByFileHash('duplicate-hash');

      expect(result).not.toBeNull();
      expect(result?.fileHash).toBe('duplicate-hash');
    });
  });

  describe('findByPeriod', () => {
    beforeEach(async () => {
      await createMockStatementImport(database, {
        fileName: 'jan.xlsx',
        statementPeriodStart: new Date('2024-01-01'),
        statementPeriodEnd: new Date('2024-01-31'),
      });
      await createMockStatementImport(database, {
        fileName: 'feb.xlsx',
        statementPeriodStart: new Date('2024-02-01'),
        statementPeriodEnd: new Date('2024-02-29'),
      });
      await createMockStatementImport(database, {
        fileName: 'mar.xlsx',
        statementPeriodStart: new Date('2024-03-01'),
        statementPeriodEnd: new Date('2024-03-31'),
      });
    });

    it('returns imports that overlap with date range', async () => {
      const result = await repository.findByPeriod(new Date('2024-01-15'), new Date('2024-02-15'));

      expect(result).toHaveLength(2);
      const fileNames = result.map((r) => r.fileName);
      expect(fileNames).toContain('jan.xlsx');
      expect(fileNames).toContain('feb.xlsx');
    });

    it('returns imports that fully contain date range', async () => {
      const result = await repository.findByPeriod(new Date('2024-01-10'), new Date('2024-01-20'));

      expect(result).toHaveLength(1);
      expect(result[0]?.fileName).toBe('jan.xlsx');
    });

    it('returns imports when date range fully contains statement period', async () => {
      const result = await repository.findByPeriod(new Date('2023-12-01'), new Date('2024-04-30'));

      expect(result).toHaveLength(3);
    });

    it('returns empty array when no overlap', async () => {
      const result = await repository.findByPeriod(new Date('2024-04-01'), new Date('2024-04-30'));

      expect(result).toEqual([]);
    });
  });

  describe('findByBankCode', () => {
    it('returns imports for specific bank', async () => {
      await createMockStatementImport(database, { bankCode: 'bancolombia' });
      await createMockStatementImport(database, { bankCode: 'bancolombia' });
      await createMockStatementImport(database, { bankCode: 'nequi' });

      const result = await repository.findByBankCode('bancolombia');

      expect(result).toHaveLength(2);
      expect(result.every((i) => i.bankCode === 'bancolombia')).toBe(true);
    });

    it('returns empty array when no imports for bank', async () => {
      const result = await repository.findByBankCode('bbva');

      expect(result).toEqual([]);
    });
  });

  describe('findByFilters', () => {
    beforeEach(async () => {
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodStart: new Date('2024-01-01'),
        statementPeriodEnd: new Date('2024-01-31'),
        transactionsImported: 100,
      });
      await createMockStatementImport(database, {
        bankCode: 'nequi',
        statementPeriodStart: new Date('2024-02-01'),
        statementPeriodEnd: new Date('2024-02-29'),
        transactionsImported: 50,
      });
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodStart: new Date('2024-03-01'),
        statementPeriodEnd: new Date('2024-03-31'),
        transactionsImported: 75,
      });
    });

    it('filters by bank code', async () => {
      const result = await repository.findByFilters({ bankCode: 'bancolombia' });

      expect(result).toHaveLength(2);
      expect(result.every((i) => i.bankCode === 'bancolombia')).toBe(true);
    });

    it('filters by start date', async () => {
      const result = await repository.findByFilters({
        startDate: new Date('2024-02-01'),
      });

      expect(result).toHaveLength(2);
    });

    it('filters by end date', async () => {
      const result = await repository.findByFilters({
        endDate: new Date('2024-02-29'),
      });

      expect(result).toHaveLength(2);
    });

    it('filters by minimum transactions', async () => {
      const result = await repository.findByFilters({ minTransactions: 75 });

      expect(result).toHaveLength(2);
      expect(result.every((i) => i.transactionsImported >= 75)).toBe(true);
    });

    it('filters by multiple conditions', async () => {
      const result = await repository.findByFilters({
        bankCode: 'bancolombia',
        minTransactions: 80,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.transactionsImported).toBe(100);
    });
  });

  describe('create', () => {
    it('creates statement import with all fields', async () => {
      const importData = {
        fileName: 'test_statement.xlsx',
        fileHash: 'test-hash-123',
        bankCode: 'nequi' as const,
        statementPeriodStart: new Date('2024-01-01'),
        statementPeriodEnd: new Date('2024-01-31'),
        transactionsImported: 42,
        importedAt: new Date('2024-02-01'),
      };

      const result = await repository.create(importData);

      expect(result.fileName).toBe('test_statement.xlsx');
      expect(result.fileHash).toBe('test-hash-123');
      expect(result.bankCode).toBe('nequi');
      expect(result.statementPeriodStart).toEqual(importData.statementPeriodStart);
      expect(result.statementPeriodEnd).toEqual(importData.statementPeriodEnd);
      expect(result.transactionsImported).toBe(42);
      expect(result.importedAt).toEqual(importData.importedAt);
    });

    it('creates with default importedAt when not provided', async () => {
      const before = new Date();

      const result = await repository.create({
        fileName: 'test.xlsx',
        fileHash: 'hash',
        bankCode: 'bancolombia',
        statementPeriodStart: new Date('2024-01-01'),
        statementPeriodEnd: new Date('2024-01-31'),
        transactionsImported: 10,
      });

      const after = new Date();
      expect(result.importedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(result.importedAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('delete', () => {
    it('deletes statement import', async () => {
      const statementImport = await createMockStatementImport(database);
      const countBefore = await repository.count();

      const result = await repository.delete(statementImport.id);

      expect(result).toBe(true);
      const countAfter = await repository.count();
      expect(countAfter).toBe(countBefore - 1);
    });

    it('returns false when not found', async () => {
      const result = await repository.delete('non-existent-id');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('returns total number of imports', async () => {
      await createMockStatementImport(database);
      await createMockStatementImport(database);
      await createMockStatementImport(database);

      const count = await repository.count();

      expect(count).toBe(3);
    });
  });

  describe('countByBankCode', () => {
    it('returns number of imports for bank', async () => {
      await createMockStatementImport(database, { bankCode: 'bancolombia' });
      await createMockStatementImport(database, { bankCode: 'bancolombia' });
      await createMockStatementImport(database, { bankCode: 'nequi' });

      const count = await repository.countByBankCode('bancolombia');

      expect(count).toBe(2);
    });
  });

  describe('exists', () => {
    it('returns true when exists', async () => {
      const statementImport = await createMockStatementImport(database);

      const exists = await repository.exists(statementImport.id);

      expect(exists).toBe(true);
    });

    it('returns false when not exists', async () => {
      const exists = await repository.exists('non-existent-id');

      expect(exists).toBe(false);
    });
  });

  describe('existsByFileHash', () => {
    it('returns true when hash exists', async () => {
      await createMockStatementImport(database, { fileHash: 'existing-hash' });

      const exists = await repository.existsByFileHash('existing-hash');

      expect(exists).toBe(true);
    });

    it('returns false when hash not exists', async () => {
      const exists = await repository.existsByFileHash('non-existent-hash');

      expect(exists).toBe(false);
    });
  });

  describe('getTotalTransactionsImported', () => {
    it('sums all imported transactions', async () => {
      await createMockStatementImport(database, { transactionsImported: 100 });
      await createMockStatementImport(database, { transactionsImported: 50 });
      await createMockStatementImport(database, { transactionsImported: 75 });

      const total = await repository.getTotalTransactionsImported();

      expect(total).toBe(225);
    });

    it('returns zero when no imports', async () => {
      const total = await repository.getTotalTransactionsImported();

      expect(total).toBe(0);
    });
  });

  describe('getLatestByBankCode', () => {
    it('returns most recent import for bank by statement end date', async () => {
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodEnd: new Date('2024-01-31'),
      });
      const latest = await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodEnd: new Date('2024-03-31'),
      });
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodEnd: new Date('2024-02-29'),
      });

      const result = await repository.getLatestByBankCode('bancolombia');

      expect(result?.id).toBe(latest.id);
    });

    it('returns null when no imports for bank', async () => {
      const result = await repository.getLatestByBankCode('bbva');

      expect(result).toBeNull();
    });
  });

  describe('observeAll', () => {
    it('returns query for all imports', () => {
      const query = repository.observeAll();

      expect(query).toBeDefined();
    });
  });
});
