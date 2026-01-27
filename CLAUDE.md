# Monea v2 - Claude Configuration

## Project Context

Monea is a React Native Android application serving as a centralized digital wallet. It reads SMS messages and bank statements to automatically track bank transactions from Colombian financial institutions (Bancolombia, Davivienda, BBVA, Nequi, Daviplata). Bank statements provide authoritative balance information and comprehensive transaction history.

**Platform**: Android only (no iOS)
**Framework**: React Native with Expo (managed workflow + dev-client)
**Language**: TypeScript (strict mode)

---

## Critical Rules

### No Assumptions Policy
- **NEVER assume** implementation details, API formats, or bank SMS patterns
- **ALWAYS verify** by reading existing code, running commands, or searching online
- If uncertain, **ASK the user** before proceeding
- When parsing bank SMS formats, require **real message samples** for verification

### Minimal Comments Policy
- Comments are **only allowed** when logic is genuinely non-obvious
- Self-documenting code through clear naming is **mandatory**
- Delete any comment that merely restates what the code does
- JSDoc is permitted only for exported public APIs

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native + Expo (dev-client) |
| Language | TypeScript (strict) |
| UI | Tamagui (dark theme) |
| State | Zustand + React Query |
| Database | WatermelonDB |
| Navigation | Expo Router |
| Testing | Jest + React Native Testing Library |

---

## Architecture

### Directory Structure
```
src/
├── app/                    # Expo Router screens (file-based routing)
├── features/               # Domain features (vertical slices)
│   └── [feature]/
│       ├── components/     # Feature-specific UI
│       ├── hooks/          # Feature-specific hooks
│       ├── services/       # Feature business logic
│       ├── store/          # Feature state (Zustand slice)
│       └── types/          # Feature TypeScript types
├── shared/                 # Cross-feature utilities
│   ├── components/         # Reusable UI components
│   ├── hooks/              # Shared hooks
│   ├── utils/              # Utility functions
│   └── theme/              # Design tokens, colors, typography
├── core/                   # Business logic (SMS & statement parsing)
│   └── parser/             # Modular bank parsers (strategy pattern)
│       ├── banks/          # Per-bank SMS parser implementations
│       ├── statement/      # Statement parsing engine
│       │   ├── banks/      # Per-bank statement parsers
│       │   ├── readers/    # File readers (XLSX, PDF)
│       │   └── shared/     # BaseStatementParser
│       ├── shared/         # BaseBankParser, pattern helpers
│       └── extractors/     # Amount, date, merchant extractors
└── infrastructure/         # External integrations
    ├── database/           # WatermelonDB setup, models, repos
    └── sms/                # SMS reading native module
```

### SOLID Principles

**Single Responsibility**
- Each component handles ONE concern
- Separate UI components from business logic hooks
- One file = one export (prefer named exports)

**Open/Closed**
- Extend via props and composition, not modification
- Use variant props for component variations
- Parser uses strategy pattern for different banks

**Liskov Substitution**
- Child components must be drop-in replacements
- Maintain consistent prop interfaces within component families

**Interface Segregation**
- Props interfaces should be minimal and focused
- Break large components into smaller, composable pieces
- Never pass unused props

**Dependency Inversion**
- Components depend on abstractions (hooks, contexts)
- Infrastructure details hidden behind repository interfaces
- Use dependency injection for services

---

## Code Standards

### TypeScript
```typescript
// REQUIRED: Strict mode enabled
// NO: any, unknown (unless truly necessary with justification)
// YES: Explicit return types on exported functions
// YES: Interface for props, Type for unions/primitives

interface TransactionItemProps {
  transaction: Transaction;
  onPress: (id: string) => void;
}

export function TransactionItem({ transaction, onPress }: TransactionItemProps): React.ReactElement {
  // implementation
}
```

### Components
```typescript
// Functional components only
// Props destructured in signature
// Hooks at top, handlers next, render last

export function AccountCard({ account, onSelect }: AccountCardProps): React.ReactElement {
  const { formatCurrency } = useCurrency();

  const handlePress = useCallback(() => {
    onSelect(account.id);
  }, [account.id, onSelect]);

  return (
    <Pressable onPress={handlePress}>
      <Text>{account.bankName}</Text>
      <Text>{formatCurrency(account.balance)}</Text>
    </Pressable>
  );
}
```

### Styling (Tamagui)
```typescript
// Use Tamagui styled components
// Define variants for component variations
// Use theme tokens ($backgroundSurface, $textPrimary, etc.)

import { styled, Stack, Text } from 'tamagui';

const Card = styled(Stack, {
  name: 'Card',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
});

const Title = styled(Text, {
  name: 'Title',
  fontSize: '$4',
  fontWeight: '600',
  color: '$textPrimary',
});

<Card>
  <Title>{title}</Title>
</Card>
```

