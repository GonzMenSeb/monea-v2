import { BANK_INFO } from '../../shared/patternHelpers';

import type {
  BankCode,
  BankInfo,
  ParsedStatementResult,
  StatementFileType,
  StatementMetadata,
  StatementParser,
} from '../types';

export abstract class BaseStatementParser implements StatementParser {
  abstract readonly bankCode: BankCode;
  abstract readonly supportedFileTypes: StatementFileType[];

  get bank(): BankInfo {
    return BANK_INFO[this.bankCode];
  }

  canParse(metadata: StatementMetadata): boolean {
    if (!this.supportedFileTypes.includes(metadata.fileType)) {
      return false;
    }

    if (metadata.bankCode && metadata.bankCode !== this.bankCode) {
      return false;
    }

    return this.matchesFilePattern(metadata);
  }

  abstract parseStatement(
    data: Buffer,
    metadata: StatementMetadata
  ): Promise<ParsedStatementResult>;

  protected abstract matchesFilePattern(metadata: StatementMetadata): boolean;

  protected validateMetadata(metadata: StatementMetadata): void {
    if (!metadata.fileName) {
      throw new Error('Statement metadata must include fileName');
    }

    if (!metadata.fileType) {
      throw new Error('Statement metadata must include fileType');
    }
  }

  protected inferFileType(fileName: string): StatementFileType | null {
    const extension = fileName.toLowerCase().split('.').pop();

    switch (extension) {
      case 'pdf':
        return 'pdf';
      case 'xlsx':
      case 'xls':
        return 'xlsx';
      case 'csv':
        return 'csv';
      default:
        return null;
    }
  }
}
