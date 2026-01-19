import { useCallback, useState } from 'react';

import { TextInput, Pressable } from 'react-native';

import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Caption } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  errorMessage?: string;
  disabled?: boolean;
}

const Container = styled(YStack, {
  name: 'AmountInputContainer',
  width: '100%',
});

const Label = styled(Text, {
  name: 'AmountLabel',
  color: '$textPrimary',
  fontWeight: '500',
  marginBottom: '$1.5',
  fontSize: '$2',
});

const InputWrapper = styled(XStack, {
  name: 'AmountInputWrapper',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$3',
  borderWidth: 2,
  alignItems: 'center',
  minHeight: 56,
  paddingHorizontal: '$4',
});

const CurrencyPrefix = styled(Text, {
  name: 'CurrencyPrefix',
  color: '$textSecondary',
  fontSize: '$5',
  fontWeight: '600',
  marginRight: '$2',
});

const ClearButton = styled(Stack, {
  name: 'ClearButton',
  width: 28,
  height: 28,
  borderRadius: '$full',
  backgroundColor: '$backgroundElevated',
  alignItems: 'center',
  justifyContent: 'center',
});

const ErrorText = styled(Text, {
  name: 'AmountError',
  color: '$accentDanger',
  fontSize: '$1',
  marginTop: '$1',
});

function formatDisplayValue(value: string): string {
  if (!value) {
    return '';
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    return '';
  }
  return num.toLocaleString('es-CO');
}

export function AmountInput({
  value,
  onChange,
  label = 'Amount',
  errorMessage,
  disabled = false,
}: AmountInputProps): React.ReactElement {
  const [isFocused, setIsFocused] = useState(false);

  const handleChangeText = useCallback(
    (text: string) => {
      const cleaned = text.replace(/[^0-9]/g, '');
      onChange(cleaned);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  const borderColor = errorMessage
    ? colors.accent.danger
    : isFocused
      ? colors.accent.primary
      : colors.border.default;

  const displayValue = formatDisplayValue(value);

  return (
    <Container>
      <Label>{label}</Label>
      <InputWrapper style={{ borderColor }} opacity={disabled ? 0.6 : 1}>
        <CurrencyPrefix>$</CurrencyPrefix>
        <TextInput
          value={displayValue}
          onChangeText={handleChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="0"
          placeholderTextColor={colors.text.muted}
          keyboardType="numeric"
          editable={!disabled}
          style={{
            flex: 1,
            fontSize: 24,
            fontWeight: '600',
            color: colors.text.primary,
            paddingVertical: 12,
          }}
          accessibilityLabel={label}
        />
        {value && !disabled && (
          <Pressable
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel="Clear amount"
          >
            {({ pressed }) => (
              <ClearButton opacity={pressed ? 0.7 : 1}>
                <Text color="$textMuted" fontSize="$2">
                  ✕
                </Text>
              </ClearButton>
            )}
          </Pressable>
        )}
      </InputWrapper>
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}
      <Caption color="$textMuted" marginTop="$1">
        Colombian Peso (COP)
      </Caption>
    </Container>
  );
}
