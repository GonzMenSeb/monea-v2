# Monea v2 - Claude Configuration

## Project Context

Monea is a React Native Android application serving as a centralized digital wallet. It reads SMS messages to automatically track bank transactions from Colombian financial institutions (Bancolombia, Davivienda, BBVA, Nequi, Daviplata).

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
| UI | NativeWind (TailwindCSS) + React Native Paper |
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
├── core/                   # Business logic (SMS parsing engine)
│   └── parser/             # Bank message parsing strategies
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

### Styling (NativeWind)
```typescript
// Prefer NativeWind utility classes
// Extract complex styles to constants
// Use design tokens from theme

const CARD_STYLES = 'bg-white rounded-xl p-4 shadow-sm';

<View className={CARD_STYLES}>
  <Text className="text-lg font-semibold text-gray-900">
    {title}
  </Text>
</View>
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
| Account | A user's bank account linked via SMS |
| Bank Pattern | Regex pattern to parse a specific bank's SMS format |
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
2. Add bank info to `src/core/parser/BankPatterns.ts` (BANK_INFO and BANK_PATTERNS)
3. Implement extraction patterns in the BANK_PATTERNS object
4. Write comprehensive tests with real message samples in `src/core/parser/__tests__/`
5. Update `docs/SMS_PATTERNS.md` with the new bank's message formats

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
| `tailwind.config.js` | NativeWind theme |
| `tsconfig.json` | TypeScript configuration |
| `src/app/_layout.tsx` | Root layout with providers |
| `src/infrastructure/database/schema.ts` | Database schema |
| `src/core/parser/TransactionParser.ts` | Main SMS parsing engine |
| `src/shared/utils/formatting.ts` | Currency and date formatting utilities |
| `.detoxrc.js` | Detox E2E test configuration |
