# Scaffold Bank SMS Parser

Create a new bank SMS parser following the strategy pattern.

## Arguments
- `$ARGUMENTS` - Bank name (e.g., "Bancolombia", "Davivienda", "BBVA", "Nequi", "Daviplata")

## Prerequisites
**IMPORTANT**: Before implementing a parser, you MUST have real SMS samples from the bank. Never assume SMS formats - they vary significantly between banks and can change over time.

Ask the user: "Please provide 3-5 real SMS message samples from {BankName} covering different transaction types (purchases, transfers, deposits, withdrawals)."

## Instructions

After receiving real SMS samples, create:

### 1. Pattern File: `src/core/parser/patterns/{BankName}.ts`

```typescript
import type { ParserStrategy, ParsedTransaction } from '../types';

const {BANK_NAME}_PATTERNS = {
  purchase: /pattern-based-on-real-samples/,
  transfer: /pattern-based-on-real-samples/,
  deposit: /pattern-based-on-real-samples/,
  withdrawal: /pattern-based-on-real-samples/,
};

function extractAmount(text: string): number | null {
  // Bank-specific amount extraction
}

function extractMerchant(text: string): string | null {
  // Bank-specific merchant extraction
}

function extractDate(text: string): Date | null {
  // Bank-specific date extraction
}

export const {bankName}Parser: ParserStrategy = {
  bankId: '{bank-id}',
  bankName: '{BankName}',

  canParse(sender: string, body: string): boolean {
    // Check if message is from this bank
  },

  parse(sender: string, body: string, receivedAt: Date): ParsedTransaction | null {
    // Implement parsing logic
  },
};
```

### 2. Test File: `src/core/parser/patterns/{BankName}.test.ts`

```typescript
import { {bankName}Parser } from './{BankName}';

const REAL_SAMPLES = {
  purchase: `actual SMS text from bank`,
  transfer: `actual SMS text from bank`,
  // ... more samples
};

describe('{BankName} Parser', () => {
  describe('canParse', () => {
    it('identifies {BankName} messages', () => {
      expect({bankName}Parser.canParse('BankSender', REAL_SAMPLES.purchase)).toBe(true);
    });

    it('rejects non-{BankName} messages', () => {
      expect({bankName}Parser.canParse('OtherBank', 'Some text')).toBe(false);
    });
  });

  describe('parse', () => {
    it('extracts purchase transaction correctly', () => {
      const result = {bankName}Parser.parse('BankSender', REAL_SAMPLES.purchase, new Date());
      expect(result).toMatchObject({
        type: 'expense',
        amount: expect.any(Number),
        merchant: expect.any(String),
      });
    });

    // Test each transaction type with real samples
  });
});
```

### 3. Register Parser: `src/core/parser/ParserRegistry.ts`

Add to the registry:
```typescript
import { {bankName}Parser } from './patterns/{BankName}';

// In the parsers array:
parsers: [
  // ... existing parsers
  {bankName}Parser,
],
```

## Colombian Banks Reference
- **Bancolombia**: Sender often "Bancolombia", blue branding
- **Davivienda**: Sender often "Davivienda", red branding
- **BBVA**: Sender often "BBVA Colombia"
- **Nequi**: Sender often "Nequi", Bancolombia subsidiary
- **Daviplata**: Sender often "Daviplata", Davivienda's digital wallet

## Testing Requirements
- 100% test coverage for parser logic
- Test with real SMS samples only
- Include edge cases (partial messages, unusual amounts)
- Test all transaction types supported by the bank
