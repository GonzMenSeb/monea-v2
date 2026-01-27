import { BaseStatementParser } from '../../shared';

import type {
  BankCode,
  ParsedStatementResult,
  StatementFileType,
  StatementMetadata,
} from '../../types';

const CARD_FILE_PATTERN = /(Mastercard|Amex)_Detallado/i;

export class BancolombiaCardParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'bancolombia';
  readonly supportedFileTypes: StatementFileType[] = ['xlsx'];

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return CARD_FILE_PATTERN.test(metadata.fileName);
  }

  parseStatement(_data: Buffer, _metadata: StatementMetadata): Promise<ParsedStatementResult> {
    return Promise.reject(new Error('BancolombiaCardParser.parseStatement not yet implemented'));
  }
}
