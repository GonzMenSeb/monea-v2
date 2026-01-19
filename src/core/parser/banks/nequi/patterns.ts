import { PATTERNS, type TransactionPattern } from '../../shared';

const { AMOUNT, BALANCE, MERCHANT } = PATTERNS;

export const NEQUI_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: new RegExp(
      `(?:Nequi|\\*Nequi\\*):\\s*(?:Pagaste|Compraste)\\s+${AMOUNT}\\s+(?:en\\s+)?${MERCHANT}(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
  {
    type: 'expense',
    pattern: new RegExp(
      `(?:Nequi|\\*Nequi\\*):\\s*(?:Retiraste|Sacaste)\\s+${AMOUNT}(?:\\s+en\\s+${MERCHANT})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `(?:Nequi|\\*Nequi\\*):\\s*(?:Recibiste|Te\\s+(?:enviaron|transfirieron))\\s+${AMOUNT}(?:\\s+de\\s+${MERCHANT})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
  {
    type: 'transfer_out',
    pattern: new RegExp(
      `(?:Nequi|\\*Nequi\\*):\\s*(?:Enviaste|Transferiste)\\s+${AMOUNT}(?:\\s+a\\s+${MERCHANT})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
];
