import { PATTERNS, type TransactionPattern } from '../../shared';

const { AMOUNT, FLEXIBLE_DATE, FLEXIBLE_TIME } = PATTERNS;

export const BANCOOMEVA_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: new RegExp(
      `Bancoomeva\\s+informa\\s+compra\\s+por\\s+Internet\\s+en\\s+(.+?)\\s+por\\s+${AMOUNT}\\s+con\\s+su\\s+tarjeta\\s+Credito\\s+(\\d{4})\\s+el\\s+${FLEXIBLE_DATE}\\s+${FLEXIBLE_TIME}`,
      'i'
    ),
    groups: { merchant: 1, amount: 2, accountLast4: 3, date: 4, time: 5 },
  },
];
