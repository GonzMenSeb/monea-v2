import { StatementParserRegistry, statementParserRegistry } from '../StatementParserRegistry';
import { BaseStatementParser } from '../shared/BaseStatementParser';

import type {
  BankCode,
  FileReadResult,
  ParsedStatementResult,
  StatementFileType,
  StatementMetadata,
} from '../types';

class MockBancolombiaParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'bancolombia';
  readonly supportedFileTypes: StatementFileType[] = ['xlsx'];

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    const fileName = metadata.fileName.toLowerCase();
    return fileName.includes('bancolombia') || fileName.includes('statement_2024');
  }

  parseStatement(): Promise<ParsedStatementResult> {
    return Promise.resolve({} as ParsedStatementResult);
  }
}

class MockBancolombiaSavingsParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'bancolombia';
  readonly supportedFileTypes: StatementFileType[] = ['xlsx'];

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return metadata.fileName.toLowerCase().includes('cuentas de ahorro');
  }

  parseStatement(): Promise<ParsedStatementResult> {
    return Promise.resolve({} as ParsedStatementResult);
  }
}

class MockNequiParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'nequi';
  readonly supportedFileTypes: StatementFileType[] = ['pdf'];

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return metadata.fileName.toLowerCase().includes('nequi');
  }

  parseStatement(): Promise<ParsedStatementResult> {
    return Promise.resolve({} as ParsedStatementResult);
  }
}

class MockDaviviendaParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'davivienda';
  readonly supportedFileTypes: StatementFileType[] = ['pdf'];

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return metadata.fileName.toLowerCase().includes('davivienda');
  }

  parseStatement(): Promise<ParsedStatementResult> {
    return Promise.resolve({} as ParsedStatementResult);
  }
}

