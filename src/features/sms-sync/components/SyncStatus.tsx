import { memo, useCallback } from 'react';

import { Pressable, ActivityIndicator } from 'react-native';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { colors } from '@/shared/theme';

import type { ProcessResult, SyncResult } from '../services';
import type { PermissionState } from '@/infrastructure/sms';

type SyncStatusVariant = 'compact' | 'detailed' | 'badge';

interface SyncStatusProps {
  isSyncing: boolean;
  isListening: boolean;
  permissionState: PermissionState;
  lastSyncResult: SyncResult | null;
  lastProcessResult: ProcessResult | null;
  error: Error | null;
  unprocessedCount: number;
  variant?: SyncStatusVariant;
  onPress?: () => void;
}

const STATUS_CONFIG = {
  syncing: {
    color: colors.accent.info,
    bgColor: colors.accent.info + '20',
    textColor: colors.accent.info,
    dotColor: colors.accent.info,
  },
  listening: {
    color: colors.accent.primary,
    bgColor: colors.accent.primary + '20',
    textColor: colors.accent.primary,
    dotColor: colors.accent.primary,
  },
  idle: {
    color: colors.text.secondary,
    bgColor: colors.background.surface,
    textColor: colors.text.secondary,
    dotColor: colors.text.muted,
  },
  error: {
    color: colors.accent.danger,
    bgColor: colors.accent.danger + '20',
    textColor: colors.accent.danger,
    dotColor: colors.accent.danger,
  },
  permissionDenied: {
    color: colors.accent.warning,
    bgColor: colors.accent.warning + '20',
    textColor: colors.accent.warning,
    dotColor: colors.accent.warning,
  },
} as const;

type StatusType = keyof typeof STATUS_CONFIG;

function getStatusType(
  props: Pick<SyncStatusProps, 'isSyncing' | 'isListening' | 'permissionState' | 'error'>
): StatusType {
  if (props.error) {
    return 'error';
  }
  if (props.permissionState === 'denied') {
    return 'permissionDenied';
  }
  if (props.isSyncing) {
    return 'syncing';
  }
  if (props.isListening) {
    return 'listening';
  }
  return 'idle';
}

function getStatusLabel(statusType: StatusType, isListening: boolean): string {
  const labels: Record<StatusType, string> = {
    syncing: 'Syncing...',
    listening: 'Monitoring SMS',
    idle: isListening ? 'Ready' : 'Not monitoring',
    error: 'Error',
    permissionDenied: 'Permission Required',
  };
  return labels[statusType];
}

function getStatusDescription(
  statusType: StatusType,
  lastProcessResult: ProcessResult | null,
  unprocessedCount: number
): string | null {
  switch (statusType) {
    case 'syncing':
      return 'Processing messages...';
    case 'listening':
      if (lastProcessResult?.success) {
        return 'Last transaction recorded';
      }
      return unprocessedCount > 0
        ? `${unprocessedCount} message${unprocessedCount > 1 ? 's' : ''} pending`
        : 'Waiting for bank SMS';
    case 'idle':
      return unprocessedCount > 0
        ? `${unprocessedCount} unprocessed message${unprocessedCount > 1 ? 's' : ''}`
        : null;
    case 'error':
      return 'Tap to retry';
    case 'permissionDenied':
      return 'SMS access needed';
    default:
      return null;
  }
}

const StatusDot = styled(Stack, {
  name: 'StatusDot',
  borderRadius: '$full',
});

function CompactContent({
  statusType,
  isListening,
  config,
}: {
  statusType: StatusType;
  isListening: boolean;
  config: (typeof STATUS_CONFIG)[StatusType];
}): React.ReactElement {
  return (
    <XStack alignItems="center">
      {statusType === 'syncing' ? (
        <ActivityIndicator size="small" color={config.color} />
      ) : (
        <StatusDot width={8} height={8} backgroundColor={config.dotColor} />
      )}
      <Text marginLeft="$2" fontSize="$2" fontWeight="500" color={config.textColor}>
        {getStatusLabel(statusType, isListening)}
      </Text>
    </XStack>
  );
}

