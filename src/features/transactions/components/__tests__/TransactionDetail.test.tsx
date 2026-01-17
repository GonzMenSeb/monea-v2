import { render, screen, fireEvent } from '@testing-library/react-native';

import { TransactionDetail } from '../TransactionDetail';

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

describe('TransactionDetail', () => {
  const defaultProps = {
    visible: true,
    onClose: jest.fn(),
    formatCurrency: mockFormatCurrency,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders null when transaction is null', () => {
    const { toJSON } = render(<TransactionDetail {...defaultProps} transaction={null} />);
    expect(toJSON()).toBeNull();
  });

  it('displays transaction amount with correct sign for expense', () => {
    const transaction = createMockTransaction({ type: 'expense', amount: 75000 });
    render(<TransactionDetail {...defaultProps} transaction={transaction} />);

    expect(screen.getByText('-$75.000')).toBeTruthy();
  });

  it('displays transaction amount with correct sign for income', () => {
    const transaction = createMockTransaction({ type: 'income', amount: 100000 });
    render(<TransactionDetail {...defaultProps} transaction={transaction} />);

    expect(screen.getByText('+$100.000')).toBeTruthy();
  });

  it('displays merchant name as title', () => {
    const transaction = createMockTransaction({ merchant: 'Test Store' });
    render(<TransactionDetail {...defaultProps} transaction={transaction} />);

    expect(screen.getByText('Test Store')).toBeTruthy();
  });

  it('displays transaction type label', () => {
    const transaction = createMockTransaction({ type: 'expense' });
    render(<TransactionDetail {...defaultProps} transaction={transaction} />);

    expect(screen.getByText('Expense')).toBeTruthy();
  });

  it('calls onClose when close button is pressed', () => {
    const onClose = jest.fn();
    const transaction = createMockTransaction();
    render(<TransactionDetail {...defaultProps} transaction={transaction} onClose={onClose} />);

    fireEvent.press(screen.getByText('Close'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('displays bank name when provided', () => {
    const transaction = createMockTransaction();
    render(
      <TransactionDetail {...defaultProps} transaction={transaction} bankName="Bancolombia" />
    );

    expect(screen.getByText('Bancolombia')).toBeTruthy();
  });

  it('displays masked account number when provided', () => {
    const transaction = createMockTransaction();
    render(
      <TransactionDetail {...defaultProps} transaction={transaction} accountNumber="1234567890" />
    );

    expect(screen.getByText('****7890')).toBeTruthy();
  });

  it('displays balance after when available', () => {
    const transaction = createMockTransaction({ balanceAfter: 500000 });
    render(<TransactionDetail {...defaultProps} transaction={transaction} />);

    expect(screen.getByText('$500.000')).toBeTruthy();
    expect(screen.getByText('Balance After')).toBeTruthy();
  });

  it('displays reference when available', () => {
    const transaction = createMockTransaction({ reference: 'REF-123456' });
    render(<TransactionDetail {...defaultProps} transaction={transaction} />);

    expect(screen.getByText('REF-123456')).toBeTruthy();
  });

  it('handles transfer_in type correctly', () => {
    const transaction = createMockTransaction({ type: 'transfer_in', amount: 200000 });
    render(<TransactionDetail {...defaultProps} transaction={transaction} />);

    expect(screen.getByText('+$200.000')).toBeTruthy();
    expect(screen.getByText('Transfer In')).toBeTruthy();
  });

  it('handles transfer_out type correctly', () => {
    const transaction = createMockTransaction({ type: 'transfer_out', amount: 200000 });
    render(<TransactionDetail {...defaultProps} transaction={transaction} />);

    expect(screen.getByText('-$200.000')).toBeTruthy();
    expect(screen.getByText('Transfer Out')).toBeTruthy();
  });

  it('displays description when both merchant and description exist', () => {
    const transaction = createMockTransaction({
      merchant: 'Store Name',
      description: 'Payment Description',
    });
    render(<TransactionDetail {...defaultProps} transaction={transaction} />);

    expect(screen.getByText('Store Name')).toBeTruthy();
    expect(screen.getByText('Payment Description')).toBeTruthy();
  });

  it('uses description as title when merchant is not available', () => {
    const transaction = createMockTransaction({
      merchant: undefined,
      description: 'Payment Description',
    });
    render(<TransactionDetail {...defaultProps} transaction={transaction} />);

    const descriptionElements = screen.queryAllByText('Payment Description');
    expect(descriptionElements.length).toBeGreaterThan(0);
  });

  it('has accessible close button', () => {
    const transaction = createMockTransaction();
    render(<TransactionDetail {...defaultProps} transaction={transaction} />);

    const closeButtons = screen.getAllByRole('button', { name: 'Close' });
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it('has accessible backdrop', () => {
    const transaction = createMockTransaction();
    render(<TransactionDetail {...defaultProps} transaction={transaction} />);

    expect(screen.getByRole('button', { name: 'Close transaction details' })).toBeTruthy();
  });
});
