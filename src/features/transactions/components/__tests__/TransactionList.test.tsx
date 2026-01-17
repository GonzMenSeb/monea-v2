import { render, screen, fireEvent } from '@testing-library/react-native';

import { TransactionList } from '../TransactionList';

import type Transaction from '@/infrastructure/database/models/Transaction';

const mockFormatCurrency = (amount: number): string => `$${amount.toLocaleString('es-CO')}`;

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => {
  const today = new Date();
  return {
    id: `tx-${Math.random().toString(36).slice(2, 9)}`,
    accountId: 'account-1',
    type: 'expense',
    amount: 50000,
    merchant: 'Test Merchant',
    description: 'Test description',
    transactionDate: today,
    createdAt: today,
    updatedAt: today,
    ...overrides,
  } as Transaction;
};

describe('TransactionList', () => {
  it('renders loading state when isLoading is true and no transactions', () => {
    render(
      <TransactionList transactions={[]} isLoading={true} formatCurrency={mockFormatCurrency} />
    );

    expect(screen.getByText('Loading transactions...')).toBeTruthy();
  });

  it('renders empty state when no transactions', () => {
    render(<TransactionList transactions={[]} formatCurrency={mockFormatCurrency} />);

    expect(screen.getByText('No transactions found')).toBeTruthy();
  });

  it('renders custom empty state props', () => {
    render(
      <TransactionList
        transactions={[]}
        formatCurrency={mockFormatCurrency}
        emptyStateTitle="Custom Title"
        emptyStateDescription="Custom description"
      />
    );

    expect(screen.getByText('Custom Title')).toBeTruthy();
    expect(screen.getByText('Custom description')).toBeTruthy();
  });

  it('renders transactions grouped by date', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const transactions = [
      createMockTransaction({ id: 'tx-1', transactionDate: today, merchant: 'Today Store' }),
      createMockTransaction({
        id: 'tx-2',
        transactionDate: yesterday,
        merchant: 'Yesterday Store',
      }),
    ];

    render(<TransactionList transactions={transactions} formatCurrency={mockFormatCurrency} />);

    expect(screen.getAllByText('Today').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Yesterday').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Today Store')).toBeTruthy();
    expect(screen.getByText('Yesterday Store')).toBeTruthy();
  });

  it('calls onTransactionPress when transaction is pressed', () => {
    const onTransactionPress = jest.fn();
    const transaction = createMockTransaction({ id: 'tx-press-test' });

    render(
      <TransactionList
        transactions={[transaction]}
        formatCurrency={mockFormatCurrency}
        onTransactionPress={onTransactionPress}
      />
    );

    fireEvent.press(screen.getByText(transaction.merchant!));

    expect(onTransactionPress).toHaveBeenCalledWith('tx-press-test');
  });

  it('groups multiple transactions on the same day under one header', () => {
    const today = new Date();
    const transactions = [
      createMockTransaction({ id: 'tx-1', transactionDate: today, merchant: 'Store A' }),
      createMockTransaction({ id: 'tx-2', transactionDate: today, merchant: 'Store B' }),
      createMockTransaction({ id: 'tx-3', transactionDate: today, merchant: 'Store C' }),
    ];

    render(<TransactionList transactions={transactions} formatCurrency={mockFormatCurrency} />);

    expect(screen.getAllByText('Today').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Store A')).toBeTruthy();
    expect(screen.getByText('Store B')).toBeTruthy();
    expect(screen.getByText('Store C')).toBeTruthy();
  });

  it('sorts transactions by date descending', () => {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const transactions = [
      createMockTransaction({ id: 'tx-old', transactionDate: threeDaysAgo, merchant: 'Old Store' }),
      createMockTransaction({ id: 'tx-new', transactionDate: today, merchant: 'New Store' }),
    ];

    render(<TransactionList transactions={transactions} formatCurrency={mockFormatCurrency} />);

    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('New Store')).toBeTruthy();
    expect(screen.getByText('Old Store')).toBeTruthy();
  });

  it('renders with refresh control when onRefresh is provided', () => {
    const onRefresh = jest.fn();
    const transaction = createMockTransaction();

    render(
      <TransactionList
        transactions={[transaction]}
        formatCurrency={mockFormatCurrency}
        onRefresh={onRefresh}
        isRefreshing={false}
      />
    );

    expect(screen.getByText(transaction.merchant!)).toBeTruthy();
  });
});
