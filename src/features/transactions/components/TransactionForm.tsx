import { useCallback, useEffect, useState } from 'react';

import { Pressable, Platform } from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Button, Input, Caption } from '@/shared/components/ui';

import { AccountSelector } from './AccountSelector';
import { AmountInput } from './AmountInput';
import { CategorySelector } from './CategorySelector';

import type { TransactionFormData, TransactionFormErrors } from '../hooks/useTransactionForm';
import type { TransactionType } from '@/infrastructure/database';

interface TransactionFormProps {
  formData: TransactionFormData;
  errors: TransactionFormErrors;
  isLoading?: boolean;
  isEditing?: boolean;
  onFieldChange: <K extends keyof TransactionFormData>(
    field: K,
    value: TransactionFormData[K]
  ) => void;
  onAmountChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const Container = styled(YStack, {
  name: 'TransactionFormContainer',
  gap: '$4',
  padding: '$4',
});

const TypeToggleContainer = styled(YStack, {
  name: 'TypeToggleContainer',
  gap: '$2',
});

const TypeToggle = styled(XStack, {
  name: 'TypeToggle',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$3',
  padding: '$1',
});

const TypeButton = styled(Stack, {
  name: 'TypeButton',
  flex: 1,
  paddingVertical: '$2',
  borderRadius: '$2',
  alignItems: 'center',
});

const DateButton = styled(XStack, {
  name: 'DateButton',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$3',
  borderWidth: 2,
  borderColor: '$border',
  alignItems: 'center',
  minHeight: 56,
  paddingHorizontal: '$4',
});

const DateLabel = styled(Text, {
  name: 'DateLabel',
  color: '$textPrimary',
  fontWeight: '500',
  marginBottom: '$1.5',
  fontSize: '$2',
});

const ButtonContainer = styled(XStack, {
  name: 'FormButtons',
  gap: '$3',
  marginTop: '$4',
});

const TRANSACTION_TYPES: { value: TransactionType; label: string; color: string }[] = [
  { value: 'expense', label: 'Expense', color: '$accentDanger' },
  { value: 'income', label: 'Income', color: '$accentPrimary' },
  { value: 'transfer_out', label: 'Transfer', color: '$accentSecondary' },
];

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function TransactionForm({
  formData,
  errors,
  isLoading = false,
  isEditing = false,
  onFieldChange,
  onAmountChange,
  onSubmit,
  onCancel,
}: TransactionFormProps): React.ReactElement {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleTypeChange = useCallback(
    (type: TransactionType) => {
      onFieldChange('type', type);
      onFieldChange('categoryId', undefined);
    },
    [onFieldChange]
  );

  const handleDateChange = useCallback(
    (_event: unknown, selectedDate?: Date) => {
      setShowDatePicker(Platform.OS === 'ios');
      if (selectedDate) {
        onFieldChange('transactionDate', selectedDate);
      }
    },
    [onFieldChange]
  );

  const handleShowDatePicker = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  return (
    <Container>
      <TypeToggleContainer>
        <Caption color="$textSecondary">Transaction Type</Caption>
        <TypeToggle>
          {TRANSACTION_TYPES.map((typeOption) => {
            const isSelected = formData.type === typeOption.value;
            return (
              <Pressable
                key={typeOption.value}
                style={{ flex: 1 }}
                onPress={() => handleTypeChange(typeOption.value)}
                disabled={isEditing}
              >
                <TypeButton
                  backgroundColor={isSelected ? typeOption.color : 'transparent'}
                  opacity={isEditing ? 0.6 : 1}
                >
                  <Text
                    color={isSelected ? '$white' : '$textSecondary'}
                    fontWeight={isSelected ? '600' : '400'}
                  >
                    {typeOption.label}
                  </Text>
                </TypeButton>
              </Pressable>
            );
          })}
        </TypeToggle>
      </TypeToggleContainer>

      <AmountInput
        value={formData.amount}
        onChange={onAmountChange}
        errorMessage={errors.amount}
        disabled={isLoading}
      />

      <AccountSelector
        value={formData.accountId}
        onChange={(id) => onFieldChange('accountId', id)}
        errorMessage={errors.accountId}
        disabled={isLoading || isEditing}
      />

      <YStack gap="$1.5">
        <DateLabel>Date</DateLabel>
        <Pressable
          onPress={handleShowDatePicker}
          disabled={isLoading}
          accessibilityRole="button"
          accessibilityLabel="Select date"
        >
          {({ pressed }) => (
            <DateButton opacity={pressed ? 0.8 : 1}>
              <Text fontSize="$3" marginRight="$2">
                📅
              </Text>
              <Text color="$textPrimary" flex={1} fontSize="$3">
                {formatDate(formData.transactionDate)}
              </Text>
            </DateButton>
          )}
        </Pressable>
        {errors.transactionDate && (
          <Text color="$accentDanger" fontSize="$1">
            {errors.transactionDate}
          </Text>
        )}
      </YStack>

      {showDatePicker && (
        <DateTimePicker
          value={formData.transactionDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      <CategorySelector
        value={formData.categoryId ?? null}
        onChange={(id) => onFieldChange('categoryId', id)}
        transactionType={formData.type}
        disabled={isLoading}
      />

      <Input
        label="Merchant / Payee"
        placeholder="e.g., Exito, Rappi, Salary"
        value={formData.merchant ?? ''}
        onChangeText={(text) => onFieldChange('merchant', text)}
        errorMessage={errors.merchant}
        disabled={isLoading}
        autoCapitalize="words"
      />

      <Input
        label="Description (optional)"
        placeholder="Add notes about this transaction"
        value={formData.description ?? ''}
        onChangeText={(text) => onFieldChange('description', text)}
        disabled={isLoading}
        multiline
        numberOfLines={2}
      />

      <ButtonContainer>
        <Button variant="ghost" onPress={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Stack flex={1}>
          <Button onPress={onSubmit} loading={isLoading} fullWidth>
            {isEditing ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </Stack>
      </ButtonContainer>
    </Container>
  );
}
