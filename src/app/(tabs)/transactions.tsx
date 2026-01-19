import { useCallback, useState } from 'react';

import { Pressable } from 'react-native';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

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

const SummaryContainer = styled(XStack, {
  name: 'SummaryContainer',
  justifyContent: 'space-between',
  paddingHorizontal: '$4',
  paddingVertical: '$3',
  marginBottom: '$2',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  marginHorizontal: '$4',
});

const SummaryItem = styled(YStack, {
  name: 'SummaryItem',
  alignItems: 'center',
});

const SummaryLabel = styled(Text, {
  name: 'SummaryLabel',
  fontSize: '$1',
  color: '$textSecondary',
  marginBottom: '$1',
});

const FABContainer = styled(Stack, {
  name: 'FABContainer',
  position: 'absolute',
  bottom: 24,
  right: 24,
});

const FAB = styled(Stack, {
  name: 'FAB',
  width: 56,
  height: 56,
  borderRadius: '$full',
  backgroundColor: '$accentPrimary',
  alignItems: 'center',
  justifyContent: 'center',
  shadowColor: '$black',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
});

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
    <SummaryContainer>
      <SummaryItem>
        <SummaryLabel>Income</SummaryLabel>
        <Text fontSize="$2" fontWeight="600" color="$income">
          {formatCurrency(totalIncome)}
        </Text>
      </SummaryItem>
      <SummaryItem>
        <SummaryLabel>Expenses</SummaryLabel>
        <Text fontSize="$2" fontWeight="600" color="$expense">
          {formatCurrency(totalExpense)}
        </Text>
      </SummaryItem>
      <SummaryItem>
        <SummaryLabel>Balance</SummaryLabel>
        <Text fontSize="$2" fontWeight="600" color="$textPrimary">
          {formatCurrency(netBalance)}
        </Text>
      </SummaryItem>
    </SummaryContainer>
  );
}

export default function TransactionsScreen(): React.ReactElement {
  const router = useRouter();
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
      router.push(`/transactions/${transactionId}/edit`);
    },
    [setSelected, router]
  );

  const handleAddTransaction = useCallback(() => {
    router.push('/transactions/new');
  }, [router]);

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
      backgroundColor={colors.background.base}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <Stack paddingHorizontal="$4" paddingTop="$4" paddingBottom="$2">
        <Text fontSize="$6" fontWeight="700" color="$textPrimary">
          Transactions
        </Text>
      </Stack>
      <Stack flex={1}>
        <TransactionList
          transactions={transactions}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onRefresh={handleRefresh}
          onTransactionPress={handleTransactionPress}
          formatCurrency={formatCurrency}
          ListHeaderComponent={listHeaderComponent}
        />
      </Stack>

      <FABContainer>
        <Pressable
          onPress={handleAddTransaction}
          accessibilityRole="button"
          accessibilityLabel="Add new transaction"
        >
          {({ pressed }) => (
            <FAB opacity={pressed ? 0.8 : 1} scale={pressed ? 0.95 : 1}>
              <Text color="$textInverse" fontSize="$6" fontWeight="300">
                +
              </Text>
            </FAB>
          )}
        </Pressable>
      </FABContainer>
    </Screen>
  );
}
