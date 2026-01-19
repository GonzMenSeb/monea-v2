import type { BankCode, BankParser } from './types';

export class ParserRegistry {
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
