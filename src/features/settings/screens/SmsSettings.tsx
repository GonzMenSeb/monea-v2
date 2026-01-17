import { useCallback, useEffect, useState } from 'react';

import { Pressable, ScrollView, Switch, View } from 'react-native';

import { useRouter } from 'expo-router';

import { useSmsSync } from '@/features/sms-sync/hooks';
import { Screen } from '@/shared/components/layout';
import { Heading, Body, Caption } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import type { PermissionState } from '@/infrastructure/sms';

const HEADER_STYLES = 'flex-row items-center px-4 pt-4 pb-2';
const BACK_BUTTON_STYLES = 'p-2 -ml-2';
const SECTION_CONTAINER_STYLES = 'mb-6';
const SECTION_HEADER_STYLES = 'px-4 py-2';
const CARD_STYLES = 'bg-surface-card mx-4 rounded-2xl overflow-hidden';
const ITEM_STYLES = 'flex-row items-center justify-between px-4 py-3.5';
const ITEM_SEPARATOR_STYLES = 'h-px bg-gray-100 ml-4';
const ICON_CONTAINER_STYLES = 'w-10 h-10 rounded-xl items-center justify-center mr-3';
const CONTENT_CONTAINER_STYLES = 'flex-1';
const STATUS_CARD_STYLES = 'bg-surface-card mx-4 rounded-2xl p-4 mb-4';
const BANK_CHIP_STYLES = 'px-3 py-1.5 rounded-full mr-2 mb-2';
const ACTION_BUTTON_STYLES = 'bg-primary-500 mx-4 py-3 rounded-xl items-center';
const ACTION_BUTTON_PRESSED_STYLES = 'bg-primary-600';
const SECONDARY_BUTTON_STYLES =
  'bg-surface-card mx-4 py-3 rounded-xl items-center border border-gray-200';
const SECONDARY_BUTTON_PRESSED_STYLES = 'bg-gray-50';

interface PermissionStatusProps {
  state: PermissionState;
  hasReadPermission: boolean;
  hasReceivePermission: boolean;
}

function PermissionStatus({
  state,
  hasReadPermission,
  hasReceivePermission,
}: PermissionStatusProps): React.ReactElement {
  const statusConfig: Record<PermissionState, { icon: string; title: string; bgClass: string }> = {
    granted: { icon: '✅', title: 'All permissions granted', bgClass: 'bg-success-50' },
    denied: { icon: '⚠️', title: 'Permissions required', bgClass: 'bg-warning-50' },
    blocked: { icon: '❌', title: 'Permissions blocked', bgClass: 'bg-error-50' },
    unknown: { icon: '❓', title: 'Checking permissions...', bgClass: 'bg-gray-100' },
    checking: { icon: '⏳', title: 'Checking permissions...', bgClass: 'bg-gray-100' },
  };

  const config = statusConfig[state];

  return (
    <View className={`${STATUS_CARD_STYLES} ${config.bgClass}`}>
      <View className="flex-row items-center mb-3">
        <Body size="lg" className="mr-2">
          {config.icon}
        </Body>
        <Body className="font-semibold">{config.title}</Body>
      </View>

      <View className="space-y-2">
        <View className="flex-row items-center justify-between">
          <Caption muted={false} className="text-text-secondary">
            {'Read SMS'}
          </Caption>
          <Caption
            muted={false}
            className={hasReadPermission ? 'text-success-600' : 'text-error-500'}
          >
            {hasReadPermission ? 'Granted' : 'Not granted'}
          </Caption>
        </View>
        <View className="flex-row items-center justify-between">
          <Caption muted={false} className="text-text-secondary">
            {'Receive SMS'}
          </Caption>
          <Caption
            muted={false}
            className={hasReceivePermission ? 'text-success-600' : 'text-error-500'}
          >
            {hasReceivePermission ? 'Granted' : 'Not granted'}
          </Caption>
        </View>
      </View>
    </View>
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
      <View className={ITEM_STYLES}>
        <View className={`${ICON_CONTAINER_STYLES} bg-primary-50`}>
          <Body size="lg">{icon}</Body>
        </View>
        <View className={CONTENT_CONTAINER_STYLES}>
          <Body>{title}</Body>
          {description && (
            <Caption muted={false} className="text-text-secondary mt-0.5">
              {description}
            </Caption>
          )}
        </View>
        {rightElement}
      </View>
      {!isLast && <View className={ITEM_SEPARATOR_STYLES} />}
    </>
  );
}

interface SyncStatsProps {
  unprocessedCount: number;
  isListening: boolean;
}

