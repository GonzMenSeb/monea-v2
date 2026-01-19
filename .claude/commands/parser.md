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
  name: '{BankName}',
  senders: ['{BankSender}', '{ShortCode}'],
},
```

Add to `BANK_PATTERNS`:
```typescript
{bankCode}: {
  purchase: /pattern-from-real-samples/i,
  withdrawal: /pattern-from-real-samples/i,
  transferIn: /pattern-from-real-samples/i,
  transferOut: /pattern-from-real-samples/i,
},
```

### 2. Add Tests: `src/core/parser/__tests__/{BankName}.test.ts`

```typescript
import { getBankBySender, BANK_PATTERNS } from '../BankPatterns';
import { transactionParser } from '../TransactionParser';

const REAL_SAMPLES = {
  purchase: `actual SMS text from bank`,
  transfer: `actual SMS text from bank`,
};

describe('{BankName} Parser', () => {
  describe('bank identification', () => {
    it('identifies {BankName} by sender', () => {
      const bank = getBankBySender('{BankSender}');
      expect(bank).toBe('{bankCode}');
    });
  });

  describe('transaction parsing', () => {
    it('extracts purchase transaction correctly', () => {
      const result = transactionParser.parse({
        address: '{BankSender}',
        body: REAL_SAMPLES.purchase,
        date: Date.now(),
      });

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
