import { BaseStatementParser } from '../shared/BaseStatementParser';
import { StatementParser, createStatementParser, defaultStatementParser } from '../StatementParser';
import { StatementParserRegistry } from '../StatementParserRegistry';
import { PdfPasswordRequiredError } from '../readers/PdfFileReader';

import type {
  BankCode,
  FileReadResult,
  ParsedStatementResult,
  StatementAccountInfo,
  StatementFileType,
  StatementMetadata,
} from '../types';

jest.mock('../readers/XlsxFileReader');
jest.mock('../readers/PdfFileReader');

class MockBancolombiaParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'bancolombia';
  readonly supportedFileTypes: StatementFileType[] = ['xlsx'];

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return metadata.fileName.toLowerCase().includes('bancolombia');
  }

  async parseStatement(_data: Buffer, metadata: StatementMetadata): Promise<ParsedStatementResult> {
    return {
      bank: this.bank,
      account: this.createMockAccount(),
      transactions: [
        {
          type: 'expense',
          amount: 50000,
          balanceAfter: 950000,
          description: 'Test transaction',
          transactionDate: new Date('2024-01-15'),
        },
      ],
      rawFileName: metadata.fileName,
    };
  }

  private createMockAccount(): StatementAccountInfo {
    return {
      accountNumber: '1234567890',
      accountType: 'savings',
      periodStart: new Date('2024-01-01'),
      periodEnd: new Date('2024-01-31'),
      openingBalance: 1000000,
      closingBalance: 950000,
    };
  }
}

class MockNequiParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'nequi';
  readonly supportedFileTypes: StatementFileType[] = ['pdf'];

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return metadata.fileName.toLowerCase().includes('nequi');
  }

  async parseStatement(_data: Buffer, metadata: StatementMetadata): Promise<ParsedStatementResult> {
    return {
      bank: this.bank,
      account: {
        accountNumber: '3001234567',
        accountType: 'savings',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        openingBalance: 500000,
        closingBalance: 600000,
      },
      transactions: [],
      rawFileName: metadata.fileName,
    };
  }
}

