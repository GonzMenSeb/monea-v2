import {
  BANK_INFO,
  BANK_PATTERNS,
  detectBankFromContent,
  parseAmount,
  parseDate,
  type TransactionPattern,
} from './BankPatterns';

import type {
  BankCode,
  BankInfo,
  BankParser,
  ParsedTransaction,
  ParseError,
  ParseOutcome,
  ParseResult,
} from './types';

function createBankParser(bankCode: BankCode): BankParser {
  const bank = BANK_INFO[bankCode];
  const patterns = BANK_PATTERNS[bankCode];

  return {
    bank,

    canParse(sms: string, _sender: string): boolean {
      return patterns.some((pattern) => pattern.pattern.test(sms));
    },

    parse(sms: string, _sender: string): ParsedTransaction | null {
      for (const patternDef of patterns) {
        const match = patternDef.pattern.exec(sms);
        if (match) {
          return extractTransaction(match, patternDef);
        }
      }
      return null;
    },
  };
}

function extractTransaction(
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

  const accountNumber = groups.accountLast4 !== undefined ? match[groups.accountLast4] : undefined;

  return {
    type,
    amount,
    balanceAfter,
    merchant,
    transactionDate,
    accountNumber,
  };
}

class ParserRegistry {
  private parsers: Map<BankCode, BankParser> = new Map();

  register(parser: BankParser): void {
    this.parsers.set(parser.bank.code, parser);
  }

  getParsers(): BankParser[] {
    return Array.from(this.parsers.values());
  }

  getParser(bankCode: BankCode): BankParser | undefined {
    return this.parsers.get(bankCode);
  }

  findParser(sms: string): BankParser | undefined {
    return this.getParsers().find((parser) => parser.canParse(sms, ''));
  }
}

function createDefaultRegistry(): ParserRegistry {
  const registry = new ParserRegistry();
  const bankCodes: BankCode[] = [
    'bancolombia',
    'davivienda',
    'bbva',
    'nequi',
    'daviplata',
    'bancoomeva',
  ];

  for (const code of bankCodes) {
    registry.register(createBankParser(code));
  }

  return registry;
}

export class TransactionParser {
  private registry: ParserRegistry;

  constructor(registry?: ParserRegistry) {
    this.registry = registry ?? createDefaultRegistry();
  }

  parse(sms: string, _sender: string): ParseOutcome {
    const bank = detectBankFromContent(sms);

    if (!bank) {
      return this.createError('No bank pattern matched this message', sms);
    }

    const parser = this.registry.getParser(bank.code);

    if (!parser) {
      return this.createError(`No parser registered for bank: ${bank.name}`, sms);
    }

    const transaction = parser.parse(sms, _sender);

    if (!transaction) {
      return this.createError(`Failed to extract transaction data from ${bank.name} message`, sms);
    }

    return this.createSuccess(bank, transaction, sms);
  }

  canParse(sms: string): boolean {
    return detectBankFromContent(sms) !== null;
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
