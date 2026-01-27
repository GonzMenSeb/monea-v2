import type { Database } from '@nozbe/watermelondb';

import {
  createTestDatabase,
  resetDatabase,
  createMockAccount,
  createMockTransaction,
  createMockStatementImport,
} from '@/infrastructure/database/__tests__/testHelpers';

import { StatementImportService, resetStatementImportService } from '../StatementImportService';

import type { FileImportInput } from '../../types';
import type { StatementParseOutcome, ParsedStatementResult } from '@/core/parser/statement';

const mockParsedResult: ParsedStatementResult = {
  bank: {
    code: 'bancolombia',
    name: 'Bancolombia',
  },
  account: {
    accountNumber: '1234567890',
    accountType: 'savings',
    holderName: 'John Doe',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    openingBalance: 1000000,
    closingBalance: 1500000,
  },
  transactions: [
    {
      type: 'income',
      amount: 500000,
      balanceAfter: 1500000,
      merchant: 'Salary',
      description: 'Monthly salary',
      transactionDate: new Date('2024-01-15'),
    },
    {
      type: 'expense',
      amount: 50000,
      balanceAfter: 1450000,
      merchant: 'Exito',
      description: 'Grocery shopping',
      transactionDate: new Date('2024-01-20'),
    },
  ],
  rawFileName: 'statement_202401.xlsx',
};

const mockParseSuccess: StatementParseOutcome = {
  success: true,
  result: mockParsedResult,
};

const mockParseError: StatementParseOutcome = {
  success: false,
  error: 'Failed to parse',
  rawFileName: 'bad_file.xlsx',
};

jest.mock('@/core/parser/statement', () => {
  const actual = jest.requireActual('@/core/parser/statement');
  return {
    ...actual,
    createStatementParser: jest.fn(() => ({
      parse: jest.fn(),
    })),
  };
});

import { createStatementParser } from '@/core/parser/statement';

const mockCreateParser = createStatementParser as jest.MockedFunction<typeof createStatementParser>;

