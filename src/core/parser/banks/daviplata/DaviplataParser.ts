import { DAVIPLATA_PATTERNS } from './patterns';
import { BaseBankParser, type TransactionPattern } from '../../shared';

import type { BankCode } from '../../types';

export class DaviplataParser extends BaseBankParser {
  readonly bankCode: BankCode = 'daviplata';
  readonly patterns: TransactionPattern[] = DAVIPLATA_PATTERNS;
}
