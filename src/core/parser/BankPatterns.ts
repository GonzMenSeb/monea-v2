import { parseAmount } from './AmountExtractor';

import type { BankCode, BankInfo, TransactionType } from './types';

export { parseAmount };

export const BANK_INFO: Record<BankCode, BankInfo> = {
  bancolombia: {
    code: 'bancolombia',
    name: 'Bancolombia',
    senderPatterns: [/^bancolombia$/i, /^891333$/, /^85954$/],
  },
  davivienda: {
    code: 'davivienda',
    name: 'Davivienda',
    senderPatterns: [/^davivienda$/i, /^85327$/],
  },
  bbva: {
    code: 'bbva',
    name: 'BBVA',
    senderPatterns: [/^bbva$/i, /^87703$/],
  },
  nequi: {
    code: 'nequi',
    name: 'Nequi',
    senderPatterns: [/^nequi$/i, /^85432$/],
  },
  daviplata: {
    code: 'daviplata',
    name: 'Daviplata',
    senderPatterns: [/^daviplata$/i, /^85255$/],
  },
};

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

const AMOUNT_PATTERN = '\\$?([\\d.,]+(?:\\.\\d{2})?)';
const BALANCE_PATTERN = '\\$?([\\d.,]+(?:\\.\\d{2})?)';
const ACCOUNT_PATTERN = '\\**(\\d{4})';
const DATE_PATTERN = '(\\d{2}/\\d{2}/\\d{4})';
const TIME_PATTERN = '(\\d{2}:\\d{2})';
const MERCHANT_PATTERN = '([A-Za-z0-9][A-Za-z0-9\\s]*[A-Za-z0-9]|[A-Za-z0-9])';
const _REFERENCE_PATTERN = '(?:Ref\\.?|Referencia:?)\\s*([A-Za-z0-9]+)';

