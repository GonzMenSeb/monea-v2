import { parseAmount } from './AmountExtractor';
import { parseDate } from './DateExtractor';

import type { BankCode, BankInfo, TransactionType } from './types';

export { parseAmount, parseDate };

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
const FLEXIBLE_TIME_PATTERN = '(\\d{1,2}:\\d{2}(?::\\d{2})?)';
const MERCHANT_PATTERN = '([A-Za-z0-9][A-Za-z0-9\\s]*[A-Za-z0-9]|[A-Za-z0-9])';
const _REFERENCE_PATTERN = '(?:Ref\\.?|Referencia:?)\\s*([A-Za-z0-9]+)';

const CURRENCY_AMOUNT_PATTERN = '(?:COP|USD)?\\s*([\\d.,]+)';
const FLEXIBLE_DATE_PATTERN = '(\\d{2}/\\d{2}/\\d{4}|\\d{4}/\\d{2}/\\d{2})';
const DEST_ACCOUNT_PATTERN = '([A-Za-z0-9\\s]+?)';

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
  {
    type: 'expense',
    pattern: new RegExp(
      `Bancolombia:\\s*Compraste\\s+${CURRENCY_AMOUNT_PATTERN}\\s+en\\s+(.+?)\\s+con\\s+tu\\s+T\\.Cred\\s*\\*(\\d{4}),?\\s*el\\s+${FLEXIBLE_DATE_PATTERN}\\s+a\\s+las\\s+${TIME_PATTERN}`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, accountLast4: 3, date: 4, time: 5 },
  },
  {
    type: 'transfer_out',
    pattern: new RegExp(
      `Bancolombia:\\s*Transferiste\\s+${AMOUNT_PATTERN}(?:\\s+por\\s+QR)?\\s+desde\\s+tu\\s+cuenta\\s*\\*?(\\d{4})\\s+a\\s+la\\s+cuenta\\s*\\*?${DEST_ACCOUNT_PATTERN}\\s*,?\\s*el\\s+${FLEXIBLE_DATE_PATTERN}(?:\\s+a\\s+las)?\\s+${TIME_PATTERN}`,
      'i'
    ),
    groups: { amount: 1, accountLast4: 2, merchant: 3, date: 4, time: 5 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `Bancolombia:\\s*Recibiste\\s+${AMOUNT_PATTERN}\\s+por\\s+QR\\s+de\\s+(.+?)\\s+en\\s+tu\\s+cuenta\\s*\\*(\\d{4})\\s+el\\s+${FLEXIBLE_DATE_PATTERN}\\s+a\\s+las\\s+${TIME_PATTERN}`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, accountLast4: 3, date: 4, time: 5 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `Bancolombia:\\s*Recibiste\\s+un\\s+pago\\s+de\\s+Nomina\\s+de\\s+(.+?)\\s+por\\s+${AMOUNT_PATTERN}\\s+en\\s+tu\\s+cuenta\\s+de\\s+Ahorros\\s+el\\s+${FLEXIBLE_DATE_PATTERN}\\s+a\\s+las\\s+${TIME_PATTERN}`,
      'i'
    ),
    groups: { merchant: 1, amount: 2, date: 3, time: 4 },
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

export const BANCOOMEVA_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: new RegExp(
      `Bancoomeva\\s+informa\\s+compra\\s+por\\s+Internet\\s+en\\s+(.+?)\\s+por\\s+${AMOUNT_PATTERN}\\s+con\\s+su\\s+tarjeta\\s+Credito\\s+(\\d{4})\\s+el\\s+${FLEXIBLE_DATE_PATTERN}\\s+${FLEXIBLE_TIME_PATTERN}`,
      'i'
    ),
    groups: { merchant: 1, amount: 2, accountLast4: 3, date: 4, time: 5 },
  },
];

export const BANK_PATTERNS: Record<BankCode, TransactionPattern[]> = {
  bancolombia: BANCOLOMBIA_PATTERNS,
  davivienda: DAVIVIENDA_PATTERNS,
  bbva: BBVA_PATTERNS,
  nequi: NEQUI_PATTERNS,
  daviplata: DAVIPLATA_PATTERNS,
  bancoomeva: BANCOOMEVA_PATTERNS,
};

export function detectBankFromContent(smsBody: string): BankInfo | null {
  for (const [bankCode, patterns] of Object.entries(BANK_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.pattern.test(smsBody)) {
        return BANK_INFO[bankCode as BankCode];
      }
    }
  }
  return null;
}
