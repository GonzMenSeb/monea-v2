# Generate Screen

Create a new Expo Router screen following project conventions.

## Arguments
- `$ARGUMENTS` - Screen path (e.g., "transactions/[id]" or "settings")

## Instructions

Parse the arguments to extract screen path and create the screen file.

### For Static Screen: `src/app/{screenPath}.tsx`

```typescript
import { Stack as RouterStack } from 'expo-router';
import { YStack, Text } from 'tamagui';

export default function {ScreenName}Screen(): React.ReactElement {
  return (
    <>
      <RouterStack.Screen options={{ title: '{Screen Title}' }} />
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <Text fontSize="$5">{ScreenName}</Text>
      </YStack>
    </>
  );
}
```

### For Dynamic Screen: `src/app/{screenPath}.tsx`

```typescript
import { Stack as RouterStack, useLocalSearchParams } from 'expo-router';
import { YStack, Text } from 'tamagui';

export default function {ScreenName}Screen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <RouterStack.Screen options={{ title: '{Screen Title}' }} />
      <YStack flex={1} backgroundColor="$background" padding="$4">
        <Text fontSize="$5">Viewing: {id}</Text>
      </YStack>
    </>
  );
}
```

### For Tab Layout: `src/app/(tabs)/_layout.tsx`

```typescript
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout(): React.ReactElement {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2563eb' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## Screen Conventions
- Default export required for Expo Router
- Use `Stack.Screen` (from expo-router) to configure header
- Use Tamagui's `$background` token for consistent theming
- Use semantic route naming
- Group related screens with route groups `()`

## File-Based Routing Reference
| File | Route |
|------|-------|
| `app/index.tsx` | `/` |
| `app/settings.tsx` | `/settings` |
| `app/transactions/[id].tsx` | `/transactions/:id` |
| `app/(tabs)/index.tsx` | `/` (in tab navigator) |
| `app/(auth)/login.tsx` | `/login` (in auth group) |
