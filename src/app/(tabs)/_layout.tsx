import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/shared/theme';

interface TabIconProps {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  size: number;
}

function TabIcon({ name, color, size }: TabIconProps): React.ReactElement {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}

export default function TabLayout(): React.ReactElement {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent.primary,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.background.surface,
          borderTopColor: colors.border.default,
          borderTopWidth: 1,
          paddingTop: 4,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <TabIcon name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="swap-horizontal" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <TabIcon name="cog" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
