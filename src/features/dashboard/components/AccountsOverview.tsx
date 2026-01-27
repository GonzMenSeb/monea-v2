import { useCallback, memo } from 'react';

import { ScrollView } from 'react-native';

import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { LoadingState } from '@/shared/components/feedback/LoadingState';
import { AccountCard } from '@/shared/components/ui/Card';

import type { AccountWithBalance } from '../hooks/useDashboardData';

interface AccountsOverviewProps {
  accounts: AccountWithBalance[];
  isLoading?: boolean;
  error?: Error | null;
  onAccountPress?: (accountId: string) => void;
  onSeeAllPress?: () => void;
  onAddAccountPress?: () => void;
  formatCurrency: (amount: number) => string;
  maxItems?: number;
}

const SectionHeader = styled(XStack, {
  name: 'SectionHeader',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: '$4',
  marginBottom: '$3',
});

const SectionTitle = styled(Text, {
  name: 'SectionTitle',
  color: '$textPrimary',
  fontSize: '$4',
  fontWeight: '600',
});

const SeeAllButton = styled(Text, {
  name: 'SeeAllButton',
  color: '$accentPrimary',
  fontSize: '$2',
  fontWeight: '500',
  pressStyle: {
    opacity: 0.7,
  },
});

const EmptyContainer = styled(YStack, {
  name: 'EmptyContainer',
  paddingVertical: '$8',
  alignItems: 'center',
  paddingHorizontal: '$4',
});

const EmptyText = styled(Text, {
  name: 'EmptyText',
  color: '$textMuted',
  fontSize: '$2',
  textAlign: 'center',
});

const ErrorText = styled(Text, {
  name: 'ErrorText',
  color: '$accentDanger',
  fontSize: '$2',
  textAlign: 'center',
});

const AddAccountCard = styled(Stack, {
  name: 'AddAccountCard',
  width: 288,
  height: 128,
  borderRadius: '$4',
  borderWidth: 2,
  borderStyle: 'dashed',
  borderColor: '$border',
  alignItems: 'center',
  justifyContent: 'center',
  pressStyle: {
    borderColor: '$accentPrimary',
    backgroundColor: 'rgba(0, 212, 170, 0.05)',
  },
});

const AddIcon = styled(Text, {
  name: 'AddIcon',
  color: '$textSecondary',
  fontSize: 24,
});

const AddText = styled(Text, {
  name: 'AddText',
  color: '$textSecondary',
  fontSize: '$2',
  fontWeight: '500',
  marginTop: '$2',
});

const AccountRow = memo(function AccountRow({
  account,
  formatCurrency,
  onPress,
  isLast,
}: {
  account: AccountWithBalance;
  formatCurrency: (amount: number) => string;
  onPress?: (id: string) => void;
  isLast: boolean;
}): React.ReactElement {
  const handleSelect = useCallback(
    (id: string) => {
      onPress?.(id);
    },
    [onPress]
  );

  return (
    <Stack width={288} marginRight={isLast ? 0 : '$3'}>
      <AccountCard
        account={{
          id: account.id,
          bankCode: account.bankCode,
          bankName: account.bankName,
          accountNumber: account.accountNumber,
          accountType: account.accountType,
          balance: account.balance,
          isActive: account.isActive,
        }}
        formatCurrency={formatCurrency}
        onSelect={handleSelect}
      />
    </Stack>
  );
});

function AddAccountButton({ onPress }: { onPress?: () => void }): React.ReactElement | null {
  if (!onPress) {
    return null;
  }

  return (
    <AddAccountCard
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add a new bank account"
    >
      <AddIcon>+</AddIcon>
      <AddText>Add Account</AddText>
    </AddAccountCard>
  );
}

export function AccountsOverview({
  accounts,
  isLoading = false,
  error = null,
  onAccountPress,
  onSeeAllPress,
  onAddAccountPress,
  formatCurrency,
  maxItems = 5,
}: AccountsOverviewProps): React.ReactElement {
  const displayedAccounts = accounts.slice(0, maxItems);
  const hasMore = accounts.length > maxItems;

  if (isLoading && accounts.length === 0) {
    return (
      <YStack marginTop="$6">
        <SectionHeader>
          <SectionTitle>Your Accounts</SectionTitle>
        </SectionHeader>
        <LoadingState message="Loading accounts..." variant="inline" />
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack marginTop="$6">
        <SectionHeader>
          <SectionTitle>Your Accounts</SectionTitle>
        </SectionHeader>
        <EmptyContainer>
          <ErrorText>Unable to load accounts</ErrorText>
        </EmptyContainer>
      </YStack>
    );
  }

  if (displayedAccounts.length === 0) {
    return (
      <YStack marginTop="$6">
        <SectionHeader>
          <SectionTitle>Your Accounts</SectionTitle>
        </SectionHeader>
        <EmptyContainer>
          <EmptyText>No accounts linked yet. Link your bank accounts to start tracking.</EmptyText>
          {onAddAccountPress && (
            <Stack marginTop="$4">
              <AddAccountButton onPress={onAddAccountPress} />
            </Stack>
          )}
        </EmptyContainer>
      </YStack>
    );
  }

  return (
    <YStack marginTop="$6">
      <SectionHeader>
        <SectionTitle>Your Accounts</SectionTitle>
        {(hasMore || onSeeAllPress) && (
          <SeeAllButton
            onPress={onSeeAllPress}
            accessibilityRole="button"
            accessibilityLabel="See all accounts"
          >
            See All
          </SeeAllButton>
        )}
      </SectionHeader>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
      >
        {displayedAccounts.map((account, index) => (
          <AccountRow
            key={account.id}
            account={account}
            formatCurrency={formatCurrency}
            onPress={onAccountPress}
            isLast={index === displayedAccounts.length - 1 && !onAddAccountPress}
          />
        ))}
        {onAddAccountPress && (
          <Stack width={288}>
            <AddAccountButton onPress={onAddAccountPress} />
          </Stack>
        )}
      </ScrollView>
    </YStack>
  );
}

export type { AccountsOverviewProps };
