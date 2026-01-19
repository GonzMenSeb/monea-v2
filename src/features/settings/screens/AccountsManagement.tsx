import { useCallback, useMemo, useState } from 'react';

import { Alert, FlatList, Modal, Pressable, ScrollView } from 'react-native';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { database, AccountRepository, TransactionRepository } from '@/infrastructure/database';
import { EmptyState, LoadingState } from '@/shared/components/feedback';
import { Screen } from '@/shared/components/layout';
import { Button, Input, Heading, Body, Caption } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import type { CreateAccountData, UpdateAccountData } from '@/infrastructure/database';
import type Account from '@/infrastructure/database/models/Account';
import type { BankCode, AccountType } from '@/infrastructure/database/models/Account';

interface AccountWithCalculatedBalance {
  id: string;
  bankCode: BankCode;
  bankName: string;
  accountNumber: string;
  accountType: AccountType;
  balance: number;
  isActive: boolean;
}

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
  { code: 'bancoomeva', name: 'Bancoomeva', color: colors.accent.primary },
];

const ACCOUNT_TYPE_OPTIONS: { type: AccountType; label: string }[] = [
  { type: 'savings', label: 'Savings' },
  { type: 'checking', label: 'Checking' },
  { type: 'credit', label: 'Credit Card' },
  { type: 'digital_wallet', label: 'Digital Wallet' },
];

const ACCOUNT_QUERY_KEYS = {
  all: ['accounts'] as const,
  list: () => [...ACCOUNT_QUERY_KEYS.all, 'list'] as const,
};

const HeaderContainer = styled(XStack, {
  name: 'HeaderContainer',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: '$4',
  paddingTop: '$4',
  paddingBottom: '$2',
});

const BackButton = styled(Stack, {
  name: 'BackButton',
  padding: '$2',
  marginLeft: -8,
});

const AddButton = styled(Stack, {
  name: 'AddButton',
  backgroundColor: '$primary',
  paddingHorizontal: '$4',
  paddingVertical: '$2',
  borderRadius: '$3',
});

const AccountCard = styled(Stack, {
  name: 'AccountCard',
  backgroundColor: '$backgroundSurface',
  marginHorizontal: '$4',
  marginBottom: '$3',
  borderRadius: '$4',
  padding: '$4',
  borderLeftWidth: 4,
});

const InactiveBadge = styled(Stack, {
  name: 'InactiveBadge',
  backgroundColor: '$backgroundElevated',
  paddingHorizontal: '$2',
  paddingVertical: 2,
  borderRadius: '$2',
});

const ModalOverlay = styled(Stack, {
  name: 'ModalOverlay',
  flex: 1,
  justifyContent: 'flex-end',
  backgroundColor: '$backgroundOverlay',
});

const ModalContent = styled(YStack, {
  name: 'ModalContent',
  backgroundColor: '$backgroundElevated',
  borderTopLeftRadius: '$6',
  borderTopRightRadius: '$6',
  maxHeight: '90%',
});

const ModalHeader = styled(XStack, {
  name: 'ModalHeader',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: '$4',
  paddingVertical: '$4',
  borderBottomWidth: 1,
  borderBottomColor: '$border',
});

