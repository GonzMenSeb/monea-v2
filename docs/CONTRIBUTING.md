# Contributing to Monea

Thank you for your interest in contributing to Monea! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 20+
- npm
- Android Studio with SDK 30+
- Java JDK 17+
- Git

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd monea

# Install dependencies
npm install --legacy-peer-deps

# Start development server
npx expo start --android
```

## Code Standards

### TypeScript

- Strict mode is enabled
- No `any` types unless absolutely necessary with justification
- Explicit return types on exported functions
- Use interfaces for props, types for unions/primitives

```typescript
interface ComponentProps {
  value: string;
  onChange: (value: string) => void;
}

export function Component({ value, onChange }: ComponentProps): React.ReactElement {
  // implementation
}
```

### Components

- Functional components only
- Props destructured in function signature
- Hooks at top, handlers next, render last
- Use `React.ReactElement` as return type

### Styling

- Use NativeWind utility classes
- Extract complex styles to constants
- Use theme tokens from `@/shared/theme`

```typescript
const CARD_STYLES = 'bg-white rounded-xl p-4 shadow-sm';

<View className={CARD_STYLES}>
  <Text className="text-lg font-semibold">{title}</Text>
</View>
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

## Git Workflow

### Branch Naming

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

Co-Authored-By: Your Name <email@example.com>
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`

### Pull Requests

1. Create a feature branch from `develop`
2. Make your changes with clear commits
3. Run `npm run validate` before pushing
4. Open a PR with a clear description
5. Request review from maintainers

## Testing

### Unit Tests

- Test components in isolation
- Mock external dependencies
- Focus on behavior, not implementation
- Minimum 70% coverage for features
- Minimum 80% coverage for core parser

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### E2E Tests

- Write E2E tests for critical user flows
- Use Detox for Android testing

```bash
npm run e2e:build:android  # Build app
npm run e2e:test:android   # Run tests
```

## Adding a New Feature

1. Create feature directory under `src/features/[name]/`
2. Define types in `types/index.ts`
3. Implement store if needed in `store/`
4. Create components in `components/`
5. Add hooks in `hooks/`
6. Create screen in `src/app/`
7. Write tests alongside each file
8. Update documentation if needed

## Adding a New Bank Parser

1. Collect real SMS samples from the bank
2. Create pattern file in `src/core/parser/patterns/[BankName].ts`
3. Implement parser strategy following existing patterns
4. Write comprehensive tests with real message samples
5. Register parser in `src/core/parser/ParserRegistry.ts`
6. Update `docs/SMS_PATTERNS.md`

## Code Review Guidelines

### For Authors

- Self-review before requesting review
- Keep PRs focused and reasonably sized
- Respond to feedback constructively
- Update PR based on feedback

### For Reviewers

- Be respectful and constructive
- Focus on code quality and maintainability
- Verify tests pass and coverage is maintained
- Check for security vulnerabilities

## Questions?

If you have questions about contributing, please open an issue for discussion.
