import { BANK_INFO } from '@/core/parser';
import { createStatementParser } from '@/core/parser/statement';
import { AccountRepository } from '@/infrastructure/database/repositories/AccountRepository';
import { StatementImportRepository } from '@/infrastructure/database/repositories/StatementImportRepository';
import {
  TransactionRepository,
  type CreateTransactionData,
} from '@/infrastructure/database/repositories/TransactionRepository';

import type {
  ImportResult,
  ImportOptions,
  ImportProgress,
  ImportError,
  DuplicateInfo,
  DeduplicationResult,
  AccountMatchResult,
  ProgressCallback,
  FileImportInput,
  ParsedImportData,
  PeriodOverlapInfo,
} from '../types';
import type {
  StatementMetadata,
  StatementTransaction,
  StatementFileType,
  StatementParser,
} from '@/core/parser/statement';
import type { BankCode, AccountType } from '@/infrastructure/database/models/Account';
import type StatementImport from '@/infrastructure/database/models/StatementImport';
import type Transaction from '@/infrastructure/database/models/Transaction';
import type { Database } from '@nozbe/watermelondb';

const DEFAULT_OPTIONS: Required<ImportOptions> = {
  skipDuplicates: true,
  updateAccountBalance: true,
  dryRun: false,
  allowPeriodOverlap: true,
};

const DUPLICATE_TIME_TOLERANCE_MS = 60 * 1000; // 1 minute
const DUPLICATE_AMOUNT_TOLERANCE = 0.01;

function inferAccountType(bankCode: BankCode): AccountType {
  if (bankCode === 'nequi' || bankCode === 'daviplata') {
    return 'digital_wallet';
  }
  return 'savings';
}

function computeFileHash(data: Buffer): string {
  let hash = 5381;
  for (let i = 0; i < data.length; i++) {
    const byte = data[i] ?? 0;
    hash = ((hash << 5) + hash) ^ byte;
    hash = hash >>> 0;
  }

  const sizeComponent = data.length.toString(16).padStart(8, '0');
  const hashComponent = hash.toString(16).padStart(8, '0');
  const checksum = data.slice(0, Math.min(16, data.length)).reduce((a, b) => (a + b) >>> 0, 0);
  const checksumComponent = checksum.toString(16).padStart(8, '0');

  return `${sizeComponent}${hashComponent}${checksumComponent}`;
}

function createEmptyResult(
  bankCode: BankCode,
  periodStart: Date,
  periodEnd: Date,
  errors: ImportError[] = [],
  periodOverlaps: PeriodOverlapInfo[] = []
): ImportResult {
  return {
    success: errors.length === 0,
    transactions: { total: 0, imported: 0, skipped: 0, duplicates: 0 },
    account: null,
    bankCode,
    periodStart,
    periodEnd,
    errors,
    duplicates: [],
    periodOverlaps,
  };
}

