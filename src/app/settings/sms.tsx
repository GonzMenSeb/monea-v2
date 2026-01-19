import { useCallback, useEffect, useState } from 'react';

import { Pressable, ScrollView, Alert } from 'react-native';

import { useRouter } from 'expo-router';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { smsPermissions } from '@/infrastructure/sms';
import { Screen } from '@/shared/components/layout';
import { Heading, Body, Caption, Button } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import type { PermissionState } from '@/infrastructure/sms';

const Header = styled(XStack, {
  name: 'Header',
  paddingHorizontal: '$4',
  paddingTop: '$4',
  paddingBottom: '$2',
  alignItems: 'center',
});

const BackButton = styled(XStack, {
  name: 'BackButton',
  alignItems: 'center',
  gap: '$1',
  flex: 1,
});

const ContentContainer = styled(YStack, {
  name: 'ContentContainer',
  padding: '$4',
  gap: '$4',
});

const Card = styled(YStack, {
  name: 'Card',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$3',
});

const PermissionRow = styled(XStack, {
  name: 'PermissionRow',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const StatusBadge = styled(Stack, {
  name: 'StatusBadge',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$full',
});

function getStatusConfig(state: PermissionState): {
  label: string;
  bgColor: string;
  textColor: string;
} {
  switch (state) {
    case 'granted':
      return {
        label: 'Enabled',
        bgColor: colors.accent.primary + '20',
        textColor: colors.accent.primary,
      };
    case 'denied':
    case 'blocked':
      return {
        label: 'Disabled',
        bgColor: colors.accent.danger + '20',
        textColor: colors.accent.danger,
      };
    case 'checking':
      return {
        label: 'Checking...',
        bgColor: colors.background.surface,
        textColor: colors.text.secondary,
      };
    default:
      return {
        label: 'Unknown',
        bgColor: colors.background.surface,
        textColor: colors.text.secondary,
      };
  }
}

export default function SmsSettingsScreen(): React.ReactElement {
  const router = useRouter();
  const [permissionState, setPermissionState] = useState<PermissionState>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    const checkPermissions = async (): Promise<void> => {
      setPermissionState('checking');
      const result = await smsPermissions.checkPermissionState();
      setPermissionState(result.state);
    };
    void checkPermissions();
  }, []);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRequestPermission = useCallback(async () => {
    setIsRequesting(true);
    try {
      const result = await smsPermissions.requestWithRetry();
      setPermissionState(result.state);
      if (result.state === 'blocked') {
        Alert.alert(
          'Permission Blocked',
          'SMS permission has been permanently denied. Please enable it in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => void smsPermissions.openAppSettings() },
          ]
        );
      }
    } finally {
      setIsRequesting(false);
    }
  }, []);

  const handleOpenSettings = useCallback(() => {
    void smsPermissions.openAppSettings();
  }, []);

  const statusConfig = getStatusConfig(permissionState);

  return (
    <Screen
      variant="fixed"
      backgroundColor={colors.background.base}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <Header>
        <Pressable onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back">
          {({ pressed }) => (
            <BackButton opacity={pressed ? 0.7 : 1}>
              <Text color="$accentPrimary" fontSize="$5">
                ‹
              </Text>
              <Body color="$accentPrimary">Back</Body>
            </BackButton>
          )}
        </Pressable>
        <Heading level="h3">SMS Settings</Heading>
        <XStack flex={1} />
      </Header>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <ContentContainer>
          <Card>
            <Body fontWeight="600">SMS Permissions</Body>
            <Caption color="$textSecondary">
              Monea needs SMS permissions to automatically detect bank transactions from your
              messages.
            </Caption>

            <PermissionRow>
              <Body>Read SMS</Body>
              <StatusBadge backgroundColor={statusConfig.bgColor}>
                <Caption color={statusConfig.textColor} fontSize="$1">
                  {statusConfig.label}
                </Caption>
              </StatusBadge>
            </PermissionRow>

            {permissionState !== 'granted' && (
              <Button onPress={handleRequestPermission} loading={isRequesting} fullWidth>
                Grant Permission
              </Button>
            )}

            {permissionState === 'blocked' && (
              <Button variant="outline" onPress={handleOpenSettings} fullWidth>
                Open App Settings
              </Button>
            )}
          </Card>

          <Card>
            <Body fontWeight="600">How SMS Reading Works</Body>
            <YStack gap="$2">
              <Caption color="$textSecondary">
                • Monea reads incoming SMS messages from known Colombian banks
              </Caption>
              <Caption color="$textSecondary">
                • Transaction details are automatically extracted and saved
              </Caption>
              <Caption color="$textSecondary">• Your SMS data never leaves your device</Caption>
              <Caption color="$textSecondary">
                • Only bank messages are processed, personal messages are ignored
              </Caption>
            </YStack>
          </Card>

          <Card>
            <Body fontWeight="600">Supported Banks</Body>
            <YStack gap="$2">
              <Caption color="$textSecondary">• Bancolombia</Caption>
              <Caption color="$textSecondary">• Davivienda</Caption>
              <Caption color="$textSecondary">• BBVA</Caption>
              <Caption color="$textSecondary">• Nequi</Caption>
              <Caption color="$textSecondary">• Daviplata</Caption>
            </YStack>
          </Card>
        </ContentContainer>
      </ScrollView>
    </Screen>
  );
}
