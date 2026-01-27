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

const CARD_FILE_PATTERN = /(Mastercard|Amex)_Detallado/i;

type CardCurrency = 'PESOS' | 'DOLARES';

interface CardInfo {
  cardNumber: string;
  currency: CardCurrency;
  periodStart: Date;
  periodEnd: Date;
  paymentDueDate: Date | null;
  minimumPayment: number;
  totalPayment: number;
  totalLimit: number;
  availableLimit: number;
}

interface SummaryInfo {
  previousBalance: number;
  monthPurchases: number;
  lateInterest: number;
  currentInterest: number;
  advances: number;
  otherCharges: number;
  totalCharges: number;
  paymentsCredits: number;
  creditBalance: number;
}

interface RawTransaction {
  authNumber: string;
  date: Date;
  description: string;
  amount: number;
  installments: string;
  installmentValue: number;
  monthlyInterestRate: number;
  annualInterestRate: number;
  pendingBalance: number;
}

interface SheetResult {
  cardInfo: CardInfo;
  summary: SummaryInfo;
  transactions: RawTransaction[];
}

export class BancolombiaCardParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'bancolombia';
  readonly supportedFileTypes: StatementFileType[] = ['xlsx'];

  private readonly xlsxReader = new XlsxFileReader();

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return CARD_FILE_PATTERN.test(metadata.fileName);
  }

  async parseStatement(data: Buffer, metadata: StatementMetadata): Promise<ParsedStatementResult> {
    this.validateMetadata(metadata);

    const fileResult = await this.xlsxReader.read(data, metadata.fileName);

    if (!fileResult.sheets.length) {
      throw new Error('Statement file has no sheets');
    }

    const pesosSheet = fileResult.sheets.find((s) => s.name === 'PESOS');
    if (!pesosSheet) {
      throw new Error('Could not find PESOS sheet in credit card statement');
    }

    const sheetResult = this.parseSheet(pesosSheet);

    const allTransactions = this.collectAllTransactions(fileResult.sheets);
    const convertedTransactions = this.convertTransactions(allTransactions);

    const account = this.buildAccountInfo(sheetResult.cardInfo, sheetResult.summary);

    return {
      bank: this.bank,
      account,
      transactions: convertedTransactions,
      rawFileName: metadata.fileName,
    };
  }

  private parseSheet(sheet: SheetData): SheetResult {
    const cardInfo = this.extractCardInfo(sheet);
    const summary = this.extractSummary(sheet);
    const transactions = this.extractTransactions(sheet, cardInfo);

    return { cardInfo, summary, transactions };
  }

  private collectAllTransactions(sheets: SheetData[]): RawTransaction[] {
    const allTransactions: RawTransaction[] = [];

    for (const sheet of sheets) {
      const currency = sheet.name as CardCurrency;
      if (currency !== 'PESOS' && currency !== 'DOLARES') {
        continue;
      }

      const cardInfo = this.extractCardInfo(sheet);
      const transactions = this.extractTransactions(sheet, cardInfo);
      allTransactions.push(...transactions);
    }

    allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    return allTransactions;
  }

  private extractCardInfo(sheet: SheetData): CardInfo {
    const rows = sheet.rows;

    let cardNumber = '';
    let currency: CardCurrency = 'PESOS';
    let periodStart = new Date();
    let periodEnd = new Date();
    let paymentDueDate: Date | null = null;
    let minimumPayment = 0;
    let totalPayment = 0;
    let totalLimit = 0;
    let availableLimit = 0;

    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const row = rows[i];
      if (!row) {
        continue;
      }

      const firstCell = this.cellToString(row[0]);

      if (firstCell.includes('Información de la Tarjeta')) {
        cardNumber = this.cellToString(row[1]);
      } else if (firstCell.includes('Moneda')) {
        currency = this.cellToString(row[1]).toUpperCase() as CardCurrency;
      } else if (firstCell.includes('Periodo facturado')) {
        periodStart = this.parsePeriodDate(this.cellToString(row[1]));
        periodEnd = this.parsePeriodDate(this.cellToString(row[2]));
      } else if (firstCell.includes('Pagar antes de')) {
        const paymentDueDateStr = this.cellToString(row[1]);
        if (paymentDueDateStr !== '-') {
          paymentDueDate = this.parsePeriodDate(paymentDueDateStr);
        }
      } else if (firstCell.includes('Pago mínimo')) {
        minimumPayment = this.parseAmount(this.cellToString(row[1]));
      } else if (firstCell.includes('Pago total')) {
        totalPayment = this.parseAmount(this.cellToString(row[1]));
      } else if (firstCell.includes('Cupo total')) {
        totalLimit = this.parseAmount(this.cellToString(row[1]));
      } else if (firstCell.includes('Cupo disponible')) {
        availableLimit = this.parseAmount(this.cellToString(row[1]));
      }
    }

    return {
      cardNumber,
      currency,
      periodStart,
      periodEnd,
      paymentDueDate,
      minimumPayment,
      totalPayment,
      totalLimit,
      availableLimit,
    };
  }

  private extractSummary(sheet: SheetData): SummaryInfo {
    const rows = sheet.rows;

    const summaryValues: Record<string, number> = {};

    for (let i = 0; i < Math.min(rows.length, 25); i++) {
      const row = rows[i];
      if (!row) {
        continue;
      }

      const col3 = this.cellToString(row[3]);
      const col4Value = this.parseAmount(this.cellToString(row[4]));

      if (col3.includes('Saldo anterior')) {
        summaryValues['previousBalance'] = col4Value;
      } else if (col3.includes('Compras del mes')) {
        summaryValues['monthPurchases'] = col4Value;
      } else if (col3.includes('Intereses de mora')) {
        summaryValues['lateInterest'] = col4Value;
      } else if (col3.includes('Intereses corrientes')) {
        summaryValues['currentInterest'] = col4Value;
      } else if (col3.includes('Avances')) {
        summaryValues['advances'] = col4Value;
      } else if (col3.includes('Otros cargos')) {
        summaryValues['otherCharges'] = col4Value;
      } else if (col3 === 'Cargos') {
        summaryValues['totalCharges'] = col4Value;
      } else if (col3.includes('Pagos / abonos')) {
        summaryValues['paymentsCredits'] = col4Value;
      } else if (col3.includes('Saldo a favor')) {
        summaryValues['creditBalance'] = col4Value;
      }
    }

    return {
      previousBalance: summaryValues['previousBalance'] ?? 0,
      monthPurchases: summaryValues['monthPurchases'] ?? 0,
      lateInterest: summaryValues['lateInterest'] ?? 0,
      currentInterest: summaryValues['currentInterest'] ?? 0,
      advances: summaryValues['advances'] ?? 0,
      otherCharges: summaryValues['otherCharges'] ?? 0,
      totalCharges: summaryValues['totalCharges'] ?? 0,
      paymentsCredits: summaryValues['paymentsCredits'] ?? 0,
      creditBalance: summaryValues['creditBalance'] ?? 0,
    };
  }

  private extractTransactions(sheet: SheetData, cardInfo: CardInfo): RawTransaction[] {
    const transactions: RawTransaction[] = [];
    const rows = sheet.rows;
    let i = 0;

    while (i < rows.length) {
      const row = rows[i];

      if (this.isMovementsHeader(row)) {
        i++;
        if (i < rows.length && this.isTransactionHeaderRow(rows[i])) {
          i++;
        }

        while (i < rows.length) {
          const transactionRow = rows[i];
          if (
            !transactionRow ||
            this.isMovementsHeader(transactionRow) ||
            this.isEmpty(transactionRow)
          ) {
            break;
          }

          const transaction = this.parseTransactionRow(transactionRow, rows, i, cardInfo);
          if (transaction) {
            transactions.push(transaction);
          }
          i++;
        }
      } else {
        i++;
      }
    }

    return transactions;
  }

  private isMovementsHeader(row: RawRow | undefined): boolean {
    if (!row) {
      return false;
    }
    const firstCell = this.cellToString(row[0]);
    return firstCell.startsWith('Movimientos durante') || firstCell.startsWith('Movimientos antes');
  }

  private isTransactionHeaderRow(row: RawRow | undefined): boolean {
    if (!row) {
      return false;
    }
    const firstCell = this.cellToString(row[0]);
    return firstCell === 'Número de autorización';
  }

  private isEmpty(row: RawRow): boolean {
    return row.every(
      (cell) => cell === null || cell === undefined || this.cellToString(cell) === ''
    );
  }

  private parseTransactionRow(
    row: RawRow,
    allRows: RawRow[],
    rowIndex: number,
    cardInfo: CardInfo
  ): RawTransaction | null {
    const dateStr = this.cellToString(row[1]);
    if (!dateStr) {
      return null;
    }

    const description = this.cellToString(row[2]);
    if (!description) {
      return null;
    }

    if (this.isAdditionalInfoRow(row)) {
      return null;
    }

    const authNumber = this.cellToString(row[0]);
    const date = this.parseTransactionDate(dateStr, cardInfo.periodEnd);
    const amount = this.parseAmount(this.cellToString(row[3]));
    const installments = this.cellToString(row[4]);
    const installmentValue = this.parseAmount(this.cellToString(row[5]));
    const monthlyInterestRate = this.parsePercentage(this.cellToString(row[6]));
    const annualInterestRate = this.parsePercentage(this.cellToString(row[7]));
    const pendingBalance = this.parseAmount(this.cellToString(row[8]));

    let fullDescription = description;
    const nextRow = allRows[rowIndex + 1];
    if (nextRow && this.isAdditionalInfoRow(nextRow)) {
      const additionalInfo = this.cellToString(nextRow[2]);
      if (additionalInfo) {
        fullDescription = `${description} (${additionalInfo})`;
      }
    }

    return {
      authNumber,
      date,
      description: fullDescription,
      amount,
      installments,
      installmentValue,
      monthlyInterestRate,
      annualInterestRate,
      pendingBalance,
    };
  }

  private isAdditionalInfoRow(row: RawRow): boolean {
    const dateStr = this.cellToString(row[1]);
    const description = this.cellToString(row[2]);
    return !dateStr && description.startsWith('VR MONEDA ORIG');
  }

  private convertTransactions(rawTransactions: RawTransaction[]): StatementTransaction[] {
    return rawTransactions.map((raw) => {
      const type = this.determineTransactionType(raw.amount, raw.description);

      return {
        type,
        amount: Math.abs(raw.amount),
        description: raw.description,
        merchant: this.extractMerchant(raw.description),
        reference: raw.authNumber || undefined,
        transactionDate: raw.date,
      };
    });
  }

  private buildAccountInfo(cardInfo: CardInfo, summary: SummaryInfo): StatementAccountInfo {
    return {
      accountNumber: cardInfo.cardNumber,
      accountType: 'credit_card',
      periodStart: cardInfo.periodStart,
      periodEnd: cardInfo.periodEnd,
      openingBalance: summary.previousBalance,
      closingBalance: summary.totalCharges - summary.paymentsCredits,
    };
  }

  private parsePeriodDate(dateStr: string): Date {
    if (!dateStr) {
      return new Date();
    }

    const cleanStr = dateStr.trim();

    const spanishMonths: Record<string, number> = {
      ene: 0,
      feb: 1,
      mar: 2,
      abr: 3,
      may: 4,
      jun: 5,
      jul: 6,
      ago: 7,
      sep: 8,
      oct: 9,
      nov: 10,
      dic: 11,
    };

    const format1 = /^(\d{1,2})\s+(\w{3})\.\s+(\d{4})$/i;
    const match1 = cleanStr.match(format1);
    if (match1 && match1[1] && match1[2] && match1[3]) {
      const day = parseInt(match1[1], 10);
      const monthKey = match1[2].toLowerCase();
      const year = parseInt(match1[3], 10);
      const month = spanishMonths[monthKey] ?? 0;
      return new Date(year, month, day);
    }

    const format2 = /^(\w{3})\.\s+(\d{1,2}),\s+(\d{4})$/i;
    const match2 = cleanStr.match(format2);
    if (match2 && match2[1] && match2[2] && match2[3]) {
      const monthKey = match2[1].toLowerCase();
      const day = parseInt(match2[2], 10);
      const year = parseInt(match2[3], 10);
      const month = spanishMonths[monthKey] ?? 0;
      return new Date(year, month, day);
    }

    return new Date();
  }

  private parseTransactionDate(dateStr: string, _periodEnd: Date): Date {
    const parts = dateStr.split('/');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      throw new Error(`Invalid transaction date format: ${dateStr}`);
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      throw new Error(`Invalid date components: ${dateStr}`);
    }

    return new Date(year, month, day);
  }

  private parseAmount(amountStr: string): number {
    if (!amountStr) {
      return 0;
    }

    const isNegative = amountStr.startsWith('-');
    const cleanedStr = amountStr.replace(/[^\d.,]/g, '');

    const normalized = cleanedStr.replace(/\./g, '').replace(',', '.');
    const value = parseFloat(normalized) || 0;

    return isNegative ? -value : value;
  }

  private parsePercentage(percentStr: string): number {
    if (!percentStr) {
      return 0;
    }
    const cleanedStr = percentStr.replace(/[^\d.,]/g, '');
    const normalized = cleanedStr.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  }

  private cellToString(cell: CellValue): string {
    if (cell === null || cell === undefined) {
      return '';
    }
    return String(cell).trim();
  }

  private determineTransactionType(amount: number, description: string): TransactionType {
    const descLower = description.toLowerCase();

    if (amount < 0 || descLower.includes('abono') || descLower.includes('pago')) {
      if (descLower.includes('traslado saldo a favor')) {
        return 'transfer_in';
      }
      return 'income';
    }

    if (descLower.includes('intereses')) {
      return 'expense';
    }

    if (descLower.includes('cuota de manejo')) {
      return 'expense';
    }

    if (descLower.includes('avance')) {
      return 'expense';
    }

    return 'expense';
  }

  private extractMerchant(description: string): string | undefined {
    const prefixesToRemove = [
      'INTERESES CORRIENTES',
      'INTERESES MORA',
      'CUOTA DE MANEJO',
      'ABONO SUCURSAL VIRTUAL',
      'ABONO DEBITO POR MORA',
      'TRASLADO SALDO A FAVOR',
      'APLICACION SALDO A FAVO',
    ];

    for (const prefix of prefixesToRemove) {
      if (description.toUpperCase().startsWith(prefix)) {
        return undefined;
      }
    }

    const baseMerchant = description.split(' (')[0];
    if (!baseMerchant) {
      return undefined;
    }

    const cleanedMerchant = baseMerchant
      .replace(/^DLO\*/, '')
      .replace(/^BOLD\*/, '')
      .replace(/^MERCADO PAGO\*/, 'Mercado Pago - ')
      .replace(/^PV\s+/, '')
      .trim();

    return cleanedMerchant || undefined;
  }
}
