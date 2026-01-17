# Data Flow Architecture

This document describes how data flows through the Monea application.

## Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        MONEA DATA FLOW                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐     ┌──────────────┐     ┌───────────────┐            │
│  │   SMS    │───▶ │  SMS Reader  │────▶│  Transaction  │           │
│  │ Messages │     │   (Native)   │     │    Parser     │            │
│  └──────────┘     └──────────────┘     └───────┬───────┘            │
│                                                │                    │
│                                                ▼                    │
│                                        ┌───────────────┐            │
│                                        │ WatermelonDB  │            │
│                                        │   (SQLite)    │            │
│                                        └───────┬───────┘            │
│                                                │                    │
│                    ┌───────────────────────────┼───────────────┐    │
│                    │                           │               │    │
│                    ▼                           ▼               ▼    │
│           ┌───────────────┐          ┌───────────────┐ ┌─────────┐  │
│           │  Transaction  │          │   Dashboard   │ │ Settings│  │
│           │    Screen     │          │    Screen     │ │ Screen  │  │
│           └───────────────┘          └───────────────┘ └─────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## SMS Processing Flow

### 1. SMS Reading

```
┌─────────────┐     ┌────────────────┐     ┌──────────────────┐
│ Android SMS │────▶│  SmsReader.ts  │────▶│  SmsPermissions  │
│  Inbox      │     │ (Native Bridge)│     │  (Permission API)│
└─────────────┘     └────────────────┘     └──────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Raw SMS     │
                    │  Messages    │
                    │  [{address,  │
                    │    body,     │
                    │    date}]    │
                    └──────────────┘
```

### 2. Transaction Parsing

```
┌──────────────┐
│  Raw SMS     │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                   TransactionParser                       │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────┐ │
│  │ getBankBySender│─▶│ matchPatterns │─▶│extractDetails│ │
│  └───────────────┘  └───────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│                   ParsedTransaction                       │
│  {                                                        │
│    bank: BankCode,                                        │
│    type: TransactionType,                                 │
│    amount: number,                                        │
│    balance?: number,                                      │
│    merchant?: string,                                     │
│    date: Date,                                            │
│    accountLast4?: string,                                 │
│    rawMessage: string                                     │
│  }                                                        │
└──────────────────────────────────────────────────────────┘
```

### 3. Data Persistence

```
┌─────────────────────┐
│ ParsedTransaction   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                    SmsSyncService                        │
│                                                          │
│  1. Check if SMS already processed (by hash)            │
│  2. Find or create Account record                        │
│  3. Create Transaction record                            │
│  4. Mark SMS as processed                                │
│  5. Update Account balance                               │
└─────────┬───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                    WatermelonDB                          │
│  ┌───────────┐  ┌──────────────┐  ┌───────────────┐    │
│  │ accounts  │  │ transactions │  │ sms_messages  │    │
│  └───────────┘  └──────────────┘  └───────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## State Management Flow

### UI State (Zustand)

```
┌─────────────────────────────────────────────────────────┐
│                     Zustand Stores                       │
│                                                          │
│  ┌─────────────────┐    ┌────────────────────┐          │
│  │ transactionStore│    │    smsSyncStore    │          │
│  │                 │    │                    │          │
│  │ - selectedId    │    │ - syncStatus       │          │
│  │ - filters       │    │ - lastSyncDate     │          │
│  │ - sortOrder     │    │ - syncProgress     │          │
│  └─────────────────┘    └────────────────────┘          │
│                                                          │
│  ┌─────────────────┐    ┌────────────────────┐          │
│  │  accountStore   │    │   settingsStore    │          │
│  │                 │    │                    │          │
│  │ - selectedAccId │    │ - theme            │          │
│  │ - viewMode      │    │ - notifications    │          │
│  └─────────────────┘    └────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### Server State (React Query)

```
┌─────────────────────────────────────────────────────────┐
│                     React Query                          │
│                                                          │
│  useQuery('transactions')                               │
│       │                                                  │
│       └──▶ TransactionRepository.findAll()              │
│                     │                                    │
│                     └──▶ WatermelonDB                   │
│                                                          │
│  useQuery('accounts')                                   │
│       │                                                  │
│       └──▶ AccountRepository.findAll()                  │
│                     │                                    │
│                     └──▶ WatermelonDB                   │
└─────────────────────────────────────────────────────────┘
```

## Component Data Flow

### Dashboard Screen

