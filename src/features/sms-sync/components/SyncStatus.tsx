import { memo, useCallback } from 'react';

import { Pressable, Text, View } from 'react-native';

import { ActivityIndicator } from 'react-native-paper';

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
    color: colors.semantic.info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    icon: 'syncing',
  },
  listening: {
    color: colors.semantic.success,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    textColor: 'text-green-700',
    icon: 'active',
  },
  idle: {
    color: colors.text.secondary,
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-600',
    icon: 'idle',
  },
  error: {
    color: colors.semantic.error,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    textColor: 'text-red-700',
    icon: 'error',
  },
  permissionDenied: {
    color: colors.semantic.warning,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
    icon: 'warning',
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

const CONTAINER_STYLES = {
  compact: 'flex-row items-center px-3 py-2 rounded-lg border',
  detailed: 'px-4 py-3 rounded-xl border',
  badge: 'flex-row items-center px-2 py-1 rounded-full',
};

function getIndicatorDotStyle(statusType: StatusType): string {
  if (statusType === 'listening') {
    return 'bg-green-500';
  }
  if (statusType === 'error') {
    return 'bg-red-500';
  }
  return 'bg-gray-400';
}

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
    <>
      {statusType === 'syncing' ? (
        <ActivityIndicator size="small" color={config.color} />
      ) : (
        <View className={`w-2 h-2 rounded-full ${getIndicatorDotStyle(statusType)}`} />
      )}
      <Text className={`ml-2 text-sm font-medium ${config.textColor}`}>
        {getStatusLabel(statusType, isListening)}
      </Text>
    </>
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
  const messageClassName = `mt-1 text-sm ${statusType === 'error' ? 'text-red-600' : 'text-text-secondary'}`;

  return (
    <>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          {statusType === 'syncing' ? (
            <ActivityIndicator size="small" color={config.color} />
          ) : (
            <View className={`w-3 h-3 rounded-full ${getIndicatorDotStyle(statusType)}`} />
          )}
          <Text className={`ml-2 text-base font-semibold ${config.textColor}`}>
            {getStatusLabel(statusType, isListening)}
          </Text>
        </View>
        {lastSyncResult && statusType !== 'error' && (
          <Text className="text-xs text-text-muted">{lastSyncResult.created} new</Text>
        )}
      </View>
      {(description || error) && (
        <Text className={messageClassName}>{error?.message ?? description}</Text>
      )}
    </>
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
    <>
      {statusType === 'syncing' ? (
        <ActivityIndicator size={12} color={config.color} />
      ) : (
        <View className={`w-1.5 h-1.5 rounded-full ${getIndicatorDotStyle(statusType)}`} />
      )}
      <Text className={`ml-1.5 text-xs font-medium ${config.textColor}`}>
        {showCount ? unprocessedCount : getStatusLabel(statusType, isListening)}
      </Text>
    </>
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

  const containerStyle = `${CONTAINER_STYLES[variant]} ${config.bgColor} ${variant !== 'badge' ? config.borderColor : ''}`;

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

  if (onPress) {
    return (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={getStatusLabel(statusType, isListening)}
        className={containerStyle}
      >
        {renderContent()}
      </Pressable>
    );
  }

  return <View className={containerStyle}>{renderContent()}</View>;
});

export type { SyncStatusProps, SyncStatusVariant };
