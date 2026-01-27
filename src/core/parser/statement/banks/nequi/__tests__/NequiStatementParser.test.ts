import * as fs from 'fs';
import * as path from 'path';

import { NequiStatementParser } from '../NequiStatementParser';

import type { StatementMetadata } from '../../../types';

const SAMPLE_DIR = path.resolve(__dirname, '../../../../../../../tmp/bank_statement_samples/nequi');

const SAMPLE_PASSWORD = '1007055144';

const loadSampleFile = (fileName: string): Buffer => {
  return fs.readFileSync(path.join(SAMPLE_DIR, fileName));
};

const hasSampleFiles = (): boolean => {
  try {
    return fs.existsSync(SAMPLE_DIR) && fs.readdirSync(SAMPLE_DIR).length > 0;
  } catch {
    return false;
  }
};

describe('NequiStatementParser', () => {
  let parser: NequiStatementParser;

  beforeEach(() => {
    parser = new NequiStatementParser();
  });

  describe('canParse', () => {
    it('returns true for nequi statement file names', () => {
      const metadata: StatementMetadata = {
        fileName: 'extracto_cuenta202410.pdf',
        fileType: 'pdf',
      };
      expect(parser.canParse(metadata)).toBe(true);
    });

    it('returns true for various month formats', () => {
      const months = ['202410', '202411', '202412', '202501', '202512'];

      months.forEach((month) => {
        const metadata: StatementMetadata = {
          fileName: `extracto_cuenta${month}.pdf`,
          fileType: 'pdf',
        };
        expect(parser.canParse(metadata)).toBe(true);
      });
    });

    it('returns false for xlsx files', () => {
      const metadata: StatementMetadata = {
        fileName: 'extracto_cuenta202410.xlsx',
        fileType: 'xlsx',
      };
      expect(parser.canParse(metadata)).toBe(false);
    });

    it('returns false for non-matching file names', () => {
      const metadata: StatementMetadata = {
        fileName: 'statement_202410.pdf',
        fileType: 'pdf',
      };
      expect(parser.canParse(metadata)).toBe(false);
    });

    it('returns false when bank code does not match', () => {
      const metadata: StatementMetadata = {
        fileName: 'extracto_cuenta202410.pdf',
        fileType: 'pdf',
        bankCode: 'bancolombia',
      };
      expect(parser.canParse(metadata)).toBe(false);
    });

    it('returns true when bank code matches', () => {
      const metadata: StatementMetadata = {
        fileName: 'extracto_cuenta202410.pdf',
        fileType: 'pdf',
        bankCode: 'nequi',
      };
      expect(parser.canParse(metadata)).toBe(true);
    });
  });

  describe('parser properties', () => {
    it('has correct bank code', () => {
      expect(parser.bankCode).toBe('nequi');
    });

    it('has correct supported file types', () => {
      expect(parser.supportedFileTypes).toEqual(['pdf']);
    });

    it('has correct bank info', () => {
      expect(parser.bank).toEqual({
        code: 'nequi',
        name: 'Nequi',
      });
    });
  });

  describe('parseStatement with real files', () => {
    const describeWithSamples = hasSampleFiles() ? describe : describe.skip;

    // NOTE: PDF parsing tests are skipped by default as they require --experimental-vm-modules
    // Run with: node --experimental-vm-modules node_modules/.bin/jest <test-file>
    describeWithSamples.skip('with sample files (requires experimental VM modules)', () => {
      it('requires password for encrypted PDFs', async () => {
        const data = loadSampleFile('extracto_cuenta202410.pdf');
        const metadata: StatementMetadata = {
          fileName: 'extracto_cuenta202410.pdf',
          fileType: 'pdf',
        };

        await expect(parser.parseStatement(data, metadata)).rejects.toThrow(/password/i);
      });

      it('parses October 2024 statement with correct password', async () => {
        const data = loadSampleFile('extracto_cuenta202410.pdf');
        const metadata: StatementMetadata = {
          fileName: 'extracto_cuenta202410.pdf',
          fileType: 'pdf',
          password: SAMPLE_PASSWORD,
        };

        // TODO: Enable this test once the parser is fully implemented
        await expect(parser.parseStatement(data, metadata)).rejects.toThrow('not implemented');
      });
    });
  });

  describe('error handling', () => {
    it('throws on empty buffer', async () => {
      const emptyData = Buffer.from([]);
      const metadata: StatementMetadata = {
        fileName: 'extracto_cuenta202410.pdf',
        fileType: 'pdf',
      };

      await expect(parser.parseStatement(emptyData, metadata)).rejects.toThrow();
    });

    it('throws when metadata is missing fileName', async () => {
      const data = Buffer.from('test');
      const metadata = {
        fileName: '',
        fileType: 'pdf',
      } as StatementMetadata;

      await expect(parser.parseStatement(data, metadata)).rejects.toThrow(
        'Statement metadata must include fileName'
      );
    });

    it('throws when metadata is missing fileType', async () => {
      const data = Buffer.from('test');
      const metadata = {
        fileName: 'extracto_cuenta202410.pdf',
        fileType: '' as unknown,
      } as StatementMetadata;

      await expect(parser.parseStatement(data, metadata)).rejects.toThrow(
        'Statement metadata must include fileType'
      );
    });
  });
});
