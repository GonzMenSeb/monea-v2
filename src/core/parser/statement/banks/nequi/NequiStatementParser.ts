import { PdfFileReader } from '../../readers';
import { BaseStatementParser } from '../../shared';

import type {
  BankCode,
  ParsedStatementResult,
  SheetData,
  StatementAccountInfo,
  StatementFileType,
  StatementMetadata,
  StatementTransaction,
  TransactionType,
} from '../../types';

const FILE_PATTERN = /extracto_cuenta\d{6}\.pdf$/i;

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
    const rawTransactions = this.extractRawTransactions(fileResult.sheets, accountHeader);
    const transactions = this.convertTransactions(rawTransactions);

    const account = this.buildAccountInfo(accountHeader, summaryInfo);

    return {
      bank: this.bank,
      account,
      transactions,
      rawFileName: metadata.fileName,
    };
  }

  private extractAccountHeader(_sheets: SheetData[]): AccountHeaderInfo {
    // TODO: Implement based on actual PDF structure analysis
    throw new Error('NequiStatementParser.extractAccountHeader not implemented');
  }

  private extractSummaryInfo(_sheets: SheetData[]): SummaryInfo {
    // TODO: Implement based on actual PDF structure analysis
    throw new Error('NequiStatementParser.extractSummaryInfo not implemented');
  }

  private extractRawTransactions(
    _sheets: SheetData[],
    _accountHeader: AccountHeaderInfo
  ): RawTransaction[] {
    // TODO: Implement based on actual PDF structure analysis
    throw new Error('NequiStatementParser.extractRawTransactions not implemented');
  }

  private convertTransactions(rawTransactions: RawTransaction[]): StatementTransaction[] {
    return rawTransactions.map((raw, index, allTransactions) => {
      const type = this.determineTransactionType(raw.amount, raw.description);
      const previousTransaction = allTransactions[index - 1];
      const balanceBefore = previousTransaction
        ? previousTransaction.balance
        : raw.balance - raw.amount;

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

  private determineTransactionType(amount: number, description: string): TransactionType {
    const descLower = description.toLowerCase();

    if (amount >= 0) {
      if (descLower.includes('transferencia recibida') || descLower.includes('recibido de')) {
        return 'transfer_in';
      }
      return 'income';
    }

    if (descLower.includes('transferencia enviada') || descLower.includes('enviado a')) {
      return 'transfer_out';
    }

    return 'expense';
  }

  private extractMerchant(description: string): string | undefined {
    const patterns = [
      /(?:COMPRA EN|PAGO EN|COMPRA)\s+(.+)/i,
      /(?:TRANSFERENCIA A|ENVIADO A)\s+(.+)/i,
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
