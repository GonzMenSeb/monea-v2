import { useCallback, useState } from 'react';

import { ScrollView } from 'react-native';
import { styled, Stack, Text, YStack, XStack } from 'tamagui';

import { smsPermissions } from '@/infrastructure/sms';
import { Button, Heading, Body, Caption } from '@/shared/components/ui';

import type { PermissionState } from '@/infrastructure/sms';

interface PermissionsScreenProps {
  onPermissionGranted: () => void;
  onSkip?: () => void;
}

interface PermissionFeature {
  icon: string;
  title: string;
  description: string;
}

const PERMISSION_FEATURES: PermissionFeature[] = [
  {
    icon: '📱',
    title: 'Read SMS Messages',
    description: 'Access your bank transaction notifications to automatically track expenses',
  },
  {
    icon: '🔔',
    title: 'Receive SMS',
    description: 'Get notified instantly when new transactions arrive',
  },
  {
    icon: '🔒',
    title: 'Your Privacy Matters',
    description: 'Messages stay on your device. We never upload or share your data',
  },
];

const STATE_MESSAGES: Record<PermissionState, { title: string; description: string }> = {
  unknown: {
    title: 'SMS Access Required',
    description:
      'Monea needs permission to read your SMS messages to automatically detect bank transactions.',
  },
  checking: {
    title: 'Checking Permissions...',
    description: 'Please wait while we verify your permission settings.',
  },
  granted: {
    title: 'Permissions Granted!',
    description: "You're all set. Monea can now track your bank transactions automatically.",
  },
  denied: {
    title: 'Permission Denied',
    description: 'Please grant SMS permissions to use automatic transaction tracking.',
  },
  blocked: {
    title: 'Permission Blocked',
    description: 'SMS permissions were blocked. Please enable them in your device settings.',
  },
};

const Container = styled(YStack, {
  name: 'Container',
  flex: 1,
  paddingHorizontal: '$6',
  paddingTop: 48,
  paddingBottom: '$8',
});

const IconContainer = styled(Stack, {
  name: 'IconContainer',
  width: 96,
  height: 96,
  borderRadius: '$full',
  backgroundColor: '$primaryMuted',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '$6',
});

const FeaturesCard = styled(YStack, {
  name: 'FeaturesCard',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  marginBottom: '$8',
});

const FeatureRow = styled(XStack, {
  name: 'FeatureRow',
  alignItems: 'flex-start',
  paddingVertical: '$4',
});

const FeatureIconContainer = styled(Stack, {
  name: 'FeatureIconContainer',
  width: 40,
  height: 40,
  borderRadius: '$full',
  backgroundColor: '$primaryMuted',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '$4',
});

const FeatureSeparator = styled(Stack, {
  name: 'FeatureSeparator',
  height: 1,
  backgroundColor: '$border',
});

const ButtonsContainer = styled(YStack, {
  name: 'ButtonsContainer',
  marginTop: 'auto',
  gap: '$3',
});

export function PermissionsScreen({
  onPermissionGranted,
  onSkip,
}: PermissionsScreenProps): React.ReactElement {
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermissions = useCallback(async () => {
    setIsRequesting(true);
    setPermissionState('checking');

    try {
      const result = await smsPermissions.requestWithRetry();
      setPermissionState(result.state);

      if (result.state === 'granted') {
        setTimeout(() => {
          onPermissionGranted();
        }, 800);
      }
    } catch {
      setPermissionState('denied');
    } finally {
      setIsRequesting(false);
    }
  }, [onPermissionGranted]);

  const handleOpenSettings = useCallback(async () => {
    await smsPermissions.openAppSettings();
  }, []);

  const handleRetry = useCallback(async () => {
    const result = await smsPermissions.checkPermissionState();
    setPermissionState(result.state);

    if (result.state === 'granted') {
      onPermissionGranted();
    }
  }, [onPermissionGranted]);

  const stateMessage = STATE_MESSAGES[permissionState];
  const showRetryFromSettings = permissionState === 'blocked';
  const showMainButton = permissionState === 'unknown' || permissionState === 'denied';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0A0B0E' }}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    >
      <Container>
        <YStack alignItems="center" marginBottom="$8">
          <IconContainer>
            <Text fontSize={48}>
              {permissionState === 'granted' ? '✅' : '📩'}
            </Text>
          </IconContainer>

          <Heading level="h2" textAlign="center" marginBottom="$3">
            {stateMessage.title}
          </Heading>

          <Body color="$textSecondary" textAlign="center" paddingHorizontal="$4">
            {stateMessage.description}
          </Body>
        </YStack>

        <FeaturesCard>
          {PERMISSION_FEATURES.map((feature, index) => (
            <YStack key={feature.title}>
              <FeatureRow>
                <FeatureIconContainer>
                  <Body>{feature.icon}</Body>
                </FeatureIconContainer>
                <YStack flex={1}>
                  <Body fontWeight="600" marginBottom="$1">{feature.title}</Body>
                  <Caption color="$textSecondary">
                    {feature.description}
                  </Caption>
                </YStack>
              </FeatureRow>
              {index < PERMISSION_FEATURES.length - 1 && <FeatureSeparator />}
            </YStack>
          ))}
        </FeaturesCard>

        <ButtonsContainer>
          {showMainButton && (
            <Button onPress={handleRequestPermissions} loading={isRequesting} fullWidth size="lg">
              {permissionState === 'denied' ? 'Try Again' : 'Grant Permissions'}
            </Button>
          )}

          {showRetryFromSettings && (
            <>
              <Button onPress={handleOpenSettings} fullWidth size="lg">
                Open Settings
              </Button>
              <Button onPress={handleRetry} variant="outline" fullWidth size="lg">
                {"I've Enabled Permissions"}
              </Button>
            </>
          )}

          {permissionState === 'granted' && (
            <Button onPress={onPermissionGranted} fullWidth size="lg">
              Continue
            </Button>
          )}

          {onSkip && permissionState !== 'granted' && (
            <Button onPress={onSkip} variant="secondary" fullWidth size="md">
              Skip for Now
            </Button>
          )}

          <Caption color="$textMuted" textAlign="center" marginTop="$4">
            You can change permissions later in Settings
          </Caption>
        </ButtonsContainer>
      </Container>
    </ScrollView>
  );
}
