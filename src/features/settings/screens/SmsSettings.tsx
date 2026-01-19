import { useCallback, useEffect, useState } from 'react';

import { ScrollView, Switch } from 'react-native';
import { styled, Stack, XStack, YStack, Text } from 'tamagui';

import { useRouter } from 'expo-router';

import { useSmsSync } from '@/features/sms-sync/hooks';
import { Screen } from '@/shared/components/layout';
import { colors } from '@/shared/theme';

import type { PermissionState } from '@/infrastructure/sms';

const HeaderContainer = styled(XStack, {
  name: 'HeaderContainer',
  alignItems: 'center',
  paddingHorizontal: '$4',
  paddingTop: '$4',
  paddingBottom: '$2',
});

const BackButton = styled(Stack, {
  name: 'BackButton',
  padding: '$2',
  marginLeft: -8,
  pressStyle: { opacity: 0.7 },
});

const HeaderTitle = styled(Text, {
  name: 'HeaderTitle',
  flex: 1,
  textAlign: 'center',
  marginRight: 32,
  fontSize: '$5',
  fontWeight: '600',
  color: '$textPrimary',
});

const SectionContainer = styled(YStack, {
  name: 'SectionContainer',
  marginBottom: '$6',
});

const SectionHeader = styled(Stack, {
  name: 'SectionHeader',
  paddingHorizontal: '$4',
  paddingVertical: '$2',
});

const SectionLabel = styled(Text, {
  name: 'SectionLabel',
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontWeight: '600',
  fontSize: '$1',
  color: '$textMuted',
});

const Card = styled(YStack, {
  name: 'Card',
  backgroundColor: '$backgroundSurface',
  marginHorizontal: '$4',
  borderRadius: '$4',
  overflow: 'hidden',
});

const StatusCard = styled(YStack, {
  name: 'StatusCard',
  marginHorizontal: '$4',
  borderRadius: '$4',
  padding: '$4',
  marginBottom: '$4',
});

const ItemRow = styled(XStack, {
  name: 'ItemRow',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: '$4',
  paddingVertical: 14,
});

const ItemSeparator = styled(Stack, {
  name: 'ItemSeparator',
  height: 1,
  backgroundColor: '$border',
  marginLeft: '$4',
});

const IconContainer = styled(Stack, {
  name: 'IconContainer',
  width: 40,
  height: 40,
  borderRadius: '$3',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '$3',
});

const BankChip = styled(Stack, {
  name: 'BankChip',
  paddingHorizontal: '$3',
  paddingVertical: 6,
  borderRadius: '$full',
  marginRight: '$2',
  marginBottom: '$2',
});

const ActionButton = styled(Stack, {
  name: 'ActionButton',
  backgroundColor: '$accentPrimary',
  marginHorizontal: '$4',
  paddingVertical: '$3',
  borderRadius: '$3',
  alignItems: 'center',
  pressStyle: { opacity: 0.8 },
});

const SecondaryButton = styled(Stack, {
  name: 'SecondaryButton',
  backgroundColor: '$backgroundSurface',
  marginHorizontal: '$4',
  paddingVertical: '$3',
  borderRadius: '$3',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '$border',
  pressStyle: { opacity: 0.8 },
});

const BodyText = styled(Text, {
  name: 'BodyText',
  color: '$textPrimary',
  fontSize: '$3',

  variants: {
    size: {
      lg: { fontSize: '$4' },
      md: { fontSize: '$3' },
      sm: { fontSize: '$2' },
    },
    secondary: {
      true: { color: '$textSecondary' },
    },
  } as const,
});

const CaptionText = styled(Text, {
  name: 'CaptionText',
  color: '$textMuted',
  fontSize: '$1',
});

interface PermissionStatusProps {
  state: PermissionState;
  hasReadPermission: boolean;
  hasReceivePermission: boolean;
}

const STATUS_COLORS: Record<PermissionState, string> = {
  granted: colors.accent.primary + '20',
  denied: colors.accent.warning + '20',
  blocked: colors.accent.danger + '20',
  unknown: colors.background.elevated,
  checking: colors.background.elevated,
};

