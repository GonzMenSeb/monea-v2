import { useMemo } from 'react';

import { BarChart } from 'react-native-gifted-charts';
import { styled, Stack, Text, XStack, YStack } from 'tamagui';

import { Card } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

type TimeRange = 'weekly' | 'monthly';

interface SpendingDataPoint {
  label: string;
  income: number;
  expense: number;
  [key: string]: string | number;
}

interface SpendingChartProps {
  data: SpendingDataPoint[];
  timeRange: TimeRange;
  formatCurrency: (amount: number) => string;
  onTimeRangeChange?: (range: TimeRange) => void;
  isLoading?: boolean;
}

interface ChartSummary {
  totalIncome: number;
  totalExpense: number;
  netChange: number;
}

const CHART_HEIGHT = 180;

const SectionHeader = styled(XStack, {
  name: 'SectionHeader',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: '$4',
  marginBottom: '$4',
});

const SectionTitle = styled(Text, {
  name: 'SectionTitle',
  color: '$textPrimary',
  fontSize: '$4',
  fontWeight: '600',
});

const ToggleContainer = styled(XStack, {
  name: 'ToggleContainer',
  backgroundColor: '$backgroundElevated',
  borderRadius: '$2',
  padding: '$0.5',
});

const ToggleButton = styled(Stack, {
  name: 'ToggleButton',
  paddingHorizontal: '$3',
  paddingVertical: 6,
  borderRadius: 6,

  variants: {
    active: {
      true: {
        backgroundColor: '$backgroundSurface',
      },
      false: {
        backgroundColor: 'transparent',
      },
    },
  } as const,
});

const ToggleText = styled(Text, {
  name: 'ToggleText',
  fontSize: '$2',
  fontWeight: '500',

  variants: {
    active: {
      true: {
        color: '$textPrimary',
      },
      false: {
        color: '$textMuted',
      },
    },
  } as const,
});

const SummaryContainer = styled(XStack, {
  name: 'SummaryContainer',
  justifyContent: 'space-around',
  marginTop: '$4',
  paddingTop: '$4',
  borderTopWidth: 1,
  borderTopColor: '$border',
});

const SummaryItem = styled(YStack, {
  name: 'SummaryItem',
  alignItems: 'center',
});

const SummaryLabel = styled(Text, {
  name: 'SummaryLabel',
  color: '$textMuted',
  fontSize: '$1',
  marginBottom: '$1',
});

const SummaryValue = styled(Text, {
  name: 'SummaryValue',
  fontFamily: '$mono',
  fontSize: '$3',
  fontWeight: '600',
});

const EmptyContainer = styled(YStack, {
  name: 'EmptyContainer',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: '$12',
});

const EmptyText = styled(Text, {
  name: 'EmptyText',
  color: '$textMuted',
  fontSize: '$2',
});

function calculateSummary(data: SpendingDataPoint[]): ChartSummary {
  return data.reduce(
    (acc, point) => ({
      totalIncome: acc.totalIncome + point.income,
      totalExpense: acc.totalExpense + point.expense,
      netChange: acc.netChange + (point.income - point.expense),
    }),
    { totalIncome: 0, totalExpense: 0, netChange: 0 }
  );
}

function TimeRangeToggle({
  timeRange,
  onChange,
}: {
  timeRange: TimeRange;
  onChange?: (range: TimeRange) => void;
}): React.ReactElement {
  if (!onChange) {
    return (
      <ToggleContainer>
        <ToggleButton active>
          <ToggleText active>{timeRange === 'weekly' ? 'Week' : 'Month'}</ToggleText>
        </ToggleButton>
      </ToggleContainer>
    );
  }

  return (
    <ToggleContainer>
      <ToggleButton
        active={timeRange === 'weekly'}
        onPress={() => onChange('weekly')}
        pressStyle={{ opacity: 0.7 }}
        accessibilityRole="button"
        accessibilityState={{ selected: timeRange === 'weekly' }}
      >
        <ToggleText active={timeRange === 'weekly'}>Week</ToggleText>
      </ToggleButton>
      <ToggleButton
        active={timeRange === 'monthly'}
        onPress={() => onChange('monthly')}
        pressStyle={{ opacity: 0.7 }}
        accessibilityRole="button"
        accessibilityState={{ selected: timeRange === 'monthly' }}
      >
        <ToggleText active={timeRange === 'monthly'}>Month</ToggleText>
      </ToggleButton>
    </ToggleContainer>
  );
}