function SyncStats({ unprocessedCount, isListening }: SyncStatsProps): React.ReactElement {
  return (
    <View className={STATUS_CARD_STYLES}>
      <View className="flex-row justify-between">
        <View className="flex-1 items-center">
          <Body size="lg" className="font-bold text-primary-600">
            {isListening ? 'Active' : 'Inactive'}
          </Body>
          <Caption className="mt-1">{'Sync Status'}</Caption>
        </View>
        <View className="w-px bg-gray-200" />
        <View className="flex-1 items-center">
          <Body
            size="lg"
            className={`font-bold ${unprocessedCount > 0 ? 'text-warning-500' : 'text-success-600'}`}
          >
            {unprocessedCount}
          </Body>
          <Caption className="mt-1">{'Unprocessed'}</Caption>
        </View>
      </View>
    </View>
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
    <View className={SECTION_CONTAINER_STYLES}>
      <View className={SECTION_HEADER_STYLES}>
        <Caption className="uppercase tracking-wider font-semibold">{'Supported Banks'}</Caption>
      </View>
      <View className="px-4 flex-row flex-wrap">
        {SUPPORTED_BANKS.map((bank) => (
          <View
            key={bank.code}
            className={BANK_CHIP_STYLES}
            style={{ backgroundColor: bank.color + '20' }}
          >
            <Caption
              size="sm"
              muted={false}
              className="font-medium"
              style={{ color: getBankTextColor(bank.color) }}
            >
              {bank.name}
            </Caption>
          </View>
        ))}
      </View>
    </View>
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
      backgroundColor={colors.background.secondary}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <View className={HEADER_STYLES}>
        <Pressable onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back">
          <View className={BACK_BUTTON_STYLES}>
            <Body size="lg">{'←'}</Body>
          </View>
        </Pressable>
        <Heading level="h3" className="flex-1 text-center mr-8">
          {'SMS Settings'}
        </Heading>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pt-4 pb-8"
      >
        <PermissionStatus
          state={permissionState}
          hasReadPermission={permissionStatus?.hasReadSmsPermission ?? false}
          hasReceivePermission={permissionStatus?.hasReceiveSmsPermission ?? false}
        />

        {showPermissionActions && (
          <View className="mb-4">
            {permissionState === 'denied' ? (
              <Pressable onPress={handleRequestPermissions} accessibilityRole="button">
                {({ pressed }) => (
                  <View
                    className={`${ACTION_BUTTON_STYLES} ${pressed ? ACTION_BUTTON_PRESSED_STYLES : ''}`}
                  >
                    <Body className="text-white font-semibold">{'Grant Permissions'}</Body>
                  </View>
                )}
              </Pressable>
            ) : (
              <Pressable onPress={handleOpenSettings} accessibilityRole="button">
                {({ pressed }) => (
                  <View
                    className={`${SECONDARY_BUTTON_STYLES} ${pressed ? SECONDARY_BUTTON_PRESSED_STYLES : ''}`}
                  >
                    <Body className="text-primary-600 font-semibold">{'Open App Settings'}</Body>
                  </View>
                )}
              </Pressable>
            )}
          </View>
        )}

        {permissionsGranted && (
          <SyncStats unprocessedCount={unprocessedCount} isListening={isListening} />
        )}

        <View className={SECTION_CONTAINER_STYLES}>
          <View className={SECTION_HEADER_STYLES}>
            <Caption className="uppercase tracking-wider font-semibold">{'Real-time Sync'}</Caption>
          </View>
          <View className={CARD_STYLES}>
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
                  trackColor={{ false: colors.text.muted, true: colors.primary[200] }}
                  thumbColor={isListening ? colors.primary[500] : '#f4f3f4'}
                />
              }
            />
          </View>
          {!permissionsGranted && (
            <View className="px-4 mt-2">
              <Caption className="text-warning-500">
                {'Grant SMS permissions to enable real-time sync'}
              </Caption>
            </View>
          )}
        </View>

        {permissionsGranted && unprocessedCount > 0 && (
          <View className="mb-6">
            <Pressable
              onPress={handleReprocessFailed}
              disabled={reprocessing || isSyncing}
              accessibilityRole="button"
            >
              {({ pressed }) => (
                <View
                  className={`${SECONDARY_BUTTON_STYLES} ${
                    reprocessing || isSyncing
                      ? 'opacity-50'
                      : pressed
                        ? SECONDARY_BUTTON_PRESSED_STYLES
                        : ''
                  }`}
                >
                  <Body className="text-primary-600 font-semibold">{reprocessButtonText}</Body>
                </View>
              )}
            </Pressable>
          </View>
        )}

        <SupportedBanks />

        <View className={SECTION_CONTAINER_STYLES}>
          <View className={SECTION_HEADER_STYLES}>
            <Caption className="uppercase tracking-wider font-semibold">{'How it works'}</Caption>
          </View>
          <View className={`${CARD_STYLES} p-4`}>
            <View className="space-y-3">
              <View className="flex-row items-start">
                <Body className="mr-3">{'1.'}</Body>
                <Body className="flex-1 text-text-secondary">
                  {'Monea reads incoming SMS messages from supported Colombian banks'}
                </Body>
              </View>
              <View className="flex-row items-start">
                <Body className="mr-3">{'2.'}</Body>
                <Body className="flex-1 text-text-secondary">
                  {'Transaction data is extracted and stored locally on your device'}
                </Body>
              </View>
              <View className="flex-row items-start">
                <Body className="mr-3">{'3.'}</Body>
                <Body className="flex-1 text-text-secondary">
                  {'Your data never leaves your phone - complete privacy guaranteed'}
                </Body>
              </View>
            </View>
          </View>
        </View>

        <View className="px-4">
          <Caption className="text-center">
            {
              'SMS data is processed locally and never uploaded to any server. Your financial information remains private and secure on your device.'
            }
          </Caption>
        </View>
      </ScrollView>
    </Screen>
  );
}
