import { XlsxFileReader } from '../../readers';
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

const SAVINGS_FILE_PATTERN = /Cuentas_de\s*ahorro/i;

const SECTION_MARKERS = {
  GENERAL_INFO: 'Información General:',
  SUMMARY: 'Resumen:',
  MOVEMENTS: 'Movimientos:',
  END_OF_STATEMENT: 'FIN ESTADO DE CUENTA',
} as const;

const HEADERS = {
  GENERAL: ['DESDE', 'HASTA', 'TIPO CUENTA', 'NRO CUENTA', 'SUCURSAL'],
  SUMMARY: [
    'SALDO ANTERIOR',
    'TOTAL ABONOS',
    'TOTAL CARGOS',
    'SALDO ACTUAL',
    'SALDO PROMEDIO',
    'CUPO SUGERIDO',
    'INTERESES',
    'RETEFUENTE',
  ],
  MOVEMENTS: ['FECHA', 'DESCRIPCIÓN', 'SUCURSAL', 'DCTO.', 'VALOR', 'SALDO'],
} as const;

interface GeneralInfo {
  periodStart: Date;
  periodEnd: Date;
  accountType: string;
  accountNumber: string;
}

interface SummaryInfo {
  openingBalance: number;
  closingBalance: number;
}

interface RawTransaction {
  date: string;
  description: string;
  amount: number;
  balance: number;
}

