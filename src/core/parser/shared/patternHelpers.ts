import type { BankCode, BankInfo, TransactionType } from '../types';

export interface TransactionPattern {
  type: TransactionType;
  pattern: RegExp;
  groups: {
    amount: number;
    balance?: number;
    merchant?: number;
    reference?: number;
    accountLast4?: number;
    date?: number;
    time?: number;
  };
}

export const PATTERNS = {
  AMOUNT: '\\$?([\\d.,]+(?:\\.\\d{2})?)',
  BALANCE: '\\$?([\\d.,]+(?:\\.\\d{2})?)',
  ACCOUNT: '\\**(\\d{4})',
  DATE: '(\\d{2}/\\d{2}/\\d{4})',
  TIME: '(\\d{2}:\\d{2})',
  FLEXIBLE_TIME: '(\\d{1,2}:\\d{2}(?::\\d{2})?)',
  MERCHANT: '([A-Za-z0-9][A-Za-z0-9\\s]*[A-Za-z0-9]|[A-Za-z0-9])',
  REFERENCE: '(?:Ref\\.?|Referencia:?)\\s*([A-Za-z0-9]+)',
  CURRENCY_AMOUNT: '(?:COP|USD)?\\s*([\\d.,]+)',
  FLEXIBLE_DATE: '(\\d{2}/\\d{2}/\\d{4}|\\d{4}/\\d{2}/\\d{2})',
  DEST_ACCOUNT: '([A-Za-z0-9\\s]+?)',
} as const;

export const BANK_INFO: Record<BankCode, BankInfo> = {
  bancolombia: {
    code: 'bancolombia',
    name: 'Bancolombia',
  },
  davivienda: {
    code: 'davivienda',
    name: 'Davivienda',
  },
  bbva: {
    code: 'bbva',
    name: 'BBVA',
  },
  nequi: {
    code: 'nequi',
    name: 'Nequi',
  },
  daviplata: {
    code: 'daviplata',
    name: 'Daviplata',
  },
  bancoomeva: {
    code: 'bancoomeva',
    name: 'Bancoomeva',
  },
};