### State Management
```typescript
// Zustand for client state
// React Query for server/async state
// Colocation: state lives near usage

// features/transactions/store/transactionStore.ts
interface TransactionStore {
  selectedId: string | null;
  setSelected: (id: string | null) => void;
}

export const useTransactionStore = create<TransactionStore>((set) => ({
  selectedId: null,
  setSelected: (id) => set({ selectedId: id }),
}));
```

### File Naming
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TransactionItem.tsx` |
| Hooks | camelCase, use prefix | `useTransactions.ts` |
| Utils | camelCase | `formatCurrency.ts` |
| Types | PascalCase | `Transaction.ts` |
| Stores | camelCase, Store suffix | `transactionStore.ts` |
| Tests | `.test.ts` suffix | `TransactionItem.test.tsx` |

### Import Order
1. React/React Native
2. External libraries
3. Internal aliases (@/features, @/shared, @/core)
4. Relative imports
5. Types (use `type` import)

```typescript
import { useCallback } from 'react';
import { View, Text } from 'react-native';

import { useQuery } from '@tanstack/react-query';

import { useTransactionStore } from '@/features/transactions/store';
import { Button } from '@/shared/components/ui';
import { formatCurrency } from '@/shared/utils';

import { TransactionItem } from './TransactionItem';

import type { Transaction } from '@/features/transactions/types';
```

---

## Commands

### Development
```bash
npx expo start --android        # Start dev server for Android
npx expo run:android            # Build and run on Android device/emulator
npm test                        # Run Jest tests
npm run test:watch              # Run tests in watch mode
npm run lint                    # ESLint check
npm run lint:fix                # ESLint auto-fix
npm run typecheck               # TypeScript check
```

### Validation
```bash
npm run validate                # Run typecheck, lint, format check, and tests
```

### E2E Testing
```bash
npm run e2e:build:android       # Build debug APK for E2E tests
npm run e2e:test:android        # Run E2E tests on local emulator
npm run e2e:test:ci             # Run E2E tests in CI environment
```

### Build
```bash
eas build --platform android --profile preview   # Build preview APK
eas build --platform android --profile production # Build production AAB
```

---

## Testing Strategy

### Unit Tests
- Test components in isolation
- Mock external dependencies (database, SMS)
- Focus on behavior, not implementation

### Test File Structure
```typescript
// ComponentName.test.tsx
import { render, fireEvent, screen } from '@testing-library/react-native';
import { TransactionItem } from './TransactionItem';

const mockTransaction = {
  id: '1',
  amount: 50000,
  type: 'expense',
  merchant: 'Exito',
  date: new Date('2024-01-15'),
};

