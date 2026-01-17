# Testing Strategy

This document outlines the testing approach for the Monea application.

## Testing Pyramid

```
         ┌─────────────────┐
         │     E2E Tests   │  ◀── Few, critical paths
         │    (Detox)      │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │ Integration     │  ◀── Medium, feature flows
         │    Tests        │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │   Unit Tests    │  ◀── Many, isolated units
         │  (Jest + RTL)   │
         └─────────────────┘
```

## Coverage Requirements

| Layer | Target Coverage | Rationale |
|-------|-----------------|-----------|
| `src/core/parser/` | 80%+ | Critical business logic |
| `src/features/` | 70%+ | User-facing functionality |
| `src/shared/components/` | 60%+ | Reusable UI components |
| `src/infrastructure/` | 50%+ | External integrations |

## Unit Testing

### Framework
- **Jest**: Test runner and assertion library
- **React Native Testing Library**: Component testing utilities
- **jest-expo**: Expo-specific Jest preset

### Test File Structure

```typescript
// ComponentName.test.tsx
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  describe('rendering', () => {
    it('renders correctly with required props', () => {
      // Test
    });
  });

  describe('interactions', () => {
    it('handles user input correctly', () => {
      // Test
    });
  });

  describe('edge cases', () => {
    it('handles empty state', () => {
      // Test
    });
  });
});
```

### Component Testing Guidelines

1. **Test behavior, not implementation**
   ```typescript
   // Good: Tests what the user sees
   expect(screen.getByText('Submit')).toBeTruthy();

   // Bad: Tests internal state
   expect(component.state.isSubmitting).toBe(true);
   ```

2. **Use semantic queries**
   ```typescript
   // Preferred order:
   screen.getByRole('button');
   screen.getByText('Submit');
   screen.getByTestId('submit-button');
   ```

3. **Mock external dependencies**
   ```typescript
   jest.mock('@/infrastructure/database', () => ({
     database: mockDatabase,
   }));
   ```

### Hook Testing

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useNetworkStatus } from './useNetworkStatus';

describe('useNetworkStatus', () => {
  it('returns online status when connected', async () => {
    const { result } = renderHook(() => useNetworkStatus());

    await act(async () => {
      // Trigger state update
    });

    expect(result.current.isOnline).toBe(true);
  });
});
```

### Parser Testing

The SMS parser is critical and requires extensive testing:

```typescript
// TransactionParser.test.ts
describe('TransactionParser', () => {
  describe('Bancolombia', () => {
    it('parses purchase transaction correctly', () => {
      const sms = {
        address: 'Bancolombia',
        body: 'Bancolombia le informa compra por $50.000 en EXITO',
        date: new Date(),
      };

      const result = parseTransaction(sms);

      expect(result).toEqual({
        bank: 'bancolombia',
        type: 'expense',
        amount: 50000,
        merchant: 'EXITO',
      });
    });
  });

  // Test all banks and transaction types
});
```

## Integration Testing

### Feature Flow Tests

Test complete features from user action to data persistence:

```typescript
// TransactionFeature.integration.test.tsx
describe('Transaction Feature', () => {
  it('displays transactions from database', async () => {
    // Setup mock database with test data
    await seedTestTransactions([
      { id: '1', amount: 50000, merchant: 'Exito' },
    ]);

    // Render the screen
    render(<TransactionsScreen />);

    // Verify data is displayed
    await waitFor(() => {
      expect(screen.getByText('$50.000')).toBeTruthy();
      expect(screen.getByText('Exito')).toBeTruthy();
    });
  });
});
```

### SMS Sync Integration Tests

```typescript
// SmsSyncService.integration.test.ts
describe('SmsSyncService', () => {
  it('processes SMS and creates transactions', async () => {
    // Setup
    const mockSms = createMockBancolombiaMessage();

    // Execute
    await smsSyncService.processSms(mockSms);

    // Verify
    const transactions = await transactionRepo.findAll();
    expect(transactions).toHaveLength(1);
  });
});
```

## E2E Testing

### Framework
- **Detox**: End-to-end testing for React Native

### Test Structure

```typescript
// e2e/onboarding.test.ts
describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('completes onboarding with SMS permissions', async () => {
    await expect(element(by.text('SMS Access Required'))).toBeVisible();
    await element(by.text('Grant Permissions')).tap();
    // ...
  });
});
```

### Critical E2E Paths

1. **Onboarding Flow**
   - Permission request
   - Skip option
   - Permission granted success

2. **Transaction Viewing**
   - List display
   - Detail view
   - Empty state

3. **Settings Management**
   - Account management
   - SMS preferences
   - Navigation

### Running E2E Tests

```bash
# Build the app
npm run e2e:build:android

# Run tests
npm run e2e:test:android

# Run specific test file
detox test --configuration android.emu.debug e2e/onboarding.test.ts
```

## Mocking Strategy

### Database Mocking

```typescript
// jest.setup.js
jest.mock('@nozbe/watermelondb', () => ({
  Database: jest.fn(() => ({
    write: jest.fn(),
    read: jest.fn(),
  })),
  Model: class Model {},
  // ...
}));
```

### Native Module Mocking

```typescript
// jest.setup.js
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
}));

jest.mock('expo-network', () => ({
  getNetworkStateAsync: jest.fn(() =>
    Promise.resolve({ isConnected: true })
  ),
}));
```

### SMS Reader Mocking

```typescript
jest.mock('@maniac-tech/react-native-expo-read-sms', () => ({
  startReadSMS: jest.fn(),
  checkIfHasSMSPermission: jest.fn(),
  requestReadSMSPermission: jest.fn(),
}));
```

## Test Data Factories

### Creating Test Data

```typescript
// testUtils/factories.ts
export function createMockTransaction(
  overrides?: Partial<Transaction>
): Transaction {
  return {
    id: faker.string.uuid(),
    amount: faker.number.int({ min: 1000, max: 1000000 }),
    type: 'expense',
    merchant: faker.company.name(),
    transactionDate: faker.date.recent(),
    ...overrides,
  };
}

export function createMockBancolombiaMessage(): SmsMessage {
  return {
    address: 'Bancolombia',
    body: 'Bancolombia le informa compra por $50.000 en EXITO',
    date: new Date(),
  };
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci --legacy-peer-deps
      - run: npm test -- --coverage

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run e2e:build:android
      - run: npm run e2e:test:android
```

## Best Practices

### Do's
- Write tests before fixing bugs (TDD for bugs)
- Test edge cases and error states
- Use descriptive test names
- Keep tests independent and isolated
- Mock external dependencies consistently

### Don'ts
- Don't test implementation details
- Don't test third-party libraries
- Don't skip flaky tests - fix them
- Don't hardcode test data - use factories
- Don't mix unit and integration tests

## Running Tests

```bash
# All unit tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage

# Specific file
npm test -- TransactionParser.test.ts

# E2E tests
npm run e2e:test:android
```

## Debugging Tests

### Jest Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Detox Debug Mode

```bash
detox test --configuration android.emu.debug --loglevel trace
```

### Common Issues

1. **Async act() warnings**: Wrap state updates in `act()`
2. **Timer issues**: Use `jest.useFakeTimers()` / `jest.useRealTimers()`
3. **Mock not working**: Check mock hoisting and module paths
