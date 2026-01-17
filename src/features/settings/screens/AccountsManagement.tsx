import { useCallback, useMemo, useState } from 'react';

import { Alert, FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { database, AccountRepository } from '@/infrastructure/database';
import { EmptyState, LoadingState } from '@/shared/components/feedback';
import { Screen } from '@/shared/components/layout';
import { Button, Input, Heading, Body, Caption } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import type { CreateAccountData, UpdateAccountData } from '@/infrastructure/database';
import type Account from '@/infrastructure/database/models/Account';
import type { BankCode, AccountType } from '@/infrastructure/database/models/Account';

interface AccountFormData {
  bankCode: BankCode;
  bankName: string;
  accountNumber: string;
  accountType: AccountType;
  balance: string;
}

type FormMode = 'create' | 'edit';

const BANK_OPTIONS: { code: BankCode; name: string; color: string }[] = [
  { code: 'bancolombia', name: 'Bancolombia', color: colors.bancolombia.yellow },
  { code: 'davivienda', name: 'Davivienda', color: colors.davivienda.red },
  { code: 'bbva', name: 'BBVA', color: colors.bbva.blue },
  { code: 'nequi', name: 'Nequi', color: colors.nequi.pink },
  { code: 'daviplata', name: 'Daviplata', color: colors.daviplata.orange },
];

const ACCOUNT_TYPE_OPTIONS: { type: AccountType; label: string }[] = [
  { type: 'savings', label: 'Savings' },
  { type: 'checking', label: 'Checking' },
  { type: 'credit', label: 'Credit Card' },
  { type: 'digital_wallet', label: 'Digital Wallet' },
];

const CONTAINER_STYLES = 'px-4 py-2';
const HEADER_STYLES = 'flex-row items-center justify-between px-4 pt-4 pb-2';
const BACK_BUTTON_STYLES = 'p-2 -ml-2';
const ADD_BUTTON_STYLES = 'bg-primary-500 px-4 py-2 rounded-xl';
const CARD_STYLES = 'bg-surface-card mx-4 mb-3 rounded-2xl p-4 border-l-4';
const CARD_PRESSED_STYLES = 'bg-gray-50';
const INACTIVE_CARD_STYLES = 'opacity-60';
const MODAL_OVERLAY_STYLES = 'flex-1 justify-end bg-black/50';
const MODAL_CONTENT_STYLES = 'bg-white rounded-t-3xl max-h-[90%]';
const MODAL_HEADER_STYLES =
  'flex-row items-center justify-between px-4 py-4 border-b border-gray-100';
const FORM_CONTAINER_STYLES = 'p-4';
const SECTION_STYLES = 'mb-4';
const SECTION_LABEL_STYLES = 'text-sm font-medium text-text-primary mb-2';
const OPTION_ROW_STYLES = 'flex-row flex-wrap gap-2';
const OPTION_CHIP_BASE_STYLES = 'px-4 py-2 rounded-xl border-2';
const OPTION_CHIP_SELECTED_STYLES = 'border-primary-500 bg-primary-50';
const OPTION_CHIP_UNSELECTED_STYLES = 'border-gray-200 bg-white';
const BANK_INDICATOR_STYLES = 'w-3 h-3 rounded-full mr-2';
const ACTIONS_STYLES = 'flex-row gap-3 mt-6';
const DELETE_SECTION_STYLES = 'mt-6 pt-4 border-t border-gray-100';

const ACCOUNT_QUERY_KEYS = {
  all: ['accounts'] as const,
  list: () => [...ACCOUNT_QUERY_KEYS.all, 'list'] as const,
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length <= 4) {
    return accountNumber;
  }
  return `****${accountNumber.slice(-4)}`;
}

function getBankAccentColor(bankCode: string): string {
  const bankColors: Record<string, string> = {
    bancolombia: 'border-l-bancolombia-yellow',
    davivienda: 'border-l-davivienda-red',
    bbva: 'border-l-bbva-blue',
    nequi: 'border-l-nequi-pink',
    daviplata: 'border-l-daviplata-orange',
  };
  return bankColors[bankCode.toLowerCase()] || 'border-l-primary-500';
}

function getInitialFormData(): AccountFormData {
  return {
    bankCode: 'bancolombia',
    bankName: 'Bancolombia',
    accountNumber: '',
    accountType: 'savings',
    balance: '',
  };
}

function accountToFormData(account: Account): AccountFormData {
  return {
    bankCode: account.bankCode,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    balance: account.balance.toString(),
  };
}

interface AccountItemProps {
  account: Account;
  onPress: (account: Account) => void;
}