const FormSection = styled(YStack, {
  name: 'FormSection',
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

const OptionChip = styled(XStack, {
  name: 'OptionChip',
  paddingHorizontal: '$4',
  paddingVertical: '$2',
  borderRadius: '$3',
  borderWidth: 2,
  alignItems: 'center',
});

const BankIndicator = styled(Stack, {
  name: 'BankIndicator',
  width: 12,
  height: 12,
  borderRadius: '$full',
  marginRight: '$2',
});

const ActionsRow = styled(XStack, {
  name: 'ActionsRow',
  gap: '$3',
  marginTop: '$6',
});

const DeleteSection = styled(Stack, {
  name: 'DeleteSection',
  marginTop: '$6',
  paddingTop: '$4',
  borderTopWidth: 1,
  borderTopColor: '$border',
});

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
    bancolombia: colors.bancolombia.yellow,
    davivienda: colors.davivienda.red,
    bbva: colors.bbva.blue,
    nequi: colors.nequi.pink,
    daviplata: colors.daviplata.orange,
  };
  return bankColors[bankCode.toLowerCase()] || colors.accent.primary;
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

function accountToFormData(account: AccountWithCalculatedBalance): AccountFormData {
  return {
    bankCode: account.bankCode,
    bankName: account.bankName,
    accountNumber: account.accountNumber,
    accountType: account.accountType,
    balance: account.balance.toString(),
  };
}

interface AccountItemProps {
  account: AccountWithCalculatedBalance;
  onPress: (account: AccountWithCalculatedBalance) => void;
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
        <AccountCard
          borderLeftColor={bankAccent}
          opacity={pressed ? 0.7 : account.isActive ? 1 : 0.6}
        >
          <XStack justifyContent="space-between" alignItems="flex-start">
            <YStack flex={1}>
              <Body fontWeight="600">{account.bankName}</Body>
              <Caption color="$textSecondary" marginTop="$1">
                {account.accountType === 'digital_wallet'
                  ? 'Digital Wallet'
                  : account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)}{' '}
                • {maskedNumber}
              </Caption>
            </YStack>
            {!account.isActive && (
              <InactiveBadge>
                <Caption fontSize="$1" color="$textSecondary">
                  Inactive
                </Caption>
              </InactiveBadge>
            )}
          </XStack>
          <YStack marginTop="$3">
            <Caption color="$textMuted">Balance</Caption>
            <Text fontFamily="$mono" fontSize="$4" fontWeight="700" color="$textPrimary">
              {formatCurrency(account.balance)}
            </Text>
          </YStack>
        </AccountCard>
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
    <FormSection>
      <SectionLabel>Bank</SectionLabel>
      <OptionRow>
        {BANK_OPTIONS.map((bank) => (
          <Pressable
            key={bank.code}
            onPress={() => onSelect(bank.code, bank.name)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === bank.code }}
          >
            <OptionChip
              borderColor={selected === bank.code ? '$primary' : '$border'}
              backgroundColor={selected === bank.code ? '$primaryMuted' : '$backgroundSurface'}
            >
              <BankIndicator backgroundColor={bank.color} />
              <Text
                color={selected === bank.code ? '$primary' : '$textSecondary'}
                fontWeight={selected === bank.code ? '500' : '400'}
              >
                {bank.name}
              </Text>
            </OptionChip>
          </Pressable>
        ))}
      </OptionRow>
    </FormSection>
  );
}

interface AccountTypeSelectorProps {
  selected: AccountType;
  onSelect: (type: AccountType) => void;
}

