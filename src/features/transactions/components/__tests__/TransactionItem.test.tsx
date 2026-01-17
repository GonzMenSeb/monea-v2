import { render, screen, fireEvent } from '@testing-library/react-native';

import { TransactionItem } from '../TransactionItem';

import type Transaction from '@/infrastructure/database/models/Transaction';

const mockFormatCurrency = (amount: number): string => `$${amount.toLocaleString('es-CO')}`;

const createMockTransaction = (overrides: Partial<Transaction> = {}): Transaction => {
  const now = new Date('2024-03-15T14:30:00');
  return {
    id: 'tx-123',
    accountId: 'account-1',
    type: 'expense',
    amount: 50000,
    merchant: 'Exito',
    description: 'Groceries',
    transactionDate: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Transaction;
};

describe('TransactionItem', () => {
  it('displays transaction merchant', () => {
    const transaction = createMockTransaction({ merchant: 'Test Merchant' });
    render(<TransactionItem transaction={transaction} formatCurrency={mockFormatCurrency} />);

    expect(screen.getByText('Test Merchant')).toBeTruthy();
  });

  it('displays formatted currency amount', () => {
    const transaction = createMockTransaction({ amount: 150000 });
    render(<TransactionItem transaction={transaction} formatCurrency={mockFormatCurrency} />);

    expect(screen.getByText('-$150.000')).toBeTruthy();
  });

  it('displays positive sign for income transactions', () => {
    const transaction = createMockTransaction({ type: 'income', amount: 100000 });
    render(<TransactionItem transaction={transaction} formatCurrency={mockFormatCurrency} />);

    expect(screen.getByText('+$100.000')).toBeTruthy();
  });

  it('displays negative sign for expense transactions', () => {
    const transaction = createMockTransaction({ type: 'expense', amount: 75000 });
    render(<TransactionItem transaction={transaction} formatCurrency={mockFormatCurrency} />);

    expect(screen.getByText('-$75.000')).toBeTruthy();
  });

  it('calls onPress with transaction id when pressed', () => {
    const onPress = jest.fn();
    const transaction = createMockTransaction({ id: 'tx-press-test' });
    render(
      <TransactionItem
        transaction={transaction}
        formatCurrency={mockFormatCurrency}
        onPress={onPress}
      />
    );

    fireEvent.press(screen.getByText(transaction.merchant!));

    expect(onPress).toHaveBeenCalledWith('tx-press-test');
  });

  it('does not call onPress when not provided', () => {
    const transaction = createMockTransaction();
    render(<TransactionItem transaction={transaction} formatCurrency={mockFormatCurrency} />);

    expect(screen.getByText(transaction.merchant!)).toBeTruthy();
  });

  it('displays description when merchant is present', () => {
    const transaction = createMockTransaction({
      merchant: 'Store',
      description: 'Test Description',
    });
    render(<TransactionItem transaction={transaction} formatCurrency={mockFormatCurrency} />);

    expect(screen.getByText('Store')).toBeTruthy();
    expect(screen.getByText('Test Description')).toBeTruthy();
  });

  it('uses custom formatTime function when provided', () => {
    const customFormatTime = jest.fn().mockReturnValue('Custom Time');
    const transaction = createMockTransaction();
    render(
      <TransactionItem
        transaction={transaction}
        formatCurrency={mockFormatCurrency}
        formatTime={customFormatTime}
      />
    );

    expect(customFormatTime).toHaveBeenCalledWith(transaction.transactionDate);
    expect(screen.getByText('Custom Time')).toBeTruthy();
  });

  it('handles transfer_in type correctly', () => {
    const transaction = createMockTransaction({ type: 'transfer_in', amount: 200000 });
    render(<TransactionItem transaction={transaction} formatCurrency={mockFormatCurrency} />);

    expect(screen.getByText('+$200.000')).toBeTruthy();
  });

  it('handles transfer_out type correctly', () => {
    const transaction = createMockTransaction({ type: 'transfer_out', amount: 200000 });
    render(<TransactionItem transaction={transaction} formatCurrency={mockFormatCurrency} />);

    expect(screen.getByText('-$200.000')).toBeTruthy();
  });
});
