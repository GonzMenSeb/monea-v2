# Bank Statement Formats Documentation

This document describes the bank statement file formats supported by Monea for automated transaction ingestion and balance tracking.

## Overview

Bank statements provide the most reliable source of transaction data, including:
- **Running balances** (exact account balance before/after each transaction)
- **Complete transaction history** for a statement period
- **Account information** (account number, type, holder name)
- **Period summaries** (opening balance, closing balance, totals)

Unlike SMS parsing, statements offer comprehensive historical data and precise balance information, making them ideal for account reconciliation and balance tracking.

## Supported Statement Formats

| Bank | Account Type | File Format | Password Protected | Parser Class |
|------|--------------|-------------|-------------------|--------------|
| Bancolombia | Savings | XLSX | No | `BancolombiaSavingsParser` |
| Bancolombia | Credit Card (Mastercard) | XLSX | No | `BancolombiaCardParser` |
| Bancolombia | Credit Card (Amex) | XLSX | No | `BancolombiaCardParser` |
| Nequi | Savings | PDF | Yes (User ID) | `NequiStatementParser` |

## Bancolombia Statements

### Savings Account (XLSX)

#### File Naming Convention
```
Extracto_YYYYMM_Cuentas_de ahorro_XXXX.xlsx
```
- `YYYYMM`: Statement period (year + month)
- `XXXX`: Last 4 digits of account number

**Examples:**
- `Extracto_202412_Cuentas_de ahorro_0810.xlsx`
- `Extracto_202503_Cuentas_de ahorro_9855.xlsx`

#### File Structure

Bancolombia savings statements use a multi-section XLSX format with labeled sections:

1. **Información General** (General Information)
   - Headers: `DESDE`, `HASTA`, `TIPO CUENTA`, `NRO CUENTA`, `SUCURSAL`
   - Contains: Period dates, account type, account number

2. **Resumen** (Summary)
   - Headers: `SALDO ANTERIOR`, `TOTAL ABONOS`, `TOTAL CARGOS`, `SALDO ACTUAL`, `SALDO PROMEDIO`, `CUPO SUGERIDO`, `INTERESES`, `RETEFUENTE`
   - Contains: Opening balance, total credits, total debits, closing balance

3. **Movimientos** (Movements)
   - Headers: `FECHA`, `DESCRIPCIÓN`, `SUCURSAL`, `DCTO.`, `VALOR`, `SALDO`
   - Contains: Transaction date (DD/MM format), description, amount, running balance
   - Multiple movement sections may appear in a single statement

#### Date Format
- Period dates: `YYYY/MM/DD` (e.g., `2024/12/01`)
- Transaction dates: `DD/MM` (e.g., `15/12`)
  - Year is inferred from statement period
  - Cross-year periods are handled correctly

#### Amount Format
- Colombian Pesos (COP)
- Decimal separator: `.` (period)
- Negative amounts: Prefixed with `-` sign
- Example: `-1500.00` (expense), `2000.00` (income)

#### Transaction Patterns
The parser identifies transaction types based on description keywords:

| Type | Description Patterns | Example |
|------|---------------------|---------|
| `income` | General income | `CONSIGNACION EFECTIVO` |
| `transfer_in` | `transferencia desde`, `transf qr` | `TRANSFERENCIA DESDE JUAN` |
| `transfer_out` | `transferencia a`, `transferencia cta` | `TRANSFERENCIA A MARIA` |
| `expense` | Purchases, withdrawals | `COMPRA EN EXITO`, `RETIRO CAJERO` |

#### Merchant Extraction
Patterns used to extract merchant names:
- `COMPRA EN [MERCHANT]`
- `PAGO QR [MERCHANT]`
- `TRANSF QR [MERCHANT]`
- `RETIRO CAJERO [MERCHANT]`

### Credit Card - Mastercard/Amex (XLSX)

#### File Naming Convention
```
Extracto_YYYYMM_{Mastercard|Amex}_Detallado_XXXX.xlsx
```
- `YYYYMM`: Statement period (year + month)
- `{Mastercard|Amex}`: Card brand
- `XXXX`: Last 4 digits of card number

**Examples:**
- `Extracto_202512_Mastercard_Detallado_1194.xlsx`
- `Extracto_202601_Amex_Detallado_1916.xlsx`

