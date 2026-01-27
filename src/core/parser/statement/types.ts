import type { BankCode, BankInfo, TransactionType } from '../types';

export type { BankCode, BankInfo, TransactionType };

export type StatementFileType = 'pdf' | 'xlsx' | 'csv';

export type AccountType = 'savings' | 'checking' | 'credit_card';

export interface StatementMetadata {
  fileName: string;
  fileType: StatementFileType;
  bankCode?: BankCode;
  password?: string;
}

export interface StatementTransaction {
  type: TransactionType;
  amount: number;
  balanceBefore?: number;
  balanceAfter?: number;
  merchant?: string;
  description?: string;
  reference?: string;
  transactionDate: Date;
}

export interface StatementAccountInfo {
  accountNumber: string;
  accountType: AccountType;
  holderName?: string;
  periodStart: Date;
  periodEnd: Date;
  openingBalance: number;
  closingBalance: number;
}

export interface ParsedStatementResult {
  bank: BankInfo;
  account: StatementAccountInfo;
  transactions: StatementTransaction[];
  rawFileName: string;
}

export interface StatementParseSuccess {
  success: true;
  result: ParsedStatementResult;
}

export interface StatementParseError {
  success: false;
  error: string;
  rawFileName: string;
}

export type StatementParseOutcome = StatementParseSuccess | StatementParseError;

export interface StatementParser {
  readonly bankCode: BankCode;
  readonly supportedFileTypes: StatementFileType[];
  bank: BankInfo;
  canParse(metadata: StatementMetadata): boolean;
  parseStatement(data: Buffer, metadata: StatementMetadata): Promise<ParsedStatementResult>;
}
