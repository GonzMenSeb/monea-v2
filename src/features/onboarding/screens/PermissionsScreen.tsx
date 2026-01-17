import { useCallback, useState } from 'react';

import { ScrollView, View } from 'react-native';

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
      className="flex-1 bg-background-primary"
      contentContainerClassName="flex-grow"
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 px-6 pt-12 pb-8">
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-6">
            <Body size="lg" className="text-5xl">
              {permissionState === 'granted' ? '✅' : '📩'}
            </Body>
          </View>

          <Heading level="h2" className="text-center mb-3">
            {stateMessage.title}
          </Heading>

          <Body muted className="text-center px-4">
            {stateMessage.description}
          </Body>
        </View>

        <View className="bg-background-secondary rounded-2xl p-4 mb-8">
          {PERMISSION_FEATURES.map((feature, index) => (
            <View
              key={feature.title}
              className={`flex-row items-start py-4 ${
                index < PERMISSION_FEATURES.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <View className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center mr-4">
                <Body>{feature.icon}</Body>
              </View>
              <View className="flex-1">
                <Body className="font-semibold mb-1">{feature.title}</Body>
                <Caption muted={false} className="text-text-secondary">
                  {feature.description}
                </Caption>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-auto">
          {showMainButton && (
            <Button onPress={handleRequestPermissions} loading={isRequesting} fullWidth size="lg">
              {permissionState === 'denied' ? 'Try Again' : 'Grant Permissions'}
            </Button>
          )}

          {showRetryFromSettings && (
            <View className="gap-3">
              <Button onPress={handleOpenSettings} fullWidth size="lg">
                Open Settings
              </Button>
              <Button onPress={handleRetry} variant="outline" fullWidth size="lg">
                {"I've Enabled Permissions"}
              </Button>
            </View>
          )}

          {permissionState === 'granted' && (
            <Button onPress={onPermissionGranted} fullWidth size="lg">
              Continue
            </Button>
          )}

          {onSkip && permissionState !== 'granted' && (
            <Button onPress={onSkip} variant="secondary" fullWidth size="md" className="mt-3">
              Skip for Now
            </Button>
          )}

          <Caption className="text-center mt-4">
            You can change permissions later in Settings
          </Caption>
        </View>
      </View>
    </ScrollView>
  );
}