#### File Structure

Credit card statements have a different structure optimized for card transactions:

1. **Card Information Section** (First ~15 rows)
   - `Información de la Tarjeta`: Card number
   - `Moneda`: Currency (PESOS or DOLARES)
   - `Periodo facturado`: Billing period dates
   - `Pagar antes de`: Payment due date
   - `Pago mínimo`: Minimum payment amount
   - `Pago total`: Total payment amount
   - `Cupo total`: Total credit limit
   - `Cupo disponible`: Available credit

2. **Summary Section**
   - Located in column 3-4 of early rows
   - `Saldo anterior`: Previous balance
   - `Compras del mes`: Month's purchases
   - `Intereses de mora`: Late interest
   - `Intereses corrientes`: Current interest
   - `Avances`: Cash advances
   - `Otros cargos`: Other charges
   - `Cargos`: Total charges
   - `Pagos / abonos`: Payments/credits
   - `Saldo a favor`: Credit balance

3. **Movements Sections**
   - Multiple sections starting with `Movimientos durante...` or `Movimientos antes...`
   - Transaction header: `Número de autorización`, `Fecha`, `Descripción`, `Valor`, etc.
   - Columns: Auth number, date (DD/MM/YYYY), description, amount, installments, interest rates, pending balance

4. **Multi-Sheet Support**
   - PESOS sheet: Transactions in Colombian Pesos
   - DOLARES sheet: Transactions in US Dollars (if applicable)
   - Parser processes all sheets and combines transactions

#### Date Formats
- Period dates: Spanish format (e.g., `15 ene. 2025`, `dic. 31, 2024`)
- Transaction dates: `DD/MM/YYYY` (e.g., `25/12/2024`)

#### Amount Format
- Colombian Pesos (COP)
- Thousands separator: `,` (comma)
- Decimal separator: `.` (period)
- Example: `1,500,000.00`

#### Transaction Type Detection

| Type | Condition | Example Description |
|------|-----------|---------------------|
| `income` | Negative amount OR contains "abono", "pago" | `ABONO SUCURSAL VIRTUAL`, `PAGO RECIBIDO` |
| `transfer_in` | Income + contains "traslado saldo a favor" | `TRASLADO SALDO A FAVOR` |
| `expense` | Positive amount (purchases, interest, fees) | `COMPRA EN EXITO`, `INTERESES CORRIENTES` |

#### Merchant Extraction
The parser cleans merchant names by:
- Removing prefixes: `DLO*`, `BOLD*`, `PV `
- Transforming: `MERCADO PAGO*` → `Mercado Pago - `
- Excluding system entries: `INTERESES CORRIENTES`, `CUOTA DE MANEJO`, etc.
- Extracting base merchant (before parentheses)

Additional transaction info (e.g., `VR MONEDA ORIG`) is appended to description in parentheses.

## Nequi Statements

### Savings Account (PDF)

#### File Naming Convention
```
extracto_cuenta{YYYYMM}.pdf
```
- `YYYYMM`: Statement period (year + month)

**Examples:**
- `extracto_cuenta202412.pdf`
- `extracto_cuenta202501.pdf`

#### Password Protection
- **Password Required**: Yes
- **Password Format**: User's Colombian ID number (cédula)
- Password must be provided in `StatementMetadata.password` field

#### File Structure

Nequi statements are PDF documents with a text-based layout:

1. **Account Header** (First page)
   - `Extracto de cuenta de ahorro de:`
   - Followed by account holder's full name
   - `Número de cuenta de ahorro: XXXXXXXXXX`
   - `Estado de cuenta para el período de: YYYY/MM/DD a YYYY/MM/DD`

2. **Transaction Section**
   - Header row: `Fecha del movimiento`, `Descripción`, `Valor`, `Saldo`
   - Transaction rows: Date, description, amount, running balance
   - Transactions may span multiple pages

3. **Summary Section** (First page)
   - `Saldo anterior`: Opening balance
   - `Saldo actual`: Closing balance
   - `Total abonos`: Total credits
   - `Total cargos`: Total debits
   - Other summary fields (average balance, interest, etc.)

