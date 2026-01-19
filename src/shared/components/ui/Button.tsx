import { useCallback } from 'react';

import { ActivityIndicator } from 'react-native';

import { styled, Stack, Text, type GetProps } from 'tamagui';

import { useHaptics } from '@/shared/hooks/useHaptics';
import { colors } from '@/shared/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const ButtonFrame = styled(Stack, {
  name: 'Button',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  borderRadius: '$3',
  pressStyle: {
    opacity: 0.8,
    scale: 0.98,
  },
  animation: 'fast',

  variants: {
    variant: {
      primary: {
        backgroundColor: '$accentPrimary',
      },
      secondary: {
        backgroundColor: '$backgroundElevated',
      },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '$accentPrimary',
      },
      ghost: {
        backgroundColor: 'transparent',
      },
      danger: {
        backgroundColor: '$accentDanger',
      },
    },
    size: {
      sm: {
        paddingHorizontal: '$3',
        paddingVertical: '$1.5',
        height: 36,
      },
      md: {
        paddingHorizontal: '$4',
        paddingVertical: '$2.5',
        height: 44,
      },
      lg: {
        paddingHorizontal: '$6',
        paddingVertical: '$3.5',
        height: 52,
      },
    },
    fullWidth: {
      true: {
        width: '100%',
      },
    },
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: 'none',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

const ButtonText = styled(Text, {
  name: 'ButtonText',
  fontWeight: '600',

  variants: {
    variant: {
      primary: {
        color: '$textInverse',
      },
      secondary: {
        color: '$textPrimary',
      },
      outline: {
        color: '$accentPrimary',
      },
      ghost: {
        color: '$accentPrimary',
      },
      danger: {
        color: '$white',
      },
    },
    size: {
      sm: {
        fontSize: '$2',
      },
      md: {
        fontSize: '$3',
      },
      lg: {
        fontSize: '$4',
      },
    },
  } as const,

  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

interface ButtonProps extends Omit<GetProps<typeof ButtonFrame>, 'children'> {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  haptic?: boolean;
}

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
  ...props
}: ButtonProps): React.ReactElement {
  const { light } = useHaptics();
  const isDisabled = disabled || loading;

  const handlePress = useCallback(
    (event: Parameters<NonNullable<typeof onPress>>[0]) => {
      if (!isDisabled && onPress) {
        if (haptic) {
          light();
        }
        onPress(event);
      }
    },
    [isDisabled, onPress, haptic, light]
  );

  const loaderColor =
    variant === 'primary' || variant === 'danger' ? colors.text.inverse : colors.accent.primary;

  return (
    <ButtonFrame
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={isDisabled}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={loaderColor} />
      ) : (
        <>
          {leftIcon && <Stack marginRight="$2">{leftIcon}</Stack>}
          <ButtonText variant={variant} size={size}>
            {children}
          </ButtonText>
          {rightIcon && <Stack marginLeft="$2">{rightIcon}</Stack>}
        </>
      )}
    </ButtonFrame>
  );
}
