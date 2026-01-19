# Scaffold Bank SMS Parser

Create a new bank SMS parser following the strategy pattern.

## Arguments
- `$ARGUMENTS` - Bank name (e.g., "Bancolombia", "Davivienda", "BBVA", "Nequi", "Daviplata")

## Prerequisites
**IMPORTANT**: Before implementing a parser, you MUST have real SMS samples from the bank. Never assume SMS formats - they vary significantly between banks and can change over time.

Ask the user: "Please provide 3-5 real SMS message samples from {BankName} covering different transaction types (purchases, transfers, deposits, withdrawals)."

## Instructions

After receiving real SMS samples, update the centralized parser configuration:

### 1. Add Bank Info: `src/core/parser/BankPatterns.ts`

Add to `BANK_INFO`:
```typescript
{bankCode}: {
  code: '{bankCode}',
  name: '{BankName}',
},
```

Add to `BANK_PATTERNS`:
```typescript
{bankCode}: [
  {
    type: 'expense',
    pattern: /pattern-from-real-samples/i,
    groups: { amount: 1, merchant: 2, date: 3, ... },
  },
  // ... other transaction types
],
```

**Note:** Bank detection is **content-based**. The pattern must uniquely identify the bank from the message body (e.g., "Bancolombia:" prefix).

### 2. Add Tests: `src/core/parser/__tests__/{BankName}.test.ts`

```typescript
import { detectBankFromContent, BANK_PATTERNS } from '../BankPatterns';
import { transactionParser } from '../TransactionParser';

const REAL_SAMPLES = {
  purchase: `actual SMS text from bank`,
  transfer: `actual SMS text from bank`,
};

describe('{BankName} Parser', () => {
  describe('bank identification', () => {
    it('identifies {BankName} from message content', () => {
      const bank = detectBankFromContent(REAL_SAMPLES.purchase);
      expect(bank?.code).toBe('{bankCode}');
    });
  });

  describe('transaction parsing', () => {
    it('extracts purchase transaction correctly', () => {
      const result = transactionParser.parse(REAL_SAMPLES.purchase, 'any-sender');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.transaction.type).toBe('expense');
        expect(result.transaction.amount).toBeGreaterThan(0);
      }
    });
  });
});
```

### 3. Update Documentation

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
- Test content-based bank detection using `detectBankFromContent()`