describe('StatementImportService', () => {
  let database: Database;
  let service: StatementImportService;
  let mockParser: { parse: jest.Mock };

  const createValidInput = (overrides: Partial<FileImportInput> = {}): FileImportInput => ({
    data: Buffer.from('test file content'),
    fileName: 'statement_202401.xlsx',
    fileType: 'xlsx',
    bankCode: 'bancolombia',
    ...overrides,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    database = createTestDatabase();
    await resetDatabase(database);
    resetStatementImportService();

    mockParser = {
      parse: jest.fn().mockResolvedValue(mockParseSuccess),
    };
    mockCreateParser.mockReturnValue(
      mockParser as unknown as ReturnType<typeof createStatementParser>
    );

    service = new StatementImportService(database);
  });

  afterEach(async () => {
    await resetDatabase(database);
  });

  describe('importStatement', () => {
    it('successfully imports a valid statement', async () => {
      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.success).toBe(true);
      expect(result.transactions.total).toBe(2);
      expect(result.transactions.imported).toBe(2);
      expect(result.transactions.duplicates).toBe(0);
      expect(result.bankCode).toBe('bancolombia');
    });

    it('creates account when importing to new account number', async () => {
      const accountCollection = database.get('accounts');
      const initialCount = await accountCollection.query().fetchCount();
      expect(initialCount).toBe(0);

      const input = createValidInput();
      await service.importStatement(input);

      const finalCount = await accountCollection.query().fetchCount();
      expect(finalCount).toBe(1);
    });

    it('reuses existing account when account number matches', async () => {
      await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: '1234567890',
        balance: 500000,
      });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.success).toBe(true);
      expect(result.account?.previousBalance).toBe(500000);
      expect(result.account?.newBalance).toBe(1500000);

      const accountCollection = database.get('accounts');
      const count = await accountCollection.query().fetchCount();
      expect(count).toBe(1);
    });

    it('creates statement import record', async () => {
      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.statementImportId).toBeDefined();

      const importCollection = database.get('statement_imports');
      const imports = await importCollection.query().fetch();
      expect(imports.length).toBe(1);
    });

    it('creates transactions linked to statement import', async () => {
      const input = createValidInput();
      const result = await service.importStatement(input);

      const transactionCollection = database.get('transactions');
      const transactions = await transactionCollection.query().fetch();

      expect(transactions.length).toBe(2);
      transactions.forEach((tx: any) => {
        expect(tx.statementImportId).toBe(result.statementImportId);
      });
    });

    it('updates account balance after import', async () => {
      const account = await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: '1234567890',
        balance: 1000000,
      });

      const input = createValidInput();
      await service.importStatement(input);

      const updatedAccount = await database.get('accounts').find(account.id);
      expect((updatedAccount as any).balance).toBe(1500000);
    });

    it('returns error for parse failure', async () => {
      mockParser.parse.mockResolvedValue(mockParseError);

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('detects previously imported file by hash', async () => {
      const input = createValidInput();
      await service.importStatement(input);

      const result = await service.importStatement(input);

      expect(result.success).toBe(false);
      expect(result.errors[0]?.message).toContain('already been imported');
    });

    it('calls progress callback during import', async () => {
      const progressCallback = jest.fn();
      const input = createValidInput();

      await service.importStatement(input, {}, progressCallback);

      expect(progressCallback).toHaveBeenCalled();
      const phases = progressCallback.mock.calls.map((call) => call[0].phase);
      expect(phases).toContain('reading');
      expect(phases).toContain('complete');
    });
  });

  describe('importStatement with skipDuplicates option', () => {
    it('skips duplicate transactions when skipDuplicates is true', async () => {
      const account = await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: '1234567890',
      });

      await createMockTransaction(database, {
        accountId: account.id,
        type: 'income',
        amount: 500000,
        transactionDate: new Date('2024-01-15'),
      });

      const input = createValidInput();
      const result = await service.importStatement(input, { skipDuplicates: true });

      expect(result.transactions.duplicates).toBe(1);
      expect(result.transactions.imported).toBe(1);
    });

    it('imports all transactions when skipDuplicates is false', async () => {
      const account = await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: '1234567890',
      });

      await createMockTransaction(database, {
        accountId: account.id,
        type: 'income',
        amount: 500000,
        transactionDate: new Date('2024-01-15'),
      });

      const input = createValidInput();
      const result = await service.importStatement(input, { skipDuplicates: false });

      expect(result.transactions.imported).toBe(2);
    });
  });

  describe('importStatement with dryRun option', () => {
    it('does not create records when dryRun is true', async () => {
      const input = createValidInput();
      const result = await service.importStatement(input, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.transactions.imported).toBe(2);

      const transactionCollection = database.get('transactions');
      const transactions = await transactionCollection.query().fetch();
      expect(transactions.length).toBe(0);

      const importCollection = database.get('statement_imports');
      const imports = await importCollection.query().fetch();
      expect(imports.length).toBe(0);

      const accountCollection = database.get('accounts');
      const accounts = await accountCollection.query().fetch();
      expect(accounts.length).toBe(0);
    });
  });

  describe('importStatement with updateAccountBalance option', () => {
    it('does not update balance when updateAccountBalance is false', async () => {
      const account = await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: '1234567890',
        balance: 1000000,
      });

      const input = createValidInput();
      await service.importStatement(input, { updateAccountBalance: false });

      const updatedAccount = await database.get('accounts').find(account.id);
      expect((updatedAccount as any).balance).toBe(1000000);
    });
  });

  describe('previewImport', () => {
    it('returns preview without creating records', async () => {
      const input = createValidInput();
      const result = await service.previewImport(input);

      expect(result.success).toBe(true);
      expect(result.transactions.imported).toBe(2);

      const transactionCollection = database.get('transactions');
      const transactions = await transactionCollection.query().fetch();
      expect(transactions.length).toBe(0);
    });
  });

  describe('checkFileAlreadyImported', () => {
    it('returns false for new file', async () => {
      const data = Buffer.from('new file content');
      const result = await service.checkFileAlreadyImported(data);
      expect(result).toBe(false);
    });

    it('returns true for previously imported file', async () => {
      const input = createValidInput();
      await service.importStatement(input);

      const result = await service.checkFileAlreadyImported(input.data);
      expect(result).toBe(true);
    });
  });

  describe('getImportHistory', () => {
    it('returns all imports when no bank code specified', async () => {
      await createMockStatementImport(database, { bankCode: 'bancolombia' });
      await createMockStatementImport(database, { bankCode: 'nequi' });

      const history = await service.getImportHistory();
      expect(history.length).toBe(2);
    });

    it('filters imports by bank code', async () => {
      await createMockStatementImport(database, { bankCode: 'bancolombia' });
      await createMockStatementImport(database, { bankCode: 'nequi' });

      const history = await service.getImportHistory('bancolombia');
      expect(history.length).toBe(1);
      expect(history[0]?.bankCode).toBe('bancolombia');
    });
  });

  describe('duplicate detection', () => {
    it('detects exact match duplicates', async () => {
      const account = await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: '1234567890',
      });

      await createMockTransaction(database, {
        accountId: account.id,
        type: 'income',
        amount: 500000,
        transactionDate: new Date('2024-01-15'),
      });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.duplicates.length).toBe(1);
      expect(result.duplicates[0]?.matchType).toBe('exact');
    });

    it('detects likely match duplicates with small time difference', async () => {
      const account = await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: '1234567890',
      });

      await createMockTransaction(database, {
        accountId: account.id,
        type: 'income',
        amount: 500000,
        transactionDate: new Date('2024-01-15T00:00:30.000Z'),
      });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.duplicates.length).toBe(1);
    });

    it('does not flag non-matching transactions as duplicates', async () => {
      const account = await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: '1234567890',
      });

      await createMockTransaction(database, {
        accountId: account.id,
        type: 'expense',
        amount: 999999,
        transactionDate: new Date('2024-02-01'),
      });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.duplicates.length).toBe(0);
      expect(result.transactions.imported).toBe(2);
    });
  });

  describe('period overlap detection', () => {
    it('detects overlapping statement periods', async () => {
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodStart: new Date('2024-01-01'),
        statementPeriodEnd: new Date('2024-01-31'),
        fileName: 'jan_statement.xlsx',
      });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.periodOverlaps.length).toBe(1);
      expect(result.periodOverlaps[0]?.fileName).toBe('jan_statement.xlsx');
      expect(result.periodOverlaps[0]?.overlapDays).toBeGreaterThan(0);
    });

    it('allows import with period overlap when allowPeriodOverlap is true', async () => {
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodStart: new Date('2024-01-01'),
        statementPeriodEnd: new Date('2024-01-31'),
      });

      const input = createValidInput();
      const result = await service.importStatement(input, { allowPeriodOverlap: true });

      expect(result.success).toBe(true);
      expect(result.transactions.imported).toBe(2);
    });

    it('blocks import with period overlap when allowPeriodOverlap is false', async () => {
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodStart: new Date('2024-01-01'),
        statementPeriodEnd: new Date('2024-01-31'),
        fileName: 'jan_statement.xlsx',
      });

      const input = createValidInput();
      const result = await service.importStatement(input, { allowPeriodOverlap: false });

      expect(result.success).toBe(false);
      expect(result.errors[0]?.message).toContain('overlaps with previously imported statements');
      expect(result.periodOverlaps.length).toBe(1);
    });

    it('returns empty period overlaps when no overlapping imports exist', async () => {
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodStart: new Date('2024-02-01'),
        statementPeriodEnd: new Date('2024-02-28'),
      });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.periodOverlaps.length).toBe(0);
    });

    it('only considers overlaps from the same bank', async () => {
      await createMockStatementImport(database, {
        bankCode: 'nequi',
        statementPeriodStart: new Date('2024-01-01'),
        statementPeriodEnd: new Date('2024-01-31'),
      });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.periodOverlaps.length).toBe(0);
    });

    it('calculates overlap days correctly for partial overlap', async () => {
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodStart: new Date('2024-01-15'),
        statementPeriodEnd: new Date('2024-02-15'),
        fileName: 'overlap_statement.xlsx',
      });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.periodOverlaps.length).toBe(1);
      const overlap = result.periodOverlaps[0];
      expect(overlap?.overlapStart).toEqual(new Date('2024-01-15'));
      expect(overlap?.overlapEnd).toEqual(new Date('2024-01-31'));
      expect(overlap?.overlapDays).toBe(17);
    });
  });

  describe('checkPeriodOverlaps', () => {
    it('returns overlapping imports for given period', async () => {
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodStart: new Date('2024-01-01'),
        statementPeriodEnd: new Date('2024-01-31'),
        fileName: 'jan.xlsx',
      });
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodStart: new Date('2024-02-01'),
        statementPeriodEnd: new Date('2024-02-28'),
        fileName: 'feb.xlsx',
      });

      const overlaps = await service.checkPeriodOverlaps(
        new Date('2024-01-15'),
        new Date('2024-02-15'),
        'bancolombia'
      );

      expect(overlaps.length).toBe(2);
    });

    it('returns empty array when no overlaps exist', async () => {
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodStart: new Date('2024-03-01'),
        statementPeriodEnd: new Date('2024-03-31'),
      });

      const overlaps = await service.checkPeriodOverlaps(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'bancolombia'
      );

      expect(overlaps.length).toBe(0);
    });

    it('filters by bank code when provided', async () => {
      await createMockStatementImport(database, {
        bankCode: 'bancolombia',
        statementPeriodStart: new Date('2024-01-01'),
        statementPeriodEnd: new Date('2024-01-31'),
      });
      await createMockStatementImport(database, {
        bankCode: 'nequi',
        statementPeriodStart: new Date('2024-01-01'),
        statementPeriodEnd: new Date('2024-01-31'),
      });

      const overlaps = await service.checkPeriodOverlaps(
        new Date('2024-01-01'),
        new Date('2024-01-31'),
        'bancolombia'
      );

      expect(overlaps.length).toBe(1);
    });
  });

  describe('duplicate detection with references', () => {
    it('detects duplicate with matching reference on same day', async () => {
      const account = await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: '1234567890',
      });

      await createMockTransaction(database, {
        accountId: account.id,
        type: 'expense',
        amount: 50000,
        transactionDate: new Date('2024-01-20T10:00:00.000Z'),
        reference: 'REF12345',
      });

      const modifiedResult = {
        ...mockParsedResult,
        transactions: [
          {
            type: 'expense' as const,
            amount: 50000,
            balanceAfter: 1450000,
            merchant: 'Exito',
            description: 'Grocery shopping',
            transactionDate: new Date('2024-01-20T14:00:00.000Z'),
            reference: 'REF12345',
          },
        ],
      };
      mockParser.parse.mockResolvedValue({ success: true, result: modifiedResult });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.duplicates.length).toBe(1);
      expect(result.transactions.imported).toBe(0);
    });

    it('does not match transactions with different references on same day', async () => {
      const account = await createMockAccount(database, {
        bankCode: 'bancolombia',
        accountNumber: '1234567890',
      });

      await createMockTransaction(database, {
        accountId: account.id,
        type: 'expense',
        amount: 50000,
        transactionDate: new Date('2024-01-20T10:00:00.000Z'),
        reference: 'REF12345',
      });

      const modifiedResult = {
        ...mockParsedResult,
        transactions: [
          {
            type: 'expense' as const,
            amount: 50000,
            balanceAfter: 1450000,
            merchant: 'Exito',
            description: 'Grocery shopping',
            transactionDate: new Date('2024-01-20T14:00:00.000Z'),
            reference: 'REF99999',
          },
        ],
      };
      mockParser.parse.mockResolvedValue({ success: true, result: modifiedResult });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.duplicates.length).toBe(0);
      expect(result.transactions.imported).toBe(1);
    });
  });

  describe('account type mapping', () => {
    it('creates account with savings type for bancolombia', async () => {
      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.success).toBe(true);
      expect(result.account).toBeDefined();

      const accountCollection = database.get('accounts');
      const accounts = await accountCollection.query().fetch();
      expect(accounts[0]).toBeDefined();
      expect((accounts[0] as any).accountType).toBe('savings');
    });

    it('creates account with checking type for checking account', async () => {
      const modifiedResult = {
        ...mockParsedResult,
        account: {
          ...mockParsedResult.account,
          accountType: 'checking',
        },
      };
      mockParser.parse.mockResolvedValue({ success: true, result: modifiedResult });

      const input = createValidInput();
      await service.importStatement(input);

      const accountCollection = database.get('accounts');
      const accounts = await accountCollection.query().fetch();
      expect(accounts[0]).toBeDefined();
      expect((accounts[0] as any).accountType).toBe('checking');
    });

    it('creates account with credit type for credit card', async () => {
      const modifiedResult = {
        ...mockParsedResult,
        account: {
          ...mockParsedResult.account,
          accountType: 'credit_card',
        },
      };
      mockParser.parse.mockResolvedValue({ success: true, result: modifiedResult });

      const input = createValidInput();
      await service.importStatement(input);

      const accountCollection = database.get('accounts');
      const accounts = await accountCollection.query().fetch();
      expect(accounts[0]).toBeDefined();
      expect((accounts[0] as any).accountType).toBe('credit');
    });

    it('creates digital wallet account type for nequi', async () => {
      const modifiedResult = {
        ...mockParsedResult,
        bank: {
          code: 'nequi',
          name: 'Nequi',
        },
        account: {
          ...mockParsedResult.account,
          accountType: 'unknown',
        },
      };
      mockParser.parse.mockResolvedValue({ success: true, result: modifiedResult });

      const input = createValidInput({ bankCode: 'nequi' });
      await service.importStatement(input);

      const accountCollection = database.get('accounts');
      const accounts = await accountCollection.query().fetch();
      expect(accounts[0]).toBeDefined();
      expect((accounts[0] as any).accountType).toBe('digital_wallet');
    });

    it('creates digital wallet account type for daviplata', async () => {
      const modifiedResult = {
        ...mockParsedResult,
        bank: {
          code: 'daviplata',
          name: 'Daviplata',
        },
        account: {
          ...mockParsedResult.account,
          accountType: 'unknown',
        },
      };
      mockParser.parse.mockResolvedValue({ success: true, result: modifiedResult });

      const input = createValidInput({ bankCode: 'daviplata' });
      await service.importStatement(input);

      const accountCollection = database.get('accounts');
      const accounts = await accountCollection.query().fetch();
      expect(accounts[0]).toBeDefined();
      expect((accounts[0] as any).accountType).toBe('digital_wallet');
    });
  });

  describe('error handling', () => {
    it('handles transaction creation failure gracefully', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const transactionRepoMock = jest.spyOn(
        service['transactionRepo'],
        'createBatch'
      );
      transactionRepoMock.mockRejectedValue(new Error('Database connection failed'));

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]?.message).toContain('Database connection failed');

      transactionRepoMock.mockRestore();
      jest.restoreAllMocks();
    });
  });

  describe('file hash computation', () => {
    it('generates consistent hash for same file content', async () => {
      const data = Buffer.from('test file content');
      const hash1 = await service.checkFileAlreadyImported(data);
      const hash2 = await service.checkFileAlreadyImported(data);

      expect(hash1).toBe(hash2);
    });

    it('generates different hash for different file content', async () => {
      const input1 = createValidInput({ fileName: 'file1.xlsx' });
      await service.importStatement(input1);

      const data2 = Buffer.from('different content');
      const isImported = await service.checkFileAlreadyImported(data2);

      expect(isImported).toBe(false);
    });

    it('generates different hash for files with different sizes', async () => {
      const input1 = createValidInput();
      await service.importStatement(input1);

      const data2 = Buffer.from('test file content with extra data');
      const isImported = await service.checkFileAlreadyImported(data2);

      expect(isImported).toBe(false);
    });
  });

  describe('singleton pattern', () => {
    it('returns same instance when calling getStatementImportService', () => {
      const instance1 = service;
      const instance2 = new StatementImportService(database);

      expect(instance1).toBeDefined();
      expect(instance2).toBeDefined();
    });

    it('resets singleton instance when calling resetStatementImportService', () => {
      resetStatementImportService();
      const newInstance = new StatementImportService(database);

      expect(newInstance).toBeDefined();
    });
  });

  describe('edge cases', () => {
    it('handles empty transaction list', async () => {
      const modifiedResult = {
        ...mockParsedResult,
        transactions: [],
      };
      mockParser.parse.mockResolvedValue({ success: true, result: modifiedResult });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.success).toBe(true);
      expect(result.transactions.total).toBe(0);
      expect(result.transactions.imported).toBe(0);
    });

    it('handles statement with only one transaction', async () => {
      const modifiedResult = {
        ...mockParsedResult,
        transactions: [mockParsedResult.transactions[0]!],
      };
      mockParser.parse.mockResolvedValue({ success: true, result: modifiedResult });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.success).toBe(true);
      expect(result.transactions.total).toBe(1);
      expect(result.transactions.imported).toBe(1);
    });

    it('handles statement with large number of transactions', async () => {
      const largeTransactionList = Array.from({ length: 100 }, (_, i) => ({
        type: 'expense' as const,
        amount: 10000 + i,
        balanceAfter: 1000000 - i * 10000,
        merchant: `Merchant ${i}`,
        description: `Transaction ${i}`,
        transactionDate: new Date(`2024-01-${(i % 28) + 1}`),
      }));

      const modifiedResult = {
        ...mockParsedResult,
        transactions: largeTransactionList,
      };
      mockParser.parse.mockResolvedValue({ success: true, result: modifiedResult });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.success).toBe(true);
      expect(result.transactions.total).toBe(100);
      expect(result.transactions.imported).toBe(100);
    });

    it('handles account with zero balance', async () => {
      const modifiedResult = {
        ...mockParsedResult,
        account: {
          ...mockParsedResult.account,
          openingBalance: 0,
          closingBalance: 0,
        },
      };
      mockParser.parse.mockResolvedValue({ success: true, result: modifiedResult });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.success).toBe(true);
      expect(result.account?.newBalance).toBe(0);
    });

    it('handles negative account balance', async () => {
      const modifiedResult = {
        ...mockParsedResult,
        account: {
          ...mockParsedResult.account,
          openingBalance: -50000,
          closingBalance: -25000,
        },
      };
      mockParser.parse.mockResolvedValue({ success: true, result: modifiedResult });

      const input = createValidInput();
      const result = await service.importStatement(input);

      expect(result.success).toBe(true);
      expect(result.account?.newBalance).toBe(-25000);
    });
  });
});
