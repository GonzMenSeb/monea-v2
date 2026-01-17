import { memo, useCallback } from 'react';

import { Pressable, Text, View, type PressableProps } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator } from 'react-native-paper';

import { colors } from '@/shared/theme';

import type { PermissionState } from '@/infrastructure/sms';

type SyncButtonVariant = 'primary' | 'secondary' | 'icon';
type SyncButtonSize = 'sm' | 'md' | 'lg';

interface SyncButtonProps extends Omit<PressableProps, 'children'> {
  isSyncing: boolean;
  isListening: boolean;
  permissionState: PermissionState;
  onSyncPress: () => void;
  onPermissionPress?: () => void;
  variant?: SyncButtonVariant;
  size?: SyncButtonSize;
  label?: string;
}

interface ButtonState {
  icon: 'sync' | 'sync-off' | 'shield-alert' | 'sync-circle';
  label: string;
  disabled: boolean;
}

const SIZE_CONFIG = {
  sm: { icon: 18, text: 'text-sm', padding: 'px-3 py-2', iconOnly: 'p-2' },
  md: { icon: 22, text: 'text-base', padding: 'px-4 py-2.5', iconOnly: 'p-3' },
  lg: { icon: 26, text: 'text-lg', padding: 'px-5 py-3', iconOnly: 'p-4' },
} as const;

const VARIANT_STYLES = {
  primary: {
    base: 'bg-primary-500 rounded-xl',
    pressed: 'bg-primary-600',
    text: 'text-white font-semibold',
    iconColor: colors.text.inverse,
  },
  secondary: {
    base: 'bg-background-tertiary rounded-xl border border-gray-200',
    pressed: 'bg-gray-200',
    text: 'text-text-primary font-medium',
    iconColor: colors.primary.DEFAULT,
  },
  icon: {
    base: 'bg-primary-50 rounded-full',
    pressed: 'bg-primary-100',
    text: '',
    iconColor: colors.primary.DEFAULT,
  },
} as const;

function getButtonState(
  isSyncing: boolean,
  isListening: boolean,
  permissionState: PermissionState
): ButtonState {
  if (permissionState === 'denied') {
    return { icon: 'shield-alert', label: 'Grant Permission', disabled: false };
  }

  if (isSyncing) {
    return { icon: 'sync-circle', label: 'Syncing...', disabled: true };
  }

  if (isListening) {
    return { icon: 'sync', label: 'Sync Now', disabled: false };
  }

  return { icon: 'sync-off', label: 'Start Sync', disabled: false };
}

interface SyncButtonContentProps {
  isSyncing: boolean;
  icon: ButtonState['icon'];
  label: string;
  variantStyle: (typeof VARIANT_STYLES)[SyncButtonVariant];
  sizeConfig: (typeof SIZE_CONFIG)[SyncButtonSize];
  showLabel: boolean;
}

const SyncButtonContent = memo(function SyncButtonContent({
  isSyncing,
  icon,
  label,
  variantStyle,
  sizeConfig,
  showLabel,
}: SyncButtonContentProps): React.ReactElement {
  if (isSyncing) {
    return (
      <View className="flex-row items-center justify-center">
        <ActivityIndicator size="small" color={variantStyle.iconColor} />
        {showLabel && (
          <Text className={`ml-2 ${sizeConfig.text} ${variantStyle.text}`}>{label}</Text>
        )}
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-center">
      <MaterialCommunityIcons name={icon} size={sizeConfig.icon} color={variantStyle.iconColor} />
      {showLabel && <Text className={`ml-2 ${sizeConfig.text} ${variantStyle.text}`}>{label}</Text>}
    </View>
  );
});

export const SyncButton = memo(function SyncButton({
  isSyncing,
  isListening,
  permissionState,
  onSyncPress,
  onPermissionPress,
  variant = 'primary',
  size = 'md',
  label: customLabel,
  disabled,
  ...pressableProps
}: SyncButtonProps): React.ReactElement {
  const buttonState = getButtonState(isSyncing, isListening, permissionState);
  const variantStyle = VARIANT_STYLES[variant];
  const sizeConfig = SIZE_CONFIG[size];

  const isDisabled = disabled || buttonState.disabled;
  const showLabel = variant !== 'icon';
  const label = customLabel ?? buttonState.label;

  const handlePress = useCallback(() => {
    if (permissionState === 'denied' && onPermissionPress) {
      onPermissionPress();
    } else {
      onSyncPress();
    }
  }, [permissionState, onPermissionPress, onSyncPress]);

  const getContainerStyle = (pressed: boolean): string => {
    const styles = [
      'items-center justify-center',
      variant === 'icon' ? sizeConfig.iconOnly : sizeConfig.padding,
      pressed ? variantStyle.pressed : variantStyle.base,
    ];

    if (isDisabled) {
      styles.push('opacity-50');
    }

    return styles.join(' ');
  };

  return (
    <Pressable
      {...pressableProps}
      disabled={isDisabled}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
    >
      {({ pressed }) => (
        <View className={getContainerStyle(pressed)}>
          <SyncButtonContent
            isSyncing={isSyncing}
            icon={buttonState.icon}
            label={label}
            variantStyle={variantStyle}
            sizeConfig={sizeConfig}
            showLabel={showLabel}
          />
        </View>
      )}
    </Pressable>
  );
});

export type { SyncButtonProps, SyncButtonVariant, SyncButtonSize };
