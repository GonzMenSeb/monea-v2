# Generate Component

Create a new React Native component following project conventions.

## Arguments
- `$ARGUMENTS` - Component name and location (e.g., "TransactionCard features/transactions")

## Instructions

Parse the arguments to extract:
1. **ComponentName** - PascalCase component name
2. **Location** - Feature path (defaults to "shared" if not specified)

Create the following files:

### 1. Component File: `src/{location}/components/{ComponentName}.tsx`

```typescript
import { View, Text, Pressable } from 'react-native';

import type { {ComponentName}Props } from './types';

interface {ComponentName}Props {
  // Define props based on component purpose
}

export function {ComponentName}({ ...props }: {ComponentName}Props): React.ReactElement {
  return (
    <View className="">
      <Text className="">{ComponentName}</Text>
    </View>
  );
}
```

### 2. Test File: `src/{location}/components/{ComponentName}.test.tsx`

```typescript
import { render, screen } from '@testing-library/react-native';

import { {ComponentName} } from './{ComponentName}';

describe('{ComponentName}', () => {
  it('renders correctly', () => {
    render(<{ComponentName} />);
    // Add appropriate assertions
  });
});
```

### 3. Update barrel export: `src/{location}/components/index.ts`

Add export: `export { {ComponentName} } from './{ComponentName}';`

## Code Standards
- Use functional components only
- Props destructured in signature
- Hooks at top, handlers next, render last
- Use NativeWind for styling
- Follow CLAUDE.md minimal comments policy
- Explicit return type: `React.ReactElement`
