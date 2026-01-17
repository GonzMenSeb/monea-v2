import { Text, View } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { Header } from '../../navigation/Header';

function MockComponent({ testID }: { testID: string }): React.ReactElement {
  return (
    <View testID={testID}>
      <Text>Custom Content</Text>
    </View>
  );
}

describe('Header', () => {
  describe('Rendering', () => {
    it('renders with title', () => {
      render(<Header title="Test Title" />);

      expect(screen.getByText('Test Title')).toBeTruthy();
    });

    it('renders with subtitle', () => {
      render(<Header title="Title" subtitle="Subtitle" />);

      expect(screen.getByText('Subtitle')).toBeTruthy();
    });

    it('renders without title when not provided', () => {
      render(<Header />);

      expect(screen.getByTestId('header-container')).toBeTruthy();
    });

    it('renders custom center content', () => {
      const { getByTestId } = render(
        <Header centerContent={<MockComponent testID="custom-center" />} />
      );

      expect(getByTestId('custom-center')).toBeTruthy();
    });
  });

  describe('Back Button', () => {
    it('shows back button when showBackButton is true', () => {
      const onBackPress = jest.fn();
      render(<Header title="Title" showBackButton onBackPress={onBackPress} />);

      expect(screen.getByTestId('header-back-button')).toBeTruthy();
    });

    it('does not show back button when showBackButton is false', () => {
      render(<Header title="Title" />);

      expect(screen.queryByTestId('header-back-button')).toBeNull();
    });

    it('calls onBackPress when back button is pressed', () => {
      const onBackPress = jest.fn();
      render(<Header title="Title" showBackButton onBackPress={onBackPress} />);

      fireEvent.press(screen.getByTestId('header-back-button'));

      expect(onBackPress).toHaveBeenCalledTimes(1);
    });

    it('has correct accessibility label for back button', () => {
      const onBackPress = jest.fn();
      render(<Header title="Title" showBackButton onBackPress={onBackPress} />);

      expect(screen.getByLabelText('Go back')).toBeTruthy();
    });
  });

  describe('Left Action', () => {
    it('renders left action when provided', () => {
      const leftAction = {
        icon: 'menu' as const,
        onPress: jest.fn(),
        accessibilityLabel: 'Open menu',
        testID: 'menu-button',
      };

      render(<Header title="Title" leftAction={leftAction} />);

      expect(screen.getByTestId('menu-button')).toBeTruthy();
    });

    it('calls onPress when left action is pressed', () => {
      const onPress = jest.fn();
      const leftAction = {
        icon: 'menu' as const,
        onPress,
        accessibilityLabel: 'Open menu',
        testID: 'menu-button',
      };

      render(<Header title="Title" leftAction={leftAction} />);
      fireEvent.press(screen.getByTestId('menu-button'));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('prefers back button over left action when both provided', () => {
      const onBackPress = jest.fn();
      const leftAction = {
        icon: 'menu' as const,
        onPress: jest.fn(),
        accessibilityLabel: 'Open menu',
        testID: 'menu-button',
      };

      render(
        <Header title="Title" showBackButton onBackPress={onBackPress} leftAction={leftAction} />
      );

      expect(screen.getByTestId('header-back-button')).toBeTruthy();
      expect(screen.queryByTestId('menu-button')).toBeNull();
    });
  });

  describe('Right Actions', () => {
    it('renders single right action', () => {
      const rightActions = [
        {
          icon: 'bell' as const,
          onPress: jest.fn(),
          accessibilityLabel: 'Notifications',
          testID: 'notifications-button',
        },
      ];

      render(<Header title="Title" rightActions={rightActions} />);

      expect(screen.getByTestId('notifications-button')).toBeTruthy();
    });

    it('renders multiple right actions', () => {
      const rightActions = [
        {
          icon: 'bell' as const,
          onPress: jest.fn(),
          accessibilityLabel: 'Notifications',
          testID: 'notifications-button',
        },
        {
          icon: 'cog' as const,
          onPress: jest.fn(),
          accessibilityLabel: 'Settings',
          testID: 'settings-button',
        },
      ];

      render(<Header title="Title" rightActions={rightActions} />);

      expect(screen.getByTestId('notifications-button')).toBeTruthy();
      expect(screen.getByTestId('settings-button')).toBeTruthy();
    });

    it('calls correct onPress for each right action', () => {
      const onPressNotifications = jest.fn();
      const onPressSettings = jest.fn();
      const rightActions = [
        {
          icon: 'bell' as const,
          onPress: onPressNotifications,
          accessibilityLabel: 'Notifications',
          testID: 'notifications-button',
        },
        {
          icon: 'cog' as const,
          onPress: onPressSettings,
          accessibilityLabel: 'Settings',
          testID: 'settings-button',
        },
      ];

      render(<Header title="Title" rightActions={rightActions} />);

      fireEvent.press(screen.getByTestId('notifications-button'));
      expect(onPressNotifications).toHaveBeenCalledTimes(1);
      expect(onPressSettings).not.toHaveBeenCalled();

      fireEvent.press(screen.getByTestId('settings-button'));
      expect(onPressSettings).toHaveBeenCalledTimes(1);
    });
  });

  describe('Variants', () => {
    it('renders default variant', () => {
      render(<Header title="Title" variant="default" />);

      expect(screen.getByTestId('header-container')).toBeTruthy();
    });

    it('renders transparent variant', () => {
      render(<Header title="Title" variant="transparent" />);

      expect(screen.getByTestId('header-container')).toBeTruthy();
    });

    it('renders elevated variant', () => {
      render(<Header title="Title" variant="elevated" />);

      expect(screen.getByTestId('header-container')).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('marks title as header for accessibility', () => {
      render(<Header title="Test Title" />);

      expect(screen.getByRole('header')).toBeTruthy();
    });

    it('sets correct accessibility role on buttons', () => {
      const onBackPress = jest.fn();
      render(<Header title="Title" showBackButton onBackPress={onBackPress} />);

      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('uses provided accessibility labels', () => {
      const rightActions = [
        {
          icon: 'bell' as const,
          onPress: jest.fn(),
          accessibilityLabel: 'View notifications',
        },
      ];

      render(<Header title="Title" rightActions={rightActions} />);

      expect(screen.getByLabelText('View notifications')).toBeTruthy();
    });
  });
});