function ChartSummaryRow({
  summary,
  formatCurrency,
}: {
  summary: ChartSummary;
  formatCurrency: (amount: number) => string;
}): React.ReactElement {
  const netChangeColor =
    summary.netChange >= 0 ? colors.transaction.income : colors.transaction.expense;
  const netChangeSign = summary.netChange >= 0 ? '+' : '';

  return (
    <SummaryContainer>
      <SummaryItem>
        <SummaryLabel>Income</SummaryLabel>
        <SummaryValue color={colors.transaction.income}>
          +{formatCurrency(summary.totalIncome)}
        </SummaryValue>
      </SummaryItem>
      <SummaryItem>
        <SummaryLabel>Expenses</SummaryLabel>
        <SummaryValue color={colors.transaction.expense}>
          -{formatCurrency(summary.totalExpense)}
        </SummaryValue>
      </SummaryItem>
      <SummaryItem>
        <SummaryLabel>Net</SummaryLabel>
        <SummaryValue color={netChangeColor}>
          {netChangeSign}
          {formatCurrency(Math.abs(summary.netChange))}
        </SummaryValue>
      </SummaryItem>
    </SummaryContainer>
  );
}

export function SpendingChart({
  data,
  timeRange,
  formatCurrency,
  onTimeRangeChange,
  isLoading = false,
}: SpendingChartProps): React.ReactElement {
  const summary = useMemo(() => calculateSummary(data), [data]);

  const chartData = useMemo(() => {
    return data.flatMap((point, index) => [
      {
        value: point.income,
        label: point.label,
        frontColor: colors.transaction.income,
        spacing: 4,
        labelWidth: 40,
        labelTextStyle: { color: colors.text.muted, fontSize: 10 },
      },
      {
        value: point.expense,
        frontColor: colors.transaction.expense,
        spacing: index === data.length - 1 ? 0 : 16,
      },
    ]);
  }, [data]);

  const maxValue = useMemo(() => {
    if (data.length === 0) {
      return 1000;
    }
    return Math.max(...data.flatMap((d) => [d.income, d.expense])) * 1.1;
  }, [data]);

  if (isLoading) {
    return (
      <YStack marginTop="$6">
        <SectionHeader>
          <SectionTitle>Spending Overview</SectionTitle>
          <TimeRangeToggle timeRange={timeRange} onChange={onTimeRangeChange} />
        </SectionHeader>
        <Card variant="elevated">
          <EmptyContainer>
            <EmptyText>Loading chart...</EmptyText>
          </EmptyContainer>
        </Card>
      </YStack>
    );
  }

  if (data.length === 0) {
    return (
      <YStack marginTop="$6">
        <SectionHeader>
          <SectionTitle>Spending Overview</SectionTitle>
          <TimeRangeToggle timeRange={timeRange} onChange={onTimeRangeChange} />
        </SectionHeader>
        <Card variant="elevated">
          <EmptyContainer>
            <EmptyText>No spending data available</EmptyText>
          </EmptyContainer>
        </Card>
      </YStack>
    );
  }

  return (
    <YStack marginTop="$6">
      <SectionHeader>
        <SectionTitle>Spending Overview</SectionTitle>
        <TimeRangeToggle timeRange={timeRange} onChange={onTimeRangeChange} />
      </SectionHeader>
      <Card variant="elevated">
        <Stack height={CHART_HEIGHT} marginBottom="$2">
          <BarChart
            data={chartData}
            barWidth={12}
            spacing={4}
            roundedTop
            roundedBottom
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{ color: colors.text.muted, fontSize: 10 }}
            noOfSections={4}
            maxValue={maxValue}
            isAnimated
            animationDuration={500}
            backgroundColor={colors.background.surface}
            height={CHART_HEIGHT - 40}
            yAxisLabelWidth={50}
            formatYLabel={(label) => {
              const num = parseFloat(label);
              if (num >= 1000000) {
                return `${(num / 1000000).toFixed(1)}M`;
              }
              if (num >= 1000) {
                return `${(num / 1000).toFixed(0)}K`;
              }
              return label;
            }}
          />
        </Stack>
        <XStack justifyContent="center" gap="$4" marginTop="$2">
          <XStack alignItems="center" gap="$1">
            <Stack
              width={12}
              height={12}
              borderRadius="$1"
              backgroundColor={colors.transaction.income}
            />
            <Text color="$textSecondary" fontSize="$1">
              Income
            </Text>
          </XStack>
          <XStack alignItems="center" gap="$1">
            <Stack
              width={12}
              height={12}
              borderRadius="$1"
              backgroundColor={colors.transaction.expense}
            />
            <Text color="$textSecondary" fontSize="$1">
              Expense
            </Text>
          </XStack>
        </XStack>
        <ChartSummaryRow summary={summary} formatCurrency={formatCurrency} />
      </Card>
    </YStack>
  );
}

export type { SpendingChartProps, SpendingDataPoint, TimeRange };
