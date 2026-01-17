# Monea v2 - System Architecture

## Overview

Monea is a **local-first, privacy-focused** digital wallet application for Android that automatically tracks bank transactions by parsing SMS messages from Colombian financial institutions. The application runs entirely on-device with no cloud dependencies, ensuring user financial data remains private and secure.

---

## System Design

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Presentation Layer                          │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│  │   Dashboard   │  │ Transactions  │  │   Settings    │           │
│  │    Screen     │  │    Screen     │  │    Screen     │           │
│  └───────────────┘  └───────────────┘  └───────────────┘           │
│                              │                                      │
│                    Expo Router (File-based)                         │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                         Feature Layer                               │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐           │
│  │  Dashboard    │  │ Transactions  │  │  SMS Sync     │           │
│  │   Feature     │  │   Feature     │  │   Feature     │           │
│  │ ┌───────────┐ │  │ ┌───────────┐ │  │ ┌───────────┐ │           │
│  │ │Components │ │  │ │Components │ │  │ │ Services  │ │           │
│  │ │  Hooks    │ │  │ │  Hooks    │ │  │ │  Hooks    │ │           │
│  │ │  Store    │ │  │ │  Store    │ │  │ │Components │ │           │
│  │ └───────────┘ │  │ └───────────┘ │  │ └───────────┘ │           │
│  └───────────────┘  └───────────────┘  └───────────────┘           │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                          Core Layer                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    SMS Parser Engine                          │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ │  │
│  │  │Bancolombia │ │ Davivienda │ │   BBVA     │ │   Nequi    │ │  │
│  │  │  Strategy  │ │  Strategy  │ │  Strategy  │ │  Strategy  │ │  │
│  │  └────────────┘ └────────────┘ └────────────┘ └────────────┘ │  │
│  │                    Strategy Pattern                           │  │
│  └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────────┐
│                     Infrastructure Layer                            │
│  ┌───────────────────────┐  ┌───────────────────────────────────┐  │
│  │   WatermelonDB        │  │      SMS Native Module            │  │
│  │  ┌─────────────────┐  │  │  ┌─────────────────────────────┐  │  │
│  │  │ Transactions    │  │  │  │ react-native-get-sms-android│  │  │
│  │  │ Accounts        │  │  │  │                             │  │  │
│  │  │ Categories      │  │  │  │ READ_SMS | RECEIVE_SMS      │  │  │
│  │  └─────────────────┘  │  │  └─────────────────────────────┘  │  │
│  │        Models         │  │        Native Bridge              │  │
│  └───────────────────────┘  └───────────────────────────────────┘  │
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

### UI Framework: NativeWind + React Native Paper

| Library | Purpose |
|---------|---------|
| NativeWind | Utility-first styling (TailwindCSS for RN) |
| React Native Paper | Material Design 3 components |

**Why dual frameworks:**
- NativeWind: Rapid UI development, consistent spacing/colors, smaller component files
- React Native Paper: Pre-built accessible components (dialogs, FABs, menus) that follow Material guidelines

**Alternatives Considered:**
- Tamagui: Powerful but steeper learning curve
- Gluestack: Good but less mature ecosystem
- Styled Components: More verbose than utility classes

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
│   │   ├── (tabs)/                   # Tab navigator group
│   │   │   ├── _layout.tsx           # Tab bar configuration
│   │   │   ├── index.tsx             # Dashboard (home tab)
│   │   │   ├── transactions.tsx      # Transactions list tab
│   │   │   └── settings.tsx          # Settings tab
│   │   └── settings/                 # Settings stack screens
│   │       └── accounts.tsx          # Account management
│   │
│   ├── features/                     # Domain features (vertical slices)
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
│   │   │   ├── components/           # SyncButton, SyncStatus
│   │   │   ├── hooks/                # useSmsSync
│   │   │   ├── services/             # SmsSyncService
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
│   │       ├── ParserRegistry.ts     # Strategy registry
│   │       ├── patterns/             # Bank-specific parsers
│   │       │   ├── BancolombiaParser.ts
│   │       │   ├── DaviviendaParser.ts
│   │       │   ├── BBVAParser.ts
│   │       │   └── NequiParser.ts
│   │       ├── extractors/           # Shared extraction logic
│   │       │   ├── AmountExtractor.ts
│   │       │   ├── DateExtractor.ts
│   │       │   └── MerchantExtractor.ts
│   │       └── types.ts              # Parser interfaces
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
├── tailwind.config.js                # NativeWind theme
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

### 1. Strategy Pattern (SMS Parsing)

Each bank has different SMS formats. The parser uses the Strategy pattern to handle this variation:

```
┌──────────────────────┐
│  TransactionParser   │
│  (Context)           │
└──────────┬───────────┘
           │ uses
           ▼
┌──────────────────────┐
│   ParserStrategy     │
│   <<interface>>      │
│  + canParse(sms)     │
│  + parse(sms)        │
└──────────┬───────────┘
           │ implemented by
     ┌─────┴─────┬─────────────┐
     ▼           ▼             ▼
┌─────────┐ ┌─────────┐ ┌─────────┐
│Bancol.  │ │Davivien.│ │  BBVA   │
│Parser   │ │Parser   │ │ Parser  │
└─────────┘ └─────────┘ └─────────┘
```

**Benefits:**
- Adding new banks requires only a new strategy file
- Each parser can be unit tested in isolation
- No modification to existing code when extending

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
    └── PaperProvider (Theme)
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
4. ParserRegistry finds matching bank parser
         │
         ▼
5. Bank parser extracts transaction data
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
| New bank support | Add parser strategy to `patterns/` |
| Multi-device sync | Add sync layer to infrastructure |
| Budget categories | Add feature to `features/budgets/` |
| Export to CSV | Add service to `features/export/` |
| Multiple currencies | Extend `AmountExtractor` |

---

## Decision Log

| Date | Decision | Rationale | Alternatives Rejected |
|------|----------|-----------|----------------------|
| 2024-01 | Android only | Colombian market, faster MVP | iOS (small market share) |
| 2024-01 | WatermelonDB | Lazy loading, RN-native | SQLite (no observables), Realm (complex) |
| 2024-01 | Zustand + React Query | Minimal boilerplate, separation | Redux (verbose), MobX (complex) |
| 2024-01 | NativeWind | Utility-first, fast development | Styled Components (verbose) |
| 2024-01 | Feature-based structure | Maintainability at scale | Layer-based (harder to navigate) |
| 2024-01 | Strategy pattern for parsers | Bank extensibility | Switch statement (violates OCP) |

---

## Related Documents

- [DATA_FLOW.md](./DATA_FLOW.md) - Detailed data flow diagrams
- [TESTING_STRATEGY.md](./TESTING_STRATEGY.md) - Testing approach and patterns
- [SMS_PATTERNS.md](../SMS_PATTERNS.md) - Bank SMS format documentation
- [CLAUDE.md](../../CLAUDE.md) - Project coding standards
