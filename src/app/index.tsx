import { useCallback, useSyncExternalStore } from 'react';

import { ActivityIndicator } from 'react-native';

import { Redirect, useRouter } from 'expo-router';
import { Stack } from 'tamagui';

import { PermissionsScreen } from '@/features/onboarding';
import { useAppStore } from '@/shared/store/appStore';
import { colors } from '@/shared/theme';

function useStoreHydration(): boolean {
  return useSyncExternalStore(
    useAppStore.persist.onFinishHydration,
    () => useAppStore.persist.hasHydrated(),
    () => false
  );
}

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const isHydrated = useStoreHydration();
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const handleOnboardingComplete = useCallback(() => {
    completeOnboarding();
    router.replace('/(tabs)');
  }, [completeOnboarding, router]);

  if (!isHydrated) {
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" backgroundColor="$backgroundBase">
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </Stack>
    );
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <PermissionsScreen
      onPermissionGranted={handleOnboardingComplete}
      onSkip={handleOnboardingComplete}
    />
  );
}