describe('TransactionItem', () => {
  it('displays transaction amount formatted as COP', () => {
    render(<TransactionItem transaction={mockTransaction} onPress={jest.fn()} />);
    expect(screen.getByText('$50.000')).toBeTruthy();
  });

  it('calls onPress with transaction id when pressed', () => {
    const onPress = jest.fn();
    render(<TransactionItem transaction={mockTransaction} onPress={onPress} />);
    fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledWith('1');
  });
});
```

### Coverage Requirements
- Minimum 80% coverage for `src/core/` (parser engine)
- Minimum 70% coverage for `src/features/`
- All exported functions must have tests

---

## Domain Terminology

| Term | Definition |
|------|------------|
| Transaction | A single bank operation (income, expense, transfer) |
| Account | A user's bank account linked via SMS or statement import |
| Bank Pattern | Regex pattern to parse a specific bank's SMS format |
| Statement | Official bank document (PDF/XLSX) with transaction history and balances |
| Statement Import | Process of reading bank statement files and extracting transactions |
| Running Balance | Sequential balance recorded after each transaction in a statement |
| Sync | Process of reading SMS and extracting transactions |
| COP | Colombian Peso currency code |

### Colombian Banks Reference
- **Bancolombia**: Largest bank, distinctive blue branding
- **Davivienda**: Red branding, "Daviplata" is their digital wallet
- **BBVA**: Spanish bank operating in Colombia
- **Nequi**: Digital-only bank (Bancolombia subsidiary)
- **Daviplata**: Davivienda's mobile wallet service

---

## Workflows

### Adding a New Feature
1. Create feature directory under `src/features/[name]/`
2. Define types in `types/index.ts`
3. Implement store if needed in `store/`
4. Create components in `components/`
5. Add hooks in `hooks/`
6. Create screen in `src/app/`
7. Write tests alongside each file

### Adding a New Bank Parser
1. Collect real SMS samples from the bank
2. Create bank directory: `src/core/parser/banks/{bankcode}/`
3. Create `patterns.ts` with bank-specific regex patterns
4. Create `{BankName}Parser.ts` extending `BaseBankParser`
5. Create `index.ts` exporting the parser
6. Register parser in `src/core/parser/banks/index.ts`
7. Add bank code to `BankCode` type in `src/core/parser/types.ts`
8. Write tests in `banks/{bankcode}/__tests__/{BankName}Parser.test.ts`
9. Update `docs/SMS_PATTERNS.md` with the new bank's message formats

### Adding a New Bank Statement Parser
1. Collect real bank statement samples (PDF/XLSX) with diverse transaction patterns
2. Create bank-specific parser directory: `src/core/parser/statement/banks/{bankcode}/`
3. Create parser class `{BankName}{Type}Parser.ts` extending `BaseStatementParser`:
   - Implement `bankCode` property
   - Implement `supportedFileTypes` property (e.g., `['xlsx']`, `['pdf']`)
   - Implement `matchesFilePattern(metadata)` for file identification
   - Implement `parseStatement(data, metadata)` with:
     - Section extraction (headers, general info, movements, summary)
     - Transaction parsing with running balances
     - Account information extraction (period, account number, opening/closing balances)
   - Use file readers: `XlsxFileReader` for Excel, `PdfFileReader` for PDF
   - Return `ParsedStatementResult` with transactions including `balanceBefore` and `balanceAfter`
4. Create `index.ts` exporting all statement parsers for the bank
5. Register parser in `src/core/parser/statement/banks/index.ts` via `createDefaultStatementRegistry()`
6. Write comprehensive tests in `banks/{bankcode}/__tests__/{BankName}{Type}Parser.test.ts`:
   - Test file pattern matching
   - Test parsing with real sample data structures
   - Test error handling for malformed statements
   - Test balance calculations and transaction type determination
7. Update `docs/STATEMENT_FORMATS.md` with format specifications and sample structure
8. Verify with `npm test` - ensure >80% coverage for parser code

**Statement Parser Guidelines:**
- Statement parsers provide authoritative balance information
- Always extract `balanceBefore` and `balanceAfter` for each transaction
- Handle multiple statement types per bank (savings, credit card, etc.)
- Use descriptive class names: `BancolombiaSavingsParser`, `BancolombiaCardParser`
- Reuse existing date/amount extraction logic from base class where possible
- Support password-protected PDFs when applicable (use `PdfFileReader` options)

### Creating a Component
1. Define props interface
2. Implement component with hooks at top
3. Extract styles to constants if complex
4. Write tests for all interactive behaviors
5. Export from feature's `components/index.ts`

---

## Git Conventions

### Branch Names
```
feat/feature-name       # New feature
fix/bug-description     # Bug fix
refactor/scope          # Code refactoring
docs/topic              # Documentation only
test/scope              # Test additions
```

### Commit Messages
```
type: Brief description (50 chars max)

- What changed
- Why it was needed

Co-Authored-By: Claude <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`

---

## Performance Guidelines

- Use `React.memo` for list item components
- Use `useCallback` for event handlers passed as props
- Use `useMemo` for expensive computations
- Virtualize lists with 50+ items (FlashList)
- Lazy load screens with `React.lazy`
- Target: 60fps scrolling, <3s cold start

---

## Security Considerations

- SMS data stays on device only (no cloud sync)
- Sensitive data encrypted in WatermelonDB
- No logging of transaction amounts in production
- Biometric authentication for app access (future feature)

---

## Quick Reference

### Path Aliases
| Alias | Path |
|-------|------|
| `@/features` | `src/features` |
| `@/shared` | `src/shared` |
| `@/core` | `src/core` |
| `@/infrastructure` | `src/infrastructure` |
| `@/app` | `src/app` |

### Key Files
| File | Purpose |
|------|---------|
| `app.json` | Expo configuration |
| `tamagui.config.ts` | Tamagui theme configuration |
| `tsconfig.json` | TypeScript configuration |
| `src/app/_layout.tsx` | Root layout with providers |
| `src/infrastructure/database/schema.ts` | Database schema |
| `src/core/parser/TransactionParser.ts` | Main SMS parsing engine |
| `src/core/parser/ParserRegistry.ts` | Bank SMS parser registry |
| `src/core/parser/shared/BaseBankParser.ts` | Abstract base class for SMS bank parsers |
| `src/core/parser/banks/index.ts` | Bank SMS parser auto-registration |
| `src/core/parser/statement/StatementParser.ts` | Main statement parsing engine |
| `src/core/parser/statement/StatementParserRegistry.ts` | Bank statement parser registry |
| `src/core/parser/statement/shared/BaseStatementParser.ts` | Abstract base class for statement parsers |
| `src/core/parser/statement/banks/index.ts` | Statement parser auto-registration |
| `src/core/parser/statement/readers/XlsxFileReader.ts` | Excel file reader |
| `src/core/parser/statement/readers/PdfFileReader.ts` | PDF file reader with password support |
| `src/shared/utils/formatting.ts` | Currency and date formatting utilities |
| `.detoxrc.js` | Detox E2E test configuration |
