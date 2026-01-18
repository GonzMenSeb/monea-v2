import { useCallback, memo } from 'react';

import { View, Text, Pressable } from 'react-native';

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

const CONTAINER_STYLES = 'mt-6';
const HEADER_CONTAINER_STYLES = 'flex-row justify-between items-center px-4 mb-3';
const TITLE_STYLES = 'text-lg font-semibold text-text-primary';
const SEE_ALL_STYLES = 'text-sm font-medium text-primary-500';
const SEE_ALL_PRESSED_STYLES = 'text-sm font-medium text-primary-700';
const LIST_CONTAINER_STYLES = 'px-4';
const ITEM_GAP_STYLES = 'mb-3';
const EMPTY_CONTAINER_STYLES = 'py-8 items-center';
const EMPTY_TEXT_STYLES = 'text-sm text-text-muted';
const ERROR_TEXT_STYLES = 'text-sm text-semantic-error';

const TransactionRow = memo(function TransactionRow({
  transaction,
  formatCurrency,
  onPress,
  isLast,
}: {
  transaction: Transaction;
  formatCurrency: (amount: number) => string;
  onPress?: (id: string) => void;
  isLast: boolean;
}): React.ReactElement {
  const handlePress = useCallback(() => {
    onPress?.(transaction.id);
  }, [transaction.id, onPress]);

  return (
    <View className={isLast ? '' : ITEM_GAP_STYLES}>
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
    </View>
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
      <View className={CONTAINER_STYLES}>
        <View className={HEADER_CONTAINER_STYLES}>
          <Text className={TITLE_STYLES}>Recent Transactions</Text>
        </View>
        <LoadingState message="Loading transactions..." variant="inline" />
      </View>
    );
  }

  if (error) {
    return (
      <View className={CONTAINER_STYLES}>
        <View className={HEADER_CONTAINER_STYLES}>
          <Text className={TITLE_STYLES}>Recent Transactions</Text>
        </View>
        <View className={EMPTY_CONTAINER_STYLES}>
          <Text className={ERROR_TEXT_STYLES}>Unable to load transactions</Text>
        </View>
      </View>
    );
  }

  if (displayedTransactions.length === 0) {
    return (
      <View className={CONTAINER_STYLES}>
        <View className={HEADER_CONTAINER_STYLES}>
          <Text className={TITLE_STYLES}>Recent Transactions</Text>
        </View>
        <View className={EMPTY_CONTAINER_STYLES}>
          <Text className={EMPTY_TEXT_STYLES}>No transactions yet</Text>
        </View>
      </View>
    );
  }

  return (
    <View className={CONTAINER_STYLES}>
      <View className={HEADER_CONTAINER_STYLES}>
        <Text className={TITLE_STYLES}>Recent Transactions</Text>
        {(hasMore || onSeeAllPress) && (
          <Pressable
            onPress={onSeeAllPress}
            accessibilityRole="button"
            accessibilityLabel="See all transactions"
          >
            {({ pressed }) => (
              <Text className={pressed ? SEE_ALL_PRESSED_STYLES : SEE_ALL_STYLES}>See All</Text>
            )}
          </Pressable>
        )}
      </View>
      <View className={LIST_CONTAINER_STYLES}>
        {displayedTransactions.map((transaction, index) => (
          <TransactionRow
            key={transaction.id}
            transaction={transaction}
            formatCurrency={formatCurrency}
            onPress={onTransactionPress}
            isLast={index === displayedTransactions.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

export type { RecentTransactionsProps };
