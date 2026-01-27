import { useCallback, useMemo, memo } from 'react';

import { RefreshControl } from 'react-native';

import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';
import { styled, Stack, Text } from 'tamagui';

import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { LoadingState } from '@/shared/components/feedback/LoadingState';
import { colors } from '@/shared/theme';
import { formatDateRelative } from '@/shared/utils';

import { TransactionItem } from './TransactionItem';

import type Transaction from '@/infrastructure/database/models/Transaction';

type TransactionListItem = Transaction | { type: 'section_header'; title: string; key: string };

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onTransactionPress?: (transactionId: string) => void;
  formatCurrency: (amount: number) => string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  emptyStateActionLabel?: string;
  onEmptyStateAction?: () => void;
  ListHeaderComponent?: React.ReactElement;
}

const SectionHeaderContainer = styled(Stack, {
  name: 'SectionHeader',
  paddingHorizontal: '$4',
  paddingVertical: '$2',
  backgroundColor: '$backgroundBase',
});

const SectionHeaderText = styled(Text, {
  name: 'SectionHeaderText',
  color: '$textSecondary',
  fontSize: '$2',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
});

const ListContainer = styled(Stack, {
  name: 'ListContainer',
  flex: 1,
  backgroundColor: '$backgroundBase',
});

function groupTransactionsByDate(transactions: Transaction[]): TransactionListItem[] {
  if (transactions.length === 0) {
    return [];
  }

  const sorted = [...transactions].sort(
    (a, b) => b.transactionDate.getTime() - a.transactionDate.getTime()
  );

  const items: TransactionListItem[] = [];
  let currentDateStr = '';

  for (const transaction of sorted) {
    const dateStr = transaction.transactionDate.toDateString();
    if (dateStr !== currentDateStr) {
      currentDateStr = dateStr;
      items.push({
        type: 'section_header',
        title: formatDateRelative(transaction.transactionDate),
        key: `header-${dateStr}`,
      });
    }
    items.push(transaction);
  }

  return items;
}

function isSectionHeader(
  item: TransactionListItem
): item is { type: 'section_header'; title: string; key: string } {
  return typeof item === 'object' && 'type' in item && item.type === 'section_header';
}

const SectionHeader = memo(function SectionHeader({
  title,
}: {
  title: string;
}): React.ReactElement {
  return (
    <SectionHeaderContainer>
      <SectionHeaderText>{title}</SectionHeaderText>
    </SectionHeaderContainer>
  );
});

const ItemSeparator = memo(function ItemSeparator(): React.ReactElement {
  return <Stack height="$3" />;
});

export function TransactionList({
  transactions,
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onTransactionPress,
  formatCurrency,
  emptyStateTitle,
  emptyStateDescription,
  emptyStateActionLabel,
  onEmptyStateAction,
  ListHeaderComponent,
}: TransactionListProps): React.ReactElement {
  const items = useMemo(() => groupTransactionsByDate(transactions), [transactions]);

  const keyExtractor = useCallback((item: TransactionListItem, _index: number): string => {
    if (isSectionHeader(item)) {
      return item.key;
    }
    return item.id;
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<TransactionListItem>): React.ReactElement => {
      if (isSectionHeader(item)) {
        return <SectionHeader title={item.title} />;
      }
      return (
        <TransactionItem
          transaction={item}
          formatCurrency={formatCurrency}
          onPress={onTransactionPress}
        />
      );
    },
    [formatCurrency, onTransactionPress]
  );

  if (isLoading && transactions.length === 0) {
    return <LoadingState message="Loading transactions..." />;
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        variant="transactions"
        title={emptyStateTitle || 'No transactions found'}
        description={emptyStateDescription}
        actionLabel={emptyStateActionLabel}
        onAction={onEmptyStateAction}
      />
    );
  }

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      colors={[colors.accent.primary]}
      tintColor={colors.accent.primary}
      progressBackgroundColor={colors.background.base}
    />
  ) : undefined;

  return (
    <ListContainer>
      <FlashList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
        refreshControl={refreshControl}
        ListHeaderComponent={ListHeaderComponent}
        showsVerticalScrollIndicator={false}
      />
    </ListContainer>
  );
}
