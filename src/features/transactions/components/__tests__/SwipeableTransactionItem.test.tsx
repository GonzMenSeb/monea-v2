import { render, screen, fireEvent } from '@testing-library/react-native';

import { SwipeableTransactionItem } from '../SwipeableTransactionItem';

import type Transaction from '@/infrastructure/database/models/Transaction';

const mockTransaction = {
  id: 'txn-123',
  type: 'expense',
  amount: 50000,
  merchant: 'Exito',
  description: 'Grocery shopping',
  transactionDate: new Date('2024-01-15T10:30:00'),
  accountId: 'acc-1',
  smsId: 'sms-1',
} as unknown as Transaction;

const mockFormatCurrency = (amount: number): string => `$${amount.toLocaleString('es-CO')}`;

describe('SwipeableTransactionItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders transaction item', () => {
      render(
        <SwipeableTransactionItem
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
        />
      );

      expect(screen.getByText('Exito')).toBeTruthy();
    });

    it('renders without swipe when enableSwipe is false', () => {
      render(
        <SwipeableTransactionItem
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          enableSwipe={false}
        />
      );

      expect(screen.getByText('Exito')).toBeTruthy();
    });

    it('renders without swipe when no actions provided', () => {
      render(
        <SwipeableTransactionItem
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          enableSwipe={true}
        />
      );

      expect(screen.getByText('Exito')).toBeTruthy();
    });
  });

  describe('delete action', () => {
    it('renders delete action when onDelete is provided', () => {
      const onDelete = jest.fn();
      render(
        <SwipeableTransactionItem
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          onDelete={onDelete}
        />
      );

      expect(screen.getByLabelText('Delete')).toBeTruthy();
    });

    it('calls onDelete when delete action is pressed', () => {
      const onDelete = jest.fn();
      render(
        <SwipeableTransactionItem
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          onDelete={onDelete}
        />
      );

      fireEvent.press(screen.getByLabelText('Delete'));

      expect(onDelete).toHaveBeenCalledWith('txn-123');
    });
  });

  describe('categorize action', () => {
    it('renders categorize action when onCategorize is provided', () => {
      const onCategorize = jest.fn();
      render(
        <SwipeableTransactionItem
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          onCategorize={onCategorize}
        />
      );

      expect(screen.getByLabelText('Category')).toBeTruthy();
    });

    it('calls onCategorize when categorize action is pressed', () => {
      const onCategorize = jest.fn();
      render(
        <SwipeableTransactionItem
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          onCategorize={onCategorize}
        />
      );

      fireEvent.press(screen.getByLabelText('Category'));

      expect(onCategorize).toHaveBeenCalledWith('txn-123');
    });
  });

  describe('both actions', () => {
    it('renders both actions when both handlers are provided', () => {
      const onDelete = jest.fn();
      const onCategorize = jest.fn();
      render(
        <SwipeableTransactionItem
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          onDelete={onDelete}
          onCategorize={onCategorize}
        />
      );

      expect(screen.getByLabelText('Delete')).toBeTruthy();
      expect(screen.getByLabelText('Category')).toBeTruthy();
    });
  });

  describe('press handler', () => {
    it('passes onPress to TransactionItem', () => {
      const onPress = jest.fn();
      render(
        <SwipeableTransactionItem
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          onPress={onPress}
        />
      );

      expect(screen.getByText('Exito')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('delete button has proper accessibility label', () => {
      const onDelete = jest.fn();
      render(
        <SwipeableTransactionItem
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          onDelete={onDelete}
        />
      );

      const deleteButton = screen.getByLabelText('Delete');
      expect(deleteButton.props.accessibilityRole).toBe('button');
    });

    it('categorize button has proper accessibility label', () => {
      const onCategorize = jest.fn();
      render(
        <SwipeableTransactionItem
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          onCategorize={onCategorize}
        />
      );

      const categoryButton = screen.getByLabelText('Category');
      expect(categoryButton.props.accessibilityRole).toBe('button');
    });
  });
});
