import { useCallback, useEffect, useState } from 'react';

import { ActivityIndicator } from 'react-native';
import { Stack } from 'tamagui';

import { useRouter } from 'expo-router';

import { PermissionsScreen } from '@/features/onboarding';
import { useAppStore } from '@/shared/store/appStore';
import { colors } from '@/shared/theme';

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  useEffect(() => {
    const unsubscribe = useAppStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useAppStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (isHydrated && hasCompletedOnboarding) {
      router.replace('/(tabs)');
    }
  }, [isHydrated, hasCompletedOnboarding, router]);

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
    return (
      <Stack flex={1} alignItems="center" justifyContent="center" backgroundColor="$backgroundBase">
        <ActivityIndicator size="large" color={colors.accent.primary} />
      </Stack>
    );
  }

  return (
    <PermissionsScreen
      onPermissionGranted={handleOnboardingComplete}
      onSkip={handleOnboardingComplete}
    />
  );
}
