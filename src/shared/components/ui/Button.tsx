import { useCallback } from 'react';

import { ActivityIndicator, Pressable, Text, View, type PressableProps } from 'react-native';

import { useHaptics } from '@/shared/hooks/useHaptics';

type ButtonVariant = 'primary' | 'secondary' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  haptic?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, { base: string; pressed: string; text: string }> = {
  primary: {
    base: 'bg-primary-500',
    pressed: 'bg-primary-600',
    text: 'text-white',
  },
  secondary: {
    base: 'bg-background-tertiary',
    pressed: 'bg-gray-200',
    text: 'text-text-primary',
  },
  outline: {
    base: 'bg-transparent border-2 border-primary-500',
    pressed: 'bg-primary-50',
    text: 'text-primary-500',
  },
};

const SIZE_STYLES: Record<ButtonSize, { container: string; text: string; icon: number }> = {
  sm: {
    container: 'px-3 py-1.5 rounded-lg',
    text: 'text-sm font-medium',
    icon: 16,
  },
  md: {
    container: 'px-4 py-2.5 rounded-xl',
    text: 'text-base font-semibold',
    icon: 20,
  },
  lg: {
    container: 'px-6 py-3.5 rounded-xl',
    text: 'text-lg font-semibold',
    icon: 24,
  },
};

const DISABLED_STYLES = 'opacity-50';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  haptic = true,
  disabled,
  onPress,
  ...pressableProps
}: ButtonProps): React.ReactElement {
  const { light } = useHaptics();
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];
  const isDisabled = disabled || loading;

  const handlePress = useCallback(
    (event: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
      if (!isDisabled && onPress) {
        if (haptic) {
          light();
        }
        onPress(event);
      }
    },
    [isDisabled, onPress, haptic, light]
  );

  const getContainerStyle = (pressed: boolean): string => {
    const baseStyles = [
      'flex-row items-center justify-center',
      sizeStyle.container,
      pressed ? variantStyle.pressed : variantStyle.base,
    ];

    if (fullWidth) {
      baseStyles.push('w-full');
    }

    if (isDisabled) {
      baseStyles.push(DISABLED_STYLES);
    }

    return baseStyles.join(' ');
  };

  const loaderColor = variant === 'primary' ? '#FFFFFF' : '#40A652';

  return (
    <Pressable
      {...pressableProps}
      disabled={isDisabled}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
    >
      {({ pressed }) => (
        <View className={getContainerStyle(pressed)}>
          {loading ? (
            <ActivityIndicator size="small" color={loaderColor} />
          ) : (
            <>
              {leftIcon && <View className="mr-2">{leftIcon}</View>}
              <Text className={`${sizeStyle.text} ${variantStyle.text}`}>{children}</Text>
              {rightIcon && <View className="ml-2">{rightIcon}</View>}
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}
