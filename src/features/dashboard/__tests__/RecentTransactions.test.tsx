import { fireEvent, render, screen } from '@testing-library/react-native';

import { RecentTransactions } from '../components/RecentTransactions';

import type Transaction from '@/infrastructure/database/models/Transaction';

const mockFormatCurrency = (amount: number): string =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    id: `txn-${Math.random().toString(36).substring(7)}`,
    accountId: 'acc-1',
    type: 'expense',
    amount: 50000,
    merchant: 'Test Merchant',
    description: 'Test transaction',
    transactionDate: new Date('2025-01-15T10:30:00'),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as unknown as Transaction;

describe('RecentTransactions', () => {
  const defaultProps = {
    transactions: [],
    formatCurrency: mockFormatCurrency,
  };

  it('renders section title', () => {
    render(<RecentTransactions {...defaultProps} />);
    expect(screen.getByText('Recent Transactions')).toBeTruthy();
  });

  it('shows empty state when no transactions', () => {
    render(<RecentTransactions {...defaultProps} transactions={[]} />);
    expect(screen.getByText('No transactions yet')).toBeTruthy();
  });

  it('shows loading state when loading with no transactions', () => {
    render(<RecentTransactions {...defaultProps} isLoading transactions={[]} />);
    expect(screen.getByText('Loading transactions...')).toBeTruthy();
  });

  it('shows error state when error is provided', () => {
    render(<RecentTransactions {...defaultProps} error={new Error('Failed')} transactions={[]} />);
    expect(screen.getByText('Unable to load transactions')).toBeTruthy();
  });

  it('renders transaction list when transactions exist', () => {
    const transactions = [
      createMockTransaction({ id: 'txn-1', merchant: 'Store A', amount: 25000 }),
      createMockTransaction({ id: 'txn-2', merchant: 'Store B', amount: 75000 }),
    ];
    render(<RecentTransactions {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Store A')).toBeTruthy();
    expect(screen.getByText('Store B')).toBeTruthy();
  });

  it('limits displayed transactions to maxItems', () => {
    const transactions = Array.from({ length: 10 }, (_, i) =>
      createMockTransaction({ id: `txn-${i}`, merchant: `Store ${i}` })
    );
    render(<RecentTransactions {...defaultProps} transactions={transactions} maxItems={3} />);
    expect(screen.getByText('Store 0')).toBeTruthy();
    expect(screen.getByText('Store 2')).toBeTruthy();
    expect(screen.queryByText('Store 3')).toBeNull();
  });

  it('shows See All button when there are more transactions than maxItems', () => {
    const transactions = Array.from({ length: 10 }, (_, i) =>
      createMockTransaction({ id: `txn-${i}`, merchant: `Store ${i}` })
    );
    render(<RecentTransactions {...defaultProps} transactions={transactions} maxItems={5} />);
    expect(screen.getByText('See All')).toBeTruthy();
  });

  it('shows See All button when onSeeAllPress is provided even with few transactions', () => {
    const transactions = [createMockTransaction()];
    render(
      <RecentTransactions {...defaultProps} transactions={transactions} onSeeAllPress={jest.fn()} />
    );
    expect(screen.getByText('See All')).toBeTruthy();
  });

  it('hides See All button when no more items and no handler', () => {
    const transactions = [createMockTransaction()];
    render(<RecentTransactions {...defaultProps} transactions={transactions} />);
    expect(screen.queryByText('See All')).toBeNull();
  });

  it('calls onSeeAllPress when See All is pressed', () => {
    const onSeeAllPress = jest.fn();
    const transactions = Array.from({ length: 10 }, (_, i) =>
      createMockTransaction({ id: `txn-${i}` })
    );
    render(
      <RecentTransactions
        {...defaultProps}
        transactions={transactions}
        onSeeAllPress={onSeeAllPress}
      />
    );
    fireEvent.press(screen.getByText('See All'));
    expect(onSeeAllPress).toHaveBeenCalledTimes(1);
  });

  it('calls onTransactionPress when transaction is pressed', () => {
    const onTransactionPress = jest.fn();
    const transactions = [createMockTransaction({ id: 'txn-press-test', merchant: 'Clickable' })];
    render(
      <RecentTransactions
        {...defaultProps}
        transactions={transactions}
        onTransactionPress={onTransactionPress}
      />
    );
    fireEvent.press(screen.getByText('Clickable'));
    expect(onTransactionPress).toHaveBeenCalledWith('txn-press-test');
  });

  it('formats currency using provided formatter', () => {
    const customFormatter = jest.fn().mockReturnValue('$100.000');
    const transactions = [createMockTransaction({ amount: 100000 })];
    render(
      <RecentTransactions
        {...defaultProps}
        transactions={transactions}
        formatCurrency={customFormatter}
      />
    );
    expect(customFormatter).toHaveBeenCalled();
  });

  it('displays income transactions with positive sign', () => {
    const transactions = [createMockTransaction({ type: 'income', amount: 50000 })];
    render(<RecentTransactions {...defaultProps} transactions={transactions} />);
    expect(screen.getByText(/\+\$\s*50[.,]000/)).toBeTruthy();
  });

  it('displays expense transactions with negative sign', () => {
    const transactions = [createMockTransaction({ type: 'expense', amount: 50000 })];
    render(<RecentTransactions {...defaultProps} transactions={transactions} />);
    expect(screen.getByText(/-\$\s*50[.,]000/)).toBeTruthy();
  });

  it('defaults maxItems to 5', () => {
    const transactions = Array.from({ length: 10 }, (_, i) =>
      createMockTransaction({ id: `txn-${i}`, merchant: `Store ${i}` })
    );
    render(<RecentTransactions {...defaultProps} transactions={transactions} />);
    expect(screen.getByText('Store 0')).toBeTruthy();
    expect(screen.getByText('Store 4')).toBeTruthy();
    expect(screen.queryByText('Store 5')).toBeNull();
  });
});