```
┌─────────────────────────────────────────────────────────┐
│                    DashboardScreen                       │
│                                                          │
│  useDashboardData() ────────────────────────────────▶   │
│       │                                                  │
│       ├── useQuery('accounts')                          │
│       │                                                  │
│       ├── useQuery('transactions', { limit: 5 })        │
│       │                                                  │
│       └── useQuery('spending', { period: 'month' })     │
│                                                          │
│  ┌─────────────┐  ┌───────────────┐  ┌──────────────┐  │
│  │ BalanceCard │  │ SpendingChart │  │ RecentTxns   │  │
│  │   (props)   │  │    (props)    │  │   (props)    │  │
│  └─────────────┘  └───────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Transaction List Screen

```
┌─────────────────────────────────────────────────────────┐
│                  TransactionsScreen                      │
│                                                          │
│  useTransactions() ─────────────────────────────────▶   │
│       │                                                  │
│       ├── useQuery('transactions')                      │
│       │                                                  │
│       └── transactionStore (filters, sort)              │
│                                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │             TransactionList                      │    │
│  │  ┌────────────────────────────────────────────┐ │    │
│  │  │ FlashList                                   │ │    │
│  │  │  ├── SectionHeader                         │ │    │
│  │  │  ├── TransactionItem                       │ │    │
│  │  │  ├── TransactionItem                       │ │    │
│  │  │  └── ...                                   │ │    │
│  │  └────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Sync Flow

### Manual Sync

```
User Press Sync Button
         │
         ▼
┌─────────────────────┐
│   SyncButton.tsx    │
│  onPress()          │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   useSmsSync()      │
│  triggerSync()      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  SmsSyncService     │
│                     │
│  1. Read new SMS    │
│  2. Parse messages  │
│  3. Save to DB      │
│  4. Update UI state │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ React Query         │
│ invalidateQueries() │
│                     │
│ Triggers re-fetch   │
│ of transaction list │
└─────────────────────┘
```

### App Startup Sync

```
App Launch
    │
    ▼
┌─────────────────────┐
│   _layout.tsx       │
│  useEffect()        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────────┐
│ Check SMS Permissions   │
└─────────┬───────────────┘
          │
    ┌─────┴─────┐
    │           │
 Granted     Denied
    │           │
    ▼           ▼
┌────────┐  ┌────────────┐
│ Sync   │  │ Skip sync, │
│ SMS    │  │ show prompt│
└────────┘  └────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────┐
│                    Error Flow                            │
│                                                          │
│  Operation ─────▶ Error Thrown                          │
│                        │                                 │
│                        ▼                                 │
│               ┌────────────────┐                        │
│               │ createAppError │                        │
│               └────────┬───────┘                        │
│                        │                                 │
│      ┌─────────────────┼─────────────────┐              │
│      │                 │                 │              │
│      ▼                 ▼                 ▼              │
│  ┌────────┐      ┌──────────┐      ┌─────────┐         │
│  │Network │      │Permission│      │ Unknown │         │
│  │ Error  │      │  Error   │      │  Error  │         │
│  └────┬───┘      └────┬─────┘      └────┬────┘         │
│       │               │                 │               │
│       ▼               ▼                 ▼               │
│  ┌─────────────────────────────────────────────┐       │
│  │              ErrorState Component            │       │
│  │                                              │       │
│  │  variant = network | permission | default   │       │
│  │  onRetry = retry callback                   │       │
│  └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

## Database Schema Relations

```
┌───────────────────┐     ┌───────────────────┐
│     accounts      │     │   transactions    │
├───────────────────┤     ├───────────────────┤
│ id (PK)           │◀────│ account_id (FK)   │
│ bank_code         │     │ id (PK)           │
│ bank_name         │     │ type              │
│ account_number    │     │ amount            │
│ account_type      │     │ transaction_date  │
│ balance           │     │ merchant          │
│ last_updated      │     │ balance_after     │
│ is_active         │     │ raw_sms_hash      │
│ created_at        │     │ created_at        │
└───────────────────┘     └───────────────────┘
                                   │
                                   │
         ┌───────────────────┐     │
         │   sms_messages    │     │
         ├───────────────────┤     │
         │ id (PK)           │─────┘
         │ address           │
         │ body              │
         │ date              │
         │ is_processed      │
         │ processing_error  │
         │ created_at        │
         └───────────────────┘
```

## Performance Considerations

1. **Virtualized Lists**: FlashList for efficient rendering of large transaction lists
2. **Query Pagination**: React Query with cursor-based pagination
3. **Optimistic Updates**: Zustand for immediate UI feedback
4. **Memoization**: useMemo/useCallback for expensive computations
5. **Lazy Loading**: React.lazy for screen components
