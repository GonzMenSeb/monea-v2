import * as fs from 'fs';
import * as path from 'path';

import { BancolombiaCardParser } from '../BancolombiaCardParser';

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

describe('BancolombiaCardParser', () => {
  let parser: BancolombiaCardParser;

  beforeEach(() => {
    parser = new BancolombiaCardParser();
  });

  describe('canParse', () => {
    it('returns true for Mastercard statement file names', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202506_Mastercard_Detallado_1194.xlsx',
        fileType: 'xlsx',
      };
      expect(parser.canParse(metadata)).toBe(true);
    });

    it('returns true for Amex statement file names', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202508_Amex_Detallado_1916.xlsx',
        fileType: 'xlsx',
      };
      expect(parser.canParse(metadata)).toBe(true);
    });

    it('returns false for savings statement file names', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
        fileType: 'xlsx',
      };
      expect(parser.canParse(metadata)).toBe(false);
    });

    it('returns false for PDF files', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202506_Mastercard_Detallado_1194.pdf',
        fileType: 'pdf',
      };
      expect(parser.canParse(metadata)).toBe(false);
    });

    it('returns false when bank code does not match', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202506_Mastercard_Detallado_1194.xlsx',
        fileType: 'xlsx',
        bankCode: 'nequi',
      };
      expect(parser.canParse(metadata)).toBe(false);
    });

    it('returns true when bank code matches', () => {
      const metadata: StatementMetadata = {
        fileName: 'Extracto_202506_Mastercard_Detallado_1194.xlsx',
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

    describeWithSamples('with Mastercard samples', () => {
      it('parses January 2026 Mastercard statement correctly', async () => {
        const data = loadSampleFile('Extracto_202601_Mastercard_Detallado_1194.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202601_Mastercard_Detallado_1194.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.bank.code).toBe('bancolombia');
        expect(result.account.accountNumber).toBe('************1194');
        expect(result.account.accountType).toBe('credit_card');

        expect(result.account.periodStart).toEqual(new Date(2025, 11, 15));
        expect(result.account.periodEnd).toEqual(new Date(2026, 0, 15));

        expect(result.transactions.length).toBeGreaterThan(0);

        const allTransactionsHaveRequiredFields = result.transactions.every(
          (t) => t.transactionDate && t.description && t.type
        );
        expect(allTransactionsHaveRequiredFields).toBe(true);
      });

      it('parses November 2025 Mastercard statement with many transactions', async () => {
        const data = loadSampleFile('Extracto_202511_Mastercard_Detallado_1194.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202511_Mastercard_Detallado_1194.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.transactions.length).toBeGreaterThan(20);

        const didiTransactions = result.transactions.filter((t) =>
          t.description?.includes('Didi') || t.description?.includes('DiDi')
        );
        expect(didiTransactions.length).toBeGreaterThan(5);

        const paymentTransactions = result.transactions.filter(
          (t) => t.type === 'income' && t.description?.includes('ABONO')
        );
        expect(paymentTransactions.length).toBeGreaterThan(0);
      });

      it('correctly identifies transaction types', async () => {
        const data = loadSampleFile('Extracto_202511_Mastercard_Detallado_1194.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202511_Mastercard_Detallado_1194.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const payment = result.transactions.find((t) =>
          t.description?.includes('ABONO SUCURSAL VIRTUAL')
        );
        expect(payment?.type).toBe('income');

        const interest = result.transactions.find((t) =>
          t.description?.includes('INTERESES')
        );
        expect(interest?.type).toBe('expense');

        const purchase = result.transactions.find((t) =>
          t.description?.includes('RAPPI') || t.description?.includes('Didi')
        );
        expect(purchase?.type).toBe('expense');
      });

      it('extracts merchants from descriptions', async () => {
        const data = loadSampleFile('Extracto_202511_Mastercard_Detallado_1194.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202511_Mastercard_Detallado_1194.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const rappiTransaction = result.transactions.find((t) =>
          t.description?.includes('RAPPI COLOMBIA')
        );
        expect(rappiTransaction?.merchant).toBe('RAPPI COLOMBIA*DL');

        const didiTransaction = result.transactions.find((t) =>
          t.merchant?.includes('Didi')
        );
        expect(didiTransaction?.merchant).toBeTruthy();

        const interestTransaction = result.transactions.find((t) =>
          t.description?.includes('INTERESES')
        );
        expect(interestTransaction?.merchant).toBeUndefined();
      });

      it('includes transactions from both PESOS and DOLARES sheets', async () => {
        const data = loadSampleFile('Extracto_202511_Mastercard_Detallado_1194.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202511_Mastercard_Detallado_1194.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const usdTransaction = result.transactions.find(
          (t) => t.description?.includes('CLAUDE.AI') || t.description?.includes('STEAMGAMES')
        );
        expect(usdTransaction).toBeTruthy();

        const pesosTransaction = result.transactions.find((t) =>
          t.description?.includes('RAPPI')
        );
        expect(pesosTransaction).toBeTruthy();
      });

      it('handles foreign currency transactions with additional info', async () => {
        const data = loadSampleFile('Extracto_202511_Mastercard_Detallado_1194.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202511_Mastercard_Detallado_1194.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const steamTransaction = result.transactions.find((t) =>
          t.description?.includes('STEAMGAMES')
        );

        if (steamTransaction) {
          expect(steamTransaction.description).toContain('VR MONEDA ORIG');
        }
      });

      it('stores authorization numbers as references', async () => {
        const data = loadSampleFile('Extracto_202511_Mastercard_Detallado_1194.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202511_Mastercard_Detallado_1194.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const transactionsWithRef = result.transactions.filter((t) => t.reference);
        expect(transactionsWithRef.length).toBeGreaterThan(0);

        const refFormats = transactionsWithRef.every((t) => /^[A-Z]\d{5}$/.test(t.reference!));
        expect(refFormats).toBe(true);
      });
    });

    describeWithSamples('with Amex samples', () => {
      it('parses January 2026 Amex statement correctly', async () => {
        const data = loadSampleFile('Extracto_202601_Amex_Detallado_1916.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202601_Amex_Detallado_1916.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.bank.code).toBe('bancolombia');
        expect(result.account.accountNumber).toBe('***********1916');
        expect(result.account.accountType).toBe('credit_card');
        expect(result.account.periodStart).toEqual(new Date(2025, 11, 15));
        expect(result.account.periodEnd).toEqual(new Date(2026, 0, 15));
      });

      it('handles empty Amex statements (no transactions)', async () => {
        const data = loadSampleFile('Extracto_202601_Amex_Detallado_1916.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202601_Amex_Detallado_1916.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.transactions).toBeDefined();
        expect(Array.isArray(result.transactions)).toBe(true);
      });
    });

    describeWithSamples('edge cases', () => {
      it('transactions are sorted by date descending', async () => {
        const data = loadSampleFile('Extracto_202511_Mastercard_Detallado_1194.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202511_Mastercard_Detallado_1194.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        for (let i = 1; i < result.transactions.length; i++) {
          const current = result.transactions[i]!;
          const previous = result.transactions[i - 1]!;
          expect(current.transactionDate.getTime()).toBeLessThanOrEqual(
            previous.transactionDate.getTime()
          );
        }
      });

      it('parses Colombian peso amounts correctly (dot as thousand separator)', async () => {
        const data = loadSampleFile('Extracto_202511_Mastercard_Detallado_1194.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202511_Mastercard_Detallado_1194.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const largeTransaction = result.transactions.find((t) => t.amount > 100000);
        expect(largeTransaction).toBeTruthy();
        expect(typeof largeTransaction?.amount).toBe('number');
        expect(Number.isFinite(largeTransaction?.amount)).toBe(true);
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
