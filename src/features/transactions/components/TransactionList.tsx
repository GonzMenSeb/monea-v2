import { useCallback, useMemo, memo } from 'react';

import { Text, View, RefreshControl } from 'react-native';

import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';

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

const SECTION_HEADER_STYLES = 'px-4 py-2 bg-background-secondary';
const SECTION_HEADER_TEXT_STYLES =
  'text-sm font-semibold text-text-secondary uppercase tracking-wide';
const LIST_CONTAINER_STYLES = 'flex-1';
const ITEM_SEPARATOR_STYLES = 'h-3';

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
    <View className={SECTION_HEADER_STYLES}>
      <Text className={SECTION_HEADER_TEXT_STYLES}>{title}</Text>
    </View>
  );
});

const ItemSeparator = memo(function ItemSeparator(): React.ReactElement {
  return <View className={ITEM_SEPARATOR_STYLES} />;
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

  const keyExtractor = useCallback((item: TransactionListItem): string => {
    if (isSectionHeader(item)) {
      return item.key;
    }
    return item.id;
  }, []);

  const getItemType = useCallback((item: TransactionListItem): string => {
    return isSectionHeader(item) ? 'section_header' : 'transaction';
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

  const stickyHeaderIndices = useMemo(() => {
    const indices: number[] = [];
    items.forEach((item, index) => {
      if (isSectionHeader(item)) {
        indices.push(index);
      }
    });
    return indices;
  }, [items]);

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
      colors={[colors.primary.DEFAULT]}
      tintColor={colors.primary.DEFAULT}
      progressBackgroundColor={colors.background.primary}
    />
  ) : undefined;

  return (
    <View className={LIST_CONTAINER_STYLES}>
      <FlashList
        data={items}
        keyExtractor={keyExtractor}
        getItemType={getItemType}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
        stickyHeaderIndices={stickyHeaderIndices}
        refreshControl={refreshControl}
        ListHeaderComponent={ListHeaderComponent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
