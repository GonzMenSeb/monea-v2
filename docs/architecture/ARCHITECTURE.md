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
│  │  └─────────────────┘  │  │  └─────────────────────────────┘  │   │
│  │        Models         │  │        Native Bridge              │   │ 
│  └───────────────────────┘  └───────────────────────────────────┘   │
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
│   │       ├── TransactionParser.ts  # Main parser entry point
│   │       ├── BankPatterns.ts       # Bank info and regex patterns
│   │       ├── AmountExtractor.ts    # COP amount extraction
│   │       ├── DateExtractor.ts      # Date/time extraction
│   │       ├── MerchantExtractor.ts  # Merchant name extraction
│   │       ├── types.ts              # Parser interfaces
│   │       ├── index.ts              # Public exports
│   │       └── __tests__/            # Parser unit tests
│   │
│   └── infrastructure/               # External system integrations
│       ├── database/
│       │   ├── schema.ts             # WatermelonDB schema definition
│       │   ├── models/               # Transaction, Account, Category models
│       │   ├── repositories/         # TransactionRepository, AccountRepository
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

### 1. Pattern-Based Parsing (SMS Parsing)

Each bank has different SMS formats. The parser uses a pattern-based approach with centralized bank configurations:

```
┌──────────────────────┐
│  TransactionParser   │
│  (Main Entry Point)  │
└──────────┬───────────┘
           │ uses
           ▼
┌──────────────────────┐
│    BankPatterns.ts   │
│  ┌────────────────┐  │
│  │  BANK_INFO     │  │  Bank identifiers & senders
│  │  BANK_PATTERNS │  │  Regex patterns per bank
│  └────────────────┘  │
└──────────┬───────────┘
           │ extracts via
     ┌─────┴─────┬─────────────┐
     ▼           ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────────┐
│ Amount  │ │  Date   │ │  Merchant   │
│Extractor│ │Extractor│ │  Extractor  │
└─────────┘ └─────────┘ └─────────────┘
```

**Benefits:**
- Adding new banks requires updating BANK_INFO and BANK_PATTERNS
- Extractors are reusable across all banks
- Centralized configuration for easy maintenance

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
| New bank support | Add patterns to `BANK_PATTERNS` in `BankPatterns.ts` |
| Multi-device sync | Add sync layer to infrastructure |
| Export to CSV | Add service to `features/backup/` (backup feature exists) |
| Multiple currencies | Extend `AmountExtractor` |
| Budgets | Add feature to `features/budgets/` |

**Implemented Features:**
- ✅ Transaction categories - `features/categories/`
- ✅ Data backup & restore - `features/backup/`
- ✅ Bulk SMS import - `features/sms-sync/` (BulkImportService)

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
| 2026-01 | Detox E2E testing | Native Android testing, CI support | Maestro (less mature) |

---

## Related Documents

- [DATA_FLOW.md](./DATA_FLOW.md) - Detailed data flow diagrams
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing approach and patterns
- [SMS_PATTERNS.md](../SMS_PATTERNS.md) - Bank SMS format documentation
- [CLAUDE.md](../../CLAUDE.md) - Project coding standards
