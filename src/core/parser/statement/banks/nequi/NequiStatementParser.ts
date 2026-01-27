import { PdfFileReader } from '../../readers';
import { BaseStatementParser } from '../../shared';

import type {
  BankCode,
  CellValue,
  ParsedStatementResult,
  RawRow,
  SheetData,
  StatementAccountInfo,
  StatementFileType,
  StatementMetadata,
  StatementTransaction,
  TransactionType,
} from '../../types';

const FILE_PATTERN = /extracto_cuenta\d{6}\.pdf$/i;

const HEADER_PATTERNS = {
  HOLDER_PREFIX: 'Extracto de cuenta de ahorro de:',
  ACCOUNT_PREFIX: 'Número de cuenta de ahorro:',
  PERIOD_PREFIX: 'Estado de cuenta para el período de:',
  TRANSACTION_HEADER: 'Fecha del movimiento',
} as const;

const SUMMARY_LABELS = {
  OPENING_BALANCE: 'Saldo anterior',
  CLOSING_BALANCE: 'Saldo actual',
} as const;

interface AccountHeaderInfo {
  accountNumber: string;
  holderName: string;
  periodStart: Date;
  periodEnd: Date;
}

interface SummaryInfo {
  openingBalance: number;
  closingBalance: number;
}

interface RawTransaction {
  date: Date;
  description: string;
  amount: number;
  balance: number;
}

