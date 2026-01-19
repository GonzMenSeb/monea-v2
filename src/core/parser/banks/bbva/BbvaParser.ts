import { BBVA_PATTERNS } from './patterns';
import { BaseBankParser, type TransactionPattern } from '../../shared';

import type { BankCode } from '../../types';

export class BbvaParser extends BaseBankParser {
  readonly bankCode: BankCode = 'bbva';
  readonly patterns: TransactionPattern[] = BBVA_PATTERNS;
}
