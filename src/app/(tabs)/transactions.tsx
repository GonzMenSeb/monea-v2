import { useCallback, useState } from 'react';

import { View, Text } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';

import { TransactionList } from '@/features/transactions/components';
import {
  useTransactions,
  useTransactionSummary,
  TRANSACTION_QUERY_KEYS,
} from '@/features/transactions/hooks';
import { useTransactionStore } from '@/features/transactions/store/transactionStore';
import { Screen } from '@/shared/components/layout';
import { colors } from '@/shared/theme';
import { formatCurrency, getDateRangeForCurrentMonth } from '@/shared/utils';

const HEADER_CONTAINER_STYLES = 'px-4 pt-4 pb-2';
const HEADER_TITLE_STYLES = 'text-2xl font-bold text-text-primary';
const SUMMARY_CONTAINER_STYLES =
  'flex-row justify-between px-4 py-3 mb-2 bg-background-secondary rounded-xl mx-4';
const SUMMARY_ITEM_STYLES = 'items-center';
const SUMMARY_LABEL_STYLES = 'text-xs text-text-secondary mb-1';
const SUMMARY_INCOME_STYLES = 'text-sm font-semibold text-semantic-success';
const SUMMARY_EXPENSE_STYLES = 'text-sm font-semibold text-semantic-error';
const SUMMARY_NET_STYLES = 'text-sm font-semibold text-text-primary';
const LIST_CONTAINER_STYLES = 'flex-1';

interface TransactionSummaryHeaderProps {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

function TransactionSummaryHeader({
  totalIncome,
  totalExpense,
  netBalance,
}: TransactionSummaryHeaderProps): React.ReactElement {
  return (
    <View className={SUMMARY_CONTAINER_STYLES}>
      <View className={SUMMARY_ITEM_STYLES}>
        <Text className={SUMMARY_LABEL_STYLES}>Income</Text>
        <Text className={SUMMARY_INCOME_STYLES}>{formatCurrency(totalIncome)}</Text>
      </View>
      <View className={SUMMARY_ITEM_STYLES}>
        <Text className={SUMMARY_LABEL_STYLES}>Expenses</Text>
        <Text className={SUMMARY_EXPENSE_STYLES}>{formatCurrency(totalExpense)}</Text>
      </View>
      <View className={SUMMARY_ITEM_STYLES}>
        <Text className={SUMMARY_LABEL_STYLES}>Balance</Text>
        <Text className={SUMMARY_NET_STYLES}>{formatCurrency(netBalance)}</Text>
      </View>
    </View>
  );
}

export default function TransactionsScreen(): React.ReactElement {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const setSelected = useTransactionStore((state) => state.setSelected);

  const { data: transactions = [], isLoading } = useTransactions();

  const { startDate, endDate } = getDateRangeForCurrentMonth();
  const { data: summary } = useTransactionSummary({ startDate, endDate });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: TRANSACTION_QUERY_KEYS.all });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const handleTransactionPress = useCallback(
    (transactionId: string) => {
      setSelected(transactionId);
    },
    [setSelected]
  );

  const listHeaderComponent = summary ? (
    <TransactionSummaryHeader
      totalIncome={summary.totalIncome}
      totalExpense={summary.totalExpense}
      netBalance={summary.netBalance}
    />
  ) : undefined;

  return (
    <Screen
      variant="fixed"
      backgroundColor={colors.background.primary}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <View className={HEADER_CONTAINER_STYLES}>
        <Text className={HEADER_TITLE_STYLES}>Transactions</Text>
      </View>
      <View className={LIST_CONTAINER_STYLES}>
        <TransactionList
          transactions={transactions}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onTransactionPress={handleTransactionPress}
          formatCurrency={formatCurrency}
          ListHeaderComponent={listHeaderComponent}
        />
      </View>
    </Screen>
  );
}