function AccountItem({ account, onPress }: AccountItemProps): React.ReactElement {
  const handlePress = useCallback(() => {
    onPress(account);
  }, [account, onPress]);

  const bankAccent = getBankAccentColor(account.bankCode);
  const maskedNumber = maskAccountNumber(account.accountNumber);

  return (
    <Pressable onPress={handlePress} accessibilityRole="button">
      {({ pressed }) => (
        <View
          className={`${CARD_STYLES} ${bankAccent} ${pressed ? CARD_PRESSED_STYLES : ''} ${!account.isActive ? INACTIVE_CARD_STYLES : ''}`}
        >
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Body className="font-semibold">{account.bankName}</Body>
              <Caption muted={false} className="text-text-secondary mt-0.5">
                {account.accountType === 'digital_wallet'
                  ? 'Digital Wallet'
                  : account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}{' '}
                • {maskedNumber}
              </Caption>
            </View>
            {!account.isActive && (
              <View className="bg-gray-200 px-2 py-0.5 rounded">
                <Caption size="sm" muted={false} className="text-text-secondary">
                  Inactive
                </Caption>
              </View>
            )}
          </View>
          <View className="mt-3">
            <Caption>Balance</Caption>
            <Body size="lg" className="font-bold">
              {formatCurrency(account.balance)}
            </Body>
          </View>
        </View>
      )}
    </Pressable>
  );
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

interface AccountFormModalProps {
  visible: boolean;
  mode: FormMode;
  formData: AccountFormData;
  onFormChange: (data: Partial<AccountFormData>) => void;
  onSave: () => void;
  onDelete?: () => void;
  onClose: () => void;
  isSaving: boolean;
  isDeleting?: boolean;
  accountNumberError?: string;
}

function AccountFormModal({
  visible,
  mode,
  formData,
  onFormChange,
  onSave,
  onDelete,
  onClose,
  isSaving,
  isDeleting,
  accountNumberError,
}: AccountFormModalProps): React.ReactElement {
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

  const handleBalanceChange = useCallback(
    (value: string) => {
      onFormChange({ balance: value.replace(/[^0-9]/g, '') });
    },
    [onFormChange]
  );

  const isFormValid = formData.accountNumber.length >= 4 && !accountNumberError;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className={MODAL_OVERLAY_STYLES}>
        <View className={MODAL_CONTENT_STYLES}>
          <View className={MODAL_HEADER_STYLES}>
            <Heading level="h4">{mode === 'create' ? 'Add Account' : 'Edit Account'}</Heading>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Text className="text-2xl text-text-secondary">×</Text>
            </Pressable>
          </View>

          <ScrollView className={FORM_CONTAINER_STYLES} keyboardShouldPersistTaps="handled">
            <BankSelector selected={formData.bankCode} onSelect={handleBankSelect} />

            <AccountTypeSelector
              selected={formData.accountType}
              onSelect={handleAccountTypeSelect}
            />

            <View className={SECTION_STYLES}>
              <Input
                label="Account Number"
                placeholder="Enter last 4+ digits"
                value={formData.accountNumber}
                onChangeText={handleAccountNumberChange}
                keyboardType="numeric"
                maxLength={20}
                errorMessage={accountNumberError}
              />
            </View>

            <View className={SECTION_STYLES}>
              <Input
                label="Initial Balance (optional)"
                placeholder="0"
                value={formData.balance}
                onChangeText={handleBalanceChange}
                keyboardType="numeric"
                hint="Current balance in Colombian Pesos"
              />
            </View>

            <View className={ACTIONS_STYLES}>
              <View className="flex-1">
                <Button
                  variant="secondary"
                  onPress={onClose}
                  fullWidth
                  disabled={isSaving || isDeleting}
                >
                  Cancel
                </Button>
              </View>
              <View className="flex-1">
                <Button
                  variant="primary"
                  onPress={onSave}
                  fullWidth
                  loading={isSaving}
                  disabled={!isFormValid || isSaving || isDeleting}
                >
                  {mode === 'create' ? 'Add Account' : 'Save Changes'}
                </Button>
              </View>
            </View>

            {mode === 'edit' && onDelete && (
              <View className={DELETE_SECTION_STYLES}>
                <Button
                  variant="outline"
                  onPress={onDelete}
                  fullWidth
                  loading={isDeleting}
                  disabled={isSaving || isDeleting}
                >
                  Delete Account
                </Button>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function AccountsManagement(): React.ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [modalVisible, setModalVisible] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [formData, setFormData] = useState<AccountFormData>(getInitialFormData);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [accountNumberError, setAccountNumberError] = useState<string | undefined>();

  const accountRepository = useMemo(() => new AccountRepository(database), []);

  const accountsQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.list(),
    queryFn: async (): Promise<Account[]> => {
      return accountRepository.findAll();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateAccountData) => {
      return accountRepository.create(data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAccountData }) => {
      return accountRepository.update(id, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return accountRepository.delete(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    },
  });

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const openCreateModal = useCallback(() => {
    setFormMode('create');
    setFormData(getInitialFormData());
    setEditingAccountId(null);
    setAccountNumberError(undefined);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((account: Account) => {
    setFormMode('edit');
    setFormData(accountToFormData(account));
    setEditingAccountId(account.id);
    setAccountNumberError(undefined);
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setFormData(getInitialFormData());
    setEditingAccountId(null);
    setAccountNumberError(undefined);
  }, []);

  const handleFormChange = useCallback((data: Partial<AccountFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    if (data.accountNumber !== undefined) {
      setAccountNumberError(undefined);
    }
  }, []);

  const validateAccountNumber = useCallback(
    async (accountNumber: string, excludeId?: string): Promise<boolean> => {
      if (accountNumber.length < 4) {
        setAccountNumberError('Account number must be at least 4 digits');
        return false;
      }

      const existingAccount = await accountRepository.findByAccountNumber(accountNumber);
      if (existingAccount && existingAccount.id !== excludeId) {
        setAccountNumberError('An account with this number already exists');
        return false;
      }

      return true;
    },
    [accountRepository]
  );

  const handleSave = useCallback(async () => {
    const isValid = await validateAccountNumber(
      formData.accountNumber,
      formMode === 'edit' ? (editingAccountId ?? undefined) : undefined
    );

    if (!isValid) {
      return;
    }

    const balance = formData.balance ? parseInt(formData.balance, 10) : 0;

    if (formMode === 'create') {
      createMutation.mutate({
        bankCode: formData.bankCode,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountType: formData.accountType,
        balance,
        isActive: true,
      });
    } else if (editingAccountId) {
      updateMutation.mutate({
        id: editingAccountId,
        data: {
          bankName: formData.bankName,
          balance,
        },
      });
    }
  }, [formData, formMode, editingAccountId, validateAccountNumber, createMutation, updateMutation]);

  const handleDelete = useCallback(() => {
    if (!editingAccountId) {
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account? This action cannot be undone and will not delete associated transactions.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(editingAccountId);
          },
        },
      ]
    );
  }, [editingAccountId, deleteMutation]);

  const renderAccount = useCallback(
    ({ item }: { item: Account }) => <AccountItem account={item} onPress={openEditModal} />,
    [openEditModal]
  );

  const keyExtractor = useCallback((item: Account) => item.id, []);

  const ListEmptyComponent = useMemo(
    () => (
      <EmptyState
        variant="accounts"
        title="No bank accounts"
        description="Add your first bank account to start tracking transactions automatically."
        actionLabel="Add Account"
        onAction={openCreateModal}
      />
    ),
    [openCreateModal]
  );

  if (accountsQuery.isLoading) {
    return (
      <Screen
        variant="fixed"
        backgroundColor={colors.background.secondary}
        edges={['top', 'left', 'right']}
      >
        <LoadingState message="Loading accounts..." />
      </Screen>
    );
  }

  const accounts = accountsQuery.data ?? [];

  return (
    <Screen
      variant="fixed"
      backgroundColor={colors.background.secondary}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <View className={HEADER_STYLES}>
        <Pressable onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back">
          <View className={BACK_BUTTON_STYLES}>
            <Text className="text-2xl">←</Text>
          </View>
        </Pressable>
        <Heading level="h3">Bank Accounts</Heading>
        <Pressable
          onPress={openCreateModal}
          accessibilityRole="button"
          accessibilityLabel="Add account"
        >
          <View className={ADD_BUTTON_STYLES}>
            <Text className="text-white font-semibold">+ Add</Text>
          </View>
        </Pressable>
      </View>

      <View className={CONTAINER_STYLES}>
        <Caption>
          {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} linked
        </Caption>
      </View>

      <FlatList
        data={accounts}
        renderItem={renderAccount}
        keyExtractor={keyExtractor}
        contentContainerClassName="pt-2 pb-8"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={ListEmptyComponent}
      />

      <AccountFormModal
        visible={modalVisible}
        mode={formMode}
        formData={formData}
        onFormChange={handleFormChange}
        onSave={handleSave}
        onDelete={formMode === 'edit' ? handleDelete : undefined}
        onClose={closeModal}
        isSaving={createMutation.isPending || updateMutation.isPending}
        isDeleting={deleteMutation.isPending}
        accountNumberError={accountNumberError}
      />
    </Screen>
  );
}