describe('StatementParser', () => {
  let registry: StatementParserRegistry;
  let parser: StatementParser;
  let mockXlsxRead: jest.Mock;
  let mockPdfRead: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    registry = new StatementParserRegistry();
    registry.register(new MockBancolombiaParser());
    registry.register(new MockNequiParser());

    parser = new StatementParser({ registry });

    const { XlsxFileReader } = jest.requireMock('../readers/XlsxFileReader');
    const { PdfFileReader } = jest.requireMock('../readers/PdfFileReader');

    mockXlsxRead = jest.fn().mockResolvedValue(createMockFileReadResult('xlsx'));
    mockPdfRead = jest.fn().mockResolvedValue(createMockFileReadResult('pdf'));

    XlsxFileReader.mockImplementation(() => ({
      supportedTypes: ['xlsx'],
      canRead: (type: StatementFileType) => type === 'xlsx',
      read: mockXlsxRead,
    }));

    PdfFileReader.mockImplementation(() => ({
      supportedTypes: ['pdf'],
      canRead: (type: StatementFileType) => type === 'pdf',
      read: mockPdfRead,
    }));

    parser = new StatementParser({ registry });
  });

  function createMockFileReadResult(fileType: StatementFileType): FileReadResult {
    return {
      metadata: {
        fileName: 'test.xlsx',
        fileType,
        fileSize: 1024,
      },
      sheets: [
        {
          name: 'Sheet1',
          rows: [['Header1', 'Header2']],
          rowCount: 1,
          columnCount: 2,
        },
      ],
    };
  }

  describe('parse', () => {
    it('successfully parses xlsx file with matching parser', async () => {
      const data = Buffer.from('mock xlsx data');
      const metadata: StatementMetadata = {
        fileName: 'Bancolombia_Statement_202401.xlsx',
        fileType: 'xlsx',
      };

      const result = await parser.parse(data, metadata);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.bank.code).toBe('bancolombia');
        expect(result.result.transactions).toHaveLength(1);
        expect(result.result.account.accountNumber).toBe('1234567890');
      }
    });

    it('successfully parses pdf file with matching parser', async () => {
      const data = Buffer.from('mock pdf data');
      const metadata: StatementMetadata = {
        fileName: 'Nequi_Extracto_202401.pdf',
        fileType: 'pdf',
      };

      const result = await parser.parse(data, metadata);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.result.bank.code).toBe('nequi');
        expect(result.result.account.accountNumber).toBe('3001234567');
      }
    });

    it('returns error when no parser matches', async () => {
      const data = Buffer.from('mock data');
      const metadata: StatementMetadata = {
        fileName: 'Unknown_Bank_Statement.xlsx',
        fileType: 'xlsx',
      };

      const result = await parser.parse(data, metadata);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('No parser found');
        expect(result.rawFileName).toBe('Unknown_Bank_Statement.xlsx');
      }
    });

    it('returns error when file data is empty', async () => {
      const data = Buffer.from('');
      const metadata: StatementMetadata = {
        fileName: 'Bancolombia_Statement.xlsx',
        fileType: 'xlsx',
      };

      const result = await parser.parse(data, metadata);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('File data is empty');
      }
    });

    it('returns error when fileName is missing', async () => {
      const data = Buffer.from('mock data');
      const metadata = { fileType: 'xlsx' } as StatementMetadata;

      const result = await parser.parse(data, metadata);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('File name is required');
      }
    });

    it('returns error when fileType is missing', async () => {
      const data = Buffer.from('mock data');
      const metadata = { fileName: 'test.xlsx' } as StatementMetadata;

      const result = await parser.parse(data, metadata);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('File type is required');
      }
    });

    it('returns error for unsupported file type', async () => {
      const data = Buffer.from('mock data');
      const metadata: StatementMetadata = {
        fileName: 'statement.csv',
        fileType: 'csv',
      };

      const result = await parser.parse(data, metadata);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unsupported file type');
      }
    });

    it('handles PDF password required error', async () => {
      mockPdfRead.mockRejectedValue(new PdfPasswordRequiredError());

      const data = Buffer.from('encrypted pdf data');
      const metadata: StatementMetadata = {
        fileName: 'Nequi_Extracto.pdf',
        fileType: 'pdf',
      };

      const result = await parser.parse(data, metadata);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('PDF requires password');
      }
    });

    it('handles generic errors during parsing', async () => {
      mockXlsxRead.mockRejectedValue(new Error('Corrupted file'));

      const data = Buffer.from('corrupted data');
      const metadata: StatementMetadata = {
        fileName: 'Bancolombia_Statement.xlsx',
        fileType: 'xlsx',
      };

      const result = await parser.parse(data, metadata);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Corrupted file');
      }
    });

    it('handles non-Error thrown values', async () => {
      mockXlsxRead.mockRejectedValue('string error');

      const data = Buffer.from('data');
      const metadata: StatementMetadata = {
        fileName: 'Bancolombia_Statement.xlsx',
        fileType: 'xlsx',
      };

      const result = await parser.parse(data, metadata);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unknown error occurred during parsing');
      }
    });

    it('passes password to file reader for PDF', async () => {
      const data = Buffer.from('encrypted pdf');
      const metadata: StatementMetadata = {
        fileName: 'Nequi_Extracto.pdf',
        fileType: 'pdf',
        password: 'secret123',
      };

      await parser.parse(data, metadata);

      expect(mockPdfRead).toHaveBeenCalledWith(data, 'Nequi_Extracto.pdf', 'secret123');
    });
  });

  describe('parseMultiple', () => {
    it('parses multiple files in parallel', async () => {
      const files = [
        {
          data: Buffer.from('bancolombia data'),
          metadata: {
            fileName: 'Bancolombia_Statement.xlsx',
            fileType: 'xlsx' as const,
          },
        },
        {
          data: Buffer.from('nequi data'),
          metadata: {
            fileName: 'Nequi_Extracto.pdf',
            fileType: 'pdf' as const,
          },
        },
      ];

      const results = await parser.parseMultiple(files);

      expect(results).toHaveLength(2);
      expect(results[0]!.success).toBe(true);
      expect(results[1]!.success).toBe(true);
    });

    it('returns individual errors for files that fail', async () => {
      const files = [
        {
          data: Buffer.from('bancolombia data'),
          metadata: {
            fileName: 'Bancolombia_Statement.xlsx',
            fileType: 'xlsx' as const,
          },
        },
        {
          data: Buffer.from('unknown data'),
          metadata: {
            fileName: 'Unknown_Bank.xlsx',
            fileType: 'xlsx' as const,
          },
        },
      ];

      const results = await parser.parseMultiple(files);

      expect(results).toHaveLength(2);
      expect(results[0]!.success).toBe(true);
      expect(results[1]!.success).toBe(false);
    });
  });

  describe('canParse', () => {
    it('returns true for supported file', () => {
      const metadata: StatementMetadata = {
        fileName: 'Bancolombia_Statement.xlsx',
        fileType: 'xlsx',
      };

      expect(parser.canParse(metadata)).toBe(true);
    });

    it('returns false for unsupported file', () => {
      const metadata: StatementMetadata = {
        fileName: 'Unknown_Bank.xlsx',
        fileType: 'xlsx',
      };

      expect(parser.canParse(metadata)).toBe(false);
    });
  });

  describe('detectBank', () => {
    it('detects bank from file name', () => {
      const metadata: StatementMetadata = {
        fileName: 'Bancolombia_Extracto.xlsx',
        fileType: 'xlsx',
      };

      const result = parser.detectBank(metadata);

      expect(result).toBeDefined();
      expect(result?.bankCode).toBe('bancolombia');
    });

    it('detects bank from file content when parser matches', () => {
      const metadata: StatementMetadata = {
        fileName: 'bancolombia_generic.xlsx',
        fileType: 'xlsx',
      };

      const fileContent: FileReadResult = {
        metadata: {
          fileName: 'bancolombia_generic.xlsx',
          fileType: 'xlsx',
          fileSize: 1024,
        },
        sheets: [
          {
            name: 'Sheet1',
            rows: [['Grupo Bancolombia', 'Statement']],
            rowCount: 1,
            columnCount: 2,
          },
        ],
      };

      const result = parser.detectBank(metadata, fileContent);

      expect(result).toBeDefined();
      expect(result?.bankCode).toBe('bancolombia');
    });

    it('returns undefined when bank cannot be detected', () => {
      const metadata: StatementMetadata = {
        fileName: 'random_file.xlsx',
        fileType: 'xlsx',
      };

      const result = parser.detectBank(metadata);

      expect(result).toBeUndefined();
    });
  });

  describe('readFileContent', () => {
    it('reads xlsx file content', async () => {
      const data = Buffer.from('xlsx data');
      const metadata: StatementMetadata = {
        fileName: 'statement.xlsx',
        fileType: 'xlsx',
      };

      const result = await parser.readFileContent(data, metadata);

      expect(result.metadata.fileType).toBe('xlsx');
      expect(mockXlsxRead).toHaveBeenCalledWith(data, 'statement.xlsx', undefined);
    });

    it('reads pdf file content', async () => {
      const data = Buffer.from('pdf data');
      const metadata: StatementMetadata = {
        fileName: 'statement.pdf',
        fileType: 'pdf',
      };

      const result = await parser.readFileContent(data, metadata);

      expect(result.metadata.fileType).toBe('pdf');
      expect(mockPdfRead).toHaveBeenCalledWith(data, 'statement.pdf', undefined);
    });
  });

  describe('getReader', () => {
    it('returns xlsx reader for xlsx type', () => {
      const reader = parser.getReader('xlsx');
      expect(reader).toBeDefined();
    });

    it('returns pdf reader for pdf type', () => {
      const reader = parser.getReader('pdf');
      expect(reader).toBeDefined();
    });

    it('returns undefined for unsupported type', () => {
      const reader = parser.getReader('csv');
      expect(reader).toBeUndefined();
    });
  });

  describe('getSupportedFileTypes', () => {
    it('returns supported file types', () => {
      const types = parser.getSupportedFileTypes();

      expect(types).toContain('xlsx');
      expect(types).toContain('pdf');
    });
  });
});

describe('createStatementParser', () => {
  it('creates a new StatementParser instance', () => {
    const parser = createStatementParser();
    expect(parser).toBeInstanceOf(StatementParser);
  });

  it('creates parser with custom registry', () => {
    const registry = new StatementParserRegistry();
    const parser = createStatementParser({ registry });

    expect(parser).toBeInstanceOf(StatementParser);
  });
});

describe('defaultStatementParser', () => {
  it('is a StatementParser instance', () => {
    expect(defaultStatementParser).toBeInstanceOf(StatementParser);
  });
});
