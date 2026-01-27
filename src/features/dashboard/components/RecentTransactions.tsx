import { useCallback, memo } from 'react';

import { styled, Text, XStack, YStack } from 'tamagui';

import { LoadingState } from '@/shared/components/feedback/LoadingState';
import { TransactionCard } from '@/shared/components/ui/Card';
import { formatTime } from '@/shared/utils';

import type Transaction from '@/infrastructure/database/models/Transaction';

interface RecentTransactionsProps {
  transactions: Transaction[];
  isLoading?: boolean;
  error?: Error | null;
  onTransactionPress?: (transactionId: string) => void;
  onSeeAllPress?: () => void;
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

const ListContainer = styled(YStack, {
  name: 'ListContainer',
  paddingHorizontal: '$4',
  gap: '$3',
});

const EmptyContainer = styled(YStack, {
  name: 'EmptyContainer',
  paddingVertical: '$8',
  alignItems: 'center',
});

const EmptyText = styled(Text, {
  name: 'EmptyText',
  color: '$textMuted',
  fontSize: '$2',
});

const ErrorText = styled(Text, {
  name: 'ErrorText',
  color: '$accentDanger',
  fontSize: '$2',
});

const TransactionRow = memo(function TransactionRow({
  transaction,
  formatCurrency,
  onPress,
}: {
  transaction: Transaction;
  formatCurrency: (amount: number) => string;
  onPress?: (id: string) => void;
}): React.ReactElement {
  const handlePress = useCallback(() => {
    onPress?.(transaction.id);
  }, [transaction.id, onPress]);

  return (
    <TransactionCard
      transaction={{
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        merchant: transaction.merchant,
        description: transaction.description,
        transactionDate: transaction.transactionDate,
      }}
      formatCurrency={formatCurrency}
      formatDate={formatTime}
      onPress={onPress ? handlePress : undefined}
    />
  );
});

export function RecentTransactions({
  transactions,
  isLoading = false,
  error = null,
  onTransactionPress,
  onSeeAllPress,
  formatCurrency,
  maxItems = 5,
}: RecentTransactionsProps): React.ReactElement {
  const displayedTransactions = transactions.slice(0, maxItems);
  const hasMore = transactions.length > maxItems;

  if (isLoading && transactions.length === 0) {
    return (
      <YStack marginTop="$6">
        <SectionHeader>
          <SectionTitle>Recent Transactions</SectionTitle>
        </SectionHeader>
        <LoadingState message="Loading transactions..." variant="inline" />
      </YStack>
    );
  }

  if (error) {
    return (
      <YStack marginTop="$6">
        <SectionHeader>
          <SectionTitle>Recent Transactions</SectionTitle>
        </SectionHeader>
        <EmptyContainer>
          <ErrorText>Unable to load transactions</ErrorText>
        </EmptyContainer>
      </YStack>
    );
  }

  if (displayedTransactions.length === 0) {
    return (
      <YStack marginTop="$6">
        <SectionHeader>
          <SectionTitle>Recent Transactions</SectionTitle>
        </SectionHeader>
        <EmptyContainer>
          <EmptyText>No transactions yet</EmptyText>
        </EmptyContainer>
      </YStack>
    );
  }

  return (
    <YStack marginTop="$6">
      <SectionHeader>
        <SectionTitle>Recent Transactions</SectionTitle>
        {(hasMore || onSeeAllPress) && (
          <SeeAllButton
            onPress={onSeeAllPress}
            accessibilityRole="button"
            accessibilityLabel="See all transactions"
          >
            See All
          </SeeAllButton>
        )}
      </SectionHeader>
      <ListContainer>
        {displayedTransactions.map((transaction) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            formatCurrency={formatCurrency}
            onPress={onTransactionPress}
          />
        ))}
      </ListContainer>
    </YStack>
  );
}

export type { RecentTransactionsProps };
