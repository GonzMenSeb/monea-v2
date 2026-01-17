import { useMemo } from 'react';

import { View, Text, Pressable } from 'react-native';

import { Circle } from '@shopify/react-native-skia';
import { type SharedValue } from 'react-native-reanimated';
import { CartesianChart, Bar, useChartPressState } from 'victory-native';

import { Card } from '@/shared/components/ui';
import { colors } from '@/shared/theme/colors';

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

const CHART_HEIGHT = 200;
const CONTAINER_STYLES = 'mt-6';
const HEADER_STYLES = 'flex-row justify-between items-center px-4 mb-4';
const TITLE_STYLES = 'text-lg font-semibold text-text-primary';
const TOGGLE_CONTAINER_STYLES = 'flex-row bg-background-tertiary rounded-lg p-0.5';
const TOGGLE_ACTIVE_STYLES = 'px-3 py-1.5 rounded-md bg-surface-card';
const TOGGLE_INACTIVE_STYLES = 'px-3 py-1.5 rounded-md';
const TOGGLE_TEXT_ACTIVE_STYLES = 'text-sm font-medium text-text-primary';
const TOGGLE_TEXT_INACTIVE_STYLES = 'text-sm font-medium text-text-muted';
const SUMMARY_CONTAINER_STYLES = 'flex-row justify-around mt-4 pt-4 border-t border-gray-100';
const SUMMARY_ITEM_STYLES = 'items-center';
const SUMMARY_LABEL_STYLES = 'text-xs text-text-muted mb-1';
const EMPTY_STATE_STYLES = 'items-center justify-center py-12';
const EMPTY_TEXT_STYLES = 'text-sm text-text-muted';

const CHART_COLORS = {
  income: colors.transaction.income,
  expense: colors.transaction.expense,
  grid: colors.text.muted,
  axis: colors.text.secondary,
};

function ToolTipIndicator({
  x,
  y,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
}): React.ReactElement {
  return <Circle cx={x} cy={y} r={8} color={colors.primary.DEFAULT} />;
}

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
      <View className={TOGGLE_CONTAINER_STYLES}>
        <View className={TOGGLE_ACTIVE_STYLES}>
          <Text className={TOGGLE_TEXT_ACTIVE_STYLES}>
            {timeRange === 'weekly' ? 'Week' : 'Month'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className={TOGGLE_CONTAINER_STYLES}>
      <Pressable
        className={timeRange === 'weekly' ? TOGGLE_ACTIVE_STYLES : TOGGLE_INACTIVE_STYLES}
        onPress={() => onChange('weekly')}
        accessibilityRole="button"
        accessibilityState={{ selected: timeRange === 'weekly' }}
      >
        <Text
          className={
            timeRange === 'weekly' ? TOGGLE_TEXT_ACTIVE_STYLES : TOGGLE_TEXT_INACTIVE_STYLES
          }
        >
          Week
        </Text>
      </Pressable>
      <Pressable
        className={timeRange === 'monthly' ? TOGGLE_ACTIVE_STYLES : TOGGLE_INACTIVE_STYLES}
        onPress={() => onChange('monthly')}
        accessibilityRole="button"
        accessibilityState={{ selected: timeRange === 'monthly' }}
      >
        <Text
          className={
            timeRange === 'monthly' ? TOGGLE_TEXT_ACTIVE_STYLES : TOGGLE_TEXT_INACTIVE_STYLES
          }
        >
          Month
        </Text>
      </Pressable>
    </View>
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
    summary.netChange >= 0 ? 'text-transaction-income' : 'text-transaction-expense';
  const netChangeSign = summary.netChange >= 0 ? '+' : '';

  return (
    <View className={SUMMARY_CONTAINER_STYLES}>
      <View className={SUMMARY_ITEM_STYLES}>
        <Text className={SUMMARY_LABEL_STYLES}>Income</Text>
        <Text className="text-base font-semibold text-transaction-income">
          +{formatCurrency(summary.totalIncome)}
        </Text>
      </View>
      <View className={SUMMARY_ITEM_STYLES}>
        <Text className={SUMMARY_LABEL_STYLES}>Expenses</Text>
        <Text className="text-base font-semibold text-transaction-expense">
          -{formatCurrency(summary.totalExpense)}
        </Text>
      </View>
      <View className={SUMMARY_ITEM_STYLES}>
        <Text className={SUMMARY_LABEL_STYLES}>Net</Text>
        <Text className={`text-base font-semibold ${netChangeColor}`}>
          {netChangeSign}
          {formatCurrency(Math.abs(summary.netChange))}
        </Text>
      </View>
    </View>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <View className={EMPTY_STATE_STYLES}>
      <Text className={EMPTY_TEXT_STYLES}>No spending data available</Text>
    </View>
  );
}

