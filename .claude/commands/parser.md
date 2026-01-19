# Scaffold Bank SMS Parser

Create a new bank SMS parser following the modular strategy pattern.

## Arguments
- `$ARGUMENTS` - Bank name (e.g., "Bancolombia", "Davivienda", "BBVA", "Nequi", "Daviplata")

## Prerequisites
**IMPORTANT**: Before implementing a parser, you MUST have real SMS samples from the bank. Never assume SMS formats - they vary significantly between banks and can change over time.

Ask the user: "Please provide 3-5 real SMS message samples from {BankName} covering different transaction types (purchases, transfers, deposits, withdrawals)."

## Instructions

After receiving real SMS samples, create the modular parser structure:

### 1. Create Bank Directory: `src/core/parser/banks/{bankcode}/`

### 2. Create Patterns File: `src/core/parser/banks/{bankcode}/patterns.ts`

```typescript
import { PATTERNS, type TransactionPattern } from '../../shared';

export const {BANKCODE}_PATTERNS: TransactionPattern[] = [
  {
    type: 'expense',
    pattern: /pattern-from-real-samples/i,
    groups: { amount: 1, merchant: 2, date: 3, ... },
  },
  // ... other transaction types
];
```

### 3. Create Parser Class: `src/core/parser/banks/{bankcode}/{BankName}Parser.ts`

```typescript
import { {BANKCODE}_PATTERNS } from './patterns';
import { BaseBankParser, type TransactionPattern } from '../../shared';
import type { BankCode } from '../../types';

export class {BankName}Parser extends BaseBankParser {
  readonly bankCode: BankCode = '{bankcode}';
  readonly patterns: TransactionPattern[] = {BANKCODE}_PATTERNS;
}
```

### 4. Create Index Export: `src/core/parser/banks/{bankcode}/index.ts`

```typescript
export { {BankName}Parser } from './{BankName}Parser';
export { {BANKCODE}_PATTERNS } from './patterns';
```

### 5. Register Parser: `src/core/parser/banks/index.ts`

Add import and registration:
```typescript
import { {BankName}Parser } from './{bankcode}';

// In createDefaultRegistry():
registry.register(new {BankName}Parser());
```

### 6. Add Bank Code Type: `src/core/parser/types.ts`

Add to `BankCode` type union:
```typescript
export type BankCode = 'bancolombia' | 'nequi' | ... | '{bankcode}';
```

### 7. Add Bank Info: `src/core/parser/shared/patternHelpers.ts`

Add to `BANK_INFO`:
```typescript
{bankcode}: {
  code: '{bankcode}',
  name: '{BankName}',
},
```

### 8. Create Tests: `src/core/parser/banks/{bankcode}/__tests__/{BankName}Parser.test.ts`

```typescript
import { {BankName}Parser } from '../{BankName}Parser';

describe('{BankName}Parser', () => {
  const parser = new {BankName}Parser();

  describe('bank info', () => {
    it('has correct bank code', () => {
      expect(parser.bankCode).toBe('{bankcode}');
    });

    it('has correct bank name', () => {
      expect(parser.bank.name).toBe('{BankName}');
    });
  });

  describe('transaction parsing', () => {
    it('parses purchase transaction', () => {
      const sms = `actual SMS text from bank`;
      const result = parser.parse(sms, 'sender');

      expect(result).not.toBeNull();
      if (result) {
        expect(result.type).toBe('expense');
        expect(result.amount).toBeGreaterThan(0);
      }
    });
  });
});
```

### 9. Update Documentation

Add patterns to `docs/SMS_PATTERNS.md` with real examples.

## Colombian Banks Reference
- **Bancolombia**: Messages start with "Bancolombia le informa" or "Bancolombia:"
- **Davivienda**: Messages start with "Davivienda:"
- **BBVA**: Messages start with "BBVA:"
- **Nequi**: Messages start with "Nequi:" or "*Nequi*:"
- **Daviplata**: Messages start with "DaviPlata:"
- **Bancoomeva**: Messages start with "Bancoomeva informa"

## Testing Requirements
- 100% test coverage for parser logic
- Test with real SMS samples only
- Include edge cases (partial messages, unusual amounts)
- Test all transaction types supported by the bank
- Test content-based bank detection using `canParse()`