function calculateOverlapDays(start1: Date, end1: Date, start2: Date, end2: Date): number {
  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

  if (overlapStart > overlapEnd) {
    return 0;
  }

  return Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function getOverlapRange(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date
): { start: Date; end: Date } | null {
  const overlapStart = new Date(Math.max(start1.getTime(), start2.getTime()));
  const overlapEnd = new Date(Math.min(end1.getTime(), end2.getTime()));

  if (overlapStart > overlapEnd) {
    return null;
  }

  return { start: overlapStart, end: overlapEnd };
}

export class StatementImportService {
  private readonly statementParser: StatementParser;
  private readonly accountRepo: AccountRepository;
  private readonly transactionRepo: TransactionRepository;
  private readonly statementImportRepo: StatementImportRepository;

  constructor(private readonly database: Database) {
    this.statementParser = createStatementParser();
    this.accountRepo = new AccountRepository(database);
    this.transactionRepo = new TransactionRepository(database);
    this.statementImportRepo = new StatementImportRepository(database);
  }

  async importStatement(
    input: FileImportInput,
    options: ImportOptions = {},
    onProgress?: ProgressCallback
  ): Promise<ImportResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const errors: ImportError[] = [];

    const notify = (progress: Omit<ImportProgress, 'fileName'>): void => {
      onProgress?.({ ...progress, fileName: input.fileName });
    };

    notify({
      phase: 'reading',
      currentStep: 1,
      totalSteps: 5,
      message: 'Reading file...',
    });

    const parseResult = await this.parseFile(input);
    if (!parseResult) {
      return createEmptyResult(input.bankCode ?? 'bancolombia', new Date(), new Date(), [
        { message: 'Failed to parse statement file' },
      ]);
    }

    const { result: parsed, fileHash } = parseResult;

    const existingImport = await this.statementImportRepo.findByFileHash(fileHash);
    if (existingImport) {
      return createEmptyResult(
        parsed.bank.code,
        parsed.account.periodStart,
        parsed.account.periodEnd,
        [{ message: 'This statement has already been imported' }]
      );
    }

    notify({
      phase: 'detecting_duplicates',
      currentStep: 2,
      totalSteps: 5,
      message: 'Checking for duplicate transactions...',
    });

    const accountMatch = await this.findOrCreateAccount(
      parsed.bank.code,
      parsed.account.accountNumber,
      parsed.account.accountType,
      opts.dryRun
    );

    if (!accountMatch.account) {
      return createEmptyResult(
        parsed.bank.code,
        parsed.account.periodStart,
        parsed.account.periodEnd,
        [{ message: 'Failed to find or create account' }]
      );
    }

    const deduplication = await this.detectDuplicates(
      parsed.transactions,
      accountMatch.account.id,
      parsed.account.periodStart,
      parsed.account.periodEnd,
      parsed.bank.code
    );

    if (!opts.allowPeriodOverlap && deduplication.periodOverlaps.length > 0) {
      const overlappingFiles = deduplication.periodOverlaps.map((o) => o.fileName).join(', ');
      return createEmptyResult(
        parsed.bank.code,
        parsed.account.periodStart,
        parsed.account.periodEnd,
        [
          {
            message: `Statement period overlaps with previously imported statements: ${overlappingFiles}`,
          },
        ],
        deduplication.periodOverlaps
      );
    }

    const transactionsToImport = opts.skipDuplicates
      ? deduplication.uniqueTransactions
      : parsed.transactions;

    notify({
      phase: 'importing',
      currentStep: 3,
      totalSteps: 5,
      message: `Importing ${transactionsToImport.length} transactions...`,
    });

    let importedCount = 0;
    let statementImportId: string | undefined;

    if (!opts.dryRun && transactionsToImport.length > 0) {
      const statementImport = await this.statementImportRepo.create({
        fileName: input.fileName,
        fileHash,
        bankCode: parsed.bank.code,
        statementPeriodStart: parsed.account.periodStart,
        statementPeriodEnd: parsed.account.periodEnd,
        transactionsImported: transactionsToImport.length,
      });
      statementImportId = statementImport.id;

      const accountId = accountMatch.account.id;
      const importId = statementImportId;
      const transactionDataList = transactionsToImport.map((tx) =>
        this.buildTransactionData(tx, accountId, importId)
      );

      try {
        const createdTransactions = await this.transactionRepo.createBatch(transactionDataList);
        importedCount = createdTransactions.length;
      } catch (err) {
        errors.push({
          message: err instanceof Error ? err.message : 'Failed to create transactions',
        });
      }
    } else if (opts.dryRun) {
      importedCount = transactionsToImport.length;
    }

    notify({
      phase: 'updating_balances',
      currentStep: 4,
      totalSteps: 5,
      message: 'Updating account balance...',
    });

    let previousBalance: number | undefined;
    const newBalance = parsed.account.closingBalance;

    if (!opts.dryRun && opts.updateAccountBalance && accountMatch.account) {
      previousBalance = accountMatch.account.balance;
      await this.accountRepo.updateBalance(accountMatch.account.id, newBalance);
      await this.accountRepo.updateLastSynced(accountMatch.account.id);
    }

    notify({
      phase: 'complete',
      currentStep: 5,
      totalSteps: 5,
      message: 'Import complete',
    });

    return {
      success: errors.length === 0,
      statementImportId,
      transactions: {
        total: parsed.transactions.length,
        imported: importedCount,
        skipped:
          parsed.transactions.length -
          transactionsToImport.length -
          deduplication.duplicates.length,
        duplicates: deduplication.duplicates.length,
      },
      account: accountMatch.account
        ? {
            id: accountMatch.account.id,
            accountNumber: accountMatch.account.accountNumber,
            previousBalance,
            newBalance,
          }
        : null,
      bankCode: parsed.bank.code,
      periodStart: parsed.account.periodStart,
      periodEnd: parsed.account.periodEnd,
      errors,
      duplicates: deduplication.duplicates,
      periodOverlaps: deduplication.periodOverlaps,
    };
  }

  async previewImport(input: FileImportInput): Promise<ImportResult> {
    return this.importStatement(input, { dryRun: true });
  }

  async checkFileAlreadyImported(data: Buffer): Promise<boolean> {
    const fileHash = computeFileHash(data);
    return this.statementImportRepo.existsByFileHash(fileHash);
  }

  async getImportHistory(bankCode?: BankCode): Promise<StatementImport[]> {
    if (bankCode) {
      return this.statementImportRepo.findByBankCode(bankCode);
    }
    return this.statementImportRepo.findAll();
  }

  async checkPeriodOverlaps(
    periodStart: Date,
    periodEnd: Date,
    bankCode?: BankCode
  ): Promise<PeriodOverlapInfo[]> {
    return this.detectPeriodOverlaps(periodStart, periodEnd, bankCode);
  }

  private async parseFile(input: FileImportInput): Promise<ParsedImportData | null> {
    const metadata: StatementMetadata = {
      fileName: input.fileName,
      fileType: input.fileType as StatementFileType,
      bankCode: input.bankCode,
      password: input.password,
    };

    const outcome = await this.statementParser.parse(input.data, metadata);

    if (!outcome.success) {
      return null;
    }

    const fileHash = computeFileHash(input.data);

    return {
      result: outcome.result,
      fileHash,
    };
  }

  private async findOrCreateAccount(
    bankCode: BankCode,
    accountNumber: string,
    accountType: string,
    dryRun: boolean
  ): Promise<AccountMatchResult> {
    const existingAccount = await this.accountRepo.findByAccountNumber(accountNumber);

    if (existingAccount) {
      return {
        account: {
          id: existingAccount.id,
          accountNumber: existingAccount.accountNumber,
          balance: existingAccount.balance,
        },
        created: false,
      };
    }

    if (dryRun) {
      return {
        account: {
          id: 'dry-run-account-id',
          accountNumber,
          balance: 0,
        },
        created: true,
      };
    }

    const bankInfo = BANK_INFO[bankCode];
    const mappedAccountType = this.mapAccountType(accountType, bankCode);

    const newAccount = await this.accountRepo.create({
      bankCode,
      bankName: bankInfo.name,
      accountNumber,
      accountType: mappedAccountType,
      balance: 0,
      isActive: true,
    });

    return {
      account: {
        id: newAccount.id,
        accountNumber: newAccount.accountNumber,
        balance: newAccount.balance,
      },
      created: true,
    };
  }

  private mapAccountType(statementType: string, bankCode: BankCode): AccountType {
    switch (statementType) {
      case 'savings':
        return 'savings';
      case 'checking':
        return 'checking';
      case 'credit_card':
        return 'credit';
      default:
        return inferAccountType(bankCode);
    }
  }

  private async detectDuplicates(
    transactions: StatementTransaction[],
    accountId: string,
    periodStart: Date,
    periodEnd: Date,
    bankCode?: BankCode
  ): Promise<DeduplicationResult> {
    const searchStart = new Date(periodStart.getTime() - 24 * 60 * 60 * 1000);
    const searchEnd = new Date(periodEnd.getTime() + 24 * 60 * 60 * 1000);

    const existingTransactions = await this.transactionRepo.findByFilters({
      accountId,
      startDate: searchStart,
      endDate: searchEnd,
    });

    const periodOverlaps = await this.detectPeriodOverlaps(periodStart, periodEnd, bankCode);

    const duplicates: DuplicateInfo[] = [];
    const uniqueTransactions: StatementTransaction[] = [];

    for (const tx of transactions) {
      const duplicate = this.findMatchingTransaction(tx, existingTransactions);

      if (duplicate) {
        duplicates.push({
          transaction: tx,
          matchedTransactionId: duplicate.id,
          matchType: this.isExactMatch(tx, duplicate) ? 'exact' : 'likely',
        });
      } else {
        uniqueTransactions.push(tx);
      }
    }

    return { duplicates, uniqueTransactions, periodOverlaps };
  }

  private async detectPeriodOverlaps(
    periodStart: Date,
    periodEnd: Date,
    bankCode?: BankCode
  ): Promise<PeriodOverlapInfo[]> {
    const overlappingImports = await this.statementImportRepo.findByPeriod(periodStart, periodEnd);

    const filteredImports = bankCode
      ? overlappingImports.filter((imp) => imp.bankCode === bankCode)
      : overlappingImports;

    return filteredImports.map((imp) => {
      const overlap = getOverlapRange(
        periodStart,
        periodEnd,
        imp.statementPeriodStart,
        imp.statementPeriodEnd
      )!;

      return {
        importId: imp.id,
        fileName: imp.fileName,
        periodStart: imp.statementPeriodStart,
        periodEnd: imp.statementPeriodEnd,
        overlapStart: overlap.start,
        overlapEnd: overlap.end,
        overlapDays: calculateOverlapDays(
          periodStart,
          periodEnd,
          imp.statementPeriodStart,
          imp.statementPeriodEnd
        ),
      };
    });
  }

  private findMatchingTransaction(
    statementTx: StatementTransaction,
    existingTransactions: Transaction[]
  ): Transaction | undefined {
    return existingTransactions.find((existing) => {
      const amountMatches =
        Math.abs(existing.amount - statementTx.amount) <= DUPLICATE_AMOUNT_TOLERANCE;

      const dateMatches =
        Math.abs(existing.transactionDate.getTime() - statementTx.transactionDate.getTime()) <=
        DUPLICATE_TIME_TOLERANCE_MS;

      const typeMatches = existing.type === statementTx.type;

      if (!amountMatches || !typeMatches) {
        return false;
      }

      if (dateMatches) {
        return true;
      }

      const sameDay =
        existing.transactionDate.toDateString() === statementTx.transactionDate.toDateString();

      if (sameDay && statementTx.reference && existing.reference === statementTx.reference) {
        return true;
      }

      return false;
    });
  }

  private isExactMatch(statementTx: StatementTransaction, existing: Transaction): boolean {
    const amountExact = existing.amount === statementTx.amount;
    const dateExact = existing.transactionDate.getTime() === statementTx.transactionDate.getTime();
    const typeExact = existing.type === statementTx.type;

    return amountExact && dateExact && typeExact;
  }

  private buildTransactionData(
    tx: StatementTransaction,
    accountId: string,
    statementImportId: string
  ): CreateTransactionData {
    return {
      accountId,
      type: tx.type,
      amount: tx.amount,
      transactionDate: tx.transactionDate,
      balanceAfter: tx.balanceAfter,
      merchant: tx.merchant,
      description: tx.description,
      reference: tx.reference,
      statementImportId,
    };
  }
}

let statementImportServiceInstance: StatementImportService | null = null;

export function getStatementImportService(database: Database): StatementImportService {
  if (!statementImportServiceInstance) {
    statementImportServiceInstance = new StatementImportService(database);
  }
  return statementImportServiceInstance;
}

export function resetStatementImportService(): void {
  statementImportServiceInstance = null;
}
