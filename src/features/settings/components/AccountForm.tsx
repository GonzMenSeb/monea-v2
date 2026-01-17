import { useCallback, useMemo, useState } from 'react';

import { Pressable, ScrollView, Text, View } from 'react-native';

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

const SECTION_STYLES = 'mb-4';
const SECTION_LABEL_STYLES = 'text-sm font-medium text-text-primary mb-2';
const OPTION_ROW_STYLES = 'flex-row flex-wrap gap-2';
const OPTION_CHIP_BASE_STYLES = 'px-4 py-2 rounded-xl border-2';
const OPTION_CHIP_SELECTED_STYLES = 'border-primary-500 bg-primary-50';
const OPTION_CHIP_UNSELECTED_STYLES = 'border-gray-200 bg-white';
const BANK_INDICATOR_STYLES = 'w-3 h-3 rounded-full mr-2';
const ACTIONS_STYLES = 'flex-row gap-3 mt-6';
const DELETE_SECTION_STYLES = 'mt-6 pt-4 border-t border-gray-100';

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
    <View className={SECTION_STYLES}>
      <Text className={SECTION_LABEL_STYLES}>Bank</Text>
      <View className={OPTION_ROW_STYLES}>
        {BANK_OPTIONS.map((bank) => (
          <Pressable
            key={bank.code}
            onPress={() => onSelect(bank.code, bank.name)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === bank.code }}
          >
            <View
              className={`${OPTION_CHIP_BASE_STYLES} flex-row items-center ${selected === bank.code ? OPTION_CHIP_SELECTED_STYLES : OPTION_CHIP_UNSELECTED_STYLES}`}
            >
              <View className={BANK_INDICATOR_STYLES} style={{ backgroundColor: bank.color }} />
              <Text
                className={
                  selected === bank.code ? 'text-primary-600 font-medium' : 'text-text-secondary'
                }
              >
                {bank.name}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

interface AccountTypeSelectorProps {
  selected: AccountType;
  onSelect: (type: AccountType) => void;
}

function AccountTypeSelector({ selected, onSelect }: AccountTypeSelectorProps): React.ReactElement {
  return (
    <View className={SECTION_STYLES}>
      <Text className={SECTION_LABEL_STYLES}>Account Type</Text>
      <View className={OPTION_ROW_STYLES}>
        {ACCOUNT_TYPE_OPTIONS.map((option) => (
          <Pressable
            key={option.type}
            onPress={() => onSelect(option.type)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === option.type }}
          >
            <View
              className={`${OPTION_CHIP_BASE_STYLES} ${selected === option.type ? OPTION_CHIP_SELECTED_STYLES : OPTION_CHIP_UNSELECTED_STYLES}`}
            >
              <Text
                className={
                  selected === option.type ? 'text-primary-600 font-medium' : 'text-text-secondary'
                }
              >
                {option.label}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
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

      <View className={SECTION_STYLES}>
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
      </View>

      <View className={SECTION_STYLES}>
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
      </View>

      <View className={ACTIONS_STYLES}>
        <View className="flex-1">
          <Button variant="secondary" onPress={onCancel} fullWidth disabled={isDisabled}>
            Cancel
          </Button>
        </View>
        <View className="flex-1">
          <Button
            variant="primary"
            onPress={onSubmit}
            fullWidth
            loading={isSubmitting}
            disabled={!isFormValid || isDisabled}
          >
            {submitLabel}
          </Button>
        </View>
      </View>

      {onDelete && (
        <View className={DELETE_SECTION_STYLES}>
          <Button
            variant="outline"
            onPress={onDelete}
            fullWidth
            loading={isDeleting}
            disabled={isDisabled}
          >
            Delete Account
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

export { BANK_OPTIONS, ACCOUNT_TYPE_OPTIONS };
