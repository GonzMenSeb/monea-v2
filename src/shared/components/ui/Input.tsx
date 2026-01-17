import { useState } from 'react';

import { TextInput, View, Text, Pressable, type TextInputProps } from 'react-native';

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

const SIZE_STYLES: Record<InputSize, { container: string; input: string; label: string }> = {
  sm: {
    container: 'min-h-[40px]',
    input: 'text-sm px-3 py-2',
    label: 'text-xs mb-1',
  },
  md: {
    container: 'min-h-[48px]',
    input: 'text-base px-4 py-3',
    label: 'text-sm mb-1.5',
  },
  lg: {
    container: 'min-h-[56px]',
    input: 'text-lg px-4 py-3.5',
    label: 'text-base mb-2',
  },
};

const STATE_STYLES: Record<InputState, { border: string; borderFocused: string; message: string }> =
  {
    default: {
      border: 'border-gray-300',
      borderFocused: 'border-primary-500',
      message: 'text-text-secondary',
    },
    error: {
      border: 'border-semantic-error',
      borderFocused: 'border-semantic-error',
      message: 'text-semantic-error',
    },
    success: {
      border: 'border-semantic-success',
      borderFocused: 'border-semantic-success',
      message: 'text-semantic-success',
    },
  };

const BASE_INPUT_STYLES = 'rounded-xl border-2 bg-white text-text-primary';
const DISABLED_STYLES = 'bg-background-tertiary opacity-60';

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
  className,
  ...inputProps
}: InputProps): React.ReactElement {
  const [isFocused, setIsFocused] = useState(false);

  const validationState = getValidationState(explicitState, errorMessage, successMessage);
  const sizeStyle = SIZE_STYLES[size];
  const stateStyle = STATE_STYLES[validationState];

  const handleFocus: TextInputProps['onFocus'] = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur: TextInputProps['onBlur'] = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const getBorderStyle = (): string => {
    if (disabled) {
      return 'border-gray-200';
    }
    return isFocused ? stateStyle.borderFocused : stateStyle.border;
  };

  const inputContainerStyles = [
    BASE_INPUT_STYLES,
    sizeStyle.container,
    getBorderStyle(),
    disabled && DISABLED_STYLES,
    (leftIcon || rightIcon) && 'flex-row items-center',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const feedbackMessage = errorMessage || successMessage || hint;
  const feedbackColor = errorMessage
    ? STATE_STYLES.error.message
    : successMessage
      ? STATE_STYLES.success.message
      : 'text-text-muted';

  return (
    <View className="w-full">
      {label && <Text className={`${sizeStyle.label} font-medium text-text-primary`}>{label}</Text>}

      <View className={inputContainerStyles}>
        {leftIcon && <View className="pl-3">{leftIcon}</View>}

        <TextInput
          {...inputProps}
          editable={!disabled}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholderTextColor="#9CA3AF"
          className={`flex-1 ${sizeStyle.input} ${leftIcon ? 'pl-2' : ''} ${rightIcon ? 'pr-2' : ''}`}
          accessibilityState={{ disabled }}
          accessibilityLabel={label}
          accessibilityHint={hint}
        />

        {rightIcon && (
          <Pressable
            onPress={onRightIconPress}
            disabled={disabled || !onRightIconPress}
            className="pr-3"
            accessibilityRole={onRightIconPress ? 'button' : 'none'}
          >
            {rightIcon}
          </Pressable>
        )}
      </View>

      {feedbackMessage && (
        <Text className={`mt-1 text-xs ${feedbackColor}`}>{feedbackMessage}</Text>
      )}
    </View>
  );
}
