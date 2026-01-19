import { render, screen, fireEvent } from '@testing-library/react-native';

import { SpendingChart, type SpendingDataPoint } from '../components/SpendingChart';

jest.mock('victory-native', () => ({
  CartesianChart: ({ children }: { children: (args: unknown) => React.ReactNode }) => {
    return children({ points: { income: [], expense: [] }, chartBounds: {} });
  },
  Bar: () => null,
  useChartPressState: () => ({
    state: {
      x: { position: { value: 0 } },
      y: { income: { position: { value: 0 } }, expense: { position: { value: 0 } } },
    },
    isActive: false,
  }),
}));

jest.mock('@shopify/react-native-skia', () => ({
  Circle: () => null,
}));

const mockFormatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const weeklyData: SpendingDataPoint[] = [
  { label: 'Mon', income: 100000, expense: 50000 },
  { label: 'Tue', income: 0, expense: 75000 },
  { label: 'Wed', income: 200000, expense: 30000 },
  { label: 'Thu', income: 0, expense: 100000 },
  { label: 'Fri', income: 50000, expense: 200000 },
  { label: 'Sat', income: 0, expense: 80000 },
  { label: 'Sun', income: 0, expense: 25000 },
];

const monthlyData: SpendingDataPoint[] = [
  { label: 'Week 1', income: 500000, expense: 300000 },
  { label: 'Week 2', income: 350000, expense: 450000 },
  { label: 'Week 3', income: 600000, expense: 200000 },
  { label: 'Week 4', income: 400000, expense: 350000 },
];

describe('SpendingChart', () => {
  it('renders the chart title', () => {
    render(
      <SpendingChart data={weeklyData} timeRange="weekly" formatCurrency={mockFormatCurrency} />
    );
    expect(screen.getByText('Spending Overview')).toBeTruthy();
  });

  it('renders weekly toggle when timeRange is weekly', () => {
    render(
      <SpendingChart data={weeklyData} timeRange="weekly" formatCurrency={mockFormatCurrency} />
    );
    expect(screen.getByText('Week')).toBeTruthy();
  });

  it('renders month toggle when timeRange is monthly', () => {
    render(
      <SpendingChart data={monthlyData} timeRange="monthly" formatCurrency={mockFormatCurrency} />
    );
    expect(screen.getByText('Month')).toBeTruthy();
  });

  it('calculates and displays correct summary totals', () => {
    render(
      <SpendingChart data={weeklyData} timeRange="weekly" formatCurrency={mockFormatCurrency} />
    );

    expect(screen.getAllByText('Income').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Expense/).length).toBeGreaterThan(0);
    expect(screen.getByText('Net')).toBeTruthy();

    expect(screen.getByText(/\+.*350[.,]000/)).toBeTruthy();
    expect(screen.getByText(/-.*560[.,]000/)).toBeTruthy();
  });

  it('shows empty state when data is empty', () => {
    render(<SpendingChart data={[]} timeRange="weekly" formatCurrency={mockFormatCurrency} />);
    expect(screen.getByText('No spending data available')).toBeTruthy();
  });

  it('shows loading state when isLoading is true', () => {
    render(
      <SpendingChart
        data={[]}
        timeRange="weekly"
        formatCurrency={mockFormatCurrency}
        isLoading={true}
      />
    );
    expect(screen.getByText('Loading chart...')).toBeTruthy();
  });

  it('calls onTimeRangeChange when toggle is pressed', () => {
    const onTimeRangeChange = jest.fn();
    render(
      <SpendingChart
        data={weeklyData}
        timeRange="weekly"
        formatCurrency={mockFormatCurrency}
        onTimeRangeChange={onTimeRangeChange}
      />
    );

    fireEvent.press(screen.getByText('Month'));
    expect(onTimeRangeChange).toHaveBeenCalledWith('monthly');
  });

  it('displays positive net change with positive styling', () => {
    const positiveData: SpendingDataPoint[] = [{ label: 'Mon', income: 500000, expense: 100000 }];

    render(
      <SpendingChart data={positiveData} timeRange="weekly" formatCurrency={mockFormatCurrency} />
    );

    expect(screen.getByText(/\+.*400[.,]000/)).toBeTruthy();
  });

  it('displays negative net change with negative styling', () => {
    const negativeData: SpendingDataPoint[] = [{ label: 'Mon', income: 100000, expense: 500000 }];

    render(
      <SpendingChart data={negativeData} timeRange="weekly" formatCurrency={mockFormatCurrency} />
    );

    expect(screen.getByText('Net')).toBeTruthy();
    expect(screen.getByText(/400[.,]000/)).toBeTruthy();
  });

  it('renders both toggles when onTimeRangeChange is provided', () => {
    const onTimeRangeChange = jest.fn();
    render(
      <SpendingChart
        data={weeklyData}
        timeRange="weekly"
        formatCurrency={mockFormatCurrency}
        onTimeRangeChange={onTimeRangeChange}
      />
    );

    expect(screen.getByText('Week')).toBeTruthy();
    expect(screen.getByText('Month')).toBeTruthy();
  });

  it('handles monthly data correctly', () => {
    render(
      <SpendingChart data={monthlyData} timeRange="monthly" formatCurrency={mockFormatCurrency} />
    );

    expect(screen.getByText(/\+.*1[.,]850[.,]000/)).toBeTruthy();
    expect(screen.getByText(/-.*1[.,]300[.,]000/)).toBeTruthy();
  });
});
