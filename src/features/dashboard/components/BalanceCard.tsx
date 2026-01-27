import { styled, Text, XStack, YStack } from 'tamagui';

import { Card } from '@/shared/components/ui';
import { colors } from '@/shared/theme';
import { formatCurrency } from '@/shared/utils';

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
  up: { color: colors.transaction.income, icon: '↑' },
  down: { color: colors.transaction.expense, icon: '↓' },
  neutral: { color: colors.text.secondary, icon: '→' },
};

const BalanceLabel = styled(Text, {
  name: 'BalanceLabel',
  color: '$textSecondary',
  fontSize: '$2',
  fontWeight: '500',
  marginBottom: '$2',
});

const BalanceAmount = styled(Text, {
  name: 'BalanceAmount',
  color: '$textPrimary',
  fontFamily: '$mono',
  fontSize: 40,
  fontWeight: '700',
  letterSpacing: -1,
});

const TrendBadge = styled(XStack, {
  name: 'TrendBadge',
  alignItems: 'center',
  marginTop: '$3',
  paddingHorizontal: '$3',
  paddingVertical: '$1.5',
  borderRadius: '$full',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
});

const TrendText = styled(Text, {
  name: 'TrendText',
  fontSize: '$2',
  fontWeight: '600',
});

const TrendLabel = styled(Text, {
  name: 'TrendLabel',
  color: '$textMuted',
  fontSize: '$2',
  marginLeft: '$1',
});

export function BalanceCard({
  totalBalance,
  percentageChange,
  trendDirection = 'neutral',
  currency = 'COP',
  locale = 'es-CO',
  label = 'Total Balance',
}: BalanceCardProps): React.ReactElement {
  const formattedBalance = formatCurrency(totalBalance, { currency, locale });
  const trendConfig = TREND_CONFIG[trendDirection];
  const showTrend = percentageChange !== undefined;

  return (
    <Card variant="elevated">
      <YStack alignItems="center" paddingVertical="$4">
        <BalanceLabel>{label}</BalanceLabel>
        <BalanceAmount accessibilityLabel={`${label}: ${formattedBalance}`}>
          {formattedBalance}
        </BalanceAmount>
        {showTrend && (
          <TrendBadge>
            <TrendText color={trendConfig.color}>
              {trendConfig.icon} {Math.abs(percentageChange).toFixed(1)}%
            </TrendText>
            <TrendLabel>vs last month</TrendLabel>
          </TrendBadge>
        )}
      </YStack>
    </Card>
  );
}
