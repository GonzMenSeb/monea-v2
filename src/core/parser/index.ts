import { createDefaultRegistry } from './banks';

import type { BankInfo } from './types';

export { TransactionParser, transactionParser } from './TransactionParser';
export { ParserRegistry } from './ParserRegistry';

export {
  BANCOLOMBIA_PATTERNS,
  BANCOOMEVA_PATTERNS,
  BBVA_PATTERNS,
  BancolombiaParser,
  BancoomevaParser,
  BbvaParser,
  DAVIPLATA_PATTERNS,
  DAVIVIENDA_PATTERNS,
  DaviplataParser,
  DaviviendaParser,
  NEQUI_PATTERNS,
  NequiParser,
  createDefaultRegistry,
} from './banks';

const defaultRegistry = createDefaultRegistry();

export function detectBankFromContent(smsBody: string): BankInfo | null {
  const parser = defaultRegistry.findParser(smsBody);
  return parser ? parser.bank : null;
}

export { BANK_INFO, BaseBankParser, PATTERNS, type TransactionPattern } from './shared';

export {
  extractAmount,
  formatCOP,
  isValidCOPAmount,
  parseAmount,
  type AmountExtractionResult,
} from './AmountExtractor';

export {
  extractDate,
  formatCODate,
  formatCODateTime,
  isValidDateString,
  isValidTimeString,
  parseDate,
  parseTimeOnly,
  type DateExtractionResult,
} from './DateExtractor';

export {
  categorizeMerchant,
  extractDescription,
  extractMerchant,
  extractReference,
  isKnownMerchant,
  normalizeMerchant,
  type MerchantCategory,
  type MerchantExtractionResult,
} from './MerchantExtractor';

export type {
  BankCode,
  BankInfo,
  BankParser,
  ParsedTransaction,
  ParseError,
  ParseOutcome,
  ParseResult,
  TransactionType,
} from './types';
