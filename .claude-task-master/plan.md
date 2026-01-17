## Task List

Now I have a clear picture. This is a fresh project (no git repo yet) for building "Monea" - a digital wallet app. Let me create a comprehensive master plan.

---

# 🏦 MONEA v2 - Digital Wallet Application Master Plan

## Project Overview

**Monea** is a React Native Android application serving as a centralized digital wallet that reads SMS messages to track bank transactions from Colombian financial institutions. The app will parse transaction notifications and provide users with a unified view of their financial activity.

---

## Phase 1: Claude Setup & Configuration

### Strategic Approach

The Claude configuration will follow a **domain-driven architecture** approach with:
1. **Project-specific CLAUDE.md** with coding standards, architecture rules, and React Native best practices
2. **Memory Bank pattern** for maintaining project context across sessions
3. **Structured prompting rules** for consistent code generation

### Key Configuration Elements

- **Minimal comments policy** (per user's global CLAUDE.md)
- **No assumptions rule** - always verify or ask
- **SOLID principles enforcement**
- **TypeScript strict mode requirements**
- **React Native + Android-specific patterns**
- **Testing requirements** (Jest + React Native Testing Library)

---

## Phase 2: Technology Stack Decision

### Core Stack (Research-Backed)

| Layer | Technology | Justification |
|-------|------------|---------------|
| **Framework** | React Native (Expo managed workflow with dev-client) | Best balance of native access + DX |
| **Language** | TypeScript (strict mode) | Type safety, better tooling |
| **UI Framework** | NativeWind (TailwindCSS for RN) + React Native Paper | Clean, utility-first styling with Material Design components |
| **State Management** | Zustand + React Query | Lightweight, performant, excellent TS support |
| **Database** | WatermelonDB | Offline-first, reactive, SQLite-backed, excellent for financial data |
| **SMS Access** | react-native-get-sms-android | Native Android SMS reading capability |
| **Navigation** | Expo Router | File-based routing, type-safe |
| **Testing** | Jest + React Native Testing Library + Detox (E2E) | Industry standard |

### Architecture Pattern

**Clean Architecture with Feature-Based Organization**
```
src/
├── app/                    # Expo Router screens
├── features/               # Domain features (transactions, accounts, sms)
│   ├── transactions/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   └── types/
├── shared/                 # Shared utilities, components, hooks
├── core/                   # Business logic, SMS parsing engine
└── infrastructure/         # Database, external APIs
```

---

## Task Breakdown by PR

### PR 1: Project Foundation & Claude Setup
*Create feature branch and establish project foundation*

- [x] `[quick]` Initialize git repository and create feature branch: `feat/project-foundation`
- [x] `[coding]` Create comprehensive `CLAUDE.md` with React Native coding standards, architecture rules, SOLID principles, minimal comments policy, and project-specific instructions
- [x] `[coding]` Create `.claude/commands/` directory with custom slash commands for common operations (component generation, test scaffolding)
- [x] `[quick]` Create `docs/architecture/` directory structure for documentation
- [x] `[coding]` Write `docs/architecture/ARCHITECTURE.md` with detailed system design, stack justification, and folder structure explanation

### PR 2: React Native Project Initialization
*Bootstrap the Expo project with TypeScript*

- [x] `[coding]` Initialize Expo project with TypeScript template using `npx create-expo-app@latest monea --template expo-template-blank-typescript`
- [x] `[coding]` Configure `tsconfig.json` with strict mode and path aliases (`@/features/*`, `@/shared/*`, `@/core/*`)
- [x] `[coding]` Configure `app.json` for Android-only build with proper permissions (READ_SMS, RECEIVE_SMS)
- [x] `[quick]` Create `.gitignore` with React Native + Expo + Android specific ignores
- [x] `[coding]` Set up ESLint + Prettier configuration in `.eslintrc.js` and `.prettierrc` following Airbnb style guide adapted for RN
- [x] `[quick]` Create `babel.config.js` with NativeWind and module resolver plugins

### PR 3: Core Dependencies & UI Framework Setup
*Install and configure all core dependencies*

- [x] `[coding]` Install and configure NativeWind (TailwindCSS) with `tailwind.config.js` and custom theme (Colombian bank colors, typography)
- [x] `[coding]` Install and configure React Native Paper with custom Material Design 3 theme in `src/shared/theme/`
- [x] `[coding]` Install and configure Zustand in `src/shared/store/` with TypeScript and persist middleware
- [x] `[coding]` Install and configure React Query in `src/shared/providers/QueryProvider.tsx`
- [x] `[coding]` Install and configure WatermelonDB with initial schema in `src/infrastructure/database/`
- [x] `[coding]` Create `src/app/_layout.tsx` root layout with all providers (Theme, Query, Paper)

### PR 4: Shared Components & Design System
*Build reusable UI component library*

- [x] `[coding]` Create `src/shared/components/ui/Button.tsx` - Primary, Secondary, Outline variants with NativeWind
- [x] `[coding]` Create `src/shared/components/ui/Card.tsx` - Transaction card, Account card variants
- [x] `[coding]` Create `src/shared/components/ui/Typography.tsx` - Heading, Body, Caption, Amount (currency formatting)
- [x] `[coding]` Create `src/shared/components/ui/Input.tsx` - Text input with validation states
- [x] `[coding]` Create `src/shared/components/layout/Screen.tsx` - Safe area wrapper with keyboard avoiding
- [x] `[coding]` Create `src/shared/components/feedback/EmptyState.tsx` and `LoadingState.tsx`
- [x] `[general]` Write unit tests for all shared components in `src/shared/components/__tests__/`

### PR 5: SMS Reading Infrastructure
*Core SMS access and permission handling*

- [x] `[coding]` Install `react-native-get-sms-android` and configure in `app.json` plugins
- [x] `[coding]` Create `src/infrastructure/sms/SmsReader.ts` - Native module wrapper with TypeScript types
- [x] `[coding]` Create `src/infrastructure/sms/SmsPermissions.ts` - Permission request flow with retry logic
- [x] `[coding]` Create `src/shared/hooks/useSmsPermission.ts` - Hook for permission state management
- [x] `[coding]` Create `src/features/onboarding/screens/PermissionsScreen.tsx` - User-friendly permission request UI
- [x] `[general]` Write tests for SMS infrastructure in `src/infrastructure/sms/__tests__/`

### PR 6: SMS Parsing Engine (Core Business Logic)
*Bank transaction message parsing*

- [ ] `[coding]` Create `src/core/parser/types.ts` - Transaction types (income, expense, transfer), BankInfo, ParsedTransaction interfaces
- [ ] `[coding]` Create `src/core/parser/BankPatterns.ts` - Regex patterns for Colombian banks (Bancolombia, Davivienda, BBVA, Nequi, Daviplata)
- [ ] `[coding]` Create `src/core/parser/TransactionParser.ts` - Main parsing engine with strategy pattern for different banks
- [ ] `[coding]` Create `src/core/parser/AmountExtractor.ts` - Currency amount parsing (COP format with dots/commas)
- [ ] `[coding]` Create `src/core/parser/DateExtractor.ts` - Date/time extraction from various formats
- [ ] `[coding]` Create `src/core/parser/MerchantExtractor.ts` - Merchant/description extraction logic
- [ ] `[coding]` Write comprehensive unit tests in `src/core/parser/__tests__/` with real SMS samples from Colombian banks

### PR 7: Database Models & Repositories
*WatermelonDB entities and data access layer*

- [ ] `[coding]` Create `src/infrastructure/database/schema.ts` - WatermelonDB schema (transactions, accounts, banks, categories)
- [ ] `[coding]` Create `src/infrastructure/database/models/Transaction.ts` - Transaction model with relations
- [ ] `[coding]` Create `src/infrastructure/database/models/Account.ts` - Bank account model
- [ ] `[coding]` Create `src/infrastructure/database/models/Category.ts` - Transaction category model
- [ ] `[coding]` Create `src/infrastructure/database/repositories/TransactionRepository.ts` - CRUD + queries
- [ ] `[coding]` Create `src/infrastructure/database/repositories/AccountRepository.ts` - Account operations
- [ ] `[coding]` Create `src/infrastructure/database/migrations/` - Initial migration setup
- [ ] `[general]` Write repository tests in `src/infrastructure/database/__tests__/`

### PR 8: Transaction Feature Implementation
*Main transaction list and detail views*

- [ ] `[coding]` Create `src/features/transactions/store/transactionStore.ts` - Zustand store for transaction state
- [ ] `[coding]` Create `src/features/transactions/hooks/useTransactions.ts` - React Query hook for transaction data
- [ ] `[coding]` Create `src/features/transactions/components/TransactionList.tsx` - Virtualized list with sections by date
- [ ] `[coding]` Create `src/features/transactions/components/TransactionItem.tsx` - Single transaction row component
- [ ] `[coding]` Create `src/features/transactions/components/TransactionDetail.tsx` - Full transaction view modal
- [ ] `[coding]` Create `src/app/(tabs)/transactions.tsx` - Main transactions screen
- [ ] `[general]` Write tests for transaction feature in `src/features/transactions/__tests__/`

### PR 9: Dashboard & Home Screen
*Main dashboard with financial overview*

- [ ] `[coding]` Create `src/features/dashboard/components/BalanceCard.tsx` - Total balance display with currency formatting
- [ ] `[coding]` Create `src/features/dashboard/components/RecentTransactions.tsx` - Last 5 transactions preview
- [ ] `[coding]` Create `src/features/dashboard/components/SpendingChart.tsx` - Weekly/monthly spending visualization (Victory Native)
- [ ] `[coding]` Create `src/features/dashboard/components/AccountsOverview.tsx` - Bank accounts summary cards
- [ ] `[coding]` Create `src/features/dashboard/hooks/useDashboardData.ts` - Aggregated dashboard data hook
- [ ] `[coding]` Create `src/app/(tabs)/index.tsx` - Home/Dashboard screen
- [ ] `[general]` Write tests for dashboard components in `src/features/dashboard/__tests__/`

### PR 10: SMS Sync Service
*Background SMS processing*

- [ ] `[coding]` Create `src/features/sms-sync/services/SmsSyncService.ts` - Service to read, parse, and store SMS transactions
- [ ] `[coding]` Create `src/features/sms-sync/hooks/useSmsSync.ts` - Hook to trigger and monitor sync
- [ ] `[coding]` Create `src/features/sms-sync/components/SyncStatus.tsx` - Sync progress indicator
- [ ] `[coding]` Create `src/features/sms-sync/components/SyncButton.tsx` - Manual sync trigger
- [ ] `[coding]` Integrate SMS sync into app startup flow in `src/app/_layout.tsx`
- [ ] `[general]` Write integration tests for SMS sync in `src/features/sms-sync/__tests__/`

### PR 11: Settings & Account Management
*User settings and bank account configuration*

- [ ] `[coding]` Create `src/features/settings/screens/SettingsScreen.tsx` - Main settings list
- [ ] `[coding]` Create `src/features/settings/screens/AccountsManagement.tsx` - Add/edit/delete bank accounts
- [ ] `[coding]` Create `src/features/settings/screens/SmsSettings.tsx` - Configure SMS reading preferences
- [ ] `[coding]` Create `src/features/settings/components/AccountForm.tsx` - Bank account form with validation
- [ ] `[coding]` Create `src/app/(tabs)/settings.tsx` - Settings tab screen
- [ ] `[coding]` Create `src/app/settings/accounts.tsx` - Accounts management nested screen
- [ ] `[general]` Write tests for settings feature in `src/features/settings/__tests__/`

### PR 12: Navigation & Tab Structure
*Complete navigation setup*

- [ ] `[coding]` Create `src/app/(tabs)/_layout.tsx` - Bottom tab navigator with icons (Home, Transactions, Settings)
- [ ] `[coding]` Create `src/shared/components/navigation/TabBar.tsx` - Custom tab bar component with animations
- [ ] `[coding]` Create `src/shared/components/navigation/Header.tsx` - Custom header component
- [ ] `[quick]` Configure deep linking in `app.json` for future features
- [ ] `[general]` Write navigation tests with React Navigation testing utilities

### PR 13: UI Polish & Animations
*Visual refinements and micro-interactions*

- [ ] `[coding]` Add pull-to-refresh animation to `TransactionList.tsx` using Reanimated
- [ ] `[coding]` Add skeleton loaders to `src/shared/components/feedback/Skeleton.tsx`
- [ ] `[coding]` Add haptic feedback to buttons and interactions using `expo-haptics`
- [ ] `[coding]` Create `src/shared/animations/` with reusable animation presets (fadeIn, slideUp, scale)
- [ ] `[coding]` Add transaction card swipe actions (categorize, delete) using `react-native-gesture-handler`
- [ ] `[general]` Review and polish all screens for visual consistency

### PR 14: Error Handling & Edge Cases
*Robust error handling throughout the app*

- [ ] `[coding]` Create `src/shared/components/feedback/ErrorBoundary.tsx` - React error boundary with fallback UI
- [ ] `[coding]` Create `src/shared/components/feedback/ErrorState.tsx` - User-friendly error display with retry
- [ ] `[coding]` Create `src/shared/utils/errorHandling.ts` - Centralized error handling utilities
- [ ] `[coding]` Add offline detection and messaging in `src/shared/hooks/useNetworkStatus.ts`
- [ ] `[coding]` Handle SMS permission denied edge case with fallback UI
- [ ] `[general]` Add error handling tests across all features

### PR 15: E2E Testing Setup & Tests
*Detox end-to-end testing*

- [ ] `[coding]` Configure Detox in `e2e/` directory with Android configuration
- [ ] `[coding]` Write E2E test for onboarding flow in `e2e/onboarding.test.ts`
- [ ] `[coding]` Write E2E test for transaction viewing in `e2e/transactions.test.ts`
- [ ] `[coding]` Write E2E test for settings flow in `e2e/settings.test.ts`
- [ ] `[general]` Create CI workflow for E2E tests in `.github/workflows/e2e.yml`

### PR 16: Documentation & Final Polish
*Comprehensive project documentation*

- [ ] `[coding]` Write `README.md` with project overview, setup instructions, architecture summary
- [ ] `[coding]` Write `docs/CONTRIBUTING.md` with contribution guidelines
- [ ] `[coding]` Write `docs/SMS_PATTERNS.md` documenting supported bank message formats
- [ ] `[coding]` Write `docs/architecture/DATA_FLOW.md` with data flow diagrams
- [ ] `[coding]` Write `docs/architecture/TESTING_STRATEGY.md` with testing approach
- [ ] `[quick]` Create `docs/screenshots/` with app screenshots for README
- [ ] `[general]` Final code review and cleanup pass

---

## Success Criteria

1. **Build Success**: `npx expo run:android` compiles and runs without errors on Android device/emulator
2. **Test Coverage**: >80% unit test coverage, all E2E tests passing (`npm test` and `npm run test:e2e`)
3. **Linting Clean**: `npm run lint` passes with zero errors or warnings
4. **SMS Parsing Accuracy**: Parser correctly identifies transactions from at least 5 major Colombian banks (Bancolombia, Davivienda, BBVA, Nequi, Daviplata) with >95% accuracy on test dataset
5. **Performance**: Transaction list renders 500+ items at 60fps, app cold start <3 seconds
6. **Documentation Complete**: All docs written with no TODO placeholders

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| SMS permission denied by user | Clear explanation UI, app works with manual entry fallback |
| Bank changes SMS format | Modular parser patterns, easy to update individual bank patterns |
| WatermelonDB learning curve | Comprehensive type definitions, well-documented repository pattern |
| Android build complexity | Use Expo dev-client, pre-configured native modules |

---

## Notes for Implementation

1. **Start each PR by reading `CLAUDE.md`** to ensure adherence to project standards
2. **No comments unless absolutely necessary** - code should be self-documenting
3. **Ask before assuming** - especially for bank SMS formats, verify with real examples
4. **TypeScript strict mode** - no `any` types, proper interfaces for all data structures
5. **Test as you go** - write tests alongside implementation, not after

---

PLANNING COMPLETE