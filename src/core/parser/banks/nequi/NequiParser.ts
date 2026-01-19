import { NEQUI_PATTERNS } from './patterns';
import { BaseBankParser, type TransactionPattern } from '../../shared';

import type { BankCode } from '../../types';

export class NequiParser extends BaseBankParser {
  readonly bankCode: BankCode = 'nequi';
  readonly patterns: TransactionPattern[] = NEQUI_PATTERNS;
}