function DetailedContent({
  statusType,
  isListening,
  config,
  lastProcessResult,
  lastSyncResult,
  error,
  unprocessedCount,
}: {
  statusType: StatusType;
  isListening: boolean;
  config: (typeof STATUS_CONFIG)[StatusType];
  lastProcessResult: ProcessResult | null;
  lastSyncResult: SyncResult | null;
  error: Error | null;
  unprocessedCount: number;
}): React.ReactElement {
  const description = getStatusDescription(statusType, lastProcessResult, unprocessedCount);

  return (
    <YStack>
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center">
          {statusType === 'syncing' ? (
            <ActivityIndicator size="small" color={config.color} />
          ) : (
            <StatusDot width={12} height={12} backgroundColor={config.dotColor} />
          )}
          <Text marginLeft="$2" fontSize="$3" fontWeight="600" color={config.textColor}>
            {getStatusLabel(statusType, isListening)}
          </Text>
        </XStack>
        {lastSyncResult && statusType !== 'error' && (
          <Text fontSize="$1" color="$textMuted">{lastSyncResult.created} new</Text>
        )}
      </XStack>
      {(description || error) && (
        <Text
          marginTop="$1"
          fontSize="$2"
          color={statusType === 'error' ? '$danger' : '$textSecondary'}
        >
          {error?.message ?? description}
        </Text>
      )}
    </YStack>
  );
}

function BadgeContent({
  statusType,
  isListening,
  config,
  unprocessedCount,
}: {
  statusType: StatusType;
  isListening: boolean;
  config: (typeof STATUS_CONFIG)[StatusType];
  unprocessedCount: number;
}): React.ReactElement {
  const showCount = unprocessedCount > 0 && statusType !== 'syncing';

  return (
    <XStack alignItems="center">
      {statusType === 'syncing' ? (
        <ActivityIndicator size={12} color={config.color} />
      ) : (
        <StatusDot width={6} height={6} backgroundColor={config.dotColor} />
      )}
      <Text marginLeft="$1" fontSize="$1" fontWeight="500" color={config.textColor}>
        {showCount ? unprocessedCount : getStatusLabel(statusType, isListening)}
      </Text>
    </XStack>
  );
}

export const SyncStatus = memo(function SyncStatus({
  isSyncing,
  isListening,
  permissionState,
  lastSyncResult,
  lastProcessResult,
  error,
  unprocessedCount,
  variant = 'compact',
  onPress,
}: SyncStatusProps): React.ReactElement {
  const statusType = getStatusType({ isSyncing, isListening, permissionState, error });
  const config = STATUS_CONFIG[statusType];

  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);

  const renderContent = (): React.ReactElement => {
    switch (variant) {
      case 'detailed':
        return (
          <DetailedContent
            statusType={statusType}
            isListening={isListening}
            config={config}
            lastProcessResult={lastProcessResult}
            lastSyncResult={lastSyncResult}
            error={error}
            unprocessedCount={unprocessedCount}
          />
        );
      case 'badge':
        return (
          <BadgeContent
            statusType={statusType}
            isListening={isListening}
            config={config}
            unprocessedCount={unprocessedCount}
          />
        );
      default:
        return <CompactContent statusType={statusType} isListening={isListening} config={config} />;
    }
  };

  const containerStyle = {
    backgroundColor: config.bgColor,
    borderRadius: variant === 'badge' ? 999 : 12,
    paddingHorizontal: variant === 'badge' ? 8 : variant === 'compact' ? 12 : 16,
    paddingVertical: variant === 'badge' ? 4 : variant === 'compact' ? 8 : 12,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={getStatusLabel(statusType, isListening)}
      >
        <Stack {...containerStyle}>
          {renderContent()}
        </Stack>
      </Pressable>
    );
  }

  return <Stack {...containerStyle}>{renderContent()}</Stack>;
});

export type { SyncStatusProps, SyncStatusVariant };