#### Date Format
- Period dates: `YYYY/MM/DD` (e.g., `2025/10/01`)
- Transaction dates: `DD/MM/YYYY` (e.g., `15/10/2025`)

#### Amount Format
- Colombian Pesos (COP)
- Thousands separator: `,` (comma)
- Decimal separator: `.` (period)
- Negative amounts: May include `-` sign
- Example: `$-3,600.00` (expense), `$30,000.00` (income)

#### Transaction Type Detection

| Type | Condition | Example Description |
|------|-----------|---------------------|
| `income` | Amount ≥ 0 + general income | `PAGO DE INTERESES`, `REVERSO` |
| `transfer_in` | Amount ≥ 0 + transfer keywords | `RECIBÍ DE`, `Otros bancos de`, `RECARGA DESDE` |
| `transfer_out` | Amount < 0 + transfer keywords | `Para NOMBRE`, `Envio a otros bancos a`, `ENVIADO A` |
| `expense` | Amount < 0 + other | `COMPRA EN`, `PAGO FACTURA` |

#### Merchant Extraction
Patterns used to identify merchants or counterparties:
- `COMPRA (?:EN|PSE EN) [MERCHANT]`
- `PAGO EN (?:QR BRE-B: )?[MERCHANT]`
- `PAGO FACTURA [MERCHANT]`
- `Para [RECIPIENT]`
- `Envio a otros bancos a [RECIPIENT]`
- `ENVIO CON BRE-B (?:A|DE): [NAME]`
- `(?:De|Otros bancos de) [SENDER]`
- `RECIBÍ A MI LLAVE DE: [SENDER]`

#### Multi-Page Support
The parser processes all PDF pages sequentially:
- Detects transaction sections by finding header row
- Stops parsing when encountering summary/footer indicators
- Combines transactions from all pages
- Sorts transactions chronologically

## Common Fields

All parsers extract these standard fields:

### Account Information
```typescript
interface StatementAccountInfo {
  accountNumber: string;        // Account/card number
  accountType: AccountType;      // 'savings' | 'checking' | 'credit_card'
  holderName?: string;          // Account holder name (if available)
  periodStart: Date;            // Statement period start date
  periodEnd: Date;              // Statement period end date
  openingBalance: number;       // Balance at period start
  closingBalance: number;       // Balance at period end
}
```

### Transaction Information
```typescript
interface StatementTransaction {
  type: TransactionType;        // 'income' | 'expense' | 'transfer_in' | 'transfer_out'
  amount: number;               // Absolute transaction amount (always positive)
  balanceBefore?: number;       // Account balance before transaction
  balanceAfter?: number;        // Account balance after transaction
  merchant?: string;            // Merchant name or counterparty
  description?: string;         // Full transaction description
  reference?: string;           // Transaction reference (e.g., auth number)
  transactionDate: Date;        // Transaction date
}
```

### Bank Information
```typescript
interface BankInfo {
  code: BankCode;              // 'bancolombia' | 'nequi'
  name: string;                // Display name
  color: string;               // Brand color (hex)
}
```

## Parser Architecture

### Class Hierarchy
```
BaseStatementParser (abstract)
├── BancolombiaSavingsParser
├── BancolombiaCardParser
└── NequiStatementParser
```

### Detection Strategy

Parsers use **filename patterns** to determine if they can parse a file:

| Parser | Pattern |
|--------|---------|
| BancolombiaSavingsParser | `/Cuentas_de\s*ahorro/i` |
| BancolombiaCardParser | `/(Mastercard\|Amex)_Detallado/i` |
| NequiStatementParser | `/extracto_cuenta\d{6}\.pdf$/i` |

The `StatementParserRegistry` automatically:
1. Checks filename against all registered parsers
2. Returns the matching parser
3. Falls back to content-based detection if needed

### File Readers

Two specialized file readers handle different formats:

#### XlsxFileReader
- Reads Excel files (.xlsx)
- Extracts all sheets as 2D arrays
- Returns structured `FileReadResult` with sheet data
- Used by: Bancolombia parsers

#### PdfFileReader
- Reads PDF files (.pdf)
- Supports password-protected PDFs
- Extracts text content page-by-page
- Parses text into row/column structure
- Returns pages as "sheets" in `FileReadResult`
- Used by: Nequi parser

## Adding New Statement Support

