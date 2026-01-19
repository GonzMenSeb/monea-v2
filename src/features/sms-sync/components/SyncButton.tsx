import { memo, useCallback } from 'react';

import { Pressable, ActivityIndicator, type PressableProps } from 'react-native';
import { styled, Stack, Text, XStack } from 'tamagui';

import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  sm: { icon: 18, text: 12, paddingH: 12, paddingV: 8, iconOnly: 8 },
  md: { icon: 22, text: 14, paddingH: 16, paddingV: 10, iconOnly: 12 },
  lg: { icon: 26, text: 16, paddingH: 20, paddingV: 12, iconOnly: 16 },
} as const;

const VARIANT_CONFIG = {
  primary: {
    bgColor: colors.accent.primary,
    pressedBgColor: colors.accent.primary + 'CC',
    textColor: colors.background.base,
    iconColor: colors.background.base,
    borderRadius: 12,
  },
  secondary: {
    bgColor: colors.background.surface,
    pressedBgColor: colors.background.elevated,
    textColor: colors.text.primary,
    iconColor: colors.accent.primary,
    borderRadius: 12,
  },
  icon: {
    bgColor: colors.accent.primary + '20',
    pressedBgColor: colors.accent.primary + '40',
    textColor: colors.text.primary,
    iconColor: colors.accent.primary,
    borderRadius: 999,
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

const ButtonContainer = styled(XStack, {
  name: 'ButtonContainer',
  alignItems: 'center',
  justifyContent: 'center',
});

interface SyncButtonContentProps {
  isSyncing: boolean;
  icon: ButtonState['icon'];
  label: string;
  variantConfig: (typeof VARIANT_CONFIG)[SyncButtonVariant];
  sizeConfig: (typeof SIZE_CONFIG)[SyncButtonSize];
  showLabel: boolean;
}

const SyncButtonContent = memo(function SyncButtonContent({
  isSyncing,
  icon,
  label,
  variantConfig,
  sizeConfig,
  showLabel,
}: SyncButtonContentProps): React.ReactElement {
  if (isSyncing) {
    return (
      <ButtonContainer>
        <ActivityIndicator size="small" color={variantConfig.iconColor} />
        {showLabel && (
          <Text
            marginLeft="$2"
            fontSize={sizeConfig.text}
            fontWeight="600"
            color={variantConfig.textColor}
          >
            {label}
          </Text>
        )}
      </ButtonContainer>
    );
  }

  return (
    <ButtonContainer>
      <MaterialCommunityIcons name={icon} size={sizeConfig.icon} color={variantConfig.iconColor} />
      {showLabel && (
        <Text
          marginLeft="$2"
          fontSize={sizeConfig.text}
          fontWeight="600"
          color={variantConfig.textColor}
        >
          {label}
        </Text>
      )}
    </ButtonContainer>
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
  const variantConfig = VARIANT_CONFIG[variant];
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
        <Stack
          alignItems="center"
          justifyContent="center"
          paddingHorizontal={variant === 'icon' ? sizeConfig.iconOnly : sizeConfig.paddingH}
          paddingVertical={variant === 'icon' ? sizeConfig.iconOnly : sizeConfig.paddingV}
          borderRadius={variantConfig.borderRadius}
          backgroundColor={pressed ? variantConfig.pressedBgColor : variantConfig.bgColor}
          opacity={isDisabled ? 0.5 : 1}
        >
          <SyncButtonContent
            isSyncing={isSyncing}
            icon={buttonState.icon}
            label={label}
            variantConfig={variantConfig}
            sizeConfig={sizeConfig}
            showLabel={showLabel}
          />
        </Stack>
      )}
    </Pressable>
  );
});

export type { SyncButtonProps, SyncButtonVariant, SyncButtonSize };
