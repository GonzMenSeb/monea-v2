import { render, screen } from '@testing-library/react-native';

import { BalanceCard } from '../components/BalanceCard';

describe('BalanceCard', () => {
  it('renders total balance formatted as COP currency', () => {
    render(<BalanceCard totalBalance={1500000} />);
    expect(screen.getByText(/\$\s*1[.,]500[.,]000/)).toBeTruthy();
  });

  it('displays default label when none provided', () => {
    render(<BalanceCard totalBalance={500000} />);
    expect(screen.getByText('Total Balance')).toBeTruthy();
  });

  it('displays custom label when provided', () => {
    render(<BalanceCard totalBalance={500000} label="Available Balance" />);
    expect(screen.getByText('Available Balance')).toBeTruthy();
  });

  it('shows percentage change with up trend indicator', () => {
    render(<BalanceCard totalBalance={1000000} percentageChange={12.5} trendDirection="up" />);
    expect(screen.getByText(/↑ 12\.5%/)).toBeTruthy();
    expect(screen.getByText('vs last month')).toBeTruthy();
  });

  it('shows percentage change with down trend indicator', () => {
    render(<BalanceCard totalBalance={1000000} percentageChange={-8.3} trendDirection="down" />);
    expect(screen.getByText(/↓ 8\.3%/)).toBeTruthy();
  });

  it('shows neutral trend indicator when direction is neutral', () => {
    render(<BalanceCard totalBalance={1000000} percentageChange={0} trendDirection="neutral" />);
    expect(screen.getByText(/→ 0\.0%/)).toBeTruthy();
  });

  it('hides trend section when percentageChange is not provided', () => {
    render(<BalanceCard totalBalance={1000000} />);
    expect(screen.queryByText('vs last month')).toBeNull();
  });

  it('formats large amounts correctly', () => {
    render(<BalanceCard totalBalance={15750000} />);
    expect(screen.getByText(/\$\s*15[.,]750[.,]000/)).toBeTruthy();
  });

  it('formats negative balance correctly', () => {
    render(<BalanceCard totalBalance={-250000} />);
    expect(screen.getByText(/-\$\s*250[.,]000/)).toBeTruthy();
  });

  it('has accessibility label for balance', () => {
    render(<BalanceCard totalBalance={1000000} />);
    expect(screen.getByLabelText(/Total Balance.*1[.,]000[.,]000/)).toBeTruthy();
  });
});