To add support for a new bank's statement format:

### 1. Collect Sample Files
- Obtain 3-5 real statement files from the bank
- Include different account types if applicable
- Note password requirements
- Add samples to `tmp/bank_statement_samples/{bankcode}/`

### 2. Create Parser Class
```typescript
// src/core/parser/statement/banks/{bankcode}/{BankName}Parser.ts
import { BaseStatementParser } from '../../shared';
import type { BankCode, StatementFileType, StatementMetadata, ParsedStatementResult } from '../../types';

const FILE_PATTERN = /pattern-for-filename/i;

export class BankNameParser extends BaseStatementParser {
  readonly bankCode: BankCode = 'bankcode';
  readonly supportedFileTypes: StatementFileType[] = ['xlsx' | 'pdf' | 'csv'];

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return FILE_PATTERN.test(metadata.fileName);
  }

  async parseStatement(data: Buffer, metadata: StatementMetadata): Promise<ParsedStatementResult> {
    // Implementation
  }
}
```

### 3. Implement Required Methods
- `matchesFilePattern()`: Return true if filename matches expected pattern
- `parseStatement()`: Parse buffer data into `ParsedStatementResult`
- Use appropriate file reader (`XlsxFileReader` or `PdfFileReader`)
- Extract account info, summary, and transactions

### 4. Register Parser
```typescript
// src/core/parser/statement/banks/{bankcode}/index.ts
export { BankNameParser } from './BankNameParser';

// src/core/parser/statement/banks/index.ts
import { BankNameParser } from './bankcode';

export function registerStatementParsers(registry: StatementParserRegistry): void {
  // ... existing parsers
  registry.register(new BankNameParser());
}
```

### 5. Add Bank Code
```typescript
// src/core/parser/types.ts
export type BankCode =
  | 'bancolombia'
  | 'nequi'
  | 'bankcode';  // Add new bank code
```

### 6. Write Tests
```typescript
// src/core/parser/statement/banks/{bankcode}/__tests__/{BankName}Parser.test.ts
import { BankNameParser } from '../BankNameParser';

const SAMPLE_DIR = path.resolve(__dirname, '../../../../../../../tmp/bank_statement_samples/bankcode');

describe('BankNameParser', () => {
  it('parses statement correctly', async () => {
    const parser = new BankNameParser();
    const data = loadSampleFile('statement.xlsx');
    const metadata = { fileName: 'statement.xlsx', fileType: 'xlsx' };

    const result = await parser.parseStatement(data, metadata);

    expect(result.account.accountNumber).toBeDefined();
    expect(result.transactions.length).toBeGreaterThan(0);
  });
});
```

### 7. Update Documentation
- Add bank to "Supported Statement Formats" table
- Document file naming convention
- Describe file structure and sections
- List date/amount formats
- Explain transaction type detection
- Document merchant extraction patterns
- Add examples

## Error Handling

Parsers throw descriptive errors for common issues:

| Error | Cause | Solution |
|-------|-------|----------|
| `File data is empty` | Buffer is empty or null | Ensure file was read correctly |
| `Statement file has no sheets` | XLSX has no sheets or PDF has no pages | Verify file integrity |
| `Could not find {Section} section` | Expected section marker not found | Check file format matches expected structure |
| `PDF requires password` | PDF is encrypted, no password provided | Provide password in `metadata.password` |
| `Invalid date format: {value}` | Date string doesn't match expected format | Verify date format in file |

## Testing

Run statement parser tests:
```bash
npm test statement
```

Tests automatically skip if sample files are not present. To run with real data:
1. Place sample files in `tmp/bank_statement_samples/{bankcode}/`
2. Run tests
3. Verify parsed data accuracy

## Performance Considerations

- **Large statements**: Parsers handle statements with hundreds of transactions efficiently
- **Multi-sheet XLSX**: Credit card parsers process multiple currency sheets
- **Multi-page PDF**: Nequi parser streams pages to avoid loading entire PDF in memory
- **Password-protected PDFs**: Decryption adds minimal overhead

## Security Notes

- Statements contain sensitive financial data
- Passwords are required in-memory only, never stored
- Sample files in `tmp/` should be gitignored
- Test data should use anonymized/redacted account numbers
- Production implementations should encrypt statement data at rest
