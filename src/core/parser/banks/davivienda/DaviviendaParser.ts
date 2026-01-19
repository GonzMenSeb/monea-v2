import { DAVIVIENDA_PATTERNS } from './patterns';
import { BaseBankParser, type TransactionPattern } from '../../shared';

import type { BankCode } from '../../types';

export class DaviviendaParser extends BaseBankParser {
  readonly bankCode: BankCode = 'davivienda';
  readonly patterns: TransactionPattern[] = DAVIVIENDA_PATTERNS;
}
