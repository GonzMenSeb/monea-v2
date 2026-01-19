import { useCallback, useMemo, useState } from 'react';

import { Pressable } from 'react-native';

import { styled, ScrollView, Stack, Text, XStack, YStack } from 'tamagui';

import { Button, Input } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import type { AccountType, BankCode } from '@/infrastructure/database/models/Account';

export interface AccountFormData {
  bankCode: BankCode;
  bankName: string;
  accountNumber: string;
  accountType: AccountType;
  balance: string;
}

export interface AccountFormErrors {
  accountNumber?: string;
  balance?: string;
}

interface AccountFormProps {
  formData: AccountFormData;
  errors?: AccountFormErrors;
  onFormChange: (data: Partial<AccountFormData>) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete?: () => void;
  isSubmitting?: boolean;
  isDeleting?: boolean;
  submitLabel?: string;
}

interface BankOption {
  code: BankCode;
  name: string;
  color: string;
}

interface AccountTypeOption {
  type: AccountType;
  label: string;
}

const BANK_OPTIONS: BankOption[] = [
  { code: 'bancolombia', name: 'Bancolombia', color: colors.bancolombia.yellow },
  { code: 'davivienda', name: 'Davivienda', color: colors.davivienda.red },
  { code: 'bbva', name: 'BBVA', color: colors.bbva.blue },
  { code: 'nequi', name: 'Nequi', color: colors.nequi.pink },
  { code: 'daviplata', name: 'Daviplata', color: colors.daviplata.orange },
];

const ACCOUNT_TYPE_OPTIONS: AccountTypeOption[] = [
  { type: 'savings', label: 'Savings' },
  { type: 'checking', label: 'Checking' },
  { type: 'credit', label: 'Credit Card' },
  { type: 'digital_wallet', label: 'Digital Wallet' },
];

const Section = styled(YStack, {
  name: 'Section',
  marginBottom: '$4',
});

const SectionLabel = styled(Text, {
  name: 'SectionLabel',
  fontSize: '$2',
  fontWeight: '500',
  color: '$textPrimary',
  marginBottom: '$2',
});

const OptionRow = styled(XStack, {
  name: 'OptionRow',
  flexWrap: 'wrap',
  gap: '$2',
});

const OptionChip = styled(Stack, {
  name: 'OptionChip',
  paddingHorizontal: '$4',
  paddingVertical: '$2',
  borderRadius: '$4',
  borderWidth: 2,
  flexDirection: 'row',
  alignItems: 'center',
  variants: {
    selected: {
      true: {
        borderColor: '$accentPrimary',
        backgroundColor: '$primaryMuted',
      },
      false: {
        borderColor: '$borderMuted',
        backgroundColor: '$backgroundSurface',
      },
    },
  } as const,
  defaultVariants: {
    selected: false,
  },
});

const BankIndicator = styled(Stack, {
  name: 'BankIndicator',
  width: 12,
  height: 12,
  borderRadius: '$full',
  marginRight: '$2',
});

const OptionText = styled(Text, {
  name: 'OptionText',
  variants: {
    selected: {
      true: {
        color: '$accentPrimary',
        fontWeight: '500',
      },
      false: {
        color: '$textSecondary',
      },
    },
  } as const,
  defaultVariants: {
    selected: false,
  },
});

const ActionsRow = styled(XStack, {
  name: 'ActionsRow',
  gap: '$3',
  marginTop: '$6',
});

const DeleteSection = styled(YStack, {
  name: 'DeleteSection',
  marginTop: '$6',
  paddingTop: '$4',
  borderTopWidth: 1,
  borderTopColor: '$borderMuted',
});

const MIN_ACCOUNT_NUMBER_LENGTH = 4;
const MAX_ACCOUNT_NUMBER_LENGTH = 20;

export function validateAccountNumber(value: string): string | undefined {
  if (!value.trim()) {
    return 'Account number is required';
  }
  if (value.length < MIN_ACCOUNT_NUMBER_LENGTH) {
    return `Account number must be at least ${MIN_ACCOUNT_NUMBER_LENGTH} digits`;
  }
  if (!/^\d+$/.test(value)) {
    return 'Account number must contain only digits';
  }
  return undefined;
}

export function validateBalance(value: string): string | undefined {
  if (value && !/^\d+$/.test(value)) {
    return 'Balance must be a valid number';
  }
  return undefined;
}

export function getInitialAccountFormData(): AccountFormData {
  return {
    bankCode: 'bancolombia',
    bankName: 'Bancolombia',
    accountNumber: '',
    accountType: 'savings',
    balance: '',
  };
}

interface BankSelectorProps {
  selected: BankCode;
  onSelect: (code: BankCode, name: string) => void;
}

