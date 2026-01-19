import { PATTERNS, type TransactionPattern } from '../../shared';

const {
  ACCOUNT,
  AMOUNT,
  BALANCE,
  CURRENCY_AMOUNT,
  DATE,
  DEST_ACCOUNT,
  FLEXIBLE_DATE,
  MERCHANT,
  TIME,
} = PATTERNS;

export const BANCOLOMBIA_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: new RegExp(
      `Bancolombia\\s+le\\s+informa\\s+(?:compra|pago)\\s+por\\s+${AMOUNT}\\s+en\\s+${MERCHANT}(?:\\s+${DATE})?(?:\\s+${TIME})?(?:\\.?\\s*T\\.?\\s*${ACCOUNT})?(?:\\s*\\.?\\s*(?:Saldo|Disp|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, time: 4, accountLast4: 5, balance: 6 },
  },
  {
    type: 'expense',
    pattern: new RegExp(
      `Bancolombia\\s+le\\s+informa\\s+retiro\\s+por\\s+${AMOUNT}\\s+en\\s+${MERCHANT}(?:\\s+${DATE})?(?:\\s+${TIME})?(?:\\.?\\s*Cta\\.?\\s*${ACCOUNT})?(?:\\s*\\.?\\s*(?:Saldo|Disp|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, time: 4, accountLast4: 5, balance: 6 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `Bancolombia\\s+le\\s+informa\\s+(?:transferencia|recepcion|consignacion)\\s+(?:recibida\\s+)?por\\s+${AMOUNT}(?:\\s+de\\s+${MERCHANT})?(?:\\s+${DATE})?(?:\\s+${TIME})?(?:\\.?\\s*(?:Cta|Cuenta)\\.?\\s*${ACCOUNT})?(?:\\s*\\.?\\s*(?:Saldo|Disp|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, time: 4, accountLast4: 5, balance: 6 },
  },
  {
    type: 'transfer_out',
    pattern: new RegExp(
      `Bancolombia\\s+le\\s+informa\\s+transferencia\\s+(?:enviada\\s+)?por\\s+${AMOUNT}(?:\\s+a\\s+${MERCHANT})?(?:\\s+${DATE})?(?:\\s+${TIME})?(?:\\.?\\s*(?:Cta|Cuenta)\\.?\\s*${ACCOUNT})?(?:\\s*\\.?\\s*(?:Saldo|Disp|Disponible):?\\s*${BALANCE})?`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, date: 3, time: 4, accountLast4: 5, balance: 6 },
  },
  {
    type: 'expense',
    pattern: new RegExp(
      `Bancolombia:\\s*Compraste\\s+${CURRENCY_AMOUNT}\\s+en\\s+(.+?)\\s+con\\s+tu\\s+T\\.Cred\\s*\\*(\\d{4}),?\\s*el\\s+${FLEXIBLE_DATE}\\s+a\\s+las\\s+${TIME}`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, accountLast4: 3, date: 4, time: 5 },
  },
  {
    type: 'transfer_out',
    pattern: new RegExp(
      `Bancolombia:\\s*Transferiste\\s+${AMOUNT}(?:\\s+por\\s+QR)?\\s+desde\\s+tu\\s+cuenta\\s*\\*?(\\d{4})\\s+a\\s+la\\s+cuenta\\s*\\*?${DEST_ACCOUNT}\\s*,?\\s*el\\s+${FLEXIBLE_DATE}(?:\\s+a\\s+las)?\\s+${TIME}`,
      'i'
    ),
    groups: { amount: 1, accountLast4: 2, merchant: 3, date: 4, time: 5 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `Bancolombia:\\s*Recibiste\\s+${AMOUNT}\\s+por\\s+QR\\s+de\\s+(.+?)\\s+en\\s+tu\\s+cuenta\\s*\\*(\\d{4})\\s+el\\s+${FLEXIBLE_DATE}\\s+a\\s+las\\s+${TIME}`,
      'i'
    ),
    groups: { amount: 1, merchant: 2, accountLast4: 3, date: 4, time: 5 },
  },
  {
    type: 'income',
    pattern: new RegExp(
      `Bancolombia:\\s*Recibiste\\s+un\\s+pago\\s+de\\s+Nomina\\s+de\\s+(.+?)\\s+por\\s+${AMOUNT}\\s+en\\s+tu\\s+cuenta\\s+de\\s+Ahorros\\s+el\\s+${FLEXIBLE_DATE}\\s+a\\s+las\\s+${TIME}`,
      'i'
    ),
    groups: { merchant: 1, amount: 2, date: 3, time: 4 },
  },
];
