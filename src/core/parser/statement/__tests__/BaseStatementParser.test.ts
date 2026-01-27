import { BaseStatementParser } from '../shared/BaseStatementParser';

import type {
  BankCode,
  ParsedStatementResult,
  StatementFileType,
  StatementMetadata,
} from '../types';

class TestStatementParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'bancolombia';
  readonly supportedFileTypes: StatementFileType[] = ['xlsx', 'pdf'];

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return metadata.fileName.toLowerCase().includes('extracto');
  }

  async parseStatement(_data: Buffer, metadata: StatementMetadata): Promise<ParsedStatementResult> {
    return {
      bank: this.bank,
      account: {
        accountNumber: '1234',
        accountType: 'savings',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        openingBalance: 1000000,
        closingBalance: 1500000,
      },
      transactions: [],
      rawFileName: metadata.fileName,
    };
  }
}

describe('BaseStatementParser', () => {
  let parser: TestStatementParser;

  beforeEach(() => {
    parser = new TestStatementParser();
  });

  describe('bank property', () => {
    it('returns correct bank info based on bankCode', () => {
      expect(parser.bank).toEqual({
        code: 'bancolombia',
        name: 'Bancolombia',
      });
    });
  });

  describe('canParse', () => {
    it('returns true for supported file type and matching pattern', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202401.xlsx',
        fileType: 'xlsx',
      };

      expect(parser.canParse(metadata)).toBe(true);
    });

    it('returns false for unsupported file type', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202401.csv',
        fileType: 'csv',
      };

      expect(parser.canParse(metadata)).toBe(false);
    });

    it('returns false when bankCode does not match', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202401.xlsx',
        fileType: 'xlsx',
        bankCode: 'nequi',
      };

      expect(parser.canParse(metadata)).toBe(false);
    });

    it('returns true when bankCode matches', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202401.xlsx',
        fileType: 'xlsx',
        bankCode: 'bancolombia',
      };

      expect(parser.canParse(metadata)).toBe(true);
    });

    it('returns false when file pattern does not match', () => {
      const metadata: StatementMetadata = {
        fileName: 'Statement_202401.xlsx',
        fileType: 'xlsx',
      };

      expect(parser.canParse(metadata)).toBe(false);
    });
  });

  describe('inferFileType', () => {
    it('returns pdf for .pdf files', () => {
      expect(parser['inferFileType']('statement.pdf')).toBe('pdf');
    });

    it('returns xlsx for .xlsx files', () => {
      expect(parser['inferFileType']('statement.xlsx')).toBe('xlsx');
    });

    it('returns xlsx for .xls files', () => {
      expect(parser['inferFileType']('statement.xls')).toBe('xlsx');
    });

    it('returns csv for .csv files', () => {
      expect(parser['inferFileType']('statement.csv')).toBe('csv');
    });

    it('returns null for unsupported extensions', () => {
      expect(parser['inferFileType']('statement.txt')).toBe(null);
    });

    it('handles uppercase extensions', () => {
      expect(parser['inferFileType']('statement.PDF')).toBe('pdf');
    });
  });

  describe('validateMetadata', () => {
    it('throws error when fileName is missing', () => {
      const metadata = { fileType: 'xlsx' } as StatementMetadata;

      expect(() => parser['validateMetadata'](metadata)).toThrow(
        'Statement metadata must include fileName'
      );
    });

    it('throws error when fileType is missing', () => {
      const metadata = { fileName: 'test.xlsx' } as StatementMetadata;

      expect(() => parser['validateMetadata'](metadata)).toThrow(
        'Statement metadata must include fileType'
      );
    });

    it('does not throw when metadata is valid', () => {
      const metadata: StatementMetadata = {
        fileName: 'test.xlsx',
        fileType: 'xlsx',
      };

      expect(() => parser['validateMetadata'](metadata)).not.toThrow();
    });
  });

  describe('parseStatement', () => {
    it('returns ParsedStatementResult with correct structure', async () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202401.xlsx',
        fileType: 'xlsx',
      };
      const data = Buffer.from('test');

      const result = await parser.parseStatement(data, metadata);

      expect(result).toMatchObject({
        bank: { code: 'bancolombia', name: 'Bancolombia' },
        account: {
          accountNumber: '1234',
          accountType: 'savings',
        },
        transactions: [],
        rawFileName: 'Extracto_202401.xlsx',
      });
    });
  });
});
