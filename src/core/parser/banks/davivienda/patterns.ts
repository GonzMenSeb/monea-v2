import { PATTERNS, type TransactionPattern } from '../../shared';

const { AMOUNT, BALANCE, DATE, MERCHANT } = PATTERNS;

export const DAVIVIENDA_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: new RegExp(
      `Davivienda:\\s*(?:compra|pago)\\s+(?:por\\s+)?${AMOUNT}\\s+(?:en\\s+)?${MERCHANT}(?:\\s+${DATE})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, balance: 4 },
  },
  {
    type: 'expense',
    pattern: new RegExp(
      `Davivienda:\\s*retiro\\s+(?:por\\s+)?${AMOUNT}(?:\\s+en\\s+${MERCHANT})?(?:\\s+${DATE})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, balance: 4 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `Davivienda:\\s*(?:transferencia|abono|consignacion)\\s+(?:recibida?\\s+)?(?:por\\s+)?${AMOUNT}(?:\\s+de\\s+${MERCHANT})?(?:\\s+${DATE})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, balance: 4 },
  },
  {
    type: 'transfer_out',
    pattern: new RegExp(
      `Davivienda:\\s*transferencia\\s+(?:enviada?\\s+)?(?:por\\s+)?${AMOUNT}(?:\\s+a\\s+${MERCHANT})?(?:\\s+${DATE})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, balance: 4 },
  },
];
