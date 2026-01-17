import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import {
  AccountForm,
  getInitialAccountFormData,
  validateAccountNumber,
  validateBalance,
  BANK_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
} from '../components/AccountForm';

import type { AccountFormData, AccountFormErrors } from '../components/AccountForm';

describe('validateAccountNumber', () => {
  it('returns error for empty value', () => {
    expect(validateAccountNumber('')).toBe('Account number is required');
    expect(validateAccountNumber('   ')).toBe('Account number is required');
  });

  it('returns error for values shorter than 4 digits', () => {
    expect(validateAccountNumber('123')).toBe('Account number must be at least 4 digits');
  });

  it('returns error for non-numeric values', () => {
    expect(validateAccountNumber('1234abc')).toBe('Account number must contain only digits');
  });

  it('returns undefined for valid account numbers', () => {
    expect(validateAccountNumber('1234')).toBeUndefined();
    expect(validateAccountNumber('12345678901234567890')).toBeUndefined();
  });
});

describe('validateBalance', () => {
  it('returns undefined for empty value', () => {
    expect(validateBalance('')).toBeUndefined();
  });

  it('returns error for non-numeric values', () => {
    expect(validateBalance('abc')).toBe('Balance must be a valid number');
    expect(validateBalance('123.45')).toBe('Balance must be a valid number');
  });

  it('returns undefined for valid numeric values', () => {
    expect(validateBalance('0')).toBeUndefined();
    expect(validateBalance('100000')).toBeUndefined();
  });
});

describe('getInitialAccountFormData', () => {
  it('returns correct initial form data', () => {
    const data = getInitialAccountFormData();

    expect(data.bankCode).toBe('bancolombia');
    expect(data.bankName).toBe('Bancolombia');
    expect(data.accountNumber).toBe('');
    expect(data.accountType).toBe('savings');
    expect(data.balance).toBe('');
  });
});

describe('AccountForm', () => {
  const mockProps = {
    formData: getInitialAccountFormData(),
    onFormChange: jest.fn(),
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all form sections', () => {
    render(<AccountForm {...mockProps} />);

    expect(screen.getByText('Bank')).toBeTruthy();
    expect(screen.getByText('Account Type')).toBeTruthy();
    expect(screen.getByText('Account Number')).toBeTruthy();
    expect(screen.getByText('Initial Balance (optional)')).toBeTruthy();
  });

  it('renders all bank options', () => {
    render(<AccountForm {...mockProps} />);

    for (const bank of BANK_OPTIONS) {
      expect(screen.getByText(bank.name)).toBeTruthy();
    }
  });

  it('renders all account type options', () => {
    render(<AccountForm {...mockProps} />);

    for (const option of ACCOUNT_TYPE_OPTIONS) {
      expect(screen.getByText(option.label)).toBeTruthy();
    }
  });

  it('calls onFormChange when selecting a bank', () => {
    render(<AccountForm {...mockProps} />);

    fireEvent.press(screen.getByText('Davivienda'));

    expect(mockProps.onFormChange).toHaveBeenCalledWith({
      bankCode: 'davivienda',
      bankName: 'Davivienda',
    });
  });

  it('calls onFormChange when selecting account type', () => {
    render(<AccountForm {...mockProps} />);

    fireEvent.press(screen.getByText('Checking'));

    expect(mockProps.onFormChange).toHaveBeenCalledWith({
      accountType: 'checking',
    });
  });

  it('calls onFormChange with sanitized account number', () => {
    render(<AccountForm {...mockProps} />);

    const accountNumberInput = screen.getByPlaceholderText('Enter last 4+ digits');
    fireEvent.changeText(accountNumberInput, '1234abc567');

    expect(mockProps.onFormChange).toHaveBeenCalledWith({
      accountNumber: '1234567',
    });
  });

  it('calls onFormChange with sanitized balance', () => {
    render(<AccountForm {...mockProps} />);

    const balanceInput = screen.getByPlaceholderText('0');
    fireEvent.changeText(balanceInput, '100000abc');

    expect(mockProps.onFormChange).toHaveBeenCalledWith({
      balance: '100000',
    });
  });

  it('calls onCancel when cancel button is pressed', () => {
    render(<AccountForm {...mockProps} />);

    fireEvent.press(screen.getByText('Cancel'));

    expect(mockProps.onCancel).toHaveBeenCalled();
  });

  it('disables submit when form is invalid', () => {
    render(<AccountForm {...mockProps} />);

    const submitButton = screen.getByText('Save');
    expect(submitButton).toBeDisabled();
  });

  it('enables submit when form is valid', () => {
    const validFormData: AccountFormData = {
      ...getInitialAccountFormData(),
      accountNumber: '1234567890',
    };

    render(<AccountForm {...mockProps} formData={validFormData} />);

    const submitButton = screen.getByText('Save');
    expect(submitButton).not.toBeDisabled();
  });

  it('calls onSubmit when submit button is pressed', () => {
    const validFormData: AccountFormData = {
      ...getInitialAccountFormData(),
      accountNumber: '1234567890',
    };

    render(<AccountForm {...mockProps} formData={validFormData} />);

    fireEvent.press(screen.getByText('Save'));

    expect(mockProps.onSubmit).toHaveBeenCalled();
  });

  it('renders custom submit label', () => {
    render(<AccountForm {...mockProps} submitLabel="Add Account" />);

    expect(screen.getByText('Add Account')).toBeTruthy();
  });

  it('shows delete button when onDelete is provided', () => {
    const onDelete = jest.fn();

    render(<AccountForm {...mockProps} onDelete={onDelete} />);

    expect(screen.getByText('Delete Account')).toBeTruthy();
  });

  it('does not show delete button when onDelete is not provided', () => {
    render(<AccountForm {...mockProps} />);

    expect(screen.queryByText('Delete Account')).toBeNull();
  });

  it('calls onDelete when delete button is pressed', () => {
    const onDelete = jest.fn();

    render(<AccountForm {...mockProps} onDelete={onDelete} />);

    fireEvent.press(screen.getByText('Delete Account'));

    expect(onDelete).toHaveBeenCalled();
  });

  it('disables buttons when isSubmitting is true', () => {
    const validFormData: AccountFormData = {
      ...getInitialAccountFormData(),
      accountNumber: '1234567890',
    };

    render(<AccountForm {...mockProps} formData={validFormData} isSubmitting onDelete={jest.fn()} />);

    expect(screen.getByText('Cancel')).toBeDisabled();
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('disables buttons when isDeleting is true', () => {
    const validFormData: AccountFormData = {
      ...getInitialAccountFormData(),
      accountNumber: '1234567890',
    };

    render(<AccountForm {...mockProps} formData={validFormData} isDeleting onDelete={jest.fn()} />);

    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Save')).toBeDisabled();
    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('displays external errors', () => {
    const errors: AccountFormErrors = {
      accountNumber: 'Account already exists',
    };

    render(<AccountForm {...mockProps} errors={errors} />);

    expect(screen.getByText('Account already exists')).toBeTruthy();
  });

  it('shows validation error after blur when field is touched', async () => {
    render(<AccountForm {...mockProps} />);

    const accountNumberInput = screen.getByPlaceholderText('Enter last 4+ digits');
    fireEvent(accountNumberInput, 'blur');

    await waitFor(() => {
      expect(screen.getByText('Account number is required')).toBeTruthy();
    });
  });
});
