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
import { Stack, Text } from 'tamagui';

interface {ComponentName}Props {
  // Define props based on component purpose
}

export function {ComponentName}({ ...props }: {ComponentName}Props): React.ReactElement {
  return (
    <Stack backgroundColor="$backgroundSurface" padding="$4" borderRadius="$4">
      <Text fontSize="$4">{ComponentName}</Text>
    </Stack>
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
- Use Tamagui for styling with theme tokens
- Follow CLAUDE.md minimal comments policy
- Explicit return type: `React.ReactElement`
