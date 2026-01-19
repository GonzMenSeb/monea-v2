import { BANCOOMEVA_PATTERNS } from './patterns';
import { BaseBankParser, type TransactionPattern } from '../../shared';

import type { BankCode } from '../../types';

export class BancoomevaParser extends BaseBankParser {
  readonly bankCode: BankCode = 'bancoomeva';
  readonly patterns: TransactionPattern[] = BANCOOMEVA_PATTERNS;
}