export class BancolombiaSavingsParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'bancolombia';
  readonly supportedFileTypes: StatementFileType[] = ['xlsx'];

  private readonly xlsxReader = new XlsxFileReader();

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return SAVINGS_FILE_PATTERN.test(metadata.fileName);
  }

  async parseStatement(data: Buffer, metadata: StatementMetadata): Promise<ParsedStatementResult> {
    this.validateMetadata(metadata);

    const fileResult = await this.xlsxReader.read(data, metadata.fileName);
    const sheet = fileResult.sheets[0];

    if (!sheet || sheet.rowCount === 0) {
      throw new Error('Statement file is empty or has no sheets');
    }

    const generalInfo = this.extractGeneralInfo(sheet);
    const summaryInfo = this.extractSummaryInfo(sheet);
    const rawTransactions = this.extractRawTransactions(sheet, generalInfo);
    const transactions = this.convertTransactions(rawTransactions);

    const account = this.buildAccountInfo(generalInfo, summaryInfo);

    return {
      bank: this.bank,
      account,
      transactions,
      rawFileName: metadata.fileName,
    };
  }

  private extractGeneralInfo(sheet: SheetData): GeneralInfo {
    const sectionIndex = this.findSectionIndex(sheet.rows, SECTION_MARKERS.GENERAL_INFO);
    if (sectionIndex === -1) {
      throw new Error('Could not find General Information section');
    }

    const headerIndex = this.findHeaderRow(sheet.rows, HEADERS.GENERAL, sectionIndex);
    if (headerIndex === -1) {
      throw new Error('Could not find General Information header row');
    }

    const dataRow = sheet.rows[headerIndex + 1];
    if (!dataRow) {
      throw new Error('Could not find General Information data row');
    }

    const [fromStr, toStr, accountType, accountNumber] = dataRow;

    return {
      periodStart: this.parseDate(this.cellToString(fromStr)),
      periodEnd: this.parseDate(this.cellToString(toStr)),
      accountType: this.cellToString(accountType),
      accountNumber: this.cellToString(accountNumber),
    };
  }

  private extractSummaryInfo(sheet: SheetData): SummaryInfo {
    const sectionIndex = this.findSectionIndex(sheet.rows, SECTION_MARKERS.SUMMARY);
    if (sectionIndex === -1) {
      throw new Error('Could not find Summary section');
    }

    const headerIndex = this.findHeaderRow(sheet.rows, HEADERS.SUMMARY, sectionIndex);
    if (headerIndex === -1) {
      throw new Error('Could not find Summary header row');
    }

    const dataRow = sheet.rows[headerIndex + 1];
    if (!dataRow) {
      throw new Error('Could not find Summary data row');
    }

    const openingBalance = this.parseAmount(this.cellToString(dataRow[0]));
    const closingBalance = this.parseAmount(this.cellToString(dataRow[3]));

    return { openingBalance, closingBalance };
  }

  private extractRawTransactions(sheet: SheetData, generalInfo: GeneralInfo): RawTransaction[] {
    const transactions: RawTransaction[] = [];
    let movementsIndex = 0;

    while (movementsIndex < sheet.rows.length) {
      const nextSectionStart = this.findSectionIndex(
        sheet.rows,
        SECTION_MARKERS.MOVEMENTS,
        movementsIndex
      );

      if (nextSectionStart === -1) {
        break;
      }

      const headerIndex = this.findHeaderRow(sheet.rows, HEADERS.MOVEMENTS, nextSectionStart);
      if (headerIndex === -1) {
        movementsIndex = nextSectionStart + 1;
        continue;
      }

      const sectionTransactions = this.extractTransactionsFromSection(
        sheet.rows,
        headerIndex + 1,
        generalInfo
      );

      transactions.push(...sectionTransactions);
      movementsIndex = headerIndex + 1;
    }

    return transactions;
  }

  private extractTransactionsFromSection(
    rows: RawRow[],
    startIndex: number,
    generalInfo: GeneralInfo
  ): RawTransaction[] {
    const transactions: RawTransaction[] = [];

    for (let i = startIndex; i < rows.length; i++) {
      const row = rows[i];
      if (!row || !this.isTransactionRow(row)) {
        break;
      }

      const dateStr = this.cellToString(row[0]);
      if (!dateStr || dateStr === SECTION_MARKERS.END_OF_STATEMENT) {
        break;
      }
      if (this.isSectionMarker(dateStr)) {
        break;
      }

      const fullDate = this.buildFullDate(dateStr, generalInfo.periodStart, generalInfo.periodEnd);
      const description = this.cellToString(row[1]);
      const amountStr = this.cellToString(row[4]);
      const balanceStr = this.cellToString(row[5]);

      if (!description) {
        continue;
      }

      transactions.push({
        date: fullDate,
        description,
        amount: this.parseAmount(amountStr),
        balance: this.parseAmount(balanceStr),
      });
    }

    return transactions;
  }

  private convertTransactions(rawTransactions: RawTransaction[]): StatementTransaction[] {
    return rawTransactions.map((raw, index) => {
      const type = this.determineTransactionType(raw.amount, raw.description);
      const previousTransaction = rawTransactions[index - 1];
      const previousBalance = previousTransaction
        ? previousTransaction.balance
        : raw.balance - raw.amount;

      return {
        type,
        amount: Math.abs(raw.amount),
        balanceBefore: previousBalance,
        balanceAfter: raw.balance,
        description: raw.description,
        merchant: this.extractMerchant(raw.description),
        transactionDate: new Date(raw.date),
      };
    });
  }

  private buildAccountInfo(
    generalInfo: GeneralInfo,
    summaryInfo: SummaryInfo
  ): StatementAccountInfo {
    return {
      accountNumber: generalInfo.accountNumber,
      accountType: 'savings',
      periodStart: generalInfo.periodStart,
      periodEnd: generalInfo.periodEnd,
      openingBalance: summaryInfo.openingBalance,
      closingBalance: summaryInfo.closingBalance,
    };
  }

  private findSectionIndex(rows: RawRow[], marker: string, startFrom = 0): number {
    for (let i = startFrom; i < rows.length; i++) {
      const row = rows[i];
      if (row && this.cellToString(row[0]) === marker) {
        return i;
      }
    }
    return -1;
  }

  private findHeaderRow(rows: RawRow[], expectedHeaders: readonly string[], startFrom = 0): number {
    for (let i = startFrom; i < rows.length; i++) {
      const row = rows[i];
      if (!row) {
        continue;
      }

      const firstCell = this.cellToString(row[0]);
      if (firstCell === expectedHeaders[0]) {
        return i;
      }
    }
    return -1;
  }

  private isTransactionRow(row: RawRow): boolean {
    const dateStr = this.cellToString(row[0]);
    if (!dateStr) {
      return false;
    }
    return /^\d{1,2}\/\d{1,2}$/.test(dateStr) || this.isSectionMarker(dateStr);
  }

  private isSectionMarker(value: string): boolean {
    return Object.values(SECTION_MARKERS).some(
      (marker) => value === marker || value.startsWith('Información')
    );
  }

  private buildFullDate(shortDate: string, periodStart: Date, periodEnd: Date): string {
    const [day, month] = shortDate.split('/').map(Number);
    if (day === undefined || month === undefined) {
      throw new Error(`Invalid date format: ${shortDate}`);
    }

    const startYear = periodStart.getFullYear();
    const endYear = periodEnd.getFullYear();

    let year = endYear;
    if (startYear !== endYear && month > periodEnd.getMonth() + 1) {
      year = startYear;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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

  private parseAmount(amountStr: string): number {
    if (!amountStr) {
      return 0;
    }

    const isNegative = amountStr.startsWith('-');
    const cleanedStr = amountStr.replace(/[^\d.]/g, '');
    const value = parseFloat(cleanedStr) || 0;

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
      if (descLower.includes('transferencia desde') || descLower.includes('transf qr')) {
        return 'transfer_in';
      }
      return 'income';
    }

    if (descLower.includes('transferencia a') || descLower.includes('transferencia cta')) {
      return 'transfer_out';
    }

    return 'expense';
  }

  private extractMerchant(description: string): string | undefined {
    const patterns = [
      /COMPRA EN\s+(.+)/i,
      /PAGO QR\s+(.+)/i,
      /TRANSF QR\s+(.+)/i,
      /^(?:RETIRO CAJERO|COMPRA EN|PAGO QR)\s+(.+)/i,
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
