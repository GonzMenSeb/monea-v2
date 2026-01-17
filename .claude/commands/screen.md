# Generate Screen

Create a new Expo Router screen following project conventions.

## Arguments
- `$ARGUMENTS` - Screen path (e.g., "transactions/[id]" or "settings")

## Instructions

Parse the arguments to extract screen path and create the screen file.

### For Static Screen: `src/app/{screenPath}.tsx`

```typescript
import { View } from 'react-native';
import { Stack } from 'expo-router';

import { Text } from '@/shared/components/ui';

export default function {ScreenName}Screen(): React.ReactElement {
  return (
    <>
      <Stack.Screen options={{ title: '{Screen Title}' }} />
      <View className="flex-1 bg-gray-50 p-4">
        <Text className="text-lg">{ScreenName}</Text>
      </View>
    </>
  );
}
```

### For Dynamic Screen: `src/app/{screenPath}.tsx`

```typescript
import { View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

import { Text } from '@/shared/components/ui';

export default function {ScreenName}Screen(): React.ReactElement {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <>
      <Stack.Screen options={{ title: '{Screen Title}' }} />
      <View className="flex-1 bg-gray-50 p-4">
        <Text className="text-lg">Viewing: {id}</Text>
      </View>
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
- Use `Stack.Screen` to configure header
- Apply consistent background: `bg-gray-50`
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
