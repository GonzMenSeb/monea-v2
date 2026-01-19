import { useCallback, useState } from 'react';

import { ScrollView, RefreshControl } from 'react-native';
import { Stack, Text, YStack } from 'tamagui';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import {
  BalanceCard,
  AccountsOverview,
  RecentTransactions,
  SpendingChart,
  type TimeRange,
  type SpendingDataPoint,
} from '@/features/dashboard/components';
import { useDashboardData, DASHBOARD_QUERY_KEYS } from '@/features/dashboard/hooks';
import { useTransactionStore } from '@/features/transactions/store/transactionStore';
import { Screen } from '@/shared/components/layout';
import { colors } from '@/shared/theme';
import { formatCurrency, getGreeting } from '@/shared/utils';

export default function DashboardScreen(): React.ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const setSelectedTransaction = useTransactionStore((state) => state.setSelected);

  const {
    data,
    accounts,
    accountsLoading,
    accountsError,
    recentTransactions,
    transactionsLoading,
    transactionsError,
    spendingData,
    spendingLoading,
  } = useDashboardData({ timeRange, recentTransactionsLimit: 5 });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEYS.all });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  const handleTransactionPress = useCallback(
    (transactionId: string) => {
      setSelectedTransaction(transactionId);
    },
    [setSelectedTransaction]
  );

  const handleSeeAllTransactions = useCallback(() => {
    router.push('/(tabs)/transactions');
  }, [router]);

  const handleAccountPress = useCallback((_accountId: string) => {
    // Navigation to account detail will be implemented in a future PR
  }, []);

  const handleSeeAllAccounts = useCallback(() => {
    // TODO: Navigate to accounts list
  }, []);

  const handleAddAccount = useCallback(() => {
    // TODO: Navigate to add account flow
  }, []);

  const handleTimeRangeChange = useCallback((range: TimeRange) => {
    setTimeRange(range);
  }, []);

  return (
    <Screen
      testID="dashboard-screen"
      variant="fixed"
      backgroundColor={colors.background.base}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.accent.primary]}
            tintColor={colors.accent.primary}
            progressBackgroundColor={colors.background.surface}
          />
        }
      >
        <Stack paddingHorizontal="$4" paddingTop="$4" paddingBottom="$2">
          <Text fontSize="$6" fontWeight="700" color="$textPrimary">
            {getGreeting()}
          </Text>
          <Text fontSize="$2" color="$textSecondary" marginTop="$1">
            Here&apos;s your financial overview
          </Text>
        </Stack>

        <Stack paddingHorizontal="$4" marginTop="$4">
          <BalanceCard
            totalBalance={data?.totalBalance ?? 0}
            percentageChange={data?.percentageChange}
            trendDirection={data?.trendDirection ?? 'neutral'}
          />
        </Stack>

        <AccountsOverview
          accounts={accounts}
          isLoading={accountsLoading}
          error={accountsError}
          onAccountPress={handleAccountPress}
          onSeeAllPress={handleSeeAllAccounts}
          onAddAccountPress={handleAddAccount}
          formatCurrency={formatCurrency}
        />

        <SpendingChart
          data={spendingData as SpendingDataPoint[]}
          timeRange={timeRange}
          formatCurrency={formatCurrency}
          onTimeRangeChange={handleTimeRangeChange}
          isLoading={spendingLoading}
        />

        <RecentTransactions
          transactions={recentTransactions}
          isLoading={transactionsLoading}
          error={transactionsError}
          onTransactionPress={handleTransactionPress}
          onSeeAllPress={handleSeeAllTransactions}
          formatCurrency={formatCurrency}
        />
      </ScrollView>
    </Screen>
  );
}
