# Generate Custom Hook

Create a custom React hook following project conventions.

## Arguments
- `$ARGUMENTS` - Hook name and location (e.g., "useTransactions features/transactions" or "useCurrency shared")

## Instructions

Parse the arguments to extract:
1. **hookName** - camelCase with `use` prefix (e.g., `useTransactions`)
2. **location** - Feature or shared path

Create the following files:

### 1. Hook File: `src/{location}/hooks/{hookName}.ts`

```typescript
import { useState, useCallback } from 'react';

interface Use{HookName}Options {
  // Hook configuration options
}

interface Use{HookName}Return {
  // Return type definition
}

export function {hookName}(options?: Use{HookName}Options): Use{HookName}Return {
  // Implementation

  return {
    // Return values
  };
}
```

### 2. Test File: `src/{location}/hooks/{hookName}.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react-native';

import { {hookName} } from './{hookName}';

describe('{hookName}', () => {
  it('returns expected initial state', () => {
    const { result } = renderHook(() => {hookName}());
    // Add assertions
  });
});
```

### 3. Update barrel export: `src/{location}/hooks/index.ts`

Add export: `export { {hookName} } from './{hookName}';`

## Hook Categories

### Data Fetching Hooks (React Query)
```typescript
import { useQuery } from '@tanstack/react-query';

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });
}
```

### State Hooks (Zustand)
```typescript
import { useTransactionStore } from '../store';

export function useSelectedTransaction() {
  const { selectedId, setSelected } = useTransactionStore();
  // Additional logic
  return { selectedId, setSelected };
}
```

### Utility Hooks
```typescript
export function useCurrency() {
  const formatCOP = useCallback((amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  return { formatCOP };
}
```

## Standards
- Always define explicit return type interface
- Use `useCallback` for returned functions
- Follow CLAUDE.md minimal comments policy
