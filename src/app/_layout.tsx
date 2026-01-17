import '../../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { PaperProvider, QueryProvider } from '@/shared/providers';
import { useAppTheme } from '@/shared/theme';

function RootLayoutContent(): React.ReactElement {
  const { isDark } = useAppTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </>
  );
}

export default function RootLayout(): React.ReactElement {
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <PaperProvider>
          <RootLayoutContent />
        </PaperProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
