# Monea v2 - System Architecture

## Overview

Monea is a **local-first, privacy-focused** digital wallet application for Android that automatically tracks bank transactions by parsing SMS messages from Colombian financial institutions. The application runs entirely on-device with no cloud dependencies, ensuring user financial data remains private and secure.

---

## System Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │
│  │   Dashboard   │  │ Transactions  │  │   Settings    │            │
│  │    Screen     │  │    Screen     │  │    Screen     │            │
│  └───────────────┘  └───────────────┘  └───────────────┘            │
│                              │                                      │
│                    Expo Router (File-based)                         │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                         Feature Layer                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │
│  │  Dashboard    │  │ Transactions  │  │  SMS Sync     │            │
│  │   Feature     │  │   Feature     │  │   Feature     │            │
│  │ ┌───────────┐ │  │ ┌───────────┐ │  │ ┌───────────┐ │            │
│  │ │Components │ │  │ │Components │ │  │ │ Services  │ │            │
│  │ │  Hooks    │ │  │ │  Hooks    │ │  │ │  Hooks    │ │            │
│  │ │  Store    │ │  │ │  Store    │ │  │ │Components │ │            │
│  │ └───────────┘ │  │ └───────────┘ │  │ └───────────┘ │            │
│  └───────────────┘  └───────────────┘  └───────────────┘            │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │               Statement Import Feature                        │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │  Services: StatementImportService                      │   │  │
│  │  │            BalanceReconciliationService                │   │  │
│  │  │  Hooks: useStatementImport                             │   │  │
│  │  └────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                          Core Layer                                 │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    SMS Parser Engine                         │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │   │
│  │  │Bancolombia │ │ Davivienda │ │   BBVA     │ │   Nequi    │ │   │
│  │  │  Strategy  │ │  Strategy  │ │  Strategy  │ │  Strategy  │ │   │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │   │
│  │                    Strategy Pattern                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              Statement Parser Engine                         │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │  File Readers: PDF (pdf-lib), XLSX (xlsx), CSV         │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │  Bank Statement Parsers (per-bank strategies)          │  │   │
│  │  │  ┌────────────┐ ┌────────────┐ ┌────────────┐          │  │   │
│  │  │  │Bancolombia │ │   Nequi    │ │  [Future]  │          │  │   │
│  │  │  │   Parser   │ │   Parser   │ │   Banks    │          │  │   │
│  │  │  └────────────┘ └────────────┘ └────────────┘          │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  │  ┌────────────────────────────────────────────────────────┐  │   │
│  │  │  StatementParser (orchestrator)                        │  │   │
│  │  │  StatementParserRegistry (bank detection)              │  │   │
│  │  └────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                     Infrastructure Layer                            │
│  ┌───────────────────────┐  ┌───────────────────────────────────┐   │
│  │   WatermelonDB        │  │      SMS Native Module            │   │
│  │  ┌─────────────────┐  │  │  ┌─────────────────────────────┐  │   │
│  │  │ Transactions    │  │  │  │ react-native-get-sms-android│  │   │
│  │  │ Accounts        │  │  │  │                             │  │   │
│  │  │ Categories      │  │  │  │ READ_SMS | RECEIVE_SMS      │  │   │
│  │  │StatementImports │  │  │  └─────────────────────────────┘  │   │
│  │  └─────────────────┘  │  │        Native Bridge              │   │
│  │        Models         │  └───────────────────────────────────┘   │
│  └───────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Architecture Pattern: Vertical Slice (Feature-Based)

The application follows a **vertical slice architecture** where code is organized by business domain (features) rather than technical layers. Each feature contains all the code needed to implement that business capability.

**Rationale:**
- Features are self-contained and can be developed/tested independently
- Reduces coupling between unrelated parts of the application
- New developers can focus on one feature without understanding the entire codebase
- Aligns with how product requirements are typically structured

---

## Tech Stack Justification

### Framework: React Native + Expo

| Consideration | Decision | Rationale |
|--------------|----------|-----------|
| Cross-platform | Android only | Target market (Colombia) is 70%+ Android; eliminates iOS complexity |
| Framework | Expo (dev-client) | Faster development, OTA updates, but native modules supported via dev-client |
| Language | TypeScript | Type safety prevents runtime errors in financial calculations |

**Why Expo over bare React Native:**
- Managed native code upgrades
- EAS Build for cloud builds without local Android SDK setup
- Better developer experience with hot reloading
- Access to native modules via dev-client when needed

### State Management: Zustand + React Query

| Library | Purpose | Alternatives Considered |
|---------|---------|------------------------|
| Zustand | Client UI state | Redux (too verbose), Jotai (too granular), MobX (complex) |
| React Query | Server/async state | SWR (less features), Apollo (GraphQL-focused) |

**Why this combination:**
- Zustand: Minimal boilerplate, TypeScript-first, no providers needed
- React Query: Handles caching, background refetch, optimistic updates for database queries
- Clear separation: Zustand for "what's selected", React Query for "what's the data"

