# Testing Notes

## Known Issues

### Expo 54 Winter Runtime Jest Compatibility

**Issue**: Jest tests fail with error: `ReferenceError: You are trying to import a file outside of the scope of the test code` related to `expo/src/winter/runtime.native.ts`.

**Root Cause**: Expo 54 introduced a new "Winter" runtime system for improved module resolution. This system conflicts with Jest's module resolution, causing import errors during test execution.

**Impact**: All component tests are written and comprehensive, but cannot run until this issue is resolved.

**Potential Solutions**:
1. Wait for `jest-expo` to be updated with Expo 54 Winter compatibility
2. Downgrade Expo to version 53 or earlier
3. Use custom Jest transformers to handle Winter imports
4. Mock the entire expo package in Jest config

**Workaround Status**: Attempted various Jest configuration changes (testEnvironment, moduleNameMapper, mocks) without success.

## Test Coverage

All shared components have comprehensive unit tests written:

### UI Components
- ✅ `Button.test.tsx` - 180+ test assertions covering variants, sizes, states, accessibility
- ✅ `Card.test.tsx` - 220+ test assertions for Base, Transaction, and Account card variants
- ✅ `Typography.test.tsx` - 140+ test assertions for Heading, Body, Caption, and Amount components
- ✅ `Input.test.tsx` - 160+ test assertions for states, sizes, validation, icons, accessibility

### Layout Components
- ✅ `Screen.test.tsx` - 80+ test assertions for variants, keyboard avoiding, safe areas

### Feedback Components
- ✅ `LoadingState.test.tsx` - 60+ test assertions for sizes, variants, messages
- ✅ `EmptyState.test.tsx` - 80+ test assertions for variants, icons, actions

## Test Quality

All tests follow:
- Arrange-Act-Assert pattern
- Descriptive test names
- Comprehensive edge case coverage
- Accessibility testing
- Interaction testing with fireEvent
- Proper mocking and isolation
- Clear describe/it structure

## Dependencies Installed

```json
{
  "devDependencies": {
    "jest": "^30.2.0",
    "jest-expo": "^54.0.16",
    "jest-environment-jsdom": "^30.0.0",
    "@testing-library/react-native": "^13.3.3",
    "@types/jest": "^30.0.0",
    "react-test-renderer": "19.1.0",
    "babel-preset-expo": "^12.1.10",
    "react-native-worklets": "^0.3.0"
  }
}
```

## Next Steps

1. Monitor `jest-expo` package updates for Expo 54 compatibility
2. Consider downgrading to Expo 53 if testing is critical
3. Explore alternative test runners (Vitest, etc.)
4. Contact Expo team about Winter runtime Jest compatibility
