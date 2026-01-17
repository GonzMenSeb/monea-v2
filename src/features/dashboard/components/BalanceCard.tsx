import { View, Text } from 'react-native';

import { Card } from '@/shared/components/ui';

type TrendDirection = 'up' | 'down' | 'neutral';

interface BalanceCardProps {
  totalBalance: number;
  percentageChange?: number;
  trendDirection?: TrendDirection;
  currency?: string;
  locale?: string;
  label?: string;
}

const TREND_CONFIG: Record<TrendDirection, { color: string; icon: string }> = {
  up: { color: 'text-transaction-income', icon: '↑' },
  down: { color: 'text-transaction-expense', icon: '↓' },
  neutral: { color: 'text-text-secondary', icon: '→' },
};

function formatCurrency(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function BalanceCard({
  totalBalance,
  percentageChange,
  trendDirection = 'neutral',
  currency = 'COP',
  locale = 'es-CO',
  label = 'Total Balance',
}: BalanceCardProps): React.ReactElement {
  const formattedBalance = formatCurrency(totalBalance, currency, locale);
  const trendConfig = TREND_CONFIG[trendDirection];
  const showTrend = percentageChange !== undefined;

  return (
    <Card variant="elevated">
      <View className="items-center py-4">
        <Text className="text-sm font-medium text-text-secondary mb-2">{label}</Text>
        <Text
          className="text-4xl font-bold text-text-primary"
          accessibilityLabel={`${label}: ${formattedBalance}`}
        >
          {formattedBalance}
        </Text>
        {showTrend && (
          <View className="flex-row items-center mt-3">
            <Text className={`text-sm font-semibold ${trendConfig.color}`}>
              {trendConfig.icon} {Math.abs(percentageChange).toFixed(1)}%
            </Text>
            <Text className="text-sm text-text-muted ml-1">vs last month</Text>
          </View>
        )}
      </View>
    </Card>
  );
}
