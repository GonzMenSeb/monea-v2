import { createDefaultRegistry } from './banks';

import type { ParserRegistry } from './ParserRegistry';
import type { BankInfo, ParsedTransaction, ParseError, ParseOutcome, ParseResult } from './types';

export class TransactionParser {
  private registry: ParserRegistry;

  constructor(registry?: ParserRegistry) {
    this.registry = registry ?? createDefaultRegistry();
  }

  parse(sms: string, _sender: string): ParseOutcome {
    const parser = this.registry.findParser(sms);

    if (!parser) {
      return this.createError('No bank pattern matched this message', sms);
    }

    const transaction = parser.parse(sms, _sender);

    if (!transaction) {
      return this.createError(
        `Failed to extract transaction data from ${parser.bank.name} message`,
        sms
      );
    }

    return this.createSuccess(parser.bank, transaction, sms);
  }

  canParse(sms: string): boolean {
    return this.registry.findParser(sms) !== undefined;
  }

  private createSuccess(
    bank: BankInfo,
    transaction: ParsedTransaction,
    rawSms: string
  ): ParseResult {
    return {
      success: true,
      bank,
      transaction,
      rawSms,
    };
  }

  private createError(error: string, rawSms: string): ParseError {
    return {
      success: false,
      error,
      rawSms,
    };
  }
}

export const transactionParser = new TransactionParser();