function PermissionStatus({
  state,
  hasReadPermission,
  hasReceivePermission,
}: PermissionStatusProps): React.ReactElement {
  const statusConfig: Record<PermissionState, { icon: string; title: string }> = {
    granted: { icon: '✅', title: 'All permissions granted' },
    denied: { icon: '⚠️', title: 'Permissions required' },
    blocked: { icon: '❌', title: 'Permissions blocked' },
    unknown: { icon: '❓', title: 'Checking permissions...' },
    checking: { icon: '⏳', title: 'Checking permissions...' },
  };

  const config = statusConfig[state];

  return (
    <StatusCard backgroundColor={STATUS_COLORS[state]}>
      <XStack alignItems="center" marginBottom="$3">
        <BodyText size="lg" marginRight="$2">{config.icon}</BodyText>
        <BodyText fontWeight="600">{config.title}</BodyText>
      </XStack>

      <YStack gap="$2">
        <XStack alignItems="center" justifyContent="space-between">
          <CaptionText color="$textSecondary">Read SMS</CaptionText>
          <CaptionText color={hasReadPermission ? colors.accent.primary : colors.accent.danger}>
            {hasReadPermission ? 'Granted' : 'Not granted'}
          </CaptionText>
        </XStack>
        <XStack alignItems="center" justifyContent="space-between">
          <CaptionText color="$textSecondary">Receive SMS</CaptionText>
          <CaptionText color={hasReceivePermission ? colors.accent.primary : colors.accent.danger}>
            {hasReceivePermission ? 'Granted' : 'Not granted'}
          </CaptionText>
        </XStack>
      </YStack>
    </StatusCard>
  );
}

interface SettingRowProps {
  icon: string;
  title: string;
  description?: string;
  rightElement?: React.ReactNode;
  isLast?: boolean;
}

function SettingRow({
  icon,
  title,
  description,
  rightElement,
  isLast = false,
}: SettingRowProps): React.ReactElement {
  return (
    <>
      <ItemRow>
        <IconContainer backgroundColor={colors.accent.primary + '20'}>
          <BodyText size="lg">{icon}</BodyText>
        </IconContainer>
        <YStack flex={1}>
          <BodyText>{title}</BodyText>
          {description && (
            <CaptionText color="$textSecondary" marginTop="$1">
              {description}
            </CaptionText>
          )}
        </YStack>
        {rightElement}
      </ItemRow>
      {!isLast && <ItemSeparator />}
    </>
  );
}

interface SyncStatsProps {
  unprocessedCount: number;
  isListening: boolean;
}

function SyncStats({ unprocessedCount, isListening }: SyncStatsProps): React.ReactElement {
  return (
    <StatusCard backgroundColor="$backgroundSurface">
      <XStack justifyContent="space-between">
        <YStack flex={1} alignItems="center">
          <BodyText size="lg" fontWeight="700" color={colors.accent.primary}>
            {isListening ? 'Active' : 'Inactive'}
          </BodyText>
          <CaptionText marginTop="$1">Sync Status</CaptionText>
        </YStack>
        <Stack width={1} backgroundColor="$border" />
        <YStack flex={1} alignItems="center">
          <BodyText
            size="lg"
            fontWeight="700"
            color={unprocessedCount > 0 ? colors.accent.warning : colors.accent.primary}
          >
            {unprocessedCount}
          </BodyText>
          <CaptionText marginTop="$1">Unprocessed</CaptionText>
        </YStack>
      </XStack>
    </StatusCard>
  );
}

const SUPPORTED_BANKS = [
  { code: 'bancolombia', name: 'Bancolombia', color: colors.bancolombia.yellow },
  { code: 'davivienda', name: 'Davivienda', color: colors.davivienda.red },
  { code: 'bbva', name: 'BBVA', color: colors.bbva.blue },
  { code: 'nequi', name: 'Nequi', color: colors.nequi.pink },
  { code: 'daviplata', name: 'Daviplata', color: colors.daviplata.orange },
];

function getBankTextColor(bankColor: string): string {
  return bankColor === colors.bancolombia.yellow ? '#8B7500' : bankColor;
}

function SupportedBanks(): React.ReactElement {
  return (
    <SectionContainer>
      <SectionHeader>
        <SectionLabel>Supported Banks</SectionLabel>
      </SectionHeader>
      <XStack paddingHorizontal="$4" flexWrap="wrap">
        {SUPPORTED_BANKS.map((bank) => (
          <BankChip key={bank.code} backgroundColor={bank.color + '20'}>
            <CaptionText fontWeight="500" color={getBankTextColor(bank.color)}>
              {bank.name}
            </CaptionText>
          </BankChip>
        ))}
      </XStack>
    </SectionContainer>
  );
}

