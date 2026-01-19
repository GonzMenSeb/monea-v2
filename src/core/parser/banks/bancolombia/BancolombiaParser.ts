import { BANCOLOMBIA_PATTERNS } from './patterns';
import { BaseBankParser, type TransactionPattern } from '../../shared';

import type { BankCode } from '../../types';

export class BancolombiaParser extends BaseBankParser {
  readonly bankCode: BankCode = 'bancolombia';
  readonly patterns: TransactionPattern[] = BANCOLOMBIA_PATTERNS;
}
