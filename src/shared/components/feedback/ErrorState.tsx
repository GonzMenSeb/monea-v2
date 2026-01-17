import { Text, View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors } from '@/shared/theme';

import { Button } from '../ui/Button';

type ErrorStateVariant = 'default' | 'network' | 'permission' | 'empty' | 'server';

interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

interface VariantConfig {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  message: string;
}

const VARIANT_CONFIG: Record<ErrorStateVariant, VariantConfig> = {
  default: {
    icon: 'alert-circle-outline',
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
  network: {
    icon: 'wifi-off',
    title: 'No internet connection',
    message: 'Check your connection and try again.',
  },
  permission: {
    icon: 'lock-outline',
    title: 'Permission required',
    message: 'This feature requires additional permissions to work properly.',
  },
  empty: {
    icon: 'database-off-outline',
    title: 'No data available',
    message: 'There is no data to display at the moment.',
  },
  server: {
    icon: 'server-off',
    title: 'Server error',
    message: 'Our servers are having trouble. Please try again later.',
  },
};

const CONTAINER_STYLES = 'flex-1 items-center justify-center px-8 py-12';
const ICON_CONTAINER_STYLES =
  'w-20 h-20 rounded-full bg-semantic-error/10 items-center justify-center mb-6';
const TITLE_STYLES = 'text-xl font-bold text-text-primary text-center';
const MESSAGE_STYLES = 'text-sm text-text-secondary text-center mt-3 max-w-xs';
const ACTIONS_CONTAINER_STYLES = 'mt-8 items-center gap-3';
const DEFAULT_RETRY_LABEL = 'Try Again';

export function ErrorState({
  variant = 'default',
  title,
  message,
  retryLabel,
  onRetry,
  secondaryActionLabel,
  onSecondaryAction,
}: ErrorStateProps): React.ReactElement {
  const config = VARIANT_CONFIG[variant];
  const displayTitle = title ?? config.title;
  const displayMessage = message ?? config.message;
  const displayRetryLabel = retryLabel ?? DEFAULT_RETRY_LABEL;

  return (
    <View className={CONTAINER_STYLES}>
      <View className={ICON_CONTAINER_STYLES}>
        <MaterialCommunityIcons name={config.icon} size={40} color={colors.semantic.error} />
      </View>
      <Text className={TITLE_STYLES}>{displayTitle}</Text>
      <Text className={MESSAGE_STYLES}>{displayMessage}</Text>
      {(onRetry ?? onSecondaryAction) && (
        <View className={ACTIONS_CONTAINER_STYLES}>
          {onRetry && (
            <Button variant="primary" size="md" onPress={onRetry}>
              {displayRetryLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="md" onPress={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </View>
      )}
    </View>
  );
}
