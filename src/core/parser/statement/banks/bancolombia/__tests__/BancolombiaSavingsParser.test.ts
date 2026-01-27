import * as fs from 'fs';
import * as path from 'path';

import { BancolombiaSavingsParser } from '../BancolombiaSavingsParser';

import type { StatementMetadata } from '../../../types';

const SAMPLE_DIR = path.resolve(
  __dirname,
  '../../../../../../../tmp/bank_statement_samples/bancolombia'
);

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

describe('BancolombiaSavingsParser', () => {
  let parser: BancolombiaSavingsParser;

  beforeEach(() => {
    parser = new BancolombiaSavingsParser();
  });

  describe('canParse', () => {
    it('returns true for savings statement file names', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
        fileType: 'xlsx',
      };
      expect(parser.canParse(metadata)).toBe(true);
    });

    it('returns true for file name with underscore variant', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202503_Cuentas_deahorro_9855.xlsx',
        fileType: 'xlsx',
      };
      expect(parser.canParse(metadata)).toBe(true);
    });

    it('returns false for card statement file names', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202506_Mastercard_Detallado_1194.xlsx',
        fileType: 'xlsx',
      };
      expect(parser.canParse(metadata)).toBe(false);
    });

    it('returns false for PDF files', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202412_Cuentas_de ahorro_0810.pdf',
        fileType: 'pdf',
      };
      expect(parser.canParse(metadata)).toBe(false);
    });

    it('returns false when bank code does not match', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
        fileType: 'xlsx',
        bankCode: 'nequi',
      };
      expect(parser.canParse(metadata)).toBe(false);
    });

    it('returns true when bank code matches', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
        fileType: 'xlsx',
        bankCode: 'bancolombia',
      };
      expect(parser.canParse(metadata)).toBe(true);
    });
  });

  describe('parser properties', () => {
    it('has correct bank code', () => {
      expect(parser.bankCode).toBe('bancolombia');
    });

    it('has correct supported file types', () => {
      expect(parser.supportedFileTypes).toEqual(['xlsx']);
    });

    it('has correct bank info', () => {
      expect(parser.bank).toEqual({
        code: 'bancolombia',
        name: 'Bancolombia',
      });
    });
  });

  describe('parseStatement with real files', () => {
    const describeWithSamples = hasSampleFiles() ? describe : describe.skip;

    describeWithSamples('with sample files', () => {
      it('parses December 2024 statement correctly', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.bank.code).toBe('bancolombia');
        expect(result.account.accountNumber).toBe('91247650810');
        expect(result.account.accountType).toBe('savings');
        expect(result.account.openingBalance).toBe(4021.71);
        expect(result.account.closingBalance).toBe(1214326.64);

        expect(result.account.periodStart).toEqual(new Date(2024, 8, 30));
        expect(result.account.periodEnd).toEqual(new Date(2024, 11, 31));

        expect(result.transactions.length).toBeGreaterThan(100);

        const firstTransaction = result.transactions[0]!;
        expect(firstTransaction.description).toBe('TRANSFERENCIA DESDE NEQUI');
        expect(firstTransaction.amount).toBe(30000);
        expect(firstTransaction.type).toBe('transfer_in');
        expect(firstTransaction.balanceAfter).toBe(34021.71);

        const lastTransaction = result.transactions[result.transactions.length - 1]!;
        expect(lastTransaction.description).toBe('ABONO INTERESES AHORROS');
        expect(lastTransaction.type).toBe('income');
        expect(lastTransaction.balanceAfter).toBe(1214326.64);
      });

      it('parses June 2024 statement correctly', async () => {
        const data = loadSampleFile('Extracto_202406_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202406_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.account.accountNumber).toBe('91247650810');
        expect(result.account.periodStart).toEqual(new Date(2024, 2, 31));
        expect(result.account.periodEnd).toEqual(new Date(2024, 5, 30));
        expect(result.account.openingBalance).toBe(1196.7);
        expect(result.account.closingBalance).toBe(289863.12);
      });

      it('correctly identifies transaction types', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const transferIn = result.transactions.find(
          (t) => t.description === 'TRANSFERENCIA DESDE NEQUI'
        );
        expect(transferIn?.type).toBe('transfer_in');

        const transferOut = result.transactions.find((t) =>
          t.description?.startsWith('TRANSFERENCIA A NEQUI')
        );
        expect(transferOut?.type).toBe('transfer_out');

        const purchase = result.transactions.find((t) => t.description?.startsWith('COMPRA EN'));
        expect(purchase?.type).toBe('expense');

        const income = result.transactions.find((t) => t.description === 'ABONO INTERESES AHORROS');
        expect(income?.type).toBe('income');

        const salary = result.transactions.find(
          (t) => t.description === 'PAGO DE NOMI QUANTUM OUTSOUR'
        );
        expect(salary?.type).toBe('income');
      });

      it('extracts merchants from descriptions', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const compraCarulla = result.transactions.find(
          (t) => t.description === 'COMPRA EN  CARULLA EL'
        );
        expect(compraCarulla?.merchant).toBe('CARULLA EL');

        const pagoQr = result.transactions.find((t) =>
          t.description?.includes('PAGO QR ZONA DE COMBATE')
        );
        expect(pagoQr?.merchant).toBe('ZONA DE COMBATE SAS');
      });

      it('calculates balance before correctly', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        for (let i = 1; i < Math.min(result.transactions.length, 10); i++) {
          const current = result.transactions[i]!;
          const previous = result.transactions[i - 1]!;
          expect(current.balanceBefore).toBe(previous.balanceAfter);
        }
      });

      it('parses account with no transactions (A LA MANO)', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_9855.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_9855.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.account.accountNumber).toBe('3052269855');
        expect(result.account.openingBalance).toBe(0);
        expect(result.account.closingBalance).toBe(0);
        expect(result.transactions.length).toBe(0);
      });
    });
  });

  describe('error handling', () => {
    it('throws on empty buffer', async () => {
      const emptyData = Buffer.from([]);
      const metadata: StatementMetadata = {
        fileName: 'empty.xlsx',
        fileType: 'xlsx',
      };

      await expect(parser.parseStatement(emptyData, metadata)).rejects.toThrow();
    });

    it('throws when metadata is missing fileName', async () => {
      const data = Buffer.from('test');
      const metadata = {
        fileName: '',
        fileType: 'xlsx',
      } as StatementMetadata;

      await expect(parser.parseStatement(data, metadata)).rejects.toThrow(
        'Statement metadata must include fileName'
      );
    });

    it('throws when metadata is missing fileType', async () => {
      const data = Buffer.from('test');
      const metadata = {
        fileName: 'test.xlsx',
        fileType: '' as unknown,
      } as StatementMetadata;

      await expect(parser.parseStatement(data, metadata)).rejects.toThrow(
        'Statement metadata must include fileType'
      );
    });
  });
});