export function SpendingChart({
  data,
  timeRange,
  formatCurrency,
  onTimeRangeChange,
  isLoading = false,
}: SpendingChartProps): React.ReactElement {
  const { state, isActive } = useChartPressState({ x: '', y: { income: 0, expense: 0 } });

  const summary = useMemo(() => calculateSummary(data), [data]);

  const maxValue = useMemo(() => {
    if (data.length === 0) {
      return 1000;
    }
    return Math.max(...data.flatMap((d) => [d.income, d.expense])) * 1.1;
  }, [data]);

  if (isLoading) {
    return (
      <View className={CONTAINER_STYLES}>
        <View className={HEADER_STYLES}>
          <Text className={TITLE_STYLES}>Spending Overview</Text>
          <TimeRangeToggle timeRange={timeRange} onChange={onTimeRangeChange} />
        </View>
        <Card variant="elevated">
          <View className={EMPTY_STATE_STYLES}>
            <Text className={EMPTY_TEXT_STYLES}>Loading chart...</Text>
          </View>
        </Card>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View className={CONTAINER_STYLES}>
        <View className={HEADER_STYLES}>
          <Text className={TITLE_STYLES}>Spending Overview</Text>
          <TimeRangeToggle timeRange={timeRange} onChange={onTimeRangeChange} />
        </View>
        <Card variant="elevated">
          <EmptyState />
        </Card>
      </View>
    );
  }

  return (
    <View className={CONTAINER_STYLES}>
      <View className={HEADER_STYLES}>
        <Text className={TITLE_STYLES}>Spending Overview</Text>
        <TimeRangeToggle timeRange={timeRange} onChange={onTimeRangeChange} />
      </View>
      <Card variant="elevated">
        <View style={{ height: CHART_HEIGHT }}>
          <CartesianChart
            data={data}
            xKey="label"
            yKeys={['income', 'expense']}
            domainPadding={{ left: 30, right: 30, top: 20 }}
            domain={{ y: [0, maxValue] }}
            chartPressState={state}
            axisOptions={{
              font: null,
              labelColor: CHART_COLORS.axis,
              lineColor: CHART_COLORS.grid,
              tickCount: { y: 4, x: data.length },
            }}
          >
            {({ points, chartBounds }) => (
              <>
                <Bar
                  points={points.income}
                  chartBounds={chartBounds}
                  color={CHART_COLORS.income}
                  roundedCorners={{ topLeft: 4, topRight: 4 }}
                  barWidth={12}
                  innerPadding={0.3}
                />
                <Bar
                  points={points.expense}
                  chartBounds={chartBounds}
                  color={CHART_COLORS.expense}
                  roundedCorners={{ topLeft: 4, topRight: 4 }}
                  barWidth={12}
                  innerPadding={0.3}
                />
                {isActive && <ToolTipIndicator x={state.x.position} y={state.y.expense.position} />}
              </>
            )}
          </CartesianChart>
        </View>
        <ChartSummaryRow summary={summary} formatCurrency={formatCurrency} />
      </Card>
    </View>
  );
}

export type { SpendingChartProps, SpendingDataPoint, TimeRange };
