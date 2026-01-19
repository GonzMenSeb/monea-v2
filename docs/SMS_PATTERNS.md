# SMS Patterns Documentation

This document describes the SMS message patterns used to parse bank transaction notifications from Colombian financial institutions.

## Supported Banks

| Bank | Code | Content Identifier |
|------|------|-------------------|
| Bancolombia | `bancolombia` | `Bancolombia le informa...`, `Bancolombia:...` |
| Davivienda | `davivienda` | `Davivienda:...` |
| BBVA Colombia | `bbva` | `BBVA:...` |
| Nequi | `nequi` | `Nequi:...`, `*Nequi*:...` |
| Daviplata | `daviplata` | `DaviPlata:...` |
| Bancoomeva | `bancoomeva` | `Bancoomeva informa...` |

**Note:** Bank detection is based on **message content**, not SMS sender. This ensures universal compatibility regardless of carrier short codes.

## Transaction Types

| Type | Description |
|------|-------------|
| `income` | Money received (transfers, deposits) |
| `expense` | Money spent (purchases, payments, withdrawals) |
| `transfer_out` | Money sent to another account |

## Message Patterns

### Bancolombia

#### Purchase/Payment (expense)
```
Bancolombia le informa compra por $[AMOUNT] en [MERCHANT] [DATE] [TIME]. T.[ACCOUNT]. Saldo: $[BALANCE]
```
Example:
```
Bancolombia le informa compra por $50.000 en EXITO COLOMBIA 17/01/2026 14:30. T.*1234. Saldo: $450.000
```

#### Withdrawal (expense)
```
Bancolombia le informa retiro por $[AMOUNT] en [MERCHANT] [DATE] [TIME]. Cta.*[ACCOUNT]. Saldo: $[BALANCE]
```
Example:
```
Bancolombia le informa retiro por $200.000 en CAJERO BANCOLOMBIA 17/01/2026 10:15. Cta.*5678. Saldo: $300.000
```

#### Received Transfer (income)
```
Bancolombia le informa transferencia recibida por $[AMOUNT] de [SENDER] [DATE] [TIME]. Cta.*[ACCOUNT]. Saldo: $[BALANCE]
```
Example:
```
Bancolombia le informa transferencia recibida por $1.500.000 de JUAN PEREZ 17/01/2026 09:00. Cta.*1234. Saldo: $2.000.000
```

#### Sent Transfer (transfer_out)
```
Bancolombia le informa transferencia enviada por $[AMOUNT] a [RECIPIENT] [DATE] [TIME]. Cta.*[ACCOUNT]. Saldo: $[BALANCE]
```
Example:
```
Bancolombia le informa transferencia enviada por $500.000 a MARIA GARCIA 17/01/2026 15:45. Cta.*1234. Saldo: $1.000.000
```

### Davivienda

#### Purchase/Payment (expense)
```
Davivienda: compra por $[AMOUNT] en [MERCHANT] [DATE]. Saldo: $[BALANCE]
```
Example:
```
Davivienda: compra por $75.000 en FALABELLA 17/01/2026. Saldo: $325.000
```

#### Withdrawal (expense)
```
Davivienda: retiro por $[AMOUNT] en [MERCHANT] [DATE]. Saldo: $[BALANCE]
```

#### Received Transfer (income)
```
Davivienda: transferencia recibida por $[AMOUNT] de [SENDER] [DATE]. Saldo: $[BALANCE]
```

#### Sent Transfer (transfer_out)
```
Davivienda: transferencia enviada por $[AMOUNT] a [RECIPIENT] [DATE]. Saldo: $[BALANCE]
```

### BBVA Colombia

#### Purchase/Payment (expense)
```
BBVA: compra por $[AMOUNT] en [MERCHANT] Cta.*[ACCOUNT] [DATE]. Saldo: $[BALANCE]
```
Example:
```
BBVA: compra por $120.000 en ALKOSTO Cta.*9012 17/01/2026. Saldo: $880.000
```

#### Withdrawal (expense)
```
BBVA: retiro por $[AMOUNT] en [MERCHANT] Cta.*[ACCOUNT] [DATE]. Saldo: $[BALANCE]
```

#### Received Transfer (income)
```
BBVA: transferencia recibida por $[AMOUNT] de [SENDER] Cta.*[ACCOUNT] [DATE]. Saldo: $[BALANCE]
```

#### Sent Transfer (transfer_out)
```
BBVA: transferencia enviada por $[AMOUNT] a [RECIPIENT] Cta.*[ACCOUNT] [DATE]. Saldo: $[BALANCE]
```

### Nequi

