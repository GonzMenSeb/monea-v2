import { useCallback, useState } from 'react';

import { ScrollView, View, Text, RefreshControl } from 'react-native';

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

const HEADER_CONTAINER_STYLES = 'px-4 pt-4 pb-2';
const HEADER_TITLE_STYLES = 'text-2xl font-bold text-text-primary';
const HEADER_SUBTITLE_STYLES = 'text-sm text-text-secondary mt-1';
const BALANCE_CONTAINER_STYLES = 'px-4 mt-4';
const CONTENT_CONTAINER_STYLES = 'pb-8';

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
      backgroundColor={colors.background.primary}
      edges={['top', 'left', 'right']}
      keyboardAvoiding={false}
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName={CONTENT_CONTAINER_STYLES}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary.DEFAULT]}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        <View className={HEADER_CONTAINER_STYLES}>
          <Text className={HEADER_TITLE_STYLES}>{getGreeting()}</Text>
          <Text className={HEADER_SUBTITLE_STYLES}>Here&apos;s your financial overview</Text>
        </View>

        <View className={BALANCE_CONTAINER_STYLES}>
          <BalanceCard
            totalBalance={data?.totalBalance ?? 0}
            percentageChange={data?.percentageChange}
            trendDirection={data?.trendDirection ?? 'neutral'}
          />
        </View>

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
