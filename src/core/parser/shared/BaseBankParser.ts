import { parseAmount, parseDate } from '../extractors';
import { BANK_INFO, type TransactionPattern } from './patternHelpers';

import type { BankCode, BankInfo, BankParser, ParsedTransaction } from '../types';

export abstract class BaseBankParser implements BankParser {
  abstract readonly bankCode: BankCode;
  abstract readonly patterns: TransactionPattern[];

  get bank(): BankInfo {
    return BANK_INFO[this.bankCode];
  }

  canParse(sms: string, _sender: string): boolean {
    return this.patterns.some((pattern) => pattern.pattern.test(sms));
  }

  parse(sms: string, _sender: string): ParsedTransaction | null {
    for (const patternDef of this.patterns) {
      const match = patternDef.pattern.exec(sms);
      if (match) {
        return this.extractTransaction(match, patternDef);
      }
    }
    return null;
  }

  protected extractTransaction(
    match: RegExpExecArray,
    patternDef: TransactionPattern
  ): ParsedTransaction {
    const { groups, type } = patternDef;

    const amountStr = match[groups.amount];
    const amount = amountStr ? parseAmount(amountStr) : 0;

    const balanceStr = groups.balance !== undefined ? match[groups.balance] : undefined;
    const balanceAfter = balanceStr ? parseAmount(balanceStr) : undefined;

    const merchantRaw = groups.merchant !== undefined ? match[groups.merchant] : undefined;
    const merchant = merchantRaw?.trim();

    const dateStr = groups.date !== undefined ? match[groups.date] : undefined;
    const timeStr = groups.time !== undefined ? match[groups.time] : undefined;
    const transactionDate = parseDate(dateStr, timeStr);

    const accountNumber =
      groups.accountLast4 !== undefined ? match[groups.accountLast4] : undefined;

    return {
      type,
      amount,
      balanceAfter,
      merchant,
      transactionDate,
      accountNumber,
    };
  }
}