#### Purchase/Payment (expense)
```
Nequi: Pagaste $[AMOUNT] en [MERCHANT]. Saldo: $[BALANCE]
```
or
```
*Nequi*: Compraste $[AMOUNT] en [MERCHANT]. Saldo: $[BALANCE]
```
Example:
```
Nequi: Pagaste $35.000 en RAPPI. Saldo: $165.000
```

#### Withdrawal (expense)
```
Nequi: Retiraste $[AMOUNT] en [MERCHANT]. Saldo: $[BALANCE]
```

#### Received Transfer (income)
```
Nequi: Recibiste $[AMOUNT] de [SENDER]. Saldo: $[BALANCE]
```
or
```
*Nequi*: Te enviaron $[AMOUNT] de [SENDER]. Saldo: $[BALANCE]
```
Example:
```
Nequi: Recibiste $100.000 de Carlos. Saldo: $265.000
```

#### Sent Transfer (transfer_out)
```
Nequi: Enviaste $[AMOUNT] a [RECIPIENT]. Saldo: $[BALANCE]
```
Example:
```
Nequi: Enviaste $50.000 a Ana. Saldo: $150.000
```

### Daviplata

#### Purchase/Payment (expense)
```
DaviPlata: Pago por $[AMOUNT] en [MERCHANT]. Saldo: $[BALANCE]
```
or
```
DaviPlata: Compra por $[AMOUNT] en [MERCHANT]. Saldo: $[BALANCE]
```
Example:
```
DaviPlata: Pago por $25.000 en TIENDA D1. Saldo: $75.000
```

#### Withdrawal (expense)
```
DaviPlata: Retiro por $[AMOUNT] en [MERCHANT]. Saldo: $[BALANCE]
```

#### Received Transfer (income)
```
DaviPlata: Recibiste $[AMOUNT] de [SENDER]. Saldo: $[BALANCE]
```
or
```
DaviPlata: Te enviaron $[AMOUNT] de [SENDER]. Saldo: $[BALANCE]
```

#### Sent Transfer (transfer_out)
```
DaviPlata: Enviaste $[AMOUNT] a [RECIPIENT]. Saldo: $[BALANCE]
```

### Bancoomeva

#### Online Purchase (expense)
```
Bancoomeva informa compra por Internet en [MERCHANT] por $[AMOUNT] con su tarjeta Credito [LAST4] el [DATE]:[TIME]
```
Example:
```
Bancoomeva informa compra por Internet en SPOTIFY por $16.900 con su tarjeta Credito 1234 el 17/01/2026:14:30
```

## Amount Formats

Colombian Peso (COP) amounts may appear in various formats:

| Format | Example | Value |
|--------|---------|-------|
| With dots as thousands separator | `$1.500.000` | 1,500,000 COP |
| With commas as thousands separator | `$1,500,000` | 1,500,000 COP |
| Without currency symbol | `1500000` | 1,500,000 COP |
| With decimal places | `$1.500.000,00` | 1,500,000 COP |

## Date Formats

Dates in SMS messages typically follow these formats:

| Format | Example |
|--------|---------|
| DD/MM/YYYY | `17/01/2026` |
| DD/MM/YY | `17/01/26` |
| DD-MM-YYYY | `17-01-2026` |

## Adding New Bank Support

To add support for a new bank:

1. Collect sample SMS messages from the bank (at least 3-5 real samples)
2. Identify the message patterns for each transaction type
3. Add bank to `BANK_INFO` in `src/core/parser/BankPatterns.ts`:
   ```typescript
   [bank-code]: {
     code: 'bank-code',
     name: 'Bank Name',
   }
   ```
4. Add patterns to `BANK_PATTERNS` in the same file:
   ```typescript
   [bank-code]: [
     {
       type: 'expense',
       pattern: /regex-pattern/i,
       groups: { amount: 1, merchant: 2, ... }
     },
     // ... other transaction types
   ]
   ```
5. Add comprehensive tests in `src/core/parser/__tests__/`
6. Test with `npm test parser`
7. Update this documentation with the new bank's patterns

### Pattern Guidelines

- Use case-insensitive matching (`/i` flag)
- Make optional parts non-capturing where possible
- Account for variations in spacing
- Test with real SMS samples
- Bank is detected from **message content** (e.g., "Bancolombia:" prefix), not SMS sender
- Patterns must uniquely identify the bank within the message body

## Testing

Run parser tests:
```bash
npm test parser
```

Parser tests should cover:
- All transaction types for each bank
- Edge cases (missing fields, unusual formatting)
- Amount parsing accuracy
- Date extraction
- Merchant name extraction
- Content-based bank detection (using `detectBankFromContent()`)
