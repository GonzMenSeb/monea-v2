import type { ParsedStatementResult, StatementTransaction } from '@/core/parser/statement';
import type { BankCode } from '@/infrastructure/database/models/Account';

export interface ImportProgress {
  phase:
    | 'reading'
    | 'parsing'
    | 'detecting_duplicates'
    | 'importing'
    | 'updating_balances'
    | 'complete';
  currentStep: number;
  totalSteps: number;
  message: string;
  fileName: string;
}

export interface DuplicateInfo {
  transaction: StatementTransaction;
  matchedTransactionId: string;
  matchType: 'exact' | 'likely';
}

export interface ImportResult {
  success: boolean;
  statementImportId?: string;
  transactions: {
    total: number;
    imported: number;
    skipped: number;
    duplicates: number;
  };
  account: {
    id: string;
    accountNumber: string;
    previousBalance?: number;
    newBalance: number;
  } | null;
  bankCode: BankCode;
  periodStart: Date;
  periodEnd: Date;
  errors: ImportError[];
  duplicates: DuplicateInfo[];
  periodOverlaps: PeriodOverlapInfo[];
}

export interface ImportError {
  message: string;
  transactionIndex?: number;
  transactionDate?: Date;
  amount?: number;
}

export interface PeriodOverlapInfo {
  importId: string;
  fileName: string;
  periodStart: Date;
  periodEnd: Date;
  overlapStart: Date;
  overlapEnd: Date;
  overlapDays: number;
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  updateAccountBalance?: boolean;
  dryRun?: boolean;
  allowPeriodOverlap?: boolean;
}

export interface DeduplicationResult {
  duplicates: DuplicateInfo[];
  uniqueTransactions: StatementTransaction[];
  periodOverlaps: PeriodOverlapInfo[];
}

export interface AccountMatchResult {
  account: {
    id: string;
    accountNumber: string;
    balance: number;
  } | null;
  created: boolean;
}

export type ProgressCallback = (progress: ImportProgress) => void;

export interface FileImportInput {
  data: Buffer;
  fileName: string;
  fileType: 'pdf' | 'xlsx';
  password?: string;
  bankCode?: BankCode;
}

export interface ParsedImportData {
  result: ParsedStatementResult;
  fileHash: string;
}

export type { ParsedStatementResult, StatementTransaction };