describe('StatementParserRegistry', () => {
  let registry: StatementParserRegistry;
  let bancolombiaParser: MockBancolombiaParser;
  let bancolombiaSavingsParser: MockBancolombiaSavingsParser;
  let nequiParser: MockNequiParser;
  let daviviendaParser: MockDaviviendaParser;

  beforeEach(() => {
    registry = new StatementParserRegistry();
    bancolombiaParser = new MockBancolombiaParser();
    bancolombiaSavingsParser = new MockBancolombiaSavingsParser();
    nequiParser = new MockNequiParser();
    daviviendaParser = new MockDaviviendaParser();
  });

  describe('register', () => {
    it('registers a single parser', () => {
      registry.register(bancolombiaParser);

      const retrieved = registry.getParser('bancolombia');
      expect(retrieved).toBe(bancolombiaParser);
    });

    it('registers multiple parsers for the same bank', () => {
      registry.register(bancolombiaParser);
      registry.register(bancolombiaSavingsParser);

      const parsers = registry.getParsersForBank('bancolombia');
      expect(parsers).toHaveLength(2);
      expect(parsers).toContain(bancolombiaParser);
      expect(parsers).toContain(bancolombiaSavingsParser);
    });

    it('registers parsers for different banks', () => {
      registry.register(bancolombiaParser);
      registry.register(nequiParser);

      expect(registry.getParser('bancolombia')).toBe(bancolombiaParser);
      expect(registry.getParser('nequi')).toBe(nequiParser);
    });
  });

  describe('registerAll', () => {
    it('registers multiple parsers at once', () => {
      registry.registerAll([bancolombiaParser, nequiParser, daviviendaParser]);

      expect(registry.getAllParsers()).toHaveLength(3);
      expect(registry.getParser('bancolombia')).toBe(bancolombiaParser);
      expect(registry.getParser('nequi')).toBe(nequiParser);
      expect(registry.getParser('davivienda')).toBe(daviviendaParser);
    });
  });

  describe('getParser', () => {
    it('returns first parser for bank when multiple exist', () => {
      registry.register(bancolombiaParser);
      registry.register(bancolombiaSavingsParser);

      const parser = registry.getParser('bancolombia');
      expect(parser).toBe(bancolombiaParser);
    });

    it('returns undefined for unregistered bank', () => {
      const parser = registry.getParser('bancolombia');
      expect(parser).toBeUndefined();
    });
  });

  describe('getParsersForBank', () => {
    it('returns all parsers for a bank', () => {
      registry.register(bancolombiaParser);
      registry.register(bancolombiaSavingsParser);

      const parsers = registry.getParsersForBank('bancolombia');
      expect(parsers).toHaveLength(2);
    });

    it('returns empty array for unregistered bank', () => {
      const parsers = registry.getParsersForBank('bancolombia');
      expect(parsers).toEqual([]);
    });
  });

  describe('getAllParsers', () => {
    it('returns all registered parsers', () => {
      registry.registerAll([bancolombiaParser, bancolombiaSavingsParser, nequiParser]);

      const allParsers = registry.getAllParsers();
      expect(allParsers).toHaveLength(3);
    });

    it('returns empty array when no parsers registered', () => {
      const allParsers = registry.getAllParsers();
      expect(allParsers).toEqual([]);
    });
  });

  describe('getBankCodes', () => {
    it('returns all registered bank codes', () => {
      registry.registerAll([bancolombiaParser, nequiParser]);

      const codes = registry.getBankCodes();
      expect(codes).toHaveLength(2);
      expect(codes).toContain('bancolombia');
      expect(codes).toContain('nequi');
    });

    it('returns empty array when no parsers registered', () => {
      const codes = registry.getBankCodes();
      expect(codes).toEqual([]);
    });
  });

  describe('findParser', () => {
    beforeEach(() => {
      registry.registerAll([bancolombiaParser, bancolombiaSavingsParser, nequiParser]);
    });

    it('finds parser by bankCode in metadata', () => {
      const metadata: StatementMetadata = {
        fileName: 'bancolombia_statement.xlsx',
        fileType: 'xlsx',
        bankCode: 'bancolombia',
      };

      const parser = registry.findParser(metadata);
      expect(parser).toBe(bancolombiaParser);
    });

    it('finds parser without bankCode via canParse', () => {
      const metadata: StatementMetadata = {
        fileName: 'bancolombia_statement.xlsx',
        fileType: 'xlsx',
      };

      const parser = registry.findParser(metadata);
      expect(parser).toBe(bancolombiaParser);
    });

    it('finds specific parser matching file pattern', () => {
      const metadata: StatementMetadata = {
        fileName: 'Cuentas de ahorro.xlsx',
        fileType: 'xlsx',
        bankCode: 'bancolombia',
      };

      const parser = registry.findParser(metadata);
      expect(parser).toBe(bancolombiaSavingsParser);
    });

    it('returns undefined when no parser matches', () => {
      const metadata: StatementMetadata = {
        fileName: 'random_file.xlsx',
        fileType: 'xlsx',
      };

      const parser = registry.findParser(metadata);
      expect(parser).toBeUndefined();
    });

    it('returns undefined when file type is not supported', () => {
      const metadata: StatementMetadata = {
        fileName: 'bancolombia.csv',
        fileType: 'csv',
        bankCode: 'bancolombia',
      };

      const parser = registry.findParser(metadata);
      expect(parser).toBeUndefined();
    });
  });

  describe('detectBank', () => {
    beforeEach(() => {
      registry.registerAll([
        bancolombiaParser,
        bancolombiaSavingsParser,
        nequiParser,
        daviviendaParser,
      ]);
    });

    it('returns high confidence when bankCode is provided in metadata', () => {
      const metadata: StatementMetadata = {
        fileName: 'bancolombia_statement.xlsx',
        fileType: 'xlsx',
        bankCode: 'bancolombia',
      };

      const result = registry.detectBank(metadata);
      expect(result).toBeDefined();
      expect(result?.bankCode).toBe('bancolombia');
      expect(result?.confidence).toBe('high');
      expect(result?.parser).toBe(bancolombiaParser);
    });

    it('detects bancolombia from file name', () => {
      const metadata: StatementMetadata = {
        fileName: 'Bancolombia_Extracto_2024.xlsx',
        fileType: 'xlsx',
      };

      const result = registry.detectBank(metadata);
      expect(result).toBeDefined();
      expect(result?.bankCode).toBe('bancolombia');
      expect(result?.confidence).toBe('high');
    });

    it('detects nequi from file name', () => {
      const metadata: StatementMetadata = {
        fileName: 'Nequi_Extracto_Enero.pdf',
        fileType: 'pdf',
      };

      const result = registry.detectBank(metadata);
      expect(result).toBeDefined();
      expect(result?.bankCode).toBe('nequi');
      expect(result?.confidence).toBe('high');
    });

    it('detects bank from file content when file name does not match', () => {
      const metadata: StatementMetadata = {
        fileName: 'statement_2024.xlsx',
        fileType: 'xlsx',
      };

      const fileContent: FileReadResult = {
        metadata: {
          fileName: 'statement_2024.xlsx',
          fileType: 'xlsx',
          fileSize: 1024,
        },
        sheets: [
          {
            name: 'Sheet1',
            rows: [
              ['Grupo Bancolombia', 'Extracto de cuenta'],
              ['Cuenta de ahorros', '1234567890'],
            ],
            rowCount: 2,
            columnCount: 2,
          },
        ],
      };

      const result = registry.detectBank(metadata, fileContent);
      expect(result).toBeDefined();
      expect(result?.bankCode).toBe('bancolombia');
      expect(result?.confidence).toBe('medium');
    });

    it('returns undefined when no bank can be detected', () => {
      const metadata: StatementMetadata = {
        fileName: 'random_file.xlsx',
        fileType: 'xlsx',
      };

      const result = registry.detectBank(metadata);
      expect(result).toBeUndefined();
    });

    it('prioritizes explicit bankCode over file name detection', () => {
      const metadata: StatementMetadata = {
        fileName: 'nequi_statement.pdf',
        fileType: 'pdf',
        bankCode: 'nequi',
      };

      const result = registry.detectBank(metadata);
      expect(result?.bankCode).toBe('nequi');
      expect(result?.confidence).toBe('high');
    });

    it('prioritizes file name detection over content detection', () => {
      const metadata: StatementMetadata = {
        fileName: 'Bancolombia_Statement.xlsx',
        fileType: 'xlsx',
      };

      const fileContent: FileReadResult = {
        metadata: {
          fileName: 'Bancolombia_Statement.xlsx',
          fileType: 'xlsx',
          fileSize: 1024,
        },
        sheets: [
          {
            name: 'Sheet1',
            rows: [['Nequi Colombia', 'Some content']],
            rowCount: 1,
            columnCount: 2,
          },
        ],
      };

      const result = registry.detectBank(metadata, fileContent);
      expect(result?.bankCode).toBe('bancolombia');
      expect(result?.confidence).toBe('high');
    });

    it('detects davivienda from file name', () => {
      const metadata: StatementMetadata = {
        fileName: 'Davivienda_cuenta_2024.pdf',
        fileType: 'pdf',
      };

      const result = registry.detectBank(metadata);
      expect(result).toBeDefined();
      expect(result?.bankCode).toBe('davivienda');
    });
  });

  describe('clear', () => {
    it('removes all registered parsers', () => {
      registry.registerAll([bancolombiaParser, nequiParser]);
      expect(registry.getAllParsers()).toHaveLength(2);

      registry.clear();
      expect(registry.getAllParsers()).toHaveLength(0);
      expect(registry.getBankCodes()).toHaveLength(0);
    });
  });

  describe('exported singleton', () => {
    it('statementParserRegistry is a StatementParserRegistry instance', () => {
      expect(statementParserRegistry).toBeInstanceOf(StatementParserRegistry);
    });
  });
});
