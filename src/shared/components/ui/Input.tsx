import { useState, useCallback } from 'react';

import { TextInput, type TextInputProps } from 'react-native';

import { styled, Stack, Text, XStack } from 'tamagui';

import { colors } from '@/shared/theme';

type InputState = 'default' | 'error' | 'success';
type InputSize = 'sm' | 'md' | 'lg';

interface InputProps extends Omit<TextInputProps, 'editable'> {
  label?: string;
  hint?: string;
  errorMessage?: string;
  successMessage?: string;
  state?: InputState;
  size?: InputSize;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

const InputContainer = styled(Stack, {
  name: 'InputContainer',
  width: '100%',
});

const InputWrapper = styled(XStack, {
  name: 'InputWrapper',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$3',
  borderWidth: 2,
  alignItems: 'center',

  variants: {
    size: {
      sm: {
        minHeight: 40,
      },
      md: {
        minHeight: 48,
      },
      lg: {
        minHeight: 56,
      },
    },
    state: {
      default: {
        borderColor: '$border',
      },
      error: {
        borderColor: '$accentDanger',
      },
      success: {
        borderColor: '$accentPrimary',
      },
    },
    focused: {
      true: {},
    },
    disabled: {
      true: {
        opacity: 0.6,
        backgroundColor: '$backgroundElevated',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
    state: 'default',
  },
});

const Label = styled(Text, {
  name: 'InputLabel',
  color: '$textPrimary',
  fontWeight: '500',
  marginBottom: '$1.5',

  variants: {
    size: {
      sm: {
        fontSize: '$1',
      },
      md: {
        fontSize: '$2',
      },
      lg: {
        fontSize: '$3',
      },
    },
  } as const,

  defaultVariants: {
    size: 'md',
  },
});

const HintText = styled(Text, {
  name: 'InputHint',
  marginTop: '$1',
  fontSize: '$1',

  variants: {
    state: {
      default: {
        color: '$textMuted',
      },
      error: {
        color: '$accentDanger',
      },
      success: {
        color: '$accentPrimary',
      },
    },
  } as const,

  defaultVariants: {
    state: 'default',
  },
});

const SIZE_STYLES: Record<InputSize, { fontSize: number; paddingHorizontal: number }> = {
  sm: { fontSize: 14, paddingHorizontal: 12 },
  md: { fontSize: 16, paddingHorizontal: 16 },
  lg: { fontSize: 18, paddingHorizontal: 16 },
};

function getValidationState(
  explicitState: InputState | undefined,
  errorMessage: string | undefined,
  successMessage: string | undefined
): InputState {
  if (explicitState) {
    return explicitState;
  }
  if (errorMessage) {
    return 'error';
  }
  if (successMessage) {
    return 'success';
  }
  return 'default';
}

export function Input({
  label,
  hint,
  errorMessage,
  successMessage,
  state: explicitState,
  size = 'md',
  disabled = false,
  leftIcon,
  rightIcon,
  onRightIconPress,
  onFocus,
  onBlur,
  ...inputProps
}: InputProps): React.ReactElement {
  const [isFocused, setIsFocused] = useState(false);

  const validationState = getValidationState(explicitState, errorMessage, successMessage);
  const sizeStyle = SIZE_STYLES[size];

  const handleFocus: TextInputProps['onFocus'] = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onFocus']>>[0]) => {
      setIsFocused(true);
      onFocus?.(e);
    },
    [onFocus]
  );

  const handleBlur: TextInputProps['onBlur'] = useCallback(
    (e: Parameters<NonNullable<TextInputProps['onBlur']>>[0]) => {
      setIsFocused(false);
      onBlur?.(e);
    },
    [onBlur]
  );

  const feedbackMessage = errorMessage || successMessage || hint;
  const feedbackState: InputState = errorMessage ? 'error' : successMessage ? 'success' : 'default';

  const borderColor =
    isFocused && validationState === 'default'
      ? colors.accent.primary
      : validationState === 'error'
        ? colors.accent.danger
        : validationState === 'success'
          ? colors.accent.primary
          : colors.border.default;

  return (
    <InputContainer>
      {label && <Label size={size}>{label}</Label>}

      <InputWrapper size={size} state={validationState} disabled={disabled} style={{ borderColor }}>
        {leftIcon && <Stack paddingLeft="$3">{leftIcon}</Stack>}

        <TextInput
          {...inputProps}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor={colors.text.muted}
          style={{
            flex: 1,
            fontSize: sizeStyle.fontSize,
            paddingHorizontal: leftIcon ? 8 : sizeStyle.paddingHorizontal,
            paddingRight: rightIcon ? 8 : sizeStyle.paddingHorizontal,
            color: colors.text.primary,
          }}
          accessibilityState={{ disabled }}
          accessibilityLabel={label}
          accessibilityHint={hint}
        />

        {rightIcon && (
          <Stack
            paddingRight="$3"
            onPress={disabled || !onRightIconPress ? undefined : onRightIconPress}
            pressStyle={onRightIconPress ? { opacity: 0.7 } : undefined}
            accessibilityRole={onRightIconPress ? 'button' : undefined}
          >
            {rightIcon}
          </Stack>
        )}
      </InputWrapper>

      {feedbackMessage && <HintText state={feedbackState}>{feedbackMessage}</HintText>}
    </InputContainer>
  );
}
