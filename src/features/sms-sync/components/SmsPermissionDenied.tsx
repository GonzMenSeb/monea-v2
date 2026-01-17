import { useCallback } from 'react';

import { Text, View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { smsPermissions } from '@/infrastructure/sms';
import { Button } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

interface SmsPermissionDeniedProps {
  variant?: 'full' | 'compact';
  onRetry?: () => void;
  onSkip?: () => void;
}

const FULL_CONTAINER_STYLES = 'flex-1 items-center justify-center px-8 py-12';
const COMPACT_CONTAINER_STYLES = 'items-center px-6 py-8 bg-background-secondary rounded-2xl mx-4';
const ICON_CONTAINER_STYLES =
  'w-20 h-20 rounded-full bg-semantic-warning/10 items-center justify-center mb-6';
const TITLE_STYLES = 'text-xl font-bold text-text-primary text-center';
const MESSAGE_STYLES = 'text-sm text-text-secondary text-center mt-3 max-w-xs';
const ACTIONS_CONTAINER_STYLES = 'mt-8 w-full gap-3';
const HINT_STYLES = 'text-xs text-text-tertiary text-center mt-4';

const TITLE_TEXT = 'SMS Permission Required';
const MESSAGE_TEXT =
  'Monea needs access to your SMS messages to automatically detect bank transactions. Please enable SMS permissions in your device settings.';
const HINT_TEXT = 'You can also add transactions manually';
const OPEN_SETTINGS_LABEL = 'Open Settings';
const TRY_AGAIN_LABEL = 'Try Again';
const MAYBE_LATER_LABEL = 'Maybe Later';

export function SmsPermissionDenied({
  variant = 'full',
  onRetry,
  onSkip,
}: SmsPermissionDeniedProps): React.ReactElement {
  const containerStyles = variant === 'full' ? FULL_CONTAINER_STYLES : COMPACT_CONTAINER_STYLES;

  const handleOpenSettings = useCallback(async () => {
    await smsPermissions.openAppSettings();
  }, []);

  const handleRetry = useCallback(async () => {
    const result = await smsPermissions.checkPermissionState();
    if (result.state === 'granted' && onRetry) {
      onRetry();
    }
  }, [onRetry]);

  return (
    <View className={containerStyles}>
      <View className={ICON_CONTAINER_STYLES}>
        <MaterialCommunityIcons
          name="message-lock-outline"
          size={40}
          color={colors.semantic.warning}
        />
      </View>
      <Text className={TITLE_STYLES}>{TITLE_TEXT}</Text>
      <Text className={MESSAGE_STYLES}>{MESSAGE_TEXT}</Text>
      <View className={ACTIONS_CONTAINER_STYLES}>
        <Button variant="primary" size="md" fullWidth onPress={handleOpenSettings}>
          {OPEN_SETTINGS_LABEL}
        </Button>
        {onRetry && (
          <Button variant="outline" size="md" fullWidth onPress={handleRetry}>
            {TRY_AGAIN_LABEL}
          </Button>
        )}
        {onSkip && (
          <Button variant="secondary" size="sm" fullWidth onPress={onSkip}>
            {MAYBE_LATER_LABEL}
          </Button>
        )}
      </View>
      <Text className={HINT_STYLES}>{HINT_TEXT}</Text>
    </View>
  );
}