function AccountTypeSelector({ selected, onSelect }: AccountTypeSelectorProps): React.ReactElement {
  return (
    <FormSection>
      <SectionLabel>Account Type</SectionLabel>
      <OptionRow>
        {ACCOUNT_TYPE_OPTIONS.map((option) => (
          <Pressable
            key={option.type}
            onPress={() => onSelect(option.type)}
            accessibilityRole="radio"
            accessibilityState={{ selected: selected === option.type }}
          >
            <OptionChip
              borderColor={selected === option.type ? '$primary' : '$border'}
              backgroundColor={selected === option.type ? '$primaryMuted' : '$backgroundSurface'}
            >
              <Text
                color={selected === option.type ? '$primary' : '$textSecondary'}
                fontWeight={selected === option.type ? '500' : '400'}
              >
                {option.label}
              </Text>
            </OptionChip>
          </Pressable>
        ))}
      </OptionRow>
    </FormSection>
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
      <ModalOverlay>
        <ModalContent>
          <ModalHeader>
            <Heading level="h4">{mode === 'create' ? 'Add Account' : 'Edit Account'}</Heading>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Text fontSize="$6" color="$textSecondary">
                ×
              </Text>
            </Pressable>
          </ModalHeader>

          <ScrollView style={{ padding: 16 }} keyboardShouldPersistTaps="handled">
            <BankSelector selected={formData.bankCode} onSelect={handleBankSelect} />

            <AccountTypeSelector
              selected={formData.accountType}
              onSelect={handleAccountTypeSelect}
            />

            <FormSection>
              <Input
                label="Account Number"
                placeholder="Enter last 4+ digits"
                value={formData.accountNumber}
                onChangeText={handleAccountNumberChange}
                keyboardType="numeric"
                maxLength={20}
                errorMessage={accountNumberError}
              />
            </FormSection>

            <FormSection>
              <Input
                label="Initial Balance (optional)"
                placeholder="0"
                value={formData.balance}
                onChangeText={handleBalanceChange}
                keyboardType="numeric"
                hint="Current balance in Colombian Pesos"
              />
            </FormSection>

            <ActionsRow>
              <Stack flex={1}>
                <Button
                  variant="secondary"
                  onPress={onClose}
                  fullWidth
                  disabled={isSaving || isDeleting}
                >
                  Cancel
                </Button>
              </Stack>
              <Stack flex={1}>
                <Button
                  variant="primary"
                  onPress={onSave}
                  fullWidth
                  loading={isSaving}
                  disabled={!isFormValid || isSaving || isDeleting}
                >
                  {mode === 'create' ? 'Add Account' : 'Save Changes'}
                </Button>
              </Stack>
            </ActionsRow>

            {mode === 'edit' && onDelete && (
              <DeleteSection>
                <Button
                  variant="outline"
                  onPress={onDelete}
                  fullWidth
                  loading={isDeleting}
                  disabled={isSaving || isDeleting}
                >
                  Delete Account
                </Button>
              </DeleteSection>
            )}

            <Stack height={32} />
          </ScrollView>
        </ModalContent>
      </ModalOverlay>
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
  const transactionRepository = useMemo(() => new TransactionRepository(database), []);

  const accountsQuery = useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.list(),
    queryFn: async (): Promise<AccountWithCalculatedBalance[]> => {
      const accounts = await accountRepository.findAll();

      if (accounts.length === 0) {
        return [];
      }

      const accountIds = accounts.map((a) => a.id);
      const balances = await transactionRepository.getBalancesByAccountIds(accountIds);

      return accounts.map((account) => ({
        id: account.id,
        bankCode: account.bankCode,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountType: account.accountType,
        balance: balances.get(account.id) ?? 0,
        isActive: account.isActive,
      }));
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
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create account');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAccountData }) => {
      const result = await accountRepository.update(id, data);
      if (!result) {
        throw new Error('Account not found');
      }
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to update account');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await accountRepository.delete(id);
      if (!result) {
        throw new Error('Account not found');
      }
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ACCOUNT_QUERY_KEYS.all });
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      closeModal();
    },
    onError: (error) => {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete account');
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

  const openEditModal = useCallback((account: AccountWithCalculatedBalance) => {
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
          bankCode: formData.bankCode,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
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
    ({ item }: { item: AccountWithCalculatedBalance }) => (
      <AccountItem account={item} onPress={openEditModal} />
    ),
    [openEditModal]
  );

  const keyExtractor = useCallback((item: AccountWithCalculatedBalance) => item.id, []);

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
        backgroundColor={colors.background.base}
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
      backgroundColor={colors.background.base}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <HeaderContainer>
        <Pressable onPress={handleBack} accessibilityRole="button" accessibilityLabel="Go back">
          <BackButton>
            <Text fontSize="$6" color="$textPrimary">
              ←
            </Text>
          </BackButton>
        </Pressable>
        <Heading level="h3">Bank Accounts</Heading>
        <Pressable
          onPress={openCreateModal}
          accessibilityRole="button"
          accessibilityLabel="Add account"
        >
          <AddButton>
            <Text color="$textInverse" fontWeight="600">
              + Add
            </Text>
          </AddButton>
        </Pressable>
      </HeaderContainer>

      <Stack paddingHorizontal="$4" paddingVertical="$2">
        <Caption color="$textSecondary">
          {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} linked
        </Caption>
      </Stack>

      <FlatList
        data={accounts}
        renderItem={renderAccount}
        keyExtractor={keyExtractor}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
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
