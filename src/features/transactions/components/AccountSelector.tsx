import { useCallback, useState } from 'react';

import { Modal, Pressable, FlatList } from 'react-native';

import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Body, Caption, Button } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import { useActiveAccounts } from '../hooks/useAccounts';

import type Account from '@/infrastructure/database/models/Account';

interface AccountSelectorProps {
  value: string | null;
  onChange: (accountId: string) => void;
  label?: string;
  errorMessage?: string;
  disabled?: boolean;
}

const Container = styled(YStack, {
  name: 'AccountSelectorContainer',
  width: '100%',
});

const Label = styled(Text, {
  name: 'AccountSelectorLabel',
  color: '$textPrimary',
  fontWeight: '500',
  marginBottom: '$1.5',
  fontSize: '$2',
});

const SelectorButton = styled(XStack, {
  name: 'AccountSelectorButton',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$3',
  borderWidth: 2,
  alignItems: 'center',
  minHeight: 56,
  paddingHorizontal: '$4',
});

const SelectedAccount = styled(XStack, {
  name: 'SelectedAccount',
  flex: 1,
  alignItems: 'center',
  gap: '$3',
});

const BankIcon = styled(Stack, {
  name: 'BankIcon',
  width: 40,
  height: 40,
  borderRadius: '$3',
  alignItems: 'center',
  justifyContent: 'center',
});

const Chevron = styled(Text, {
  name: 'Chevron',
  color: '$textMuted',
  fontSize: '$4',
});

const ErrorText = styled(Text, {
  name: 'AccountSelectorError',
  color: '$accentDanger',
  fontSize: '$1',
  marginTop: '$1',
});

const ModalContainer = styled(Stack, {
  name: 'ModalContainer',
  flex: 1,
  backgroundColor: 'rgba(0,0,0,0.8)',
  justifyContent: 'flex-end',
});

const ModalContent = styled(YStack, {
  name: 'ModalContent',
  backgroundColor: '$backgroundBase',
  borderTopLeftRadius: '$6',
  borderTopRightRadius: '$6',
  maxHeight: '70%',
});

const ModalHeader = styled(XStack, {
  name: 'ModalHeader',
  paddingHorizontal: '$4',
  paddingVertical: '$4',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottomWidth: 1,
  borderBottomColor: '$border',
});

const AccountItem = styled(XStack, {
  name: 'AccountItem',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  alignItems: 'center',
  gap: '$3',
});

const ItemSeparator = styled(Stack, {
  name: 'ItemSeparator',
  height: 1,
  backgroundColor: '$border',
  marginLeft: 68,
});

const BANK_COLORS: Record<string, string> = {
  bancolombia: '#FDDA24',
  davivienda: '#E30613',
  bbva: '#004481',
  nequi: '#200040',
  daviplata: '#E30613',
};

const BANK_EMOJIS: Record<string, string> = {
  bancolombia: '🟡',
  davivienda: '🔴',
  bbva: '🔵',
  nequi: '🟣',
  daviplata: '🟠',
};

export function AccountSelector({
  value,
  onChange,
  label = 'Account',
  errorMessage,
  disabled = false,
}: AccountSelectorProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const { data: accounts = [] } = useActiveAccounts();

  const selectedAccount = accounts.find((a) => a.id === value);

  const handleOpen = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
    }
  }, [disabled]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSelect = useCallback(
    (account: Account) => {
      onChange(account.id);
      setIsOpen(false);
    },
    [onChange]
  );

  const borderColor = errorMessage ? colors.accent.danger : colors.border.default;

  const renderAccount = useCallback(
    ({ item }: { item: Account }) => {
      const isSelected = item.id === value;
      const bankColor = BANK_COLORS[item.bankCode] ?? colors.accent.primary;
      const bankEmoji = BANK_EMOJIS[item.bankCode] ?? '🏦';

      return (
        <Pressable onPress={() => handleSelect(item)} accessibilityRole="button">
          {({ pressed }) => (
            <AccountItem
              opacity={pressed ? 0.7 : 1}
              backgroundColor={isSelected ? '$primaryMuted' : 'transparent'}
            >
              <BankIcon backgroundColor={bankColor + '20'}>
                <Text fontSize="$5">{bankEmoji}</Text>
              </BankIcon>
              <YStack flex={1}>
                <Body>{item.bankName}</Body>
                <Caption color="$textSecondary">****{item.accountNumber.slice(-4)}</Caption>
              </YStack>
              {isSelected && (
                <Text color="$accentPrimary" fontSize="$4">
                  ✓
                </Text>
              )}
            </AccountItem>
          )}
        </Pressable>
      );
    },
    [value, handleSelect]
  );

  const renderSeparator = useCallback(() => <ItemSeparator />, []);

  return (
    <Container>
      <Label>{label}</Label>
      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {({ pressed }) => (
          <SelectorButton style={{ borderColor }} opacity={disabled ? 0.6 : pressed ? 0.8 : 1}>
            <SelectedAccount>
              {selectedAccount ? (
                <>
                  <BankIcon
                    backgroundColor={
                      (BANK_COLORS[selectedAccount.bankCode] ?? colors.accent.primary) + '20'
                    }
                  >
                    <Text fontSize="$5">{BANK_EMOJIS[selectedAccount.bankCode] ?? '🏦'}</Text>
                  </BankIcon>
                  <YStack flex={1}>
                    <Body>{selectedAccount.bankName}</Body>
                    <Caption color="$textSecondary">
                      ****{selectedAccount.accountNumber.slice(-4)}
                    </Caption>
                  </YStack>
                </>
              ) : (
                <Body color="$textMuted">Select an account</Body>
              )}
            </SelectedAccount>
            <Chevron>›</Chevron>
          </SelectorButton>
        )}
      </Pressable>
      {errorMessage && <ErrorText>{errorMessage}</ErrorText>}

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={handleClose}>
        <ModalContainer>
          <Pressable style={{ flex: 1 }} onPress={handleClose} />
          <ModalContent>
            <ModalHeader>
              <Body fontWeight="600">Select Account</Body>
              <Button variant="ghost" size="sm" onPress={handleClose}>
                Done
              </Button>
            </ModalHeader>
            <FlatList
              data={accounts}
              keyExtractor={(item) => item.id}
              renderItem={renderAccount}
              ItemSeparatorComponent={renderSeparator}
              contentContainerStyle={{ paddingBottom: 32 }}
              ListEmptyComponent={
                <YStack padding="$6" alignItems="center">
                  <Body color="$textSecondary">No accounts available</Body>
                </YStack>
              }
            />
          </ModalContent>
        </ModalContainer>
      </Modal>
    </Container>
  );
}
