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
});
