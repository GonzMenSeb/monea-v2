export type TransactionType = 'income' | 'expense' | 'transfer_in' | 'transfer_out';

export type BankCode =
  | 'bancolombia'
  | 'davivienda'
  | 'bbva'
  | 'nequi'
  | 'daviplata';

export interface BankInfo {
  code: BankCode;
  name: string;
  senderPatterns: RegExp[];
}

export interface ParsedTransaction {
  type: TransactionType;
  amount: number;
  balanceAfter?: number;
  merchant?: string;
  description?: string;
  reference?: string;
  transactionDate: Date;
  accountNumber?: string;
  accountType?: string;
}

export interface ParseResult {
  success: true;
  bank: BankInfo;
  transaction: ParsedTransaction;
  rawSms: string;
}

export interface ParseError {
  success: false;
  error: string;
  rawSms: string;
}

export type ParseOutcome = ParseResult | ParseError;

export interface BankParser {
  bank: BankInfo;
  canParse(sms: string, sender: string): boolean;
  parse(sms: string, sender: string): ParsedTransaction | null;
}
