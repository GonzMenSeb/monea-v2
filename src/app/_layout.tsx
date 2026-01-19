import { useEffect } from 'react';

import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TamaguiProvider, QueryProvider, SmsSyncProvider } from '@/shared/providers';
import { ThemeProvider } from '@/shared/theme';

void SplashScreen.preventAutoHideAsync();

function RootLayoutContent(): React.ReactElement {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#0A0B0E' },
          animation: 'fade',
        }}
      />
    </>
  );
}

export default function RootLayout(): React.ReactElement {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <TamaguiProvider>
        <ThemeProvider>
          <QueryProvider>
            <SmsSyncProvider>
              <RootLayoutContent />
            </SmsSyncProvider>
          </QueryProvider>
        </ThemeProvider>
      </TamaguiProvider>
    </SafeAreaProvider>
  );
}