export const BANCOLOMBIA_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: new RegExp(
      `Bancolombia\\s+le\\s+informa\\s+(?:compra|pago)\\s+por\\s+${AMOUNT_PATTERN}\\s+en\\s+${MERCHANT_PATTERN}(?:\\s+${DATE_PATTERN})?(?:\\s+${TIME_PATTERN})?(?:\\.?\\s*T\\.?\\s*${ACCOUNT_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disp|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, time: 4, accountLast4: 5, balance: 6 },
  },
  {
    type: 'expense',
    pattern: new RegExp(
      `Bancolombia\\s+le\\s+informa\\s+retiro\\s+por\\s+${AMOUNT_PATTERN}\\s+en\\s+${MERCHANT_PATTERN}(?:\\s+${DATE_PATTERN})?(?:\\s+${TIME_PATTERN})?(?:\\.?\\s*Cta\\.?\\s*${ACCOUNT_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disp|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, time: 4, accountLast4: 5, balance: 6 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `Bancolombia\\s+le\\s+informa\\s+(?:transferencia|recepcion|consignacion)\\s+(?:recibida\\s+)?por\\s+${AMOUNT_PATTERN}(?:\\s+de\\s+${MERCHANT_PATTERN})?(?:\\s+${DATE_PATTERN})?(?:\\s+${TIME_PATTERN})?(?:\\.?\\s*(?:Cta|Cuenta)\\.?\\s*${ACCOUNT_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disp|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, time: 4, accountLast4: 5, balance: 6 },
  },
  {
    type: 'transfer_out',
    pattern: new RegExp(
      `Bancolombia\\s+le\\s+informa\\s+transferencia\\s+(?:enviada\\s+)?por\\s+${AMOUNT_PATTERN}(?:\\s+a\\s+${MERCHANT_PATTERN})?(?:\\s+${DATE_PATTERN})?(?:\\s+${TIME_PATTERN})?(?:\\.?\\s*(?:Cta|Cuenta)\\.?\\s*${ACCOUNT_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disp|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, time: 4, accountLast4: 5, balance: 6 },
  },
];

export const DAVIVIENDA_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: new RegExp(
      `Davivienda:\\s*(?:compra|pago)\\s+(?:por\\s+)?${AMOUNT_PATTERN}\\s+(?:en\\s+)?${MERCHANT_PATTERN}(?:\\s+${DATE_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, balance: 4 },
  },
  {
    type: 'expense',
    pattern: new RegExp(
      `Davivienda:\\s*retiro\\s+(?:por\\s+)?${AMOUNT_PATTERN}(?:\\s+en\\s+${MERCHANT_PATTERN})?(?:\\s+${DATE_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, balance: 4 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `Davivienda:\\s*(?:transferencia|abono|consignacion)\\s+(?:recibida?\\s+)?(?:por\\s+)?${AMOUNT_PATTERN}(?:\\s+de\\s+${MERCHANT_PATTERN})?(?:\\s+${DATE_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, balance: 4 },
  },
  {
    type: 'transfer_out',
    pattern: new RegExp(
      `Davivienda:\\s*transferencia\\s+(?:enviada?\\s+)?(?:por\\s+)?${AMOUNT_PATTERN}(?:\\s+a\\s+${MERCHANT_PATTERN})?(?:\\s+${DATE_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, balance: 4 },
  },
];

export const BBVA_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: new RegExp(
      `BBVA:\\s*(?:compra|pago)\\s+(?:por\\s+)?${AMOUNT_PATTERN}\\s+(?:en\\s+)?${MERCHANT_PATTERN}(?:\\s+Cta\\.?\\s*${ACCOUNT_PATTERN})?(?:\\s+${DATE_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, accountLast4: 3, date: 4, balance: 5 },
  },
  {
    type: 'expense',
    pattern: new RegExp(
      `BBVA:\\s*retiro\\s+(?:por\\s+)?${AMOUNT_PATTERN}(?:\\s+en\\s+${MERCHANT_PATTERN})?(?:\\s+Cta\\.?\\s*${ACCOUNT_PATTERN})?(?:\\s+${DATE_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, accountLast4: 3, date: 4, balance: 5 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `BBVA:\\s*(?:transferencia|abono|consignacion)\\s+(?:recibida?\\s+)?(?:por\\s+)?${AMOUNT_PATTERN}(?:\\s+de\\s+${MERCHANT_PATTERN})?(?:\\s+Cta\\.?\\s*${ACCOUNT_PATTERN})?(?:\\s+${DATE_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, accountLast4: 3, date: 4, balance: 5 },
  },
  {
    type: 'transfer_out',
    pattern: new RegExp(
      `BBVA:\\s*transferencia\\s+(?:enviada?\\s+)?(?:por\\s+)?${AMOUNT_PATTERN}(?:\\s+a\\s+${MERCHANT_PATTERN})?(?:\\s+Cta\\.?\\s*${ACCOUNT_PATTERN})?(?:\\s+${DATE_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, accountLast4: 3, date: 4, balance: 5 },
  },
];

export const NEQUI_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: new RegExp(
      `(?:Nequi|\\*Nequi\\*):\\s*(?:Pagaste|Compraste)\\s+${AMOUNT_PATTERN}\\s+(?:en\\s+)?${MERCHANT_PATTERN}(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
  {
    type: 'expense',
    pattern: new RegExp(
      `(?:Nequi|\\*Nequi\\*):\\s*(?:Retiraste|Sacaste)\\s+${AMOUNT_PATTERN}(?:\\s+en\\s+${MERCHANT_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `(?:Nequi|\\*Nequi\\*):\\s*(?:Recibiste|Te\\s+(?:enviaron|transfirieron))\\s+${AMOUNT_PATTERN}(?:\\s+de\\s+${MERCHANT_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
  {
    type: 'transfer_out',
    pattern: new RegExp(
      `(?:Nequi|\\*Nequi\\*):\\s*(?:Enviaste|Transferiste)\\s+${AMOUNT_PATTERN}(?:\\s+a\\s+${MERCHANT_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
];

export const DAVIPLATA_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: new RegExp(
      `DaviPlata:\\s*(?:Pago|Compra)\\s+(?:por\\s+)?${AMOUNT_PATTERN}\\s+(?:en\\s+)?${MERCHANT_PATTERN}(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
  {
    type: 'expense',
    pattern: new RegExp(
      `DaviPlata:\\s*Retiro\\s+(?:por\\s+)?${AMOUNT_PATTERN}(?:\\s+en\\s+${MERCHANT_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `DaviPlata:\\s*(?:Recibiste|Te\\s+enviaron)\\s+${AMOUNT_PATTERN}(?:\\s+de\\s+${MERCHANT_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
  {
    type: 'transfer_out',
    pattern: new RegExp(
      `DaviPlata:\\s*(?:Enviaste|Transferiste)\\s+${AMOUNT_PATTERN}(?:\\s+a\\s+${MERCHANT_PATTERN})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE_PATTERN})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
];

export const BANK_PATTERNS: Record<BankCode, TransactionPattern[]> = {
  bancolombia: BANCOLOMBIA_PATTERNS,
  davivienda: DAVIVIENDA_PATTERNS,
  bbva: BBVA_PATTERNS,
  nequi: NEQUI_PATTERNS,
  daviplata: DAVIPLATA_PATTERNS,
};

export function parseDate(dateStr: string | undefined, timeStr?: string): Date {
  if (!dateStr) {
    return new Date();
  }

  const parts = dateStr.split('/').map(Number);
  const day = parts[0] ?? 1;
  const month = parts[1] ?? 1;
  const year = parts[2] ?? new Date().getFullYear();
  const date = new Date(year, month - 1, day);

  if (timeStr) {
    const timeParts = timeStr.split(':').map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    date.setHours(hours, minutes);
  }

  return date;
}

export function matchesSender(sender: string, bank: BankInfo): boolean {
  return bank.senderPatterns.some((pattern) => pattern.test(sender));
}

export function getBankBySender(sender: string): BankInfo | null {
  const banks = Object.values(BANK_INFO);
  return banks.find((bank) => matchesSender(sender, bank)) ?? null;
}
