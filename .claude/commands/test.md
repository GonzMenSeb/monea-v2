# Generate Test Scaffolding

Create test files for existing source files.

## Arguments
- `$ARGUMENTS` - Path to source file(s) to test (e.g., "src/features/transactions/components/TransactionCard.tsx")

## Instructions

1. Read the specified source file
2. Analyze exports, props interfaces, and functionality
3. Generate comprehensive test file

### For Components

Create `{ComponentName}.test.tsx` alongside the component:

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';

import { {ComponentName} } from './{ComponentName}';

const defaultProps: {ComponentName}Props = {
  // Mock required props
};

const renderComponent = (props = {}) => {
  return render(<{ComponentName} {...defaultProps} {...props} />);
};

describe('{ComponentName}', () => {
  describe('rendering', () => {
    it('renders without crashing', () => {
      renderComponent();
      // Verify essential elements
    });

    it('displays expected content', () => {
      renderComponent();
      // Check text content, structure
    });
  });

  describe('interactions', () => {
    it('handles user interactions correctly', () => {
      const mockHandler = jest.fn();
      renderComponent({ onPress: mockHandler });
      // Simulate and verify interactions
    });
  });

  describe('edge cases', () => {
    it('handles empty data gracefully', () => {
      // Test boundary conditions
    });
  });
});
```

### For Hooks

Create `{hookName}.test.ts` alongside the hook:

```typescript
import { renderHook, act } from '@testing-library/react-native';

import { {hookName} } from './{hookName}';

describe('{hookName}', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => {hookName}());
    // Verify initial return values
  });

  it('updates state correctly', () => {
    const { result } = renderHook(() => {hookName}());
    act(() => {
      // Trigger state changes
    });
    // Verify updated state
  });
});
```

### For Services/Utils

Create `{fileName}.test.ts` alongside the file:

```typescript
import { functionName } from './{fileName}';

describe('{functionName}', () => {
  it('returns expected output for valid input', () => {
    const result = functionName(validInput);
    expect(result).toEqual(expectedOutput);
  });

  it('handles edge cases', () => {
    // Test boundary conditions
  });

  it('throws on invalid input', () => {
    expect(() => functionName(invalidInput)).toThrow();
  });
});
```

## Coverage Goals
- `src/core/` - Minimum 80% coverage
- `src/features/` - Minimum 70% coverage
- Test all exported functions
- Focus on behavior, not implementation details

## Mocking Patterns

### Database Mocks
```typescript
jest.mock('@/infrastructure/database', () => ({
  getRepository: jest.fn(),
}));
```

### SMS Module Mocks
```typescript
jest.mock('@/infrastructure/sms', () => ({
  readMessages: jest.fn().mockResolvedValue([]),
}));
```
