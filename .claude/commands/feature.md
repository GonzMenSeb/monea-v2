# Scaffold Feature Module

Create a complete feature module following vertical slice architecture.

## Arguments
- `$ARGUMENTS` - Feature name in kebab-case (e.g., "transactions", "accounts")

## Instructions

Parse arguments to get feature name, then create the following structure:

```
src/features/{featureName}/
├── components/
│   └── index.ts
├── hooks/
│   └── index.ts
├── services/
│   └── index.ts
├── store/
│   └── index.ts
├── types/
│   └── index.ts
└── index.ts
```

### Files to Create

#### 1. `src/features/{featureName}/types/index.ts`
```typescript
export interface {FeatureName}Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. `src/features/{featureName}/store/index.ts`
```typescript
import { create } from 'zustand';

interface {FeatureName}Store {
  selectedId: string | null;
  setSelected: (id: string | null) => void;
}

export const use{FeatureName}Store = create<{FeatureName}Store>((set) => ({
  selectedId: null,
  setSelected: (id) => set({ selectedId: id }),
}));
```

#### 3. `src/features/{featureName}/hooks/index.ts`
```typescript
export {};
```

#### 4. `src/features/{featureName}/services/index.ts`
```typescript
export {};
```

#### 5. `src/features/{featureName}/components/index.ts`
```typescript
export {};
```

#### 6. `src/features/{featureName}/index.ts`
```typescript
export * from './components';
export * from './hooks';
export * from './store';
export * from './types';
```

## Naming Conventions
- Feature directory: kebab-case (e.g., `bank-accounts`)
- Types/Interfaces: PascalCase (e.g., `BankAccountEntity`)
- Store hook: camelCase with `use` prefix and `Store` suffix (e.g., `useBankAccountsStore`)

## After Creation
1. Add feature-specific types to `types/index.ts`
2. Create initial components as needed
3. Set up React Query hooks for data fetching
4. Write tests for store and components
