import { View } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { Input } from '../../ui/Input';

describe('Input', () => {
  describe('Rendering', () => {
    it('renders with placeholder', () => {
      render(<Input placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('renders with label', () => {
      render(<Input label="Username" placeholder="Enter username" />);
      expect(screen.getByText('Username')).toBeTruthy();
    });

    it('renders with hint message', () => {
      render(<Input hint="Must be at least 8 characters" />);
      expect(screen.getByText('Must be at least 8 characters')).toBeTruthy();
    });

    it('renders with error message', () => {
      render(<Input errorMessage="This field is required" />);
      expect(screen.getByText('This field is required')).toBeTruthy();
    });

    it('renders with success message', () => {
      render(<Input successMessage="Looks good!" />);
      expect(screen.getByText('Looks good!')).toBeTruthy();
    });

    it('renders with left icon', () => {
      const icon = <View testID="left-icon" />;
      render(<Input leftIcon={icon} />);
      expect(screen.getByTestId('left-icon')).toBeTruthy();
    });

    it('renders with right icon', () => {
      const icon = <View testID="right-icon" />;
      render(<Input rightIcon={icon} />);
      expect(screen.getByTestId('right-icon')).toBeTruthy();
    });

    it('renders with both left and right icons', () => {
      const leftIcon = <View testID="left-icon" />;
      const rightIcon = <View testID="right-icon" />;
      render(<Input leftIcon={leftIcon} rightIcon={rightIcon} />);
      expect(screen.getByTestId('left-icon')).toBeTruthy();
      expect(screen.getByTestId('right-icon')).toBeTruthy();
    });
  });

  describe('Sizes', () => {
    it('renders with small size', () => {
      render(<Input size="sm" placeholder="Small input" />);
      expect(screen.getByPlaceholderText('Small input')).toBeTruthy();
    });

    it('renders with medium size by default', () => {
      render(<Input placeholder="Default input" />);
      expect(screen.getByPlaceholderText('Default input')).toBeTruthy();
    });

    it('renders with large size', () => {
      render(<Input size="lg" placeholder="Large input" />);
      expect(screen.getByPlaceholderText('Large input')).toBeTruthy();
    });
  });

  describe('States', () => {
    it('renders in default state', () => {
      render(<Input state="default" />);
      const input = screen.getByRole('none');
      expect(input).toBeTruthy();
    });

    it('renders in error state', () => {
      render(<Input state="error" />);
      const input = screen.getByRole('none');
      expect(input).toBeTruthy();
    });

    it('renders in success state', () => {
      render(<Input state="success" />);
      const input = screen.getByRole('none');
      expect(input).toBeTruthy();
    });

    it('infers error state from errorMessage', () => {
      render(<Input errorMessage="Error occurred" />);
      expect(screen.getByText('Error occurred')).toBeTruthy();
    });

    it('infers success state from successMessage', () => {
      render(<Input successMessage="Success!" />);
      expect(screen.getByText('Success!')).toBeTruthy();
    });

    it('explicit state overrides inferred state', () => {
      render(<Input state="default" errorMessage="Error" />);
      expect(screen.getByText('Error')).toBeTruthy();
    });
  });

  describe('Disabled State', () => {
    it('is not editable when disabled', () => {
      render(<Input disabled placeholder="Disabled input" />);
      const input = screen.getByPlaceholderText('Disabled input');
      expect(input.props.editable).toBe(false);
    });

    it('shows disabled styling', () => {
      render(<Input disabled />);
      const input = screen.getByRole('none');
      expect(input.props.accessibilityState.disabled).toBe(true);
    });

    it('does not call onRightIconPress when disabled', () => {
      const onPress = jest.fn();
      const icon = <View testID="right-icon" />;
      render(<Input disabled rightIcon={icon} onRightIconPress={onPress} />);
      fireEvent.press(screen.getByTestId('right-icon'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Focus State', () => {
    it('calls onFocus when focused', () => {
      const onFocus = jest.fn();
      render(<Input onFocus={onFocus} />);
      const input = screen.getByRole('none');
      fireEvent(input, 'focus');
      expect(onFocus).toHaveBeenCalled();
    });

    it('calls onBlur when blurred', () => {
      const onBlur = jest.fn();
      render(<Input onBlur={onBlur} />);
      const input = screen.getByRole('none');
      fireEvent(input, 'blur');
      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe('Right Icon Interaction', () => {
    it('calls onRightIconPress when right icon is pressed', () => {
      const onPress = jest.fn();
      const icon = <View testID="right-icon" />;
      render(<Input rightIcon={icon} onRightIconPress={onPress} />);
      fireEvent.press(screen.getByTestId('right-icon'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not make right icon pressable without onRightIconPress', () => {
      const icon = <View testID="right-icon" />;
      render(<Input rightIcon={icon} />);
      const iconWrapper = screen.getByTestId('right-icon').parent;
      expect(iconWrapper?.props.accessibilityRole).toBe('none');
    });

    it('makes right icon pressable with onRightIconPress', () => {
      const icon = <View testID="right-icon" />;
      render(<Input rightIcon={icon} onRightIconPress={() => {}} />);
      const iconWrapper = screen.getByTestId('right-icon').parent;
      expect(iconWrapper?.props.accessibilityRole).toBe('button');
    });
  });

  describe('Message Priority', () => {
    it('shows error message over hint', () => {
      render(<Input errorMessage="Error" hint="Hint" />);
      expect(screen.getByText('Error')).toBeTruthy();
      expect(screen.queryByText('Hint')).toBeNull();
    });

    it('shows success message over hint', () => {
      render(<Input successMessage="Success" hint="Hint" />);
      expect(screen.getByText('Success')).toBeTruthy();
      expect(screen.queryByText('Hint')).toBeNull();
    });

    it('shows error message over success message', () => {
      render(<Input errorMessage="Error" successMessage="Success" />);
      expect(screen.getByText('Error')).toBeTruthy();
      expect(screen.queryByText('Success')).toBeNull();
    });

    it('shows hint when no error or success message', () => {
      render(<Input hint="Helpful hint" />);
      expect(screen.getByText('Helpful hint')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('sets accessibility label from label prop', () => {
      render(<Input label="Email" />);
      const input = screen.getByRole('none');
      expect(input.props.accessibilityLabel).toBe('Email');
    });

    it('sets accessibility hint from hint prop', () => {
      render(<Input hint="Enter your email address" />);
      const input = screen.getByRole('none');
      expect(input.props.accessibilityHint).toBe('Enter your email address');
    });

    it('sets disabled state in accessibility', () => {
      render(<Input disabled />);
      const input = screen.getByRole('none');
      expect(input.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Value and Change', () => {
    it('renders with value', () => {
      render(<Input value="Test value" onChangeText={() => {}} />);
      const input = screen.getByDisplayValue('Test value');
      expect(input).toBeTruthy();
    });

    it('calls onChangeText when text changes', () => {
      const onChangeText = jest.fn();
      render(<Input onChangeText={onChangeText} />);
      const input = screen.getByRole('none');
      fireEvent.changeText(input, 'new text');
      expect(onChangeText).toHaveBeenCalledWith('new text');
    });
  });

  describe('Custom Props', () => {
    it('forwards additional TextInput props', () => {
      render(
        <Input
          testID="custom-input"
          maxLength={10}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      );
      const input = screen.getByTestId('custom-input');
      expect(input.props.maxLength).toBe(10);
      expect(input.props.autoCapitalize).toBe('none');
      expect(input.props.keyboardType).toBe('email-address');
    });

    it('accepts custom className', () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole('none');
      expect(input).toBeTruthy();
    });
  });

  describe('Secure Text Entry', () => {
    it('supports secure text entry', () => {
      render(<Input secureTextEntry />);
      const input = screen.getByRole('none');
      expect(input.props.secureTextEntry).toBe(true);
    });
  });
});
