import { PATTERNS, type TransactionPattern } from '../../shared';

const { AMOUNT, BALANCE, MERCHANT } = PATTERNS;

export const DAVIPLATA_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: new RegExp(
      `DaviPlata:\\s*(?:Pago|Compra)\\s+(?:por\\s+)?${AMOUNT}\\s+(?:en\\s+)?${MERCHANT}(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
  {
    type: 'expense',
    pattern: new RegExp(
      `DaviPlata:\\s*Retiro\\s+(?:por\\s+)?${AMOUNT}(?:\\s+en\\s+${MERCHANT})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `DaviPlata:\\s*(?:Recibiste|Te\\s+enviaron)\\s+${AMOUNT}(?:\\s+de\\s+${MERCHANT})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
  {
    type: 'transfer_out',
    pattern: new RegExp(
      `DaviPlata:\\s*(?:Enviaste|Transferiste)\\s+${AMOUNT}(?:\\s+a\\s+${MERCHANT})?(?:\\s*\\.?\\s*(?:Saldo|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, balance: 3 },
  },
];
