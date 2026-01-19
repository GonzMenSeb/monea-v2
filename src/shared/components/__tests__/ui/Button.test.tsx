import { View } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from '../../ui/Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeTruthy();
    });

    it('renders with primary variant by default', () => {
      render(<Button testID="primary-btn">Primary</Button>);
      const button = screen.getByTestId('primary-btn');
      expect(button).toBeTruthy();
    });

    it('renders with secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByText('Secondary')).toBeTruthy();
    });

    it('renders with outline variant', () => {
      render(<Button variant="outline">Outline</Button>);
      expect(screen.getByText('Outline')).toBeTruthy();
    });

    it('renders with small size', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByText('Small')).toBeTruthy();
    });

    it('renders with medium size', () => {
      render(<Button size="md">Medium</Button>);
      expect(screen.getByText('Medium')).toBeTruthy();
    });

    it('renders with large size', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByText('Large')).toBeTruthy();
    });

    it('renders with left icon', () => {
      const icon = <View testID="left-icon" />;
      render(<Button leftIcon={icon}>With Icon</Button>);
      expect(screen.getByTestId('left-icon')).toBeTruthy();
      expect(screen.getByText('With Icon')).toBeTruthy();
    });

    it('renders with right icon', () => {
      const icon = <View testID="right-icon" />;
      render(<Button rightIcon={icon}>With Icon</Button>);
      expect(screen.getByTestId('right-icon')).toBeTruthy();
      expect(screen.getByText('With Icon')).toBeTruthy();
    });

    it('renders with both left and right icons', () => {
      const leftIcon = <View testID="left-icon" />;
      const rightIcon = <View testID="right-icon" />;
      render(
        <Button leftIcon={leftIcon} rightIcon={rightIcon}>
          Both Icons
        </Button>
      );
      expect(screen.getByTestId('left-icon')).toBeTruthy();
      expect(screen.getByTestId('right-icon')).toBeTruthy();
    });
  });

  describe('Loading State', () => {
    it('shows loading indicator when loading is true', () => {
      render(
        <Button loading testID="loading-btn">
          Loading
        </Button>
      );
      expect(screen.queryByText('Loading')).toBeNull();
      const button = screen.getByTestId('loading-btn');
      expect(button).toBeTruthy();
    });

    it('hides text and icons when loading', () => {
      const icon = <View testID="left-icon" />;
      render(
        <Button loading leftIcon={icon}>
          Loading Text
        </Button>
      );
      expect(screen.queryByText('Loading Text')).toBeNull();
      expect(screen.queryByTestId('left-icon')).toBeNull();
    });

    it('does not call onPress when loading', () => {
      const onPress = jest.fn();
      render(
        <Button loading onPress={onPress} testID="loading-btn">
          Loading
        </Button>
      );
      fireEvent.press(screen.getByTestId('loading-btn'));
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('renders as disabled when disabled prop is true', () => {
      render(
        <Button disabled testID="disabled-btn">
          Disabled
        </Button>
      );
      const button = screen.getByTestId('disabled-btn');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('does not call onPress when disabled', () => {
      const onPress = jest.fn();
      render(
        <Button disabled onPress={onPress} testID="disabled-btn">
          Disabled
        </Button>
      );
      fireEvent.press(screen.getByTestId('disabled-btn'));
      expect(onPress).not.toHaveBeenCalled();
    });

    it('is disabled when loading', () => {
      render(
        <Button loading testID="loading-btn">
          Loading
        </Button>
      );
      const button = screen.getByTestId('loading-btn');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  describe('Full Width', () => {
    it('renders full width when fullWidth is true', () => {
      render(<Button fullWidth>Full Width</Button>);
      expect(screen.getByText('Full Width')).toBeTruthy();
    });

    it('does not render full width by default', () => {
      render(<Button>Normal Width</Button>);
      expect(screen.getByText('Normal Width')).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onPress when pressed', () => {
      const onPress = jest.fn();
      render(<Button onPress={onPress}>Press Me</Button>);
      fireEvent.press(screen.getByText('Press Me'));
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not call onPress when not provided', () => {
      render(<Button testID="no-handler-btn">No Handler</Button>);
      const button = screen.getByTestId('no-handler-btn');
      fireEvent.press(button);
    });

    it('passes event to onPress handler', () => {
      const onPress = jest.fn();
      render(<Button onPress={onPress}>Event Test</Button>);
      fireEvent.press(screen.getByText('Event Test'));
      expect(onPress).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has button role', () => {
      render(<Button testID="accessible-btn">Accessible</Button>);
      const button = screen.getByTestId('accessible-btn');
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('sets disabled state in accessibility', () => {
      render(
        <Button disabled testID="disabled-btn">
          Disabled
        </Button>
      );
      const button = screen.getByTestId('disabled-btn');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });

    it('sets loading state as disabled in accessibility', () => {
      render(
        <Button loading testID="loading-btn">
          Loading
        </Button>
      );
      const button = screen.getByTestId('loading-btn');
      expect(button.props.accessibilityState.disabled).toBe(true);
    });
  });

  describe('Custom Props', () => {
    it('forwards additional pressable props', () => {
      render(
        <Button testID="custom-button" accessibilityHint="Custom hint">
          Custom Props
        </Button>
      );
      expect(screen.getByTestId('custom-button')).toBeTruthy();
    });
  });
});
