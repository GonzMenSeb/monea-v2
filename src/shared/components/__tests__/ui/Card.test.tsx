import { Text } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { Card, TransactionCard, AccountCard } from '../../ui/Card';

describe('Card', () => {
  describe('Base Card', () => {
    it('renders children', () => {
      render(
        <Card>
          <Text>Card Content</Text>
        </Card>
      );
      expect(screen.getByText('Card Content')).toBeTruthy();
    });

    it('renders with elevated variant by default', () => {
      render(
        <Card>
          <Text>Elevated</Text>
        </Card>
      );
      expect(screen.getByText('Elevated')).toBeTruthy();
    });

    it('renders with transaction variant', () => {
      render(
        <Card variant="transaction">
          <Text>Transaction</Text>
        </Card>
      );
      expect(screen.getByText('Transaction')).toBeTruthy();
    });

    it('renders with account variant', () => {
      render(
        <Card variant="account">
          <Text>Account</Text>
        </Card>
      );
      expect(screen.getByText('Account')).toBeTruthy();
    });

    it('renders as non-pressable when no onPress is provided', () => {
      render(
        <Card>
          <Text>Static Card</Text>
        </Card>
      );
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('renders as pressable when onPress is provided', () => {
      render(
        <Card onPress={() => {}}>
          <Text>Pressable Card</Text>
        </Card>
      );
      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      render(
        <Card onPress={onPress}>
          <Text>Click Me</Text>
        </Card>
      );
      fireEvent.press(screen.getByRole('button'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when disabled', () => {
      const onPress = jest.fn();
      render(
        <Card onPress={onPress} disabled>
          <Text>Disabled Card</Text>
        </Card>
      );
      fireEvent.press(screen.getByRole('button'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('TransactionCard', () => {
    const mockTransaction = {
      id: 'tx-1',
      type: 'expense' as const,
      amount: 50000,
      merchant: 'Exito',
      description: 'Groceries',
      transactionDate: new Date('2024-01-15T10:30:00'),
      bankName: 'bancolombia',
    };

    const mockFormatCurrency = (amount: number): string => `$${amount.toLocaleString()}`;
    const mockFormatDate = (date: Date): string => date.toLocaleDateString();

    it('renders transaction with merchant name', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          formatDate={mockFormatDate}
        />
      );
      expect(screen.getByText('Exito')).toBeTruthy();
    });

    it('renders transaction amount with correct sign', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          formatDate={mockFormatDate}
        />
      );
      expect(screen.getByText('-$50,000')).toBeTruthy();
    });

    it('renders income transaction with positive sign', () => {
      const incomeTransaction = { ...mockTransaction, type: 'income' as const };
      render(
        <TransactionCard
          transaction={incomeTransaction}
          formatCurrency={mockFormatCurrency}
          formatDate={mockFormatDate}
        />
      );
      expect(screen.getByText('+$50,000')).toBeTruthy();
    });

    it('renders transfer_in with positive sign', () => {
      const transferTransaction = { ...mockTransaction, type: 'transfer_in' as const };
      render(
        <TransactionCard
          transaction={transferTransaction}
          formatCurrency={mockFormatCurrency}
          formatDate={mockFormatDate}
        />
      );
      expect(screen.getByText('+$50,000')).toBeTruthy();
    });

    it('renders transfer_out with negative sign', () => {
      const transferTransaction = { ...mockTransaction, type: 'transfer_out' as const };
      render(
        <TransactionCard
          transaction={transferTransaction}
          formatCurrency={mockFormatCurrency}
          formatDate={mockFormatDate}
        />
      );
      expect(screen.getByText('-$50,000')).toBeTruthy();
    });

    it('renders formatted date', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          formatDate={mockFormatDate}
        />
      );
      expect(screen.getByText('1/15/2024')).toBeTruthy();
    });

    it('shows description when both merchant and description exist', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          formatDate={mockFormatDate}
        />
      );
      expect(screen.getByText('Groceries')).toBeTruthy();
    });

    it('uses description as title when merchant is missing', () => {
      const noMerchant = { ...mockTransaction, merchant: undefined };
      render(
        <TransactionCard
          transaction={noMerchant}
          formatCurrency={mockFormatCurrency}
          formatDate={mockFormatDate}
        />
      );
      expect(screen.getByText('Groceries')).toBeTruthy();
    });

    it('uses transaction type label when no merchant or description', () => {
      const minimal = {
        ...mockTransaction,
        merchant: undefined,
        description: undefined,
      };
      render(
        <TransactionCard
          transaction={minimal}
          formatCurrency={mockFormatCurrency}
          formatDate={mockFormatDate}
        />
      );
      expect(screen.getByText('Expense')).toBeTruthy();
    });

    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      render(
        <TransactionCard
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          formatDate={mockFormatDate}
          onPress={onPress}
        />
      );
      fireEvent.press(screen.getByRole('button'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('renders as non-pressable when no onPress provided', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          formatDate={mockFormatDate}
        />
      );
      expect(screen.queryByRole('button')).toBeNull();
    });

    it('has proper accessibility label', () => {
      render(
        <TransactionCard
          transaction={mockTransaction}
          formatCurrency={mockFormatCurrency}
          formatDate={mockFormatDate}
          onPress={() => {}}
        />
      );
      const button = screen.getByRole('button');
      expect(button.props.accessibilityLabel).toBe('Exito, -$50,000');
    });
  });

  describe('AccountCard', () => {
    const mockAccount = {
      id: 'acc-1',
      bankCode: 'bancolombia',
      bankName: 'Bancolombia',
      accountNumber: '12345678901234',
      accountType: 'Savings',
      balance: 1500000,
      isActive: true,
    };

    const mockFormatCurrency = (amount: number): string => `$${amount.toLocaleString()}`;

    it('renders bank name', () => {
      const onSelect = jest.fn();
      render(
        <AccountCard
          account={mockAccount}
          formatCurrency={mockFormatCurrency}
          onSelect={onSelect}
        />
      );
      expect(screen.getByText('Bancolombia')).toBeTruthy();
    });

    it('renders masked account number', () => {
      const onSelect = jest.fn();
      render(
        <AccountCard
          account={mockAccount}
          formatCurrency={mockFormatCurrency}
          onSelect={onSelect}
        />
      );
      expect(screen.getByText(/\*\*\*\*1234/)).toBeTruthy();
    });

    it('renders account type', () => {
      const onSelect = jest.fn();
      render(
        <AccountCard
          account={mockAccount}
          formatCurrency={mockFormatCurrency}
          onSelect={onSelect}
        />
      );
      expect(screen.getByText(/Savings/)).toBeTruthy();
    });

    it('renders formatted balance', () => {
      const onSelect = jest.fn();
      render(
        <AccountCard
          account={mockAccount}
          formatCurrency={mockFormatCurrency}
          onSelect={onSelect}
        />
      );
      expect(screen.getByText('$1,500,000')).toBeTruthy();
    });

    it('calls onSelect with account id when pressed', () => {
      const onSelect = jest.fn();
      render(
        <AccountCard
          account={mockAccount}
          formatCurrency={mockFormatCurrency}
          onSelect={onSelect}
        />
      );
      fireEvent.press(screen.getByRole('button'));
      expect(onSelect).toHaveBeenCalledWith('acc-1');
    });

    it('shows inactive badge when account is inactive', () => {
      const inactiveAccount = { ...mockAccount, isActive: false };
      const onSelect = jest.fn();
      render(
        <AccountCard
          account={inactiveAccount}
          formatCurrency={mockFormatCurrency}
          onSelect={onSelect}
        />
      );
      expect(screen.getByText('Inactive')).toBeTruthy();
    });

    it('is disabled when account is inactive', () => {
      const inactiveAccount = { ...mockAccount, isActive: false };
      const onSelect = jest.fn();
      render(
        <AccountCard
          account={inactiveAccount}
          formatCurrency={mockFormatCurrency}
          onSelect={onSelect}
        />
      );
      const button = screen.getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
      fireEvent.press(button);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('is disabled when disabled prop is true', () => {
      const onSelect = jest.fn();
      render(
        <AccountCard
          account={mockAccount}
          formatCurrency={mockFormatCurrency}
          onSelect={onSelect}
          disabled
        />
      );
      const button = screen.getByRole('button');
      expect(button.props.accessibilityState.disabled).toBe(true);
      fireEvent.press(button);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('has proper accessibility label', () => {
      const onSelect = jest.fn();
      render(
        <AccountCard
          account={mockAccount}
          formatCurrency={mockFormatCurrency}
          onSelect={onSelect}
        />
      );
      const button = screen.getByRole('button');
      expect(button.props.accessibilityLabel).toBe('Bancolombia account ending in 1234');
    });

    it('masks short account numbers properly', () => {
      const shortAccount = { ...mockAccount, accountNumber: '123' };
      const onSelect = jest.fn();
      render(
        <AccountCard
          account={shortAccount}
          formatCurrency={mockFormatCurrency}
          onSelect={onSelect}
        />
      );
      expect(screen.getByText(/123/)).toBeTruthy();
    });
  });
});