export function SmsSettings(): React.ReactElement {
  const router = useRouter();
  const {
    permissionState,
    permissionStatus,
    isListening,
    unprocessedCount,
    isSyncing,
    requestPermissions,
    openSettings,
    startListening,
    stopListening,
    reprocessFailed,
    refreshUnprocessedCount,
  } = useSmsSync();

  const [reprocessing, setReprocessing] = useState(false);

  useEffect(() => {
    void refreshUnprocessedCount();
  }, [refreshUnprocessedCount]);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleRequestPermissions = useCallback(async () => {
    await requestPermissions();
  }, [requestPermissions]);

  const handleOpenSettings = useCallback(async () => {
    await openSettings();
  }, [openSettings]);

  const handleToggleSync = useCallback(
    (value: boolean) => {
      if (value) {
        startListening();
      } else {
        stopListening();
      }
    },
    [startListening, stopListening]
  );

  const handleReprocessFailed = useCallback(async () => {
    setReprocessing(true);
    try {
      await reprocessFailed();
    } finally {
      setReprocessing(false);
    }
  }, [reprocessFailed]);

  const permissionsGranted = permissionState === 'granted';
  const showPermissionActions = permissionState === 'denied' || permissionState === 'blocked';
  const reprocessButtonText = reprocessing
    ? 'Reprocessing...'
    : `Reprocess ${unprocessedCount} Failed Messages`;

  return (
    <Screen
      variant="fixed"
      backgroundColor={colors.background.surface}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <HeaderContainer>
        <BackButton onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back">
          <BodyText size="lg">←</BodyText>
        </BackButton>
        <HeaderTitle>SMS Settings</HeaderTitle>
      </HeaderContainer>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
      >
        <PermissionStatus
          state={permissionState}
          hasReadPermission={permissionStatus?.hasReadSmsPermission ?? false}
          hasReceivePermission={permissionStatus?.hasReceiveSmsPermission ?? false}
        />

        {showPermissionActions && (
          <YStack marginBottom="$4">
            {permissionState === 'denied' ? (
              <ActionButton onPress={handleRequestPermissions} accessibilityRole="button">
                <BodyText color="$textInverse" fontWeight="600">Grant Permissions</BodyText>
              </ActionButton>
            ) : (
              <SecondaryButton onPress={handleOpenSettings} accessibilityRole="button">
                <BodyText color={colors.accent.primary} fontWeight="600">Open App Settings</BodyText>
              </SecondaryButton>
            )}
          </YStack>
        )}

        {permissionsGranted && (
          <SyncStats unprocessedCount={unprocessedCount} isListening={isListening} />
        )}

        <SectionContainer>
          <SectionHeader>
            <SectionLabel>Real-time Sync</SectionLabel>
          </SectionHeader>
          <Card>
            <SettingRow
              icon="📡"
              title="Auto-sync incoming SMS"
              description="Automatically process new bank SMS messages"
              isLast
              rightElement={
                <Switch
                  value={isListening}
                  onValueChange={handleToggleSync}
                  disabled={!permissionsGranted}
                  trackColor={{ false: colors.text.muted, true: colors.accent.primary + '50' }}
                  thumbColor={isListening ? colors.accent.primary : '#f4f3f4'}
                />
              }
            />
          </Card>
          {!permissionsGranted && (
            <Stack paddingHorizontal="$4" marginTop="$2">
              <CaptionText color={colors.accent.warning}>
                Grant SMS permissions to enable real-time sync
              </CaptionText>
            </Stack>
          )}
        </SectionContainer>

        {permissionsGranted && unprocessedCount > 0 && (
          <YStack marginBottom="$6">
            <SecondaryButton
              onPress={handleReprocessFailed}
              disabled={reprocessing || isSyncing}
              opacity={reprocessing || isSyncing ? 0.5 : 1}
              accessibilityRole="button"
            >
              <BodyText color={colors.accent.primary} fontWeight="600">
                {reprocessButtonText}
              </BodyText>
            </SecondaryButton>
          </YStack>
        )}

        <SupportedBanks />

        <SectionContainer>
          <SectionHeader>
            <SectionLabel>How it works</SectionLabel>
          </SectionHeader>
          <Card padding="$4">
            <YStack gap="$3">
              <XStack alignItems="flex-start">
                <BodyText marginRight="$3">1.</BodyText>
                <BodyText flex={1} secondary>
                  Monea reads incoming SMS messages from supported Colombian banks
                </BodyText>
              </XStack>
              <XStack alignItems="flex-start">
                <BodyText marginRight="$3">2.</BodyText>
                <BodyText flex={1} secondary>
                  Transaction data is extracted and stored locally on your device
                </BodyText>
              </XStack>
              <XStack alignItems="flex-start">
                <BodyText marginRight="$3">3.</BodyText>
                <BodyText flex={1} secondary>
                  Your data never leaves your phone - complete privacy guaranteed
                </BodyText>
              </XStack>
            </YStack>
          </Card>
        </SectionContainer>

        <Stack paddingHorizontal="$4">
          <CaptionText textAlign="center">
            SMS data is processed locally and never uploaded to any server. Your financial
            information remains private and secure on your device.
          </CaptionText>
        </Stack>
      </ScrollView>
    </Screen>
  );
}
