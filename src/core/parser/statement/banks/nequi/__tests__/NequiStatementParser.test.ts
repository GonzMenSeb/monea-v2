import * as fs from 'fs';
import * as path from 'path';

import { NequiStatementParser } from '../NequiStatementParser';

import type { StatementMetadata, FileReadResult } from '../../../types';

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

const createMockFileReadResult = (overrides: Partial<FileReadResult> = {}): FileReadResult => ({
  metadata: {
    fileName: 'extracto_cuenta202510.pdf',
    fileType: 'pdf',
    fileSize: 1000,
    sheetCount: 1,
    sheetNames: ['Page 1'],
  },
  sheets: [
    {
      name: 'Page 1',
      rows: [
        ['Extracto de cuenta de ahorro de:'],
        ['SEBASTIAN MENDOZA GONZALEZ'],
        ['Número de cuenta de ahorro: 3052269855'],
        ['Estado de cuenta para el período de: 2025/10/01 a 2025/10/31'],
        ['Fecha del movimiento', 'Descripción', 'Valor', 'Saldo'],
        ['01/10/2025', 'Para BEATRIZ ELENA GAVIRIA', '$-3,600.00', '$351,188.42'],
        ['02/10/2025', 'RECARGA DESDE', '$30,000.00', '$381,188.42'],
        ['02/10/2025', 'PAGO EN COPI BLOCK', '$-4,200.00', '$376,988.42'],
        ['Saldo anterior', '$354,788.42'],
        ['Total abonos', '$30,000.00'],
        ['Total cargos', '$7,800.00'],
        ['Saldo actual', '$376,988.42'],
      ],
      rowCount: 12,
      columnCount: 4,
    },
  ],
  ...overrides,
});

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

  describe('parseStatement with mocked PDF reader', () => {
    let mockRead: jest.SpyInstance;

    beforeEach(() => {
      const pdfReader = (
        parser as unknown as { pdfReader: { read: () => Promise<FileReadResult> } }
      ).pdfReader;
      mockRead = jest.spyOn(pdfReader, 'read').mockResolvedValue(createMockFileReadResult());
    });

    afterEach(() => {
      mockRead.mockRestore();
    });

    it('extracts account holder name', async () => {
      const result = await parser.parseStatement(Buffer.from('test'), {
        fileName: 'extracto_cuenta202510.pdf',
        fileType: 'pdf',
        password: SAMPLE_PASSWORD,
      });

      expect(result.account.holderName).toBe('SEBASTIAN MENDOZA GONZALEZ');
    });

    it('extracts account number', async () => {
      const result = await parser.parseStatement(Buffer.from('test'), {
        fileName: 'extracto_cuenta202510.pdf',
        fileType: 'pdf',
        password: SAMPLE_PASSWORD,
      });

      expect(result.account.accountNumber).toBe('3052269855');
    });

    it('extracts statement period', async () => {
      const result = await parser.parseStatement(Buffer.from('test'), {
        fileName: 'extracto_cuenta202510.pdf',
        fileType: 'pdf',
        password: SAMPLE_PASSWORD,
      });

      expect(result.account.periodStart).toEqual(new Date(2025, 9, 1));
      expect(result.account.periodEnd).toEqual(new Date(2025, 9, 31));
    });

    it('extracts opening and closing balances', async () => {
      const result = await parser.parseStatement(Buffer.from('test'), {
        fileName: 'extracto_cuenta202510.pdf',
        fileType: 'pdf',
        password: SAMPLE_PASSWORD,
      });

      expect(result.account.openingBalance).toBe(354788.42);
      expect(result.account.closingBalance).toBe(376988.42);
    });

    it('extracts transactions correctly', async () => {
      const result = await parser.parseStatement(Buffer.from('test'), {
        fileName: 'extracto_cuenta202510.pdf',
        fileType: 'pdf',
        password: SAMPLE_PASSWORD,
      });

      expect(result.transactions).toHaveLength(3);

      const firstTx = result.transactions[0]!;
      expect(firstTx.transactionDate).toEqual(new Date(2025, 9, 1));
      expect(firstTx.amount).toBe(3600);
      expect(firstTx.type).toBe('transfer_out');
      expect(firstTx.description).toBe('Para BEATRIZ ELENA GAVIRIA');
    });

    it('sets account type to savings', async () => {
      const result = await parser.parseStatement(Buffer.from('test'), {
        fileName: 'extracto_cuenta202510.pdf',
        fileType: 'pdf',
        password: SAMPLE_PASSWORD,
      });

      expect(result.account.accountType).toBe('savings');
    });

    it('returns correct bank info', async () => {
      const result = await parser.parseStatement(Buffer.from('test'), {
        fileName: 'extracto_cuenta202510.pdf',
        fileType: 'pdf',
        password: SAMPLE_PASSWORD,
      });

      expect(result.bank.code).toBe('nequi');
      expect(result.bank.name).toBe('Nequi');
    });

    it('categorizes income transactions correctly', async () => {
      const result = await parser.parseStatement(Buffer.from('test'), {
        fileName: 'extracto_cuenta202510.pdf',
        fileType: 'pdf',
        password: SAMPLE_PASSWORD,
      });

      const incomeTx = result.transactions.find((t) => t.description === 'RECARGA DESDE');
      expect(incomeTx?.type).toBe('transfer_in');
    });

    it('categorizes expense transactions correctly', async () => {
      const result = await parser.parseStatement(Buffer.from('test'), {
        fileName: 'extracto_cuenta202510.pdf',
        fileType: 'pdf',
        password: SAMPLE_PASSWORD,
      });

      const expenseTx = result.transactions.find((t) => t.description?.includes('PAGO EN'));
      expect(expenseTx?.type).toBe('expense');
    });

    it('extracts merchant from payment transactions', async () => {
      const result = await parser.parseStatement(Buffer.from('test'), {
        fileName: 'extracto_cuenta202510.pdf',
        fileType: 'pdf',
        password: SAMPLE_PASSWORD,
      });

      const paymentTx = result.transactions.find((t) => t.description?.includes('PAGO EN'));
      expect(paymentTx?.merchant).toBe('COPI BLOCK');
    });

    it('extracts merchant from transfer transactions', async () => {
      const result = await parser.parseStatement(Buffer.from('test'), {
        fileName: 'extracto_cuenta202510.pdf',
        fileType: 'pdf',
        password: SAMPLE_PASSWORD,
      });

      const transferTx = result.transactions.find((t) => t.description?.includes('Para'));
      expect(transferTx?.merchant).toBe('BEATRIZ ELENA GAVIRIA');
    });

    it('calculates balance before correctly', async () => {
      const result = await parser.parseStatement(Buffer.from('test'), {
        fileName: 'extracto_cuenta202510.pdf',
        fileType: 'pdf',
        password: SAMPLE_PASSWORD,
      });

      const firstTx = result.transactions[0]!;
      expect(firstTx.balanceBefore).toBe(354788.42);

      const secondTx = result.transactions[1]!;
      expect(secondTx.balanceBefore).toBe(351188.42);
    });

    it('throws error when no pages found', async () => {
      mockRead.mockResolvedValue(createMockFileReadResult({ sheets: [] }));

      await expect(
        parser.parseStatement(Buffer.from('test'), {
          fileName: 'extracto_cuenta202510.pdf',
          fileType: 'pdf',
          password: SAMPLE_PASSWORD,
        })
      ).rejects.toThrow('Statement file has no pages');
    });

    it('throws error when account holder name cannot be extracted', async () => {
      mockRead.mockResolvedValue(
        createMockFileReadResult({
          sheets: [
            {
              name: 'Page 1',
              rows: [['Some other content'], ['Número de cuenta de ahorro: 3052269855']],
              rowCount: 2,
              columnCount: 1,
            },
          ],
        })
      );

      await expect(
        parser.parseStatement(Buffer.from('test'), {
          fileName: 'extracto_cuenta202510.pdf',
          fileType: 'pdf',
          password: SAMPLE_PASSWORD,
        })
      ).rejects.toThrow('Could not extract account holder name');
    });

    it('throws error when account number cannot be extracted', async () => {
      mockRead.mockResolvedValue(
        createMockFileReadResult({
          sheets: [
            {
              name: 'Page 1',
              rows: [
                ['Extracto de cuenta de ahorro de:'],
                ['SEBASTIAN MENDOZA GONZALEZ'],
                ['Some other content'],
              ],
              rowCount: 3,
              columnCount: 1,
            },
          ],
        })
      );

      await expect(
        parser.parseStatement(Buffer.from('test'), {
          fileName: 'extracto_cuenta202510.pdf',
          fileType: 'pdf',
          password: SAMPLE_PASSWORD,
        })
      ).rejects.toThrow('Could not extract account number');
    });

    it('throws error when period cannot be extracted', async () => {
      mockRead.mockResolvedValue(
        createMockFileReadResult({
          sheets: [
            {
              name: 'Page 1',
              rows: [
                ['Extracto de cuenta de ahorro de:'],
                ['SEBASTIAN MENDOZA GONZALEZ'],
                ['Número de cuenta de ahorro: 3052269855'],
                ['Some other content'],
              ],
              rowCount: 4,
              columnCount: 1,
            },
          ],
        })
      );

      await expect(
        parser.parseStatement(Buffer.from('test'), {
          fileName: 'extracto_cuenta202510.pdf',
          fileType: 'pdf',
          password: SAMPLE_PASSWORD,
        })
      ).rejects.toThrow('Could not extract statement period');
    });
  });

  describe('parseStatement with real files', () => {
    const describeWithSamples = hasSampleFiles() ? describe : describe.skip;

    describeWithSamples.skip('with sample files (requires --experimental-vm-modules)', () => {
      it('requires password for encrypted PDFs', async () => {
        const data = loadSampleFile('extracto_cuenta202510.pdf');
        const metadata: StatementMetadata = {
          fileName: 'extracto_cuenta202510.pdf',
          fileType: 'pdf',
        };

        await expect(parser.parseStatement(data, metadata)).rejects.toThrow(/password/i);
      });

      it('parses October 2025 statement with correct password', async () => {
        const data = loadSampleFile('extracto_cuenta202510.pdf');
        const metadata: StatementMetadata = {
          fileName: 'extracto_cuenta202510.pdf',
          fileType: 'pdf',
          password: SAMPLE_PASSWORD,
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.bank.code).toBe('nequi');
        expect(result.bank.name).toBe('Nequi');
        expect(result.rawFileName).toBe('extracto_cuenta202510.pdf');

        expect(result.account.accountNumber).toBe('3052269855');
        expect(result.account.accountType).toBe('savings');
        expect(result.account.holderName).toBe('SEBASTIAN MENDOZA GONZALEZ');
        expect(result.account.periodStart).toEqual(new Date(2025, 9, 1));
        expect(result.account.periodEnd).toEqual(new Date(2025, 9, 31));
        expect(result.account.openingBalance).toBe(354788.42);
        expect(result.account.closingBalance).toBe(3853532.83);

        expect(result.transactions.length).toBeGreaterThan(0);

        const firstTransaction = result.transactions[0]!;
        expect(firstTransaction.transactionDate).toBeInstanceOf(Date);
        expect(typeof firstTransaction.amount).toBe('number');
        expect(firstTransaction.amount).toBeGreaterThan(0);
        expect(typeof firstTransaction.balanceAfter).toBe('number');
      });

      it('parses January 2025 statement correctly', async () => {
        const data = loadSampleFile('extracto_cuenta202501.pdf');
        const metadata: StatementMetadata = {
          fileName: 'extracto_cuenta202501.pdf',
          fileType: 'pdf',
          password: SAMPLE_PASSWORD,
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.account.accountNumber).toBe('3052269855');
        expect(result.account.periodStart).toEqual(new Date(2025, 0, 1));
        expect(result.account.periodEnd).toEqual(new Date(2025, 0, 31));
        expect(result.account.openingBalance).toBe(235994.55);
        expect(result.account.closingBalance).toBe(2676839.61);

        expect(result.transactions.length).toBeGreaterThan(0);
      });

      it('parses all available sample files without errors', async () => {
        const files = fs.readdirSync(SAMPLE_DIR).filter((f) => f.endsWith('.pdf'));

        for (const file of files) {
          const data = loadSampleFile(file);
          const metadata: StatementMetadata = {
            fileName: file,
            fileType: 'pdf',
            password: SAMPLE_PASSWORD,
          };

          const result = await parser.parseStatement(data, metadata);

          expect(result.bank.code).toBe('nequi');
          expect(result.account.accountNumber).toBeDefined();
          expect(result.transactions.length).toBeGreaterThan(0);
        }
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
