import { BaseStatementParser } from '../../shared';

import type {
  BankCode,
  ParsedStatementResult,
  StatementFileType,
  StatementMetadata,
} from '../../types';

const SAVINGS_FILE_PATTERN = /Cuentas_de\s*ahorro/i;

export class BancolombiaSavingsParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'bancolombia';
  readonly supportedFileTypes: StatementFileType[] = ['xlsx'];

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return SAVINGS_FILE_PATTERN.test(metadata.fileName);
  }

  parseStatement(_data: Buffer, _metadata: StatementMetadata): Promise<ParsedStatementResult> {
    return Promise.reject(new Error('BancolombiaSavingsParser.parseStatement not yet implemented'));
  }
}