export class NequiStatementParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'nequi';
  readonly supportedFileTypes: StatementFileType[] = ['pdf'];

  private readonly pdfReader = new PdfFileReader();

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return FILE_PATTERN.test(metadata.fileName);
  }

  async parseStatement(data: Buffer, metadata: StatementMetadata): Promise<ParsedStatementResult> {
    this.validateMetadata(metadata);

    const fileResult = await this.pdfReader.read(data, metadata.fileName, metadata.password);

    if (!fileResult.sheets.length) {
      throw new Error('Statement file has no pages');
    }

    const accountHeader = this.extractAccountHeader(fileResult.sheets);
    const summaryInfo = this.extractSummaryInfo(fileResult.sheets);
    const rawTransactions = this.extractRawTransactions(fileResult.sheets);
    const transactions = this.convertTransactions(rawTransactions, summaryInfo.openingBalance);

    const account = this.buildAccountInfo(accountHeader, summaryInfo);

    return {
      bank: this.bank,
      account,
      transactions,
      rawFileName: metadata.fileName,
    };
  }

  private extractAccountHeader(sheets: SheetData[]): AccountHeaderInfo {
    const firstPage = sheets[0];
    if (!firstPage) {
      throw new Error('No pages found in statement');
    }

    let holderName = '';
    let accountNumber = '';
    let periodStart: Date | null = null;
    let periodEnd: Date | null = null;

    for (let i = 0; i < firstPage.rows.length; i++) {
      const row = firstPage.rows[i];
      const cellValue = this.cellToString(row?.[0]);

      if (cellValue === HEADER_PATTERNS.HOLDER_PREFIX) {
        const nextRow = firstPage.rows[i + 1];
        holderName = this.cellToString(nextRow?.[0]);
      }

      if (cellValue.startsWith(HEADER_PATTERNS.ACCOUNT_PREFIX)) {
        accountNumber = cellValue.replace(HEADER_PATTERNS.ACCOUNT_PREFIX, '').trim();
      }

      if (cellValue.startsWith(HEADER_PATTERNS.PERIOD_PREFIX)) {
        const periodStr = cellValue.replace(HEADER_PATTERNS.PERIOD_PREFIX, '').trim();
        const dates = this.parsePeriodString(periodStr);
        periodStart = dates.start;
        periodEnd = dates.end;
      }

      if (holderName && accountNumber && periodStart && periodEnd) {
        break;
      }
    }

    if (!holderName) {
      throw new Error('Could not extract account holder name');
    }
    if (!accountNumber) {
      throw new Error('Could not extract account number');
    }
    if (!periodStart || !periodEnd) {
      throw new Error('Could not extract statement period');
    }

    return { accountNumber, holderName, periodStart, periodEnd };
  }

  private extractSummaryInfo(sheets: SheetData[]): SummaryInfo {
    const firstPage = sheets[0];
    if (!firstPage) {
      throw new Error('No pages found in statement');
    }

    let openingBalance: number | null = null;
    let closingBalance: number | null = null;

    for (const row of firstPage.rows) {
      const cellValue = this.cellToString(row?.[0]);

      if (cellValue === SUMMARY_LABELS.OPENING_BALANCE) {
        openingBalance = this.parseAmount(this.cellToString(row?.[1]));
      }

      if (cellValue === SUMMARY_LABELS.CLOSING_BALANCE) {
        closingBalance = this.parseAmount(this.cellToString(row?.[1]));
      }

      if (openingBalance !== null && closingBalance !== null) {
        break;
      }
    }

    if (openingBalance === null) {
      throw new Error('Could not extract opening balance');
    }
    if (closingBalance === null) {
      throw new Error('Could not extract closing balance');
    }

    return { openingBalance, closingBalance };
  }

  private extractRawTransactions(sheets: SheetData[]): RawTransaction[] {
    const transactions: RawTransaction[] = [];

    for (const sheet of sheets) {
      const pageTransactions = this.extractTransactionsFromPage(sheet);
      transactions.push(...pageTransactions);
    }

    return transactions;
  }

  private extractTransactionsFromPage(sheet: SheetData): RawTransaction[] {
    const transactions: RawTransaction[] = [];
    let inTransactionSection = false;

    for (const row of sheet.rows) {
      const firstCell = this.cellToString(row?.[0]);

      if (firstCell === HEADER_PATTERNS.TRANSACTION_HEADER) {
        inTransactionSection = true;
        continue;
      }

      if (!inTransactionSection) {
        continue;
      }

      if (this.isTransactionRow(row)) {
        const transaction = this.parseTransactionRow(row);
        if (transaction) {
          transactions.push(transaction);
        }
      } else if (this.isSummaryOrFooterRow(firstCell)) {
        inTransactionSection = false;
      }
    }

    return transactions;
  }

  private isTransactionRow(row: RawRow | undefined): boolean {
    if (!row || row.length < 4) {
      return false;
    }

    const dateStr = this.cellToString(row[0]);
    return /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);
  }

  private isSummaryOrFooterRow(cellValue: string): boolean {
    const summaryIndicators = [
      SUMMARY_LABELS.OPENING_BALANCE,
      SUMMARY_LABELS.CLOSING_BALANCE,
      'Total abonos',
      'Total cargos',
      'Saldo promedio',
      'Cuentas por cobrar',
      'Valor de intereses',
      'Retefuente',
      'Resumen',
      'Las cuentas de ahorro Nequi',
    ];

    return summaryIndicators.some((indicator) => cellValue.startsWith(indicator));
  }

  private parseTransactionRow(row: RawRow): RawTransaction | null {
    const dateStr = this.cellToString(row[0]);
    const description = this.cellToString(row[1]);
    const amountStr = this.cellToString(row[2]);
    const balanceStr = this.cellToString(row[3]);

    if (!dateStr || !description) {
      return null;
    }

    const date = this.parseTransactionDate(dateStr);
    const amount = this.parseAmount(amountStr);
    const balance = this.parseAmount(balanceStr);

    return { date, description, amount, balance };
  }

  private convertTransactions(
    rawTransactions: RawTransaction[],
    openingBalance: number
  ): StatementTransaction[] {
    const sortedTransactions = [...rawTransactions].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );

    return sortedTransactions.map((raw, index) => {
      const type = this.determineTransactionType(raw.amount, raw.description);
      const previousTransaction = sortedTransactions[index - 1];
      const balanceBefore = previousTransaction ? previousTransaction.balance : openingBalance;

      return {
        type,
        amount: Math.abs(raw.amount),
        balanceBefore,
        balanceAfter: raw.balance,
        description: raw.description,
        merchant: this.extractMerchant(raw.description),
        transactionDate: raw.date,
      };
    });
  }

  private buildAccountInfo(
    accountHeader: AccountHeaderInfo,
    summaryInfo: SummaryInfo
  ): StatementAccountInfo {
    return {
      accountNumber: accountHeader.accountNumber,
      accountType: 'savings',
      holderName: accountHeader.holderName,
      periodStart: accountHeader.periodStart,
      periodEnd: accountHeader.periodEnd,
      openingBalance: summaryInfo.openingBalance,
      closingBalance: summaryInfo.closingBalance,
    };
  }

  private parsePeriodString(periodStr: string): { start: Date; end: Date } {
    const match = periodStr.match(/(\d{4}\/\d{2}\/\d{2})\s+a\s+(\d{4}\/\d{2}\/\d{2})/);
    if (!match || !match[1] || !match[2]) {
      throw new Error(`Invalid period format: ${periodStr}`);
    }

    return {
      start: this.parseDate(match[1]),
      end: this.parseDate(match[2]),
    };
  }

  private parseDate(dateStr: string): Date {
    const parts = dateStr.split('/');
    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    const [yearStr, monthStr, dayStr] = parts;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error(`Invalid date components: ${dateStr}`);
    }

    return new Date(year, month - 1, day);
  }

  private parseTransactionDate(dateStr: string): Date {
    const parts = dateStr.split('/');
    if (parts.length !== 3) {
      throw new Error(`Invalid transaction date format: ${dateStr}`);
    }

    const [dayStr, monthStr, yearStr] = parts;
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new Error(`Invalid date components: ${dateStr}`);
    }

    return new Date(year, month - 1, day);
  }

  private parseAmount(amountStr: string): number {
    if (!amountStr) {
      return 0;
    }

    const isNegative = amountStr.includes('-');
    const cleaned = amountStr.replace(/[^\d.,]/g, '');

    const normalized = cleaned.replace(/,/g, '');
    const value = parseFloat(normalized) || 0;

    return isNegative ? -value : value;
  }

  private cellToString(cell: CellValue): string {
    if (cell === null || cell === undefined) {
      return '';
    }
    return String(cell).trim();
  }

  private determineTransactionType(amount: number, description: string): TransactionType {
    const descLower = description.toLowerCase();

    if (amount >= 0) {
      if (
        descLower.includes('recibí') ||
        descLower.includes('de ') ||
        descLower.includes('otros bancos de')
      ) {
        return 'transfer_in';
      }
      if (descLower.includes('recarga desde')) {
        return 'transfer_in';
      }
      if (descLower.includes('pago de intereses') || descLower.includes('reverso')) {
        return 'income';
      }
      return 'income';
    }

    if (
      descLower.includes('para ') ||
      descLower.includes('envio') ||
      descLower.includes('enviado a')
    ) {
      return 'transfer_out';
    }

    return 'expense';
  }

  private extractMerchant(description: string): string | undefined {
    const patterns = [
      /COMPRA (?:EN|PSE EN)\s+(.+)/i,
      /PAGO EN (?:QR BRE-B:\s*)?(.+)/i,
      /PAGO FACTURA\s+(.+)/i,
      /Para\s+(.+)/i,
      /Envio a otros bancos a\s+(.+)/i,
      /ENVIO CON BRE-B (?:A|DE):\s+(.+)/i,
      /(?:De|Otros bancos de)\s+(.+)/i,
      /RECIBÍ A MI LLAVE DE:\s+(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match?.[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }
}