function BankSelector({ selected, onSelect }: BankSelectorProps): React.ReactElement {
  return (
    <Section>
      <SectionLabel>Bank</SectionLabel>
      <OptionRow>
        {BANK_OPTIONS.map((bank) => (
          <Pressable
            key={bank.code}
            onPress={() => onSelect(bank.code, bank.name)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === bank.code }}
          >
            <OptionChip selected={selected === bank.code}>
              <BankIndicator backgroundColor={bank.color} />
              <OptionText selected={selected === bank.code}>{bank.name}</OptionText>
            </OptionChip>
          </Pressable>
        ))}
      </OptionRow>
    </Section>
  );
}

interface AccountTypeSelectorProps {
  selected: AccountType;
  onSelect: (type: AccountType) => void;
}

function AccountTypeSelector({ selected, onSelect }: AccountTypeSelectorProps): React.ReactElement {
  return (
    <Section>
      <SectionLabel>Account Type</SectionLabel>
      <OptionRow>
        {ACCOUNT_TYPE_OPTIONS.map((option) => (
          <Pressable
            key={option.type}
            onPress={() => onSelect(option.type)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === option.type }}
          >
            <OptionChip selected={selected === option.type}>
              <OptionText selected={selected === option.type}>{option.label}</OptionText>
            </OptionChip>
          </Pressable>
        ))}
      </OptionRow>
    </Section>
  );
}

export function AccountForm({
  formData,
  errors,
  onFormChange,
  onSubmit,
  onCancel,
  onDelete,
  isSubmitting = false,
  isDeleting = false,
  submitLabel = 'Save',
}: AccountFormProps): React.ReactElement {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBankSelect = useCallback(
    (code: BankCode, name: string) => {
      onFormChange({ bankCode: code, bankName: name });
    },
    [onFormChange]
  );

  const handleAccountTypeSelect = useCallback(
    (type: AccountType) => {
      onFormChange({ accountType: type });
    },
    [onFormChange]
  );

  const handleAccountNumberChange = useCallback(
    (value: string) => {
      onFormChange({ accountNumber: value.replace(/[^0-9]/g, '') });
    },
    [onFormChange]
  );

  const handleAccountNumberBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, accountNumber: true }));
  }, []);

  const handleBalanceChange = useCallback(
    (value: string) => {
      onFormChange({ balance: value.replace(/[^0-9]/g, '') });
    },
    [onFormChange]
  );

  const handleBalanceBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, balance: true }));
  }, []);

  const localErrors = useMemo(
    () => ({
      accountNumber: touched.accountNumber
        ? validateAccountNumber(formData.accountNumber)
        : undefined,
      balance: touched.balance ? validateBalance(formData.balance) : undefined,
    }),
    [formData.accountNumber, formData.balance, touched]
  );

  const displayedErrors = useMemo(
    () => ({
      accountNumber: errors?.accountNumber ?? localErrors.accountNumber,
      balance: errors?.balance ?? localErrors.balance,
    }),
    [errors, localErrors]
  );

  const isFormValid = useMemo(() => {
    const accountNumberValid = !validateAccountNumber(formData.accountNumber);
    const balanceValid = !validateBalance(formData.balance);
    const noExternalErrors = !errors?.accountNumber && !errors?.balance;
    return accountNumberValid && balanceValid && noExternalErrors;
  }, [formData.accountNumber, formData.balance, errors]);

  const isDisabled = isSubmitting || isDeleting;

  return (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <BankSelector selected={formData.bankCode} onSelect={handleBankSelect} />

      <AccountTypeSelector selected={formData.accountType} onSelect={handleAccountTypeSelect} />

      <Section>
        <Input
          label="Account Number"
          placeholder="Enter last 4+ digits"
          value={formData.accountNumber}
          onChangeText={handleAccountNumberChange}
          onBlur={handleAccountNumberBlur}
          keyboardType="numeric"
          maxLength={MAX_ACCOUNT_NUMBER_LENGTH}
          errorMessage={displayedErrors.accountNumber}
          disabled={isDisabled}
        />
      </Section>

      <Section>
        <Input
          label="Initial Balance (optional)"
          placeholder="0"
          value={formData.balance}
          onChangeText={handleBalanceChange}
          onBlur={handleBalanceBlur}
          keyboardType="numeric"
          errorMessage={displayedErrors.balance}
          hint="Current balance in Colombian Pesos"
          disabled={isDisabled}
        />
      </Section>

      <ActionsRow>
        <Stack flex={1}>
          <Button variant="secondary" onPress={onCancel} fullWidth disabled={isDisabled}>
            Cancel
          </Button>
        </Stack>
        <Stack flex={1}>
          <Button
            variant="primary"
            onPress={onSubmit}
            fullWidth
            loading={isSubmitting}
            disabled={!isFormValid || isDisabled}
          >
            {submitLabel}
          </Button>
        </Stack>
      </ActionsRow>

      {onDelete && (
        <DeleteSection>
          <Button
            variant="outline"
            onPress={onDelete}
            fullWidth
            loading={isDeleting}
            disabled={isDisabled}
          >
            Delete Account
          </Button>
        </DeleteSection>
      )}
    </ScrollView>
  );
}

export { BANK_OPTIONS, ACCOUNT_TYPE_OPTIONS };
