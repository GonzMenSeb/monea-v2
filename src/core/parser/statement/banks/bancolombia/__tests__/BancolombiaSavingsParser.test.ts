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

      it('parses March 2024 statement correctly', async () => {
        const data = loadSampleFile('Extracto_202403_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202403_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.bank.code).toBe('bancolombia');
        expect(result.account.accountNumber).toBe('91247650810');
        expect(result.account.accountType).toBe('savings');
        expect(result.account.periodStart).toEqual(new Date(2023, 11, 31));
        expect(result.account.periodEnd).toEqual(new Date(2024, 2, 31));
        expect(result.transactions.length).toBeGreaterThan(0);

        const allTransactionsHaveRequiredFields = result.transactions.every(
          (t) => t.transactionDate && t.description && t.type
        );
        expect(allTransactionsHaveRequiredFields).toBe(true);
      });

      it('parses September 2024 statement correctly', async () => {
        const data = loadSampleFile('Extracto_202409_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202409_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.account.accountNumber).toBe('91247650810');
        expect(result.account.periodStart).toEqual(new Date(2024, 5, 30));
        expect(result.account.periodEnd).toEqual(new Date(2024, 8, 30));
        expect(result.transactions.length).toBeGreaterThan(0);
      });

      it('parses December 2025 statement correctly', async () => {
        const data = loadSampleFile('Extracto_202512_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202512_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.account.accountNumber).toBe('91247650810');
        expect(result.account.periodStart).toEqual(new Date(2025, 8, 30));
        expect(result.account.periodEnd).toEqual(new Date(2025, 11, 31));
      });

      it('parses March 2025 statement correctly', async () => {
        const data = loadSampleFile('Extracto_202503_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202503_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.account.accountNumber).toBe('91247650810');
        expect(result.account.periodStart).toEqual(new Date(2024, 11, 31));
        expect(result.account.periodEnd).toEqual(new Date(2025, 2, 31));
      });

      it('parses June 2025 statement correctly', async () => {
        const data = loadSampleFile('Extracto_202506_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202506_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.account.accountNumber).toBe('91247650810');
        expect(result.account.periodStart).toEqual(new Date(2025, 2, 31));
        expect(result.account.periodEnd).toEqual(new Date(2025, 5, 30));
      });

      it('parses September 2025 statement correctly', async () => {
        const data = loadSampleFile('Extracto_202509_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202509_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.account.accountNumber).toBe('91247650810');
        expect(result.account.periodStart).toEqual(new Date(2025, 5, 30));
        expect(result.account.periodEnd).toEqual(new Date(2025, 8, 30));
      });


      it('parses account with no transactions (A LA MANO - December 2024)', async () => {
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

      it('parses account with no transactions (A LA MANO - March 2025)', async () => {
        const data = loadSampleFile('Extracto_202503_Cuentas_de ahorro_9855.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202503_Cuentas_de ahorro_9855.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.account.accountNumber).toBe('3052269855');
        expect(result.account.openingBalance).toBe(0);
        expect(result.account.closingBalance).toBe(0);
        expect(result.transactions.length).toBe(0);
      });

      it('handles statements crossing year boundaries correctly (March 2024)', async () => {
        const data = loadSampleFile('Extracto_202403_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202403_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const transactionsFromDec = result.transactions.filter(
          (t) => t.transactionDate.getMonth() === 11
        );
        const transactionsFromJan = result.transactions.filter((t) => t.transactionDate.getMonth() === 0);
        const transactionsFromFeb = result.transactions.filter((t) => t.transactionDate.getMonth() === 1);
        const transactionsFromMar = result.transactions.filter((t) => t.transactionDate.getMonth() === 2);

        expect(transactionsFromJan.length + transactionsFromFeb.length + transactionsFromMar.length).toBeGreaterThan(0);

        if (transactionsFromDec.length > 0) {
          transactionsFromDec.forEach((t) => {
            expect(t.transactionDate.getFullYear()).toBe(2023);
          });
        }

        [...transactionsFromJan, ...transactionsFromFeb, ...transactionsFromMar].forEach((t) => {
          expect(t.transactionDate.getFullYear()).toBe(2024);
        });
      });

      it('handles statements crossing year boundaries correctly (March 2025)', async () => {
        const data = loadSampleFile('Extracto_202503_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202503_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const transactionsFromDec = result.transactions.filter(
          (t) => t.transactionDate.getMonth() === 11
        );
        const transactionsFrom2025 = result.transactions.filter(
          (t) => t.transactionDate.getFullYear() === 2025
        );

        if (transactionsFromDec.length > 0) {
          transactionsFromDec.forEach((t) => {
            expect(t.transactionDate.getFullYear()).toBe(2024);
          });
        }

        if (transactionsFrom2025.length > 0) {
          transactionsFrom2025.forEach((t) => {
            expect(t.transactionDate.getFullYear()).toBe(2025);
            expect([0, 1, 2]).toContain(t.transactionDate.getMonth());
          });
        }
      });

      it('all transactions have valid dates within period', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        result.transactions.forEach((t) => {
          expect(t.transactionDate).toBeInstanceOf(Date);
          expect(t.transactionDate.getTime()).toBeGreaterThanOrEqual(
            result.account.periodStart.getTime()
          );
          expect(t.transactionDate.getTime()).toBeLessThanOrEqual(result.account.periodEnd.getTime());
        });
      });

      it('parses amount formats correctly (negatives and positives)', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const incomeTransactions = result.transactions.filter((t) => t.type === 'income' || t.type === 'transfer_in');
        const expenseTransactions = result.transactions.filter((t) => t.type === 'expense' || t.type === 'transfer_out');

        expect(incomeTransactions.length).toBeGreaterThan(0);
        expect(expenseTransactions.length).toBeGreaterThan(0);

        incomeTransactions.forEach((t) => {
          expect(t.amount).toBeGreaterThan(0);
          expect(typeof t.amount).toBe('number');
          expect(Number.isFinite(t.amount)).toBe(true);
        });

        expenseTransactions.forEach((t) => {
          expect(t.amount).toBeGreaterThan(0);
          expect(typeof t.amount).toBe('number');
          expect(Number.isFinite(t.amount)).toBe(true);
        });
      });

      it('parses large amounts correctly (above 1 million)', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const largeTransaction = result.transactions.find((t) => t.amount > 1000000);
        if (largeTransaction) {
          expect(largeTransaction.amount).toBeGreaterThan(1000000);
          expect(typeof largeTransaction.amount).toBe('number');
          expect(Number.isFinite(largeTransaction.amount)).toBe(true);
        }

        expect(result.account.closingBalance).toBeGreaterThan(1000000);
      });
    });

    describeWithSamples('transaction type classification', () => {
      it('identifies transfer_in transactions correctly', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const transferInFromNequi = result.transactions.filter(
          (t) => t.type === 'transfer_in' && t.description?.includes('NEQUI')
        );
        expect(transferInFromNequi.length).toBeGreaterThan(0);

        transferInFromNequi.forEach((t) => {
          expect(t.description).toMatch(/DESDE|TRANSF QR/);
          expect(t.amount).toBeGreaterThan(0);
        });
      });

      it('identifies transfer_out transactions correctly', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const transferOutToNequi = result.transactions.filter(
          (t) => t.type === 'transfer_out' && t.description?.includes('NEQUI')
        );
        expect(transferOutToNequi.length).toBeGreaterThan(0);

        transferOutToNequi.forEach((t) => {
          expect(t.description).toMatch(/TRANSFERENCIA (A|CTA)/);
          expect(t.amount).toBeGreaterThan(0);
        });
      });

      it('identifies QR transfer transactions correctly', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const qrTransfersIn = result.transactions.filter(
          (t) => t.description?.includes('TRANSF QR') && t.type === 'transfer_in'
        );
        if (qrTransfersIn.length > 0) {
          qrTransfersIn.forEach((t) => {
            expect(t.type).toBe('transfer_in');
            expect(t.amount).toBeGreaterThan(0);
          });
        }

        const qrPayments = result.transactions.filter(
          (t) => t.description?.includes('PAGO QR')
        );
        if (qrPayments.length > 0) {
          qrPayments.forEach((t) => {
            expect(t.type).toBe('expense');
            expect(t.merchant).toBeTruthy();
          });
        }
      });

      it('identifies income transactions correctly', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const salaryPayments = result.transactions.filter(
          (t) => t.type === 'income' && t.description?.includes('PAGO DE NOMI')
        );
        expect(salaryPayments.length).toBeGreaterThan(0);

        const interestPayments = result.transactions.filter(
          (t) => t.type === 'income' && t.description?.includes('INTERESES AHORROS')
        );
        expect(interestPayments.length).toBeGreaterThan(0);
      });

      it('identifies expense transactions correctly', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const purchases = result.transactions.filter(
          (t) => t.type === 'expense' && t.description?.startsWith('COMPRA EN')
        );
        expect(purchases.length).toBeGreaterThan(0);

        purchases.forEach((t) => {
          expect(t.amount).toBeGreaterThan(0);
          expect(t.merchant).toBeTruthy();
        });
      });
    });

    describeWithSamples('merchant extraction', () => {
      it('extracts merchants from COMPRA EN transactions', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const compraEnTransactions = result.transactions.filter(
          (t) => t.description?.startsWith('COMPRA EN')
        );

        compraEnTransactions.forEach((t) => {
          expect(t.merchant).toBeTruthy();
          expect(t.merchant).not.toContain('COMPRA EN');
          expect(typeof t.merchant).toBe('string');
        });
      });

      it('extracts merchants from PAGO QR transactions', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const pagoQrTransactions = result.transactions.filter((t) =>
          t.description?.includes('PAGO QR')
        );

        if (pagoQrTransactions.length > 0) {
          pagoQrTransactions.forEach((t) => {
            expect(t.merchant).toBeTruthy();
            expect(t.merchant).not.toContain('PAGO QR');
          });
        }
      });

      it('does not extract merchants for transfers', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const transfers = result.transactions.filter(
          (t) => t.type === 'transfer_in' || t.type === 'transfer_out'
        );

        transfers.forEach((t) => {
          if (!t.description?.includes('QR')) {
            expect(t.merchant).toBeUndefined();
          }
        });
      });

      it('does not extract merchants for income transactions', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        const incomeTransactions = result.transactions.filter(
          (t) => t.type === 'income' && (t.description?.includes('NOMI') || t.description?.includes('INTERESES'))
        );

        incomeTransactions.forEach((t) => {
          expect(t.merchant).toBeUndefined();
        });
      });
    });

    describeWithSamples('balance calculations', () => {
      it('balance progression is consistent throughout statement', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        for (let i = 1; i < result.transactions.length; i++) {
          const current = result.transactions[i]!;
          const previous = result.transactions[i - 1]!;
          expect(current.balanceBefore).toBe(previous.balanceAfter);
        }
      });

      it('first transaction balance before matches opening balance', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        if (result.transactions.length > 0) {
          const firstTransaction = result.transactions[0]!;
          const expectedBalanceBefore = firstTransaction.balanceAfter - firstTransaction.amount * (firstTransaction.type === 'expense' || firstTransaction.type === 'transfer_out' ? -1 : 1);
          expect(Math.abs(expectedBalanceBefore - result.account.openingBalance)).toBeLessThan(0.01);
        }
      });

      it('last transaction balance after matches closing balance', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        if (result.transactions.length > 0) {
          const lastTransaction = result.transactions[result.transactions.length - 1]!;
          expect(lastTransaction.balanceAfter).toBe(result.account.closingBalance);
        }
      });

      it('handles multiple movement sections correctly', async () => {
        const data = loadSampleFile('Extracto_202412_Cuentas_de ahorro_0810.xlsx');
        const metadata: StatementMetadata = {
          fileName: 'Extracto_202412_Cuentas_de ahorro_0810.xlsx',
          fileType: 'xlsx',
        };

        const result = await parser.parseStatement(data, metadata);

        expect(result.transactions.length).toBeGreaterThan(50);

        for (let i = 1; i < result.transactions.length; i++) {
          const current = result.transactions[i]!;
          const previous = result.transactions[i - 1]!;
          expect(current.balanceBefore).toBe(previous.balanceAfter);
        }
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
