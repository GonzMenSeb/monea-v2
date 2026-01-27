import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { PasswordPrompt } from '../PasswordPrompt';

import type { PasswordPromptProps } from '../PasswordPrompt';

const createDefaultProps = (overrides: Partial<PasswordPromptProps> = {}): PasswordPromptProps => ({
  visible: true,
  fileName: 'statement-2024-01.pdf',
  onSubmit: jest.fn(),
  onCancel: jest.fn(),
  loading: false,
  errorMessage: undefined,
  ...overrides,
});

describe('PasswordPrompt', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders when visible', () => {
      render(<PasswordPrompt {...createDefaultProps()} />);
      expect(screen.getByText('Password Required')).toBeTruthy();
    });

    it('does not render content when not visible', () => {
      render(<PasswordPrompt {...createDefaultProps({ visible: false })} />);
      expect(screen.queryByText('Password Required')).toBeNull();
    });

    it('displays the header text', () => {
      render(<PasswordPrompt {...createDefaultProps()} />);
      expect(screen.getByText('Password Required')).toBeTruthy();
      expect(
        screen.getByText('This PDF is password-protected. Enter the password to continue.')
      ).toBeTruthy();
    });

    it('displays the file name when provided', () => {
      render(<PasswordPrompt {...createDefaultProps({ fileName: 'test-file.pdf' })} />);
      expect(screen.getByText(/test-file\.pdf/)).toBeTruthy();
    });

    it('does not display file name badge when not provided', () => {
      render(<PasswordPrompt {...createDefaultProps({ fileName: undefined })} />);
      expect(screen.queryByText(/📄/)).toBeNull();
    });

    it('displays the lock icon', () => {
      render(<PasswordPrompt {...createDefaultProps()} />);
      expect(screen.getByText('🔒')).toBeTruthy();
    });

    it('displays password input field', () => {
      render(<PasswordPrompt {...createDefaultProps()} />);
      expect(screen.getByText('PDF Password')).toBeTruthy();
      expect(screen.getByPlaceholderText('Enter password')).toBeTruthy();
    });

    it('displays cancel and unlock buttons', () => {
      render(<PasswordPrompt {...createDefaultProps()} />);
      expect(screen.getByTestId('password-cancel-button')).toBeTruthy();
      expect(screen.getByTestId('password-submit-button')).toBeTruthy();
    });
  });

  describe('Error State', () => {
    it('displays error message when provided', () => {
      render(<PasswordPrompt {...createDefaultProps({ errorMessage: 'Invalid password' })} />);
      expect(screen.getByText('Invalid password')).toBeTruthy();
    });

    it('does not display error message when not provided', () => {
      render(<PasswordPrompt {...createDefaultProps({ errorMessage: undefined })} />);
      expect(screen.queryByText('Invalid password')).toBeNull();
    });
  });

  describe('Loading State', () => {
    it('shows loading state on submit button when loading', () => {
      render(<PasswordPrompt {...createDefaultProps({ loading: true })} />);
      const submitButton = screen.getByTestId('password-submit-button');
      expect(submitButton).toBeTruthy();
    });

    it('disables cancel button when loading', () => {
      const onCancel = jest.fn();
      render(<PasswordPrompt {...createDefaultProps({ loading: true, onCancel })} />);
      const cancelButton = screen.getByTestId('password-cancel-button');
      fireEvent.press(cancelButton);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('disables input when loading', () => {
      render(<PasswordPrompt {...createDefaultProps({ loading: true })} />);
      const input = screen.getByPlaceholderText('Enter password');
      expect(input.props.editable).toBe(false);
    });
  });

  describe('User Interactions', () => {
    it('calls onCancel when cancel button is pressed', () => {
      const onCancel = jest.fn();
      render(<PasswordPrompt {...createDefaultProps({ onCancel })} />);
      fireEvent.press(screen.getByTestId('password-cancel-button'));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('handles modal onRequestClose', () => {
      const onCancel = jest.fn();
      render(<PasswordPrompt {...createDefaultProps({ onCancel })} />);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('calls onSubmit with password when unlock button is pressed', () => {
      const onSubmit = jest.fn();
      render(<PasswordPrompt {...createDefaultProps({ onSubmit })} />);

      const input = screen.getByPlaceholderText('Enter password');
      fireEvent.changeText(input, 'mypassword123');

      fireEvent.press(screen.getByTestId('password-submit-button'));
      expect(onSubmit).toHaveBeenCalledWith('mypassword123');
    });

    it('does not call onSubmit when password is empty', () => {
      const onSubmit = jest.fn();
      render(<PasswordPrompt {...createDefaultProps({ onSubmit })} />);

      fireEvent.press(screen.getByTestId('password-submit-button'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('does not call onSubmit when password is only whitespace', () => {
      const onSubmit = jest.fn();
      render(<PasswordPrompt {...createDefaultProps({ onSubmit })} />);

      const input = screen.getByPlaceholderText('Enter password');
      fireEvent.changeText(input, '   ');

      fireEvent.press(screen.getByTestId('password-submit-button'));
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('calls onSubmit when submit editing on input', () => {
      const onSubmit = jest.fn();
      render(<PasswordPrompt {...createDefaultProps({ onSubmit })} />);

      const input = screen.getByPlaceholderText('Enter password');
      fireEvent.changeText(input, 'mypassword');
      fireEvent(input, 'submitEditing');

      expect(onSubmit).toHaveBeenCalledWith('mypassword');
    });

    it('updates password value on text change', () => {
      render(<PasswordPrompt {...createDefaultProps()} />);

      const input = screen.getByPlaceholderText('Enter password');
      fireEvent.changeText(input, 'testpassword');

      expect(input.props.value).toBe('testpassword');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('hides password by default', () => {
      render(<PasswordPrompt {...createDefaultProps()} />);
      const input = screen.getByPlaceholderText('Enter password');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('shows eye icon for hidden password', () => {
      render(<PasswordPrompt {...createDefaultProps()} />);
      expect(screen.getByText('👁️')).toBeTruthy();
    });

    it('toggles password visibility when eye icon is pressed', async () => {
      render(<PasswordPrompt {...createDefaultProps()} />);

      const toggleButton = screen.getByLabelText('Show password');
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('🙈')).toBeTruthy();
      });

      const input = screen.getByPlaceholderText('Enter password');
      expect(input.props.secureTextEntry).toBe(false);
    });

    it('toggles back to hidden password', async () => {
      render(<PasswordPrompt {...createDefaultProps()} />);

      const showButton = screen.getByLabelText('Show password');
      fireEvent.press(showButton);

      await waitFor(() => {
        expect(screen.getByText('🙈')).toBeTruthy();
      });

      const hideButton = screen.getByLabelText('Hide password');
      fireEvent.press(hideButton);

      await waitFor(() => {
        expect(screen.getByText('👁️')).toBeTruthy();
      });

      const input = screen.getByPlaceholderText('Enter password');
      expect(input.props.secureTextEntry).toBe(true);
    });
  });

  describe('State Reset', () => {
    it('clears password when modal becomes visible', () => {
      const { rerender } = render(<PasswordPrompt {...createDefaultProps({ visible: false })} />);

      rerender(<PasswordPrompt {...createDefaultProps({ visible: true })} />);

      const input = screen.getByPlaceholderText('Enter password');
      expect(input.props.value).toBe('');
    });

    it('resets password visibility when modal becomes visible', async () => {
      const { rerender } = render(<PasswordPrompt {...createDefaultProps({ visible: true })} />);

      const toggleButton = screen.getByLabelText('Show password');
      fireEvent.press(toggleButton);

      await waitFor(() => {
        expect(screen.getByText('🙈')).toBeTruthy();
      });

      rerender(<PasswordPrompt {...createDefaultProps({ visible: false })} />);
      rerender(<PasswordPrompt {...createDefaultProps({ visible: true })} />);

      await waitFor(() => {
        expect(screen.getByText('👁️')).toBeTruthy();
      });
    });
  });

  describe('Accessibility', () => {
    it('has alert accessibility role', () => {
      render(<PasswordPrompt {...createDefaultProps()} />);
      const dialog = screen.getByLabelText('Password required for PDF');
      expect(dialog.props.accessibilityRole).toBe('alert');
    });

    it('has correct accessibility labels on buttons', () => {
      render(<PasswordPrompt {...createDefaultProps()} />);
      expect(screen.getByTestId('password-cancel-button')).toBeTruthy();
      expect(screen.getByTestId('password-submit-button')).toBeTruthy();
    });

    it('has show password accessibility label', () => {
      render(<PasswordPrompt {...createDefaultProps()} />);
      expect(screen.getByLabelText('Show password')).toBeTruthy();
    });
  });

  describe('Input Configuration', () => {
    it('has correct input attributes', () => {
      render(<PasswordPrompt {...createDefaultProps()} />);
      const input = screen.getByPlaceholderText('Enter password');

      expect(input.props.autoCapitalize).toBe('none');
      expect(input.props.autoCorrect).toBe(false);
      expect(input.props.autoComplete).toBe('password');
      expect(input.props.returnKeyType).toBe('done');
    });
  });

  describe('Edge Cases', () => {
    it('handles very long file names', () => {
      const longFileName =
        'very-long-file-name-that-exceeds-normal-display-width-bancolombia-statement-2024-01.pdf';
      render(<PasswordPrompt {...createDefaultProps({ fileName: longFileName })} />);
      expect(screen.getByText(new RegExp(longFileName.slice(0, 20)))).toBeTruthy();
    });

    it('handles empty file name', () => {
      render(<PasswordPrompt {...createDefaultProps({ fileName: '' })} />);
      expect(screen.queryByText(/📄/)).toBeNull();
    });

    it('handles long error messages', () => {
      const longError =
        'The password you entered is incorrect. Please verify that Caps Lock is off and try again.';
      render(<PasswordPrompt {...createDefaultProps({ errorMessage: longError })} />);
      expect(screen.getByText(longError)).toBeTruthy();
    });

    it('handles special characters in password', () => {
      const onSubmit = jest.fn();
      render(<PasswordPrompt {...createDefaultProps({ onSubmit })} />);

      const input = screen.getByPlaceholderText('Enter password');
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      fireEvent.changeText(input, specialPassword);

      fireEvent.press(screen.getByTestId('password-submit-button'));
      expect(onSubmit).toHaveBeenCalledWith(specialPassword);
    });

    it('handles unicode characters in password', () => {
      const onSubmit = jest.fn();
      render(<PasswordPrompt {...createDefaultProps({ onSubmit })} />);

      const input = screen.getByPlaceholderText('Enter password');
      const unicodePassword = 'contraseña123áéíóú';
      fireEvent.changeText(input, unicodePassword);

      fireEvent.press(screen.getByTestId('password-submit-button'));
      expect(onSubmit).toHaveBeenCalledWith(unicodePassword);
    });
  });
});
