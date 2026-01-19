# Testing Guide

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm run validate` | Run all checks (typecheck + lint + format + tests) |
| `npm test` | Run unit tests |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint code analysis |
| `npm run e2e:test:android` | Run E2E tests on emulator |

---

## Unit Tests (Jest)

```bash
npm test                    # Run all tests once
npm run test:watch          # Watch mode (re-runs on file changes)
npm run test:coverage       # Generate coverage report
```

Run specific tests:
```bash
npm test -- TransactionList           # Tests matching "TransactionList"
npm test -- --testPathPattern=parser  # Tests in paths containing "parser"
npm test -- src/core/parser           # Tests in specific directory
```

Coverage requirements: 80% for `src/core/`, 70% for `src/features/`.

---

## TypeScript

```bash
npm run typecheck
```

Validates types across the entire codebase without emitting files. Fix all errors before committing.

---

## Linting (ESLint)

```bash
npm run lint        # Check for issues
npm run lint:fix    # Auto-fix issues
```

Rules enforce React Native best practices, import order, and TypeScript standards.

---

## Formatting (Prettier)

```bash
npm run format:check    # Check formatting
npm run format          # Fix formatting
```

---

## E2E Tests (Detox)

Requires Android emulator running.

### Setup
```bash
npm run e2e:build:android    # Build debug APK for testing
```

### Run Tests
```bash
npm run e2e:test:android     # Run on local emulator
npm run e2e:test:ci          # Run in CI environment
```

### Release Testing
```bash
npm run e2e:build:release    # Build release APK
npm run e2e:test:release     # Test release build
```

---

## Full Validation

Before committing or creating PRs:
```bash
npm run validate
```

Runs typecheck, lint, format check, and all unit tests sequentially. All must pass.
