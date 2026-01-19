import { PATTERNS, type TransactionPattern } from '../../shared';

const { ACCOUNT, AMOUNT, BALANCE, DATE, MERCHANT } = PATTERNS;

export const BBVA_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: new RegExp(
      `BBVA:\\s*(?:compra|pago)\\s+(?:por\\s+)?${AMOUNT}\\s+(?:en\\s+)?${MERCHANT}(?:\\s+Cta\\.?\\s*${ACCOUNT})?(?:\\s+${DATE})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, accountLast4: 3, date: 4, balance: 5 },
  },
  {
    type: 'expense',
    pattern: new RegExp(
      `BBVA:\\s*retiro\\s+(?:por\\s+)?${AMOUNT}(?:\\s+en\\s+${MERCHANT})?(?:\\s+Cta\\.?\\s*${ACCOUNT})?(?:\\s+${DATE})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, accountLast4: 3, date: 4, balance: 5 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `BBVA:\\s*(?:transferencia|abono|consignacion)\\s+(?:recibida?\\s+)?(?:por\\s+)?${AMOUNT}(?:\\s+de\\s+${MERCHANT})?(?:\\s+Cta\\.?\\s*${ACCOUNT})?(?:\\s+${DATE})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, accountLast4: 3, date: 4, balance: 5 },
  },
  {
    type: 'transfer_out',
    pattern: new RegExp(
      `BBVA:\\s*transferencia\\s+(?:enviada?\\s+)?(?:por\\s+)?${AMOUNT}(?:\\s+a\\s+${MERCHANT})?(?:\\s+Cta\\.?\\s*${ACCOUNT})?(?:\\s+${DATE})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, accountLast4: 3, date: 4, balance: 5 },
  },
];