### Database: WatermelonDB

| Requirement | WatermelonDB | SQLite | AsyncStorage |
|-------------|-------------|--------|--------------|
| Large datasets (10k+ transactions) | ✓ Lazy loading | ✓ | ✗ |
| Complex queries | ✓ | ✓ | ✗ |
| React integration | ✓ Observable | Manual | ✓ |
| Performance | Excellent | Good | Poor for large data |
| Offline-first | ✓ | ✓ | ✓ |

**Rationale:**
- Built specifically for React Native with lazy loading and observable queries
- SQLite under the hood for robust data integrity
- Handles transaction volumes expected (1000+ per month per account)
- Query performance remains constant as data grows

### UI Framework: Tamagui

| Feature | Benefit |
|---------|---------|
| Styled components | Type-safe, co-located styles with variants |
| Theme tokens | Consistent spacing, colors, typography via $tokens |
| Dark theme | Premium crypto/broker aesthetic |
| Performance | Compile-time optimization, minimal runtime |

**Why Tamagui:**
- Type-safe styling with full TypeScript support
- Built-in dark theme support with theme tokens
- Styled component pattern familiar to web developers
- Excellent performance through compile-time optimizations
- Active ecosystem with React Native focus

**Theme Design:**
- Dark backgrounds (#0A0B0E base, #12141A surface, #1A1D26 elevated)
- Teal primary accent (#00D4AA) for income/positive actions
- Red accent (#FF4757) for expenses/danger states
- Monospace fonts for currency amounts

### Navigation: Expo Router

**Selection Criteria:**
- File-based routing reduces boilerplate
- TypeScript route types out of the box
- Deep linking support built-in
- Follows Next.js conventions (familiar to web developers)

---

## Folder Structure Explanation

```
monea/
├── src/
│   ├── app/                          # Screen routes (Expo Router)
│   │   ├── _layout.tsx               # Root layout with providers
│   │   ├── index.tsx                 # Dashboard (home)
│   │   ├── (tabs)/                   # Tab navigator group
│   │   │   ├── _layout.tsx           # Tab bar configuration
│   │   │   └── transactions.tsx      # Transactions list tab
│   │   ├── settings/                 # Settings stack screens
│   │   │   ├── _layout.tsx           # Settings layout
│   │   │   ├── about.tsx             # About screen
│   │   │   ├── accounts.tsx          # Account management
│   │   │   ├── backup.tsx            # Backup & restore
│   │   │   ├── categories.tsx        # Category management
│   │   │   ├── category/             # Category detail routes
│   │   │   ├── clear-data.tsx        # Clear data screen
│   │   │   └── sms.tsx               # SMS settings
│   │   ├── sync/                     # Sync-related screens
│   │   └── transactions/             # Transaction detail routes
│   │
│   ├── features/                     # Domain features (vertical slices)
│   │   ├── backup/
│   │   │   ├── components/           # BackupCard, RestoreDialog
│   │   │   ├── hooks/                # useBackup
│   │   │   ├── services/             # BackupService
│   │   │   └── types/                # Backup types
│   │   │
│   │   ├── categories/
│   │   │   ├── components/           # CategoryList, CategoryForm
│   │   │   ├── hooks/                # useCategories
│   │   │   ├── services/             # CategoryService
│   │   │   └── types/                # Category types
│   │   │
│   │   ├── dashboard/
│   │   │   ├── components/           # BalanceCard, SpendingChart, etc.
│   │   │   ├── hooks/                # useDashboardData
│   │   │   └── types/                # Dashboard-specific types
│   │   │
│   │   ├── transactions/
│   │   │   ├── components/           # TransactionList, TransactionItem
│   │   │   ├── hooks/                # useTransactions
│   │   │   ├── store/                # transactionStore (Zustand)
│   │   │   └── types/                # Transaction types
│   │   │
│   │   ├── sms-sync/
│   │   │   ├── components/           # SyncButton, SyncStatus, BulkImportCard
│   │   │   ├── hooks/                # useSmsSync, useBulkImport
│   │   │   ├── services/             # SmsSyncService, BulkImportService
│   │   │   └── types/                # Sync-related types
│   │   │
│   │   ├── statement-import/
│   │   │   ├── components/           # StatementUploader, ImportProgress
│   │   │   ├── hooks/                # useStatementImport
│   │   │   ├── services/             # StatementImportService
│   │   │   │                         # BalanceReconciliationService
│   │   │   └── types/                # Import result types, reconciliation
│   │   │
│   │   ├── settings/
│   │   │   ├── components/           # AccountForm
│   │   │   ├── screens/              # SettingsScreen, AccountsManagement
│   │   │   └── types/                # Settings types
│   │   │
│   │   └── onboarding/
│   │       ├── screens/              # PermissionsScreen
│   │       └── components/           # Permission request UI
│   │
│   ├── shared/                       # Cross-feature code
│   │   ├── components/
│   │   │   ├── ui/                   # Button, Card, Input, Typography
│   │   │   ├── layout/               # Screen wrapper, SafeArea
│   │   │   ├── feedback/             # EmptyState, LoadingState, ErrorBoundary
│   │   │   └── navigation/           # TabBar, Header
│   │   │
│   │   ├── hooks/                    # useNetworkStatus, useSmsPermission
│   │   ├── utils/                    # formatCurrency, formatDate
│   │   ├── theme/                    # Colors, typography tokens
│   │   ├── providers/                # QueryProvider, ThemeProvider
│   │   └── animations/               # Reusable animation presets
│   │
│   ├── core/                         # Business logic (domain-pure)
│   │   └── parser/
│   │       ├── TransactionParser.ts  # Main SMS parser entry point
│   │       ├── ParserRegistry.ts     # SMS bank parser registry
│   │       ├── types.ts              # Parser interfaces
│   │       ├── index.ts              # Public exports
│   │       ├── extractors/           # Amount, date extractors
│   │       ├── shared/               # BaseBankParser, pattern helpers
│   │       ├── banks/                # Per-bank SMS parser implementations
│   │       │   ├── bancolombia/      # BancolombiaParser + patterns + tests
│   │       │   ├── bancoomeva/       # BancoomevaParser + patterns + tests
│   │       │   ├── bbva/             # BBVAParser + patterns + tests
│   │       │   ├── daviplata/        # DaviplataParser + patterns + tests
│   │       │   ├── davivienda/       # DaviviendaParser + patterns + tests
│   │       │   └── nequi/            # NequiParser + patterns + tests
│   │       ├── statement/            # Bank statement parser subsystem
│   │       │   ├── StatementParser.ts           # Main statement parser orchestrator
│   │       │   ├── StatementParserRegistry.ts   # Bank detection registry
│   │       │   ├── types.ts                     # Statement parser interfaces
│   │       │   ├── index.ts                     # Public exports
│   │       │   ├── shared/                      # BaseStatementParser
│   │       │   ├── readers/                     # File format readers
│   │       │   │   ├── PdfFileReader.ts         # PDF extraction (pdf-lib)
│   │       │   │   ├── XlsxFileReader.ts        # Excel parsing (xlsx)
│   │       │   │   └── index.ts
│   │       │   ├── banks/                       # Per-bank statement parsers
│   │       │   │   ├── bancolombia/             # (future) Bancolombia statements
│   │       │   │   └── nequi/                   # NequiStatementParser + tests
│   │       │   └── __tests__/                   # Integration tests
│   │       └── __tests__/            # SMS parser integration tests
│   │
│   └── infrastructure/               # External system integrations
│       ├── database/
│       │   ├── schema.ts             # WatermelonDB schema definition
│       │   ├── models/               # Transaction, Account, Category,
│       │   │                         # StatementImport models
│       │   ├── repositories/         # TransactionRepository, AccountRepository
│       │   │                         # StatementImportRepository
│       │   └── migrations/           # Schema migrations
│       │
│       └── sms/
│           ├── SmsReader.ts          # Native module wrapper
│           └── SmsPermissions.ts     # Permission handling
│
├── docs/
│   ├── architecture/                 # You are here
│   ├── CONTRIBUTING.md
│   └── SMS_PATTERNS.md
│
├── e2e/                              # Detox E2E tests
│
├── CLAUDE.md                         # Project configuration for Claude
├── app.json                          # Expo configuration
├── tamagui.config.ts                 # Tamagui theme configuration
├── tsconfig.json                     # TypeScript configuration
└── package.json
```

### Directory Rationale

| Directory | Responsibility | Key Principle |
|-----------|---------------|---------------|
| `src/app/` | Screen routing only | Screens are thin, delegate to features |
| `src/features/` | Business capabilities | Vertical slice, self-contained |
| `src/shared/` | Reusable across features | No business logic, pure UI/utils |
| `src/core/` | Domain logic | Framework-agnostic, easily testable |
| `src/infrastructure/` | External systems | Abstracts native modules, database |

---

## Design Patterns

### 1. Modular Bank Parsers (SMS Parsing)

Each bank has different SMS formats. The parser uses a **modular strategy pattern** where each bank has its own parser class:

```
┌──────────────────────┐
│  TransactionParser   │
│  (Main Entry Point)  │
└──────────┬───────────┘
           │ uses
           ▼
┌──────────────────────┐
│   ParserRegistry     │
│  (Bank Parser Mgmt)  │
└──────────┬───────────┘
           │ finds
           ▼
┌──────────────────────────────────────────────────────────┐
│                    BaseBankParser                         │
│  (Abstract base class with common extraction logic)       │
└──────────────────────────────────────────────────────────┘
           │ extended by
     ┌─────┴─────┬─────────────┬─────────────┬─────────────┐
     ▼           ▼             ▼             ▼             ▼
┌──────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
│Bancolombia││  Nequi   ││Davivienda││ Daviplata││   BBVA   │
│  Parser   ││  Parser  ││  Parser  ││  Parser  ││  Parser  │
└──────────┘└──────────┘└──────────┘└──────────┘└──────────┘
     │           │             │             │             │
     └───────────┴─────────────┴─────────────┴─────────────┘
                               │ uses
                     ┌─────────┴─────────┐
                     ▼                   ▼
               ┌─────────┐         ┌─────────┐
               │ Amount  │         │  Date   │
               │Extractor│         │Extractor│
               └─────────┘         └─────────┘
```

**Benefits:**
- **SOLID Compliance**: Each bank parser has single responsibility
- **Open/Closed**: Add new banks without modifying existing code
- **Testability**: Each bank has dedicated tests in its directory
- **Maintainability**: Bank-specific logic isolated in own directory

### 2. Repository Pattern (Data Access)

Database operations are abstracted behind repository interfaces:

```typescript
interface TransactionRepository {
  getAll(): Observable<Transaction[]>;
  getById(id: string): Promise<Transaction>;
  create(data: TransactionInput): Promise<Transaction>;
  update(id: string, data: Partial<Transaction>): Promise<Transaction>;
  delete(id: string): Promise<void>;
  getByDateRange(start: Date, end: Date): Observable<Transaction[]>;
}
```

**Benefits:**
- Components depend on abstractions, not WatermelonDB specifics
- Easy to mock in tests
- Database implementation can change without affecting features

### 3. Provider Pattern (Dependency Injection)

React Context provides dependencies to components:

```
App
└── QueryClientProvider (React Query)
    └── TamaguiProvider (Theme)
        └── DatabaseProvider (WatermelonDB)
            └── Navigation
```

**Benefits:**
- Dependencies injected at runtime
- Easy to swap implementations for testing
- Clear dependency hierarchy

### 4. Modular Statement Parsers (Bank Statement Import)

Each bank has different statement formats. The statement parser uses a **modular strategy pattern** similar to SMS parsing, but for structured documents:

```
┌──────────────────────┐
│   StatementParser    │
│   (Orchestrator)     │
└──────────┬───────────┘
           │ uses
           ▼
┌──────────────────────────────────────────┐
│       StatementParserRegistry            │
│  (Bank detection & parser management)    │
│  • detectFromFileName()                  │
│  • detectFromContent()                   │
│  • findParser()                          │
└──────────┬───────────────────────────────┘
           │ uses
           ▼
┌──────────────────────────────────────────┐
│         File Readers Layer               │
│  ┌────────────┐  ┌────────────┐          │
│  │ PdfReader  │  │XlsxReader  │          │
│  │ (pdf-lib)  │  │  (xlsx)    │          │
│  └────────────┘  └────────────┘          │
└──────────┬───────────────────────────────┘
           │ extracts
           ▼
┌──────────────────────────────────────────────────────────┐
│              BaseStatementParser                         │
│  (Abstract base class with common logic)                 │
│  • canParse() - file type & pattern matching             │
│  • validateMetadata()                                    │
│  • inferFileType()                                       │
└──────────────────────────────────────────────────────────┘
           │ extended by
     ┌─────┴─────┬─────────────┐
     ▼           ▼             ▼
┌──────────┐┌──────────┐┌──────────┐
│Bancolombia││   Nequi  ││  [Future]│
│ Statement││ Statement││   Banks  │
│  Parser  ││  Parser  ││  Parsers │
└──────────┘└──────────┘└──────────┘
     │           │             │
     └───────────┴─────────────┘
                 │ parses to
                 ▼
       ┌─────────────────────┐
       │ ParsedStatementResult│
       │  • Account info      │
       │  • Transactions[]    │
       │  • Period dates      │
       │  • Balances          │
       └─────────────────────┘
```

**Architecture Layers:**

1. **File Readers**: Transform binary data into structured data (sheets/pages)
   - `PdfFileReader`: Extracts text/tables from PDF using pdf-lib
   - `XlsxFileReader`: Parses Excel sheets into rows/columns using xlsx

2. **Statement Parsers**: Extract financial data from structured content
   - Each bank has dedicated parser extending `BaseStatementParser`
   - Located in `src/core/parser/statement/banks/{bankcode}/`
   - Implements bank-specific row/pattern matching logic

3. **Registry & Orchestration**:
   - `StatementParserRegistry`: Auto-detects bank from filename or content
   - `StatementParser`: Coordinates file reading → bank detection → parsing

4. **Feature Services**:
   - `StatementImportService`: Import orchestration, deduplication, batch creation
   - `BalanceReconciliationService`: Balance validation, discrepancy detection

**Benefits:**
- **SOLID Compliance**: Each parser has single responsibility
- **Open/Closed**: Add new banks/file types without modifying existing code
- **Testability**: Each parser has dedicated tests with real statement samples
- **Maintainability**: Bank-specific logic isolated in own directory
- **Extensibility**: Easy to add CSV parsers or other formats

**Key Design Decisions:**

| Decision | Rationale |
|----------|-----------|
| Separate file readers from parsers | File formats (PDF/XLSX) orthogonal to bank logic |
| Strategy pattern per bank | Banks have radically different statement layouts |
| Registry-based detection | Automatic bank identification improves UX |
| File hash tracking | Prevents duplicate imports of same statement |
| Balance reconciliation service | Validates statement integrity, detects discrepancies |
| Transaction deduplication | Prevents overlap when importing multiple statements |

---

## Data Flow

### SMS to Transaction Flow

```
1. User grants SMS permission
         │
         ▼
2. SmsSyncService reads SMS inbox
         │
         ▼
3. TransactionParser iterates messages
         │
         ▼
4. BankPatterns.getBankBySender() identifies bank
         │
         ▼
5. Bank patterns extract transaction data
         │
         ▼
6. TransactionRepository saves to WatermelonDB
         │
         ▼
7. React Query invalidates cache
         │
         ▼
8. UI updates via observable queries
```

### Statement Import Flow

```
1. User selects bank statement file (PDF/XLSX)
         │
         ▼
2. StatementImportService validates file hash (detect duplicates)
         │
         ▼
3. File Reader (PdfFileReader/XlsxFileReader) extracts content
         │
         ▼
4. StatementParserRegistry detects bank from file name or content
         │
         ▼
5. Bank-specific StatementParser extracts:
   • Account info (number, holder, period, opening/closing balance)
   • Transaction list (date, amount, type, balance after, merchant)
         │
         ▼
6. StatementImportService deduplicates against existing transactions
         │
         ▼
7. BalanceReconciliationService reconciles account balance:
   • Validates opening/closing balance consistency
   • Detects future transactions beyond statement period
   • Updates account balance to statement closing balance
         │
         ▼
8. TransactionRepository creates batch transactions with balanceAfter
         │
         ▼
9. StatementImportRepository records import metadata:
   • File hash (prevent duplicate imports)
   • Period start/end (detect overlapping statements)
   • Transaction count
         │
         ▼
10. React Query invalidates cache, UI updates
```

---

## Statement Import Feature Architecture

### Overview

The Statement Import feature provides a robust system for importing bank statements (PDF/XLSX) to populate transaction history with high-fidelity balance information. Unlike SMS parsing which extracts individual notifications, statement parsing processes complete financial documents with running balances, account metadata, and comprehensive transaction history.

### Core Components

#### 1. File Reading Layer

**Purpose**: Transform binary files into structured data

```typescript
interface FileReader {
  supportedTypes: StatementFileType[];
  read(data: Buffer, fileName: string, password?: string): Promise<FileReadResult>;
}

interface FileReadResult {
  metadata: FileReadMetadata;
  sheets: SheetData[];  // Unified structure for PDF pages or Excel sheets
}
```

**Implementations:**
- **PdfFileReader**: Uses `pdf-lib` to extract text and tables from PDF documents
  - Handles password-protected PDFs
  - Preserves table structure for transaction parsing
  - Extracts metadata (page count, file size)

- **XlsxFileReader**: Uses `xlsx` library to parse Excel workbooks
  - Supports .xlsx and .xls formats
  - Converts cells to normalized types (string, number, date)
  - Handles multiple sheets

**Design Rationale:**
- Abstraction allows adding new formats (CSV, OFX) without changing parsers
- Normalized output (`SheetData[]`) regardless of source format
- Password handling at reader level, not parser level

#### 2. Statement Parser Layer

**BaseStatementParser Abstract Class:**

```typescript
abstract class BaseStatementParser implements StatementParser {
  abstract readonly bankCode: BankCode;
  abstract readonly supportedFileTypes: StatementFileType[];

  canParse(metadata: StatementMetadata): boolean;
  abstract parseStatement(data: Buffer, metadata: StatementMetadata): Promise<ParsedStatementResult>;
  protected abstract matchesFilePattern(metadata: StatementMetadata): boolean;
}
```

**Bank-Specific Parsers:**
- Located in `src/core/parser/statement/banks/{bankcode}/`
- Each parser implements bank-specific row/column identification
- Extracts:
  - Account information (number, holder, type)
  - Period dates (start/end)
  - Opening and closing balances
  - Transaction list with running balances

**Example: NequiStatementParser**
```typescript
class NequiStatementParser extends BaseStatementParser {
  bankCode = 'nequi';
  supportedFileTypes = ['xlsx', 'pdf'];

  protected matchesFilePattern(metadata: StatementMetadata): boolean {
    return /nequi/i.test(metadata.fileName);
  }

  async parseStatement(data: Buffer, metadata: StatementMetadata): Promise<ParsedStatementResult> {
    // Extract Nequi-specific data from sheets/pages
  }
}
```

#### 3. Statement Parser Registry

**Purpose**: Automatic bank detection and parser resolution

```typescript
class StatementParserRegistry {
  register(parser: StatementParser): void;
  findParser(metadata: StatementMetadata): StatementParser | undefined;
  detectBank(metadata: StatementMetadata, fileContent?: FileReadResult): BankDetectionResult | undefined;
}
```

**Detection Strategy (in order):**
1. **Explicit Bank Code**: If `metadata.bankCode` provided, use directly
2. **Filename Patterns**: Match regex patterns against filename
   - `bancolombia` → BancolombiaStatementParser
   - `nequi` → NequiStatementParser
3. **Content Analysis**: Search first 20 rows for bank indicators
   - "Nequi Colombia" → nequi
   - "Bancolombia" → bancolombia

**Confidence Levels:**
- `high`: Explicit bank code or strong filename match
- `medium`: Content-based detection
- `low`: Fallback guess

#### 4. Statement Import Service

**Purpose**: Orchestrate entire import process with business logic

**Key Responsibilities:**

1. **Duplicate File Detection**
   ```typescript
   computeFileHash(data: Buffer): string
   // DJB2 hash variant with size/checksum components
   ```

2. **Transaction Deduplication**
   ```typescript
   detectDuplicates(
     transactions: StatementTransaction[],
     accountId: string,
     periodStart: Date,
     periodEnd: Date
   ): Promise<DeduplicationResult>
   ```
   - Matches by: amount (±$0.01), date (±1 minute), type
   - Extends search ±1 day beyond statement period
   - Returns: exact matches, likely matches, unique transactions

3. **Period Overlap Detection**
   ```typescript
   detectPeriodOverlaps(
     periodStart: Date,
     periodEnd: Date,
     bankCode?: BankCode
   ): Promise<PeriodOverlapInfo[]>
   ```
   - Detects previously imported statements covering same dates
   - Calculates overlap days
   - Optional: Block import if `allowPeriodOverlap: false`

4. **Account Matching**
   ```typescript
   findOrCreateAccount(
     bankCode: BankCode,
     accountNumber: string,
     accountType: string,
     dryRun: boolean
   ): Promise<AccountMatchResult>
   ```
   - Searches for existing account by number
   - Creates new account if not found (respects dryRun)
   - Maps statement account types to app types

5. **Batch Transaction Creation**
   ```typescript
   buildTransactionData(
     tx: StatementTransaction,
     accountId: string,
     statementImportId: string
   ): CreateTransactionData
   ```
   - Preserves `balanceAfter` from statement
   - Links to `StatementImport` record via foreign key
   - Processes in single database transaction

6. **Progress Tracking**
   ```typescript
   onProgress?: (progress: ImportProgress) => void
   ```
   - Reports phases: reading → detecting_duplicates → importing → updating_balances → complete
   - Updates step counts (1/5, 2/5, etc.)

#### 5. Balance Reconciliation Service

**Purpose**: Validate and reconcile account balances using statement data

**Key Operations:**

1. **Balance Reconciliation**
   ```typescript
   reconcile(input: ReconciliationInput): Promise<ReconciliationSummary>
   ```
   - Compares current account balance vs statement closing balance
   - Detects discrepancies > $0.01
   - Checks for transactions after statement period end
   - Warns if last reconciliation is stale (>30 days)
   - Updates account balance to statement closing balance

2. **Running Balance Validation**
   ```typescript
   validateRunningBalances(
     accountId: string,
     transactions: StatementTransaction[]
   ): { valid: boolean; discrepancies: Array<...> }
   ```
   - Verifies `balanceAfter[i-1]` ≈ `balanceBefore[i]`
   - Detects breaks in transaction chain
   - Ensures statement integrity

3. **Balance Checkpoints**
   ```typescript
   getBalanceCheckpoints(
     accountId: string,
     startDate: Date,
     endDate: Date
   ): Promise<BalanceCheckpoint[]>
   ```
   - Returns all transactions with `balanceAfter` values
   - Sorted chronologically
   - Source: 'statement' or 'transaction' (SMS-derived)

4. **Historical Balance Lookup**
   ```typescript
   getAccountBalanceAtDate(accountId: string, date: Date): Promise<number | null>
   ```
   - Finds closest transaction with balance before date
   - Enables time-travel balance queries

**Reconciliation Warnings:**
- `balance_discrepancy`: Current balance differs from statement
- `future_transactions_exist`: Transactions after statement period
- `stale_reconciliation`: Last balance update >30 days old

**Reconciliation Errors:**
- `account_not_found`: Account ID invalid
- `invalid_balance`: Statement balance not a number
- `balance_update_failed`: Database write error

#### 6. Database Models

**StatementImport Model:**
```typescript
class StatementImport extends Model {
  @field('file_name') fileName: string;
  @field('file_hash') fileHash: string;
  @field('bank_code') bankCode: BankCode;
  @date('statement_period_start') statementPeriodStart: Date;
  @date('statement_period_end') statementPeriodEnd: Date;
  @field('transactions_imported') transactionsImported: number;
  @date('imported_at') importedAt: Date;
  @children('transactions') transactions: Query<Transaction>;
}
```

**Transaction Model Extensions:**
```typescript
class Transaction extends Model {
  // ... existing fields
  @field('balance_after') balanceAfter?: number;  // NEW: Running balance
  @field('statement_import_id') statementImportId?: string;  // NEW: Source tracking
}
```

### Data Quality Guarantees

1. **No Duplicate Files**: File hash prevents re-importing same statement
2. **No Duplicate Transactions**: Fuzzy matching with ±1 minute, ±$0.01 tolerance
3. **Balance Integrity**: Running balances preserved from statements
4. **Audit Trail**: Every transaction linked to source statement
5. **Idempotency**: Dry-run mode tests import without side effects

### Performance Characteristics

| Operation | Target | Implementation |
|-----------|--------|----------------|
| Parse 12-month statement (1000 txns) | <2s | Stream parsing, batch inserts |
| Duplicate detection | <500ms | Indexed date/amount queries |
| File hash computation | <100ms | DJB2 hash (O(n) single pass) |
| Balance reconciliation | <200ms | Single DB query for latest balance |

### Error Handling Strategy

**Parse Errors:**
- Invalid file format → `StatementParseError` with user-friendly message
- Password required → Specific error prompting password input
- Corrupted file → Graceful failure with partial data if possible

**Import Errors:**
- Duplicate file → Skip with notification (not a failure)
- Account creation failed → Rollback, report error
- Transaction batch failed → Rollback entire import (atomicity)

**Reconciliation Warnings (non-blocking):**
- Balance discrepancy → Warn but allow import
- Future transactions → Warn but allow import
- Stale reconciliation → Informational only

### Extensibility Points

1. **New File Formats**
   - Implement `FileReader` interface
   - Register in `StatementParser.initializeReaders()`
   - No changes to parsers or services

2. **New Banks**
   - Extend `BaseStatementParser`
   - Place in `statement/banks/{bankcode}/`
   - Auto-registered via registry
   - Add detection patterns to registry

3. **Enhanced Bank Detection**
   - Add patterns to `StatementParserRegistry.detectFromFileName()`
   - Add indicators to `StatementParserRegistry.detectFromContent()`

4. **Custom Reconciliation Rules**
   - Extend `BalanceReconciliationService`
   - Override `reconcile()` for bank-specific logic

### Testing Strategy

1. **Real Statement Samples**
   - Stored in `tmp/bank_statement_samples/{bank}/`
   - Password-protected samples for security testing
   - Covers multiple statement formats per bank

2. **Parser Unit Tests**
   - `NequiStatementParser.test.ts` parses real Nequi statements
   - Validates all extracted fields (account, transactions, balances)
   - Tests edge cases (empty periods, single transaction)

3. **Integration Tests**
   - Full import flow with mocked database
   - Duplicate detection accuracy
   - Balance reconciliation warnings

4. **Service Tests**
   - `StatementImportService.test.ts` covers all flows
   - Dry-run mode testing
   - Error handling paths

### Security Considerations

1. **Password Handling**: Passwords never persisted, only used during parse
2. **File Storage**: Statements not stored after import (only hash for deduplication)
3. **Sensitive Data**: No logging of account numbers or balances
4. **Input Validation**: File size limits, type checking, malformed data handling

### State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         UI Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Component A │  │ Component B │  │     Component C     │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                    │             │
│         └────────────────┼────────────────────┘             │
│                          │                                  │
│                ┌─────────┴─────────┐                        │
│                │   Custom Hooks    │                        │
│                └─────────┬─────────┘                        │
└──────────────────────────┼──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌─────────────────┐ ┌─────────────┐ ┌─────────────────┐
│     Zustand     │ │ React Query │ │   WatermelonDB  │
│  (UI State)     │ │ (Data Cache)│ │   (Persistence) │
│                 │ │             │ │                 │
│ • selectedId    │ │ • txns list │ │ • Transactions  │
│ • filters       │ │ • accounts  │ │ • Accounts      │
│ • modals        │ │ • dashboard │ │ • Categories    │
└─────────────────┘ └─────────────┘ └─────────────────┘
```

---

## Security Architecture

### Principles

1. **Data Locality**: All financial data stays on device
2. **No Network Calls**: App functions 100% offline
3. **Permission Minimization**: Only READ_SMS, no write or network
4. **Encryption at Rest**: WatermelonDB with SQLCipher (future)

### Threat Model

| Threat | Mitigation |
|--------|------------|
| Data exfiltration | No network permissions, no cloud sync |
| Device theft | Biometric lock (future), encrypted database |
| SMS spoofing | Verify sender numbers against known bank patterns |
| Debug logging | Strip transaction amounts from production logs |

---

## Performance Considerations

### Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Cold start | < 3s | Lazy load screens, minimal root bundle |
| List scroll | 60fps | FlashList virtualization, React.memo |
| SMS parsing | < 100ms per message | Compiled regex, early termination |
| DB queries | < 50ms | Indexed columns, observable queries |

### Optimizations

1. **Virtualized Lists**: FlashList for transaction lists (handles 10k+ items)
2. **Lazy Loading**: Screens loaded on navigation, not at startup
3. **Memoization**: `React.memo` on list items, `useMemo` for aggregations
4. **Background Sync**: SMS parsing on app background with WorkManager (future)

---

## Testing Strategy

### Test Pyramid

```
          ┌───────────┐
          │   E2E     │   Detox - Critical user flows
          │   10%     │
          ├───────────┤
          │Integration│   Feature tests with mocked DB
          │   20%     │
          ├───────────┤
          │   Unit    │   Components, parsers, utils
          │   70%     │
          └───────────┘
```

### Coverage Goals

| Module | Target | Rationale |
|--------|--------|-----------|
| `src/core/parser/` | 90% | Financial accuracy critical |
| `src/features/` | 70% | Business logic coverage |
| `src/shared/` | 60% | Utility coverage |
| `src/infrastructure/` | 50% | Integration-tested instead |

---

## Scalability Considerations

### Current Scope

- Single user, single device
- ~5 bank accounts maximum
- ~1000 transactions per month
- Colombian banks only

### Extension Points

| Future Feature | Extension Strategy |
|----------------|-------------------|
| New bank SMS support | Create new SMS parser in `parser/banks/{bankcode}/` extending `BaseBankParser` |
| New bank statement support | Create new statement parser in `parser/statement/banks/{bankcode}/` extending `BaseStatementParser` |
| CSV statement support | Add `CsvFileReader` to `parser/statement/readers/`, update registry |
| Multi-device sync | Add sync layer to infrastructure |
| Export to CSV | Add service to `features/backup/` (backup feature exists) |
| Multiple currencies | Extend `AmountExtractor` |
| Budgets | Add feature to `features/budgets/` |
| Statement OCR (scanned PDFs) | Add OCR preprocessing in `PdfFileReader` |

**Implemented Features:**
- ✅ Transaction categories - `features/categories/`
- ✅ Data backup & restore - `features/backup/`
- ✅ Bulk SMS import - `features/sms-sync/` (BulkImportService)
- ✅ Bank statement import - `features/statement-import/` (StatementImportService)
  - PDF/XLSX support with automatic bank detection
  - Balance reconciliation with discrepancy detection
  - Duplicate detection across statements
  - Period overlap detection

---

## Decision Log

| Date | Decision | Rationale | Alternatives Rejected |
|------|----------|-----------|----------------------|
| 2024-01 | Android only | Colombian market, faster MVP | iOS (small market share) |
| 2024-01 | WatermelonDB | Lazy loading, RN-native | SQLite (no observables), Realm (complex) |
| 2024-01 | Zustand + React Query | Minimal boilerplate, separation | Redux (verbose), MobX (complex) |
| 2024-01 | Tamagui | Type-safe styling, dark theme, performance | NativeWind (className strings), Styled Components (verbose) |
| 2024-01 | Feature-based structure | Maintainability at scale | Layer-based (harder to navigate) |
| 2024-01 | Pattern-based parsing | Centralized config, reusable extractors | Strategy classes (more files) |
| 2026-01 | Modular bank parsers | SOLID compliance, per-bank testing | Monolithic BankPatterns.ts |
| 2026-01 | Detox E2E testing | Native Android testing, CI support | Maestro (less mature) |
| 2026-01 | Statement import feature | Reliable balance tracking, formal transaction source | SMS-only approach (incomplete data) |
| 2026-01 | Separate statement parser subsystem | Different concerns than SMS parsing | Merge with SMS parser (tight coupling) |
| 2026-01 | File readers abstraction | PDF/XLSX have different APIs | Direct parser access to libraries |
| 2026-01 | Registry-based bank detection | Better UX, auto-detect bank | Require user to specify bank |
| 2026-01 | File hash duplicate prevention | Prevents re-importing same file | Date range checks only (unreliable) |
| 2026-01 | Balance reconciliation service | Validates statement integrity | Trust closing balance blindly |
| 2026-01 | Transaction deduplication | Handles statement overlaps | Allow duplicates, manual cleanup |
| 2026-01 | pdf-lib for PDFs | Pure JS, works on RN | pdfjs (Node.js-specific), react-native-pdf (view-only) |
| 2026-01 | xlsx library | Industry standard, full-featured | react-native-xlsx (limited), custom parser (reinventing wheel) |

---

## Related Documents

- [DATA_FLOW.md](./DATA_FLOW.md) - Detailed data flow diagrams
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing approach and patterns
- [SMS_PATTERNS.md](../SMS_PATTERNS.md) - Bank SMS format documentation
- [CLAUDE.md](../../CLAUDE.md) - Project coding standards
