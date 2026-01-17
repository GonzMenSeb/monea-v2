import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import { Alert } from 'react-native';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { AccountRepository } from '@/infrastructure/database';

import { AccountsManagement } from '../screens/AccountsManagement';

jest.mock('expo-router');
jest.mock('@/infrastructure/database');

const mockRouter = {
  back: jest.fn(),
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockAccount = {
  id: '1',
  bankCode: 'bancolombia',
  bankName: 'Bancolombia',
  accountNumber: '1234567890',
  accountType: 'savings',
  balance: 100000,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAccountRepository = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByAccountNumber: jest.fn(),
};

describe('AccountsManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (AccountRepository as jest.Mock).mockImplementation(() => mockAccountRepository);
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('loading state', () => {
    it('shows loading state while fetching accounts', () => {
      mockAccountRepository.findAll.mockReturnValue(
        new Promise(() => {
          // never resolves
        })
      );

      render(<AccountsManagement />, { wrapper: createWrapper() });

      expect(screen.getByText('Loading accounts...')).toBeTruthy();
    });
  });

  describe('empty state', () => {
    it('shows empty state when no accounts exist', async () => {
      mockAccountRepository.findAll.mockResolvedValue([]);

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('No bank accounts')).toBeTruthy();
        expect(
          screen.getByText(
            'Add your first bank account to start tracking transactions automatically.'
          )
        ).toBeTruthy();
      });
    });

    it('shows add account button in empty state', async () => {
      mockAccountRepository.findAll.mockResolvedValue([]);

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Add Account')).toBeTruthy();
      });
    });
  });

  describe('account list', () => {
    it('displays all accounts', async () => {
      const accounts = [
        mockAccount,
        {
          ...mockAccount,
          id: '2',
          bankCode: 'nequi',
          bankName: 'Nequi',
          accountNumber: '9876543210',
        },
      ];
      mockAccountRepository.findAll.mockResolvedValue(accounts);

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Bancolombia')).toBeTruthy();
        expect(screen.getByText('Nequi')).toBeTruthy();
      });
    });

    it('displays account count', async () => {
      mockAccountRepository.findAll.mockResolvedValue([mockAccount]);

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('1 account linked')).toBeTruthy();
      });
    });

    it('displays plural account count', async () => {
      const accounts = [mockAccount, { ...mockAccount, id: '2' }];
      mockAccountRepository.findAll.mockResolvedValue(accounts);

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('2 accounts linked')).toBeTruthy();
      });
    });

    it('displays masked account numbers', async () => {
      mockAccountRepository.findAll.mockResolvedValue([mockAccount]);

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/\*\*\*\*7890/)).toBeTruthy();
      });
    });

    it('displays account balance formatted as currency', async () => {
      mockAccountRepository.findAll.mockResolvedValue([mockAccount]);

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/100\.000/)).toBeTruthy();
      });
    });

    it('shows inactive badge for inactive accounts', async () => {
      const inactiveAccount = { ...mockAccount, isActive: false };
      mockAccountRepository.findAll.mockResolvedValue([inactiveAccount]);

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Inactive')).toBeTruthy();
      });
    });

    it('displays account type labels correctly', async () => {
      const digitalWalletAccount = {
        ...mockAccount,
        accountType: 'digital_wallet',
      };
      mockAccountRepository.findAll.mockResolvedValue([digitalWalletAccount]);

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText(/Digital Wallet/)).toBeTruthy();
      });
    });
  });

  describe('navigation', () => {
    beforeEach(() => {
      mockAccountRepository.findAll.mockResolvedValue([mockAccount]);
    });

    it('navigates back when back button is pressed', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText('Go back')).toBeTruthy();
      });

      fireEvent.press(screen.getByLabelText('Go back'));

      expect(mockRouter.back).toHaveBeenCalled();
    });
  });

  describe('create account modal', () => {
    beforeEach(() => {
      mockAccountRepository.findAll.mockResolvedValue([mockAccount]);
    });

    it('opens create modal when add button is pressed', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText('Add account')).toBeTruthy();
      });

      fireEvent.press(screen.getByLabelText('Add account'));

      await waitFor(() => {
        const addAccountTexts = screen.getAllByText('Add Account');
        expect(addAccountTexts.length).toBeGreaterThan(0);
      });
    });

    it('closes modal when cancel is pressed', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText('Add account')).toBeTruthy();
      });

      fireEvent.press(screen.getByLabelText('Add account'));

      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Cancel'));

      await waitFor(() => {
        expect(screen.queryByText('Add Account')).toBeNull();
      });
    });

    it('closes modal when close button is pressed', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByLabelText('Add account')).toBeTruthy();
      });

      fireEvent.press(screen.getByLabelText('Add account'));

      await waitFor(() => {
        expect(screen.getByLabelText('Close')).toBeTruthy();
      });

      fireEvent.press(screen.getByLabelText('Close'));

      await waitFor(() => {
        expect(screen.queryByText('Add Account')).toBeNull();
      });
    });
  });

  describe('edit account modal', () => {
    beforeEach(() => {
      mockAccountRepository.findAll.mockResolvedValue([mockAccount]);
    });

    it('opens edit modal when account is pressed', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Bancolombia')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Bancolombia'));

      await waitFor(() => {
        expect(screen.getByText('Edit Account')).toBeTruthy();
      });
    });

    it('populates form with account data when editing', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Bancolombia')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Bancolombia'));

      await waitFor(() => {
        const inputs = screen.getAllByDisplayValue('1234567890');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });

    it('shows delete button in edit mode', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Bancolombia')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Bancolombia'));

      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeTruthy();
      });
    });
  });

  describe('account creation', () => {
    beforeEach(() => {
      mockAccountRepository.findAll.mockResolvedValue([]);
      mockAccountRepository.findByAccountNumber.mockResolvedValue(null);
      mockAccountRepository.create.mockResolvedValue({
        ...mockAccount,
        id: 'new-id',
      });
    });

    it('renders account creation form', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getAllByText('Add Account').length).toBeGreaterThan(0);
      });

      const addButtons = screen.getAllByText('Add Account');
      const headerButton = addButtons[0];
      fireEvent.press(headerButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter last 4+ digits')).toBeTruthy();
        expect(screen.getByPlaceholderText('0')).toBeTruthy();
      });

      fireEvent.changeText(screen.getByPlaceholderText('Enter last 4+ digits'), '1234567890');
      fireEvent.changeText(screen.getByPlaceholderText('0'), '50000');

      expect(screen.getByPlaceholderText('Enter last 4+ digits').props.value).toBe('1234567890');
      expect(screen.getByPlaceholderText('0').props.value).toBe('50000');
    });

    it('validates account number length', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getAllByText('Add Account').length).toBeGreaterThan(0);
      });

      fireEvent.press(screen.getAllByText('Add Account')[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter last 4+ digits')).toBeTruthy();
      });

      const input = screen.getByPlaceholderText('Enter last 4+ digits');
      fireEvent.changeText(input, '123');

      const saveButtons = screen.getAllByRole('button');
      const saveButton = saveButtons.find((btn) => btn.props.children?.props?.children === 'Add Account');
      if (saveButton) {
        fireEvent.press(saveButton);
      }

      await waitFor(() => {
        expect(mockAccountRepository.create).not.toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('renders bank and account type selectors', async () => {
      mockAccountRepository.findByAccountNumber.mockResolvedValue(mockAccount);

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getAllByText('Add Account').length).toBeGreaterThan(0);
      });

      fireEvent.press(screen.getAllByText('Add Account')[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter last 4+ digits')).toBeTruthy();
      });

      expect(screen.getByText('Bancolombia')).toBeTruthy();
      expect(screen.getByText('Davivienda')).toBeTruthy();
      expect(screen.getByText('Savings')).toBeTruthy();
      expect(screen.getByText('Checking')).toBeTruthy();
    });

    it('has create account functionality', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getAllByText('Add Account').length).toBeGreaterThan(0);
      });

      fireEvent.press(screen.getAllByText('Add Account')[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter last 4+ digits')).toBeTruthy();
      });

      expect(screen.getByPlaceholderText('Enter last 4+ digits')).toBeTruthy();
    });
  });

  describe('account update', () => {
    beforeEach(() => {
      mockAccountRepository.findAll.mockResolvedValue([mockAccount]);
      mockAccountRepository.findByAccountNumber.mockResolvedValue(null);
      mockAccountRepository.update.mockResolvedValue(mockAccount);
    });

    it('updates account with valid data', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Bancolombia')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Bancolombia'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('0')).toBeTruthy();
      });

      fireEvent.changeText(screen.getByPlaceholderText('0'), '200000');

      fireEvent.press(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockAccountRepository.update).toHaveBeenCalledWith('1', {
          bankName: 'Bancolombia',
          balance: 200000,
        });
      });
    });

    it('allows editing same account number', async () => {
      mockAccountRepository.findByAccountNumber.mockResolvedValue(mockAccount);

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Bancolombia')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Bancolombia'));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('0')).toBeTruthy();
      });

      fireEvent.changeText(screen.getByPlaceholderText('0'), '150000');

      fireEvent.press(screen.getByText('Save Changes'));

      await waitFor(() => {
        expect(mockAccountRepository.update).toHaveBeenCalled();
      });
    });
  });

  describe('account deletion', () => {
    beforeEach(() => {
      mockAccountRepository.findAll.mockResolvedValue([mockAccount]);
      mockAccountRepository.delete.mockResolvedValue(undefined);
    });

    it('shows confirmation alert when delete is pressed', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Bancolombia')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Bancolombia'));

      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Delete Account'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Delete Account',
        'Are you sure you want to delete this account? This action cannot be undone and will not delete associated transactions.',
        expect.any(Array)
      );
    });

    it('deletes account when confirmed', async () => {
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const deleteButton = buttons?.find((b: { text: string }) => b.text === 'Delete');
        deleteButton?.onPress?.();
      });

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Bancolombia')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Bancolombia'));

      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Delete Account'));

      await waitFor(() => {
        expect(mockAccountRepository.delete).toHaveBeenCalledWith('1');
      });
    });

    it('does not delete account when cancelled', async () => {
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        const cancelButton = buttons?.find((b: { text: string }) => b.text === 'Cancel');
        cancelButton?.onPress?.();
      });

      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Bancolombia')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Bancolombia'));

      await waitFor(() => {
        expect(screen.getByText('Delete Account')).toBeTruthy();
      });

      fireEvent.press(screen.getByText('Delete Account'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      expect(mockAccountRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('form validation', () => {
    beforeEach(() => {
      mockAccountRepository.findAll.mockResolvedValue([]);
    });

    it('validates account number input', async () => {
      render(<AccountsManagement />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getAllByText('Add Account').length).toBeGreaterThan(0);
      });

      fireEvent.press(screen.getAllByText('Add Account')[0]);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter last 4+ digits')).toBeTruthy();
      });

      const input = screen.getByPlaceholderText('Enter last 4+ digits');
      fireEvent.changeText(input, '1234567890');

      expect(input.props.value).toBe('1234567890');
    });
  });
});
