import { fireEvent, render, screen } from '@testing-library/react-native';

import { AccountsOverview } from '../components/AccountsOverview';

import type Account from '@/infrastructure/database/models/Account';

const createMockAccount = (overrides: Partial<Account> = {}): Account =>
  ({
    id: 'acc-1',
    bankCode: 'bancolombia',
    bankName: 'Bancolombia',
    accountNumber: '12345678901234',
    accountType: 'savings',
    balance: 1500000,
    isActive: true,
    lastSyncedAt: undefined,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  }) as unknown as Account;

const mockAccounts = [
  createMockAccount({ id: 'acc-1', bankName: 'Bancolombia', balance: 1500000 }),
  createMockAccount({
    id: 'acc-2',
    bankCode: 'davivienda',
    bankName: 'Davivienda',
    balance: 2500000,
  }),
  createMockAccount({
    id: 'acc-3',
    bankCode: 'nequi',
    bankName: 'Nequi',
    balance: 350000,
  }),
];

const mockFormatCurrency = (amount: number): string => `$${amount.toLocaleString()}`;

describe('AccountsOverview', () => {
  describe('Loading State', () => {
    it('shows loading indicator when loading with no accounts', () => {
      render(
        <AccountsOverview accounts={[]} isLoading={true} formatCurrency={mockFormatCurrency} />
      );
      expect(screen.getByText('Loading accounts...')).toBeTruthy();
    });

    it('renders header while loading', () => {
      render(
        <AccountsOverview accounts={[]} isLoading={true} formatCurrency={mockFormatCurrency} />
      );
      expect(screen.getByText('Your Accounts')).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('shows error message when there is an error', () => {
      render(
        <AccountsOverview
          accounts={[]}
          error={new Error('Network error')}
          formatCurrency={mockFormatCurrency}
        />
      );
      expect(screen.getByText('Unable to load accounts')).toBeTruthy();
    });

    it('renders header even with error', () => {
      render(
        <AccountsOverview
          accounts={[]}
          error={new Error('Network error')}
          formatCurrency={mockFormatCurrency}
        />
      );
      expect(screen.getByText('Your Accounts')).toBeTruthy();
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no accounts', () => {
      render(<AccountsOverview accounts={[]} formatCurrency={mockFormatCurrency} />);
      expect(
        screen.getByText('No accounts linked yet. Link your bank accounts to start tracking.')
      ).toBeTruthy();
    });

    it('shows add account card in empty state when onAddAccountPress provided', () => {
      render(
        <AccountsOverview
          accounts={[]}
          formatCurrency={mockFormatCurrency}
          onAddAccountPress={() => {}}
        />
      );
      expect(screen.getByText('Add Account')).toBeTruthy();
    });
  });

  describe('With Accounts', () => {
    it('renders account bank names', () => {
      render(<AccountsOverview accounts={mockAccounts} formatCurrency={mockFormatCurrency} />);
      expect(screen.getByText('Bancolombia')).toBeTruthy();
      expect(screen.getByText('Davivienda')).toBeTruthy();
      expect(screen.getByText('Nequi')).toBeTruthy();
    });

    it('renders formatted balances', () => {
      render(<AccountsOverview accounts={mockAccounts} formatCurrency={mockFormatCurrency} />);
      expect(screen.getByText('$1,500,000')).toBeTruthy();
      expect(screen.getByText('$2,500,000')).toBeTruthy();
      expect(screen.getByText('$350,000')).toBeTruthy();
    });

    it('calls onAccountPress when account is pressed', () => {
      const onAccountPress = jest.fn();
      render(
        <AccountsOverview
          accounts={mockAccounts}
          formatCurrency={mockFormatCurrency}
          onAccountPress={onAccountPress}
        />
      );
      fireEvent.press(screen.getByText('Bancolombia'));
      expect(onAccountPress).toHaveBeenCalledWith('acc-1');
    });

    it('shows See All when there are more accounts than maxItems', () => {
      render(
        <AccountsOverview
          accounts={mockAccounts}
          formatCurrency={mockFormatCurrency}
          maxItems={2}
        />
      );
      expect(screen.getByText('See All')).toBeTruthy();
    });

    it('hides See All when accounts fit within maxItems', () => {
      render(
        <AccountsOverview
          accounts={mockAccounts}
          formatCurrency={mockFormatCurrency}
          maxItems={5}
        />
      );
      expect(screen.queryByText('See All')).toBeNull();
    });

    it('shows See All when onSeeAllPress is provided even without overflow', () => {
      render(
        <AccountsOverview
          accounts={mockAccounts}
          formatCurrency={mockFormatCurrency}
          maxItems={10}
          onSeeAllPress={() => {}}
        />
      );
      expect(screen.getByText('See All')).toBeTruthy();
    });

    it('calls onSeeAllPress when See All is pressed', () => {
      const onSeeAllPress = jest.fn();
      render(
        <AccountsOverview
          accounts={mockAccounts}
          formatCurrency={mockFormatCurrency}
          maxItems={2}
          onSeeAllPress={onSeeAllPress}
        />
      );
      fireEvent.press(screen.getByText('See All'));
      expect(onSeeAllPress).toHaveBeenCalledTimes(1);
    });

    it('limits displayed accounts to maxItems', () => {
      const manyAccounts = Array.from({ length: 10 }, (_, i) =>
        createMockAccount({
          id: `acc-${i}`,
          bankName: `Bank ${i}`,
        })
      );
      render(
        <AccountsOverview
          accounts={manyAccounts}
          formatCurrency={mockFormatCurrency}
          maxItems={3}
        />
      );
      expect(screen.getByText('Bank 0')).toBeTruthy();
      expect(screen.getByText('Bank 1')).toBeTruthy();
      expect(screen.getByText('Bank 2')).toBeTruthy();
      expect(screen.queryByText('Bank 3')).toBeNull();
    });
  });

  describe('Add Account Card', () => {
    it('renders add account card when onAddAccountPress is provided', () => {
      render(
        <AccountsOverview
          accounts={mockAccounts}
          formatCurrency={mockFormatCurrency}
          onAddAccountPress={() => {}}
        />
      );
      expect(screen.getByText('Add Account')).toBeTruthy();
    });

    it('does not render add account card when onAddAccountPress is not provided', () => {
      render(<AccountsOverview accounts={mockAccounts} formatCurrency={mockFormatCurrency} />);
      expect(screen.queryByText('Add Account')).toBeNull();
    });

    it('calls onAddAccountPress when add card is pressed', () => {
      const onAddAccountPress = jest.fn();
      render(
        <AccountsOverview
          accounts={mockAccounts}
          formatCurrency={mockFormatCurrency}
          onAddAccountPress={onAddAccountPress}
        />
      );
      fireEvent.press(screen.getByText('Add Account'));
      expect(onAddAccountPress).toHaveBeenCalledTimes(1);
    });

    it('has proper accessibility label for add account card', () => {
      render(
        <AccountsOverview
          accounts={mockAccounts}
          formatCurrency={mockFormatCurrency}
          onAddAccountPress={() => {}}
        />
      );
      expect(screen.getByLabelText('Add a new bank account')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility label for See All button', () => {
      render(
        <AccountsOverview
          accounts={mockAccounts}
          formatCurrency={mockFormatCurrency}
          maxItems={2}
        />
      );
      expect(screen.getByLabelText('See all accounts')).toBeTruthy();
    });
  });

  describe('Inactive Accounts', () => {
    it('shows inactive badge for inactive accounts', () => {
      const inactiveAccount = createMockAccount({ id: 'acc-inactive', isActive: false });
      render(<AccountsOverview accounts={[inactiveAccount]} formatCurrency={mockFormatCurrency} />);
      expect(screen.getByText('Inactive')).toBeTruthy();
    });

    it('marks inactive accounts as disabled', () => {
      const onAccountPress = jest.fn();
      const inactiveAccount = createMockAccount({
        id: 'acc-inactive',
        isActive: false,
        bankName: 'Test Bank',
      });
      render(
        <AccountsOverview
          accounts={[inactiveAccount]}
          formatCurrency={mockFormatCurrency}
          onAccountPress={onAccountPress}
        />
      );
      const card = screen.getByLabelText('Test Bank account ending in 1234');
      expect(card.props.accessibilityState.disabled).toBe(true);
    });
  });
});
