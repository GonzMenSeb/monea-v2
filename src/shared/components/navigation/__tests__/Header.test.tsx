import { View } from 'react-native';

import { render, screen, fireEvent } from '@testing-library/react-native';

import { Header } from '../Header';

describe('Header', () => {
  describe('title rendering', () => {
    it('renders title when provided', () => {
      render(<Header title="Test Title" />);

      expect(screen.getByText('Test Title')).toBeTruthy();
    });

    it('renders title with header accessibility role', () => {
      render(<Header title="Test Title" />);

      expect(screen.getByRole('header')).toBeTruthy();
    });

    it('renders subtitle when provided', () => {
      render(<Header title="Title" subtitle="Subtitle" />);

      expect(screen.getByText('Subtitle')).toBeTruthy();
    });

    it('does not render subtitle when not provided', () => {
      render(<Header title="Title" />);

      expect(screen.queryByText('Subtitle')).toBeNull();
    });

    it('does not render title when not provided', () => {
      render(<Header />);

      expect(screen.queryByRole('header')).toBeNull();
    });
  });

  describe('back button', () => {
    it('renders back button when showBackButton is true and onBackPress is provided', () => {
      const onBackPress = jest.fn();
      render(<Header showBackButton onBackPress={onBackPress} />);

      expect(screen.getByTestId('header-back-button')).toBeTruthy();
    });

    it('does not render back button when showBackButton is false', () => {
      const onBackPress = jest.fn();
      render(<Header showBackButton={false} onBackPress={onBackPress} />);

      expect(screen.queryByTestId('header-back-button')).toBeNull();
    });

    it('does not render back button when onBackPress is not provided', () => {
      render(<Header showBackButton />);

      expect(screen.queryByTestId('header-back-button')).toBeNull();
    });

    it('calls onBackPress when back button is pressed', () => {
      const onBackPress = jest.fn();
      render(<Header showBackButton onBackPress={onBackPress} />);

      fireEvent.press(screen.getByTestId('header-back-button'));

      expect(onBackPress).toHaveBeenCalledTimes(1);
    });

    it('has proper accessibility label for back button', () => {
      const onBackPress = jest.fn();
      render(<Header showBackButton onBackPress={onBackPress} />);

      expect(screen.getByLabelText('Go back')).toBeTruthy();
    });
  });

  describe('left action', () => {
    it('renders left action button when provided', () => {
      const leftAction = {
        icon: 'menu' as const,
        onPress: jest.fn(),
        accessibilityLabel: 'Open menu',
        testID: 'menu-button',
      };
      render(<Header leftAction={leftAction} />);

      expect(screen.getByTestId('menu-button')).toBeTruthy();
    });

    it('calls left action onPress when pressed', () => {
      const onPress = jest.fn();
      const leftAction = {
        icon: 'menu' as const,
        onPress,
        accessibilityLabel: 'Open menu',
        testID: 'menu-button',
      };
      render(<Header leftAction={leftAction} />);

      fireEvent.press(screen.getByTestId('menu-button'));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('back button takes precedence over left action', () => {
      const onBackPress = jest.fn();
      const leftAction = {
        icon: 'menu' as const,
        onPress: jest.fn(),
        accessibilityLabel: 'Open menu',
        testID: 'menu-button',
      };
      render(<Header showBackButton onBackPress={onBackPress} leftAction={leftAction} />);

      expect(screen.getByTestId('header-back-button')).toBeTruthy();
      expect(screen.queryByTestId('menu-button')).toBeNull();
    });
  });

  describe('right actions', () => {
    it('renders single right action button', () => {
      const rightActions = [
        {
          icon: 'bell' as const,
          onPress: jest.fn(),
          accessibilityLabel: 'Notifications',
          testID: 'notifications-button',
        },
      ];
      render(<Header rightActions={rightActions} />);

      expect(screen.getByTestId('notifications-button')).toBeTruthy();
    });

    it('renders multiple right action buttons', () => {
      const rightActions = [
        {
          icon: 'bell' as const,
          onPress: jest.fn(),
          accessibilityLabel: 'Notifications',
          testID: 'notifications-button',
        },
        {
          icon: 'magnify' as const,
          onPress: jest.fn(),
          accessibilityLabel: 'Search',
          testID: 'search-button',
        },
      ];
      render(<Header rightActions={rightActions} />);

      expect(screen.getByTestId('notifications-button')).toBeTruthy();
      expect(screen.getByTestId('search-button')).toBeTruthy();
    });

    it('calls right action onPress when pressed', () => {
      const onPress = jest.fn();
      const rightActions = [
        {
          icon: 'bell' as const,
          onPress,
          accessibilityLabel: 'Notifications',
          testID: 'notifications-button',
        },
      ];
      render(<Header rightActions={rightActions} />);

      fireEvent.press(screen.getByTestId('notifications-button'));

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('does not render right actions when empty array', () => {
      render(<Header rightActions={[]} />);

      expect(screen.queryByTestId('notifications-button')).toBeNull();
    });
  });

  describe('center content', () => {
    it('renders custom center content instead of title', () => {
      render(<Header title="Title" centerContent={<View testID="custom-center" />} />);

      expect(screen.queryByText('Title')).toBeNull();
    });
  });

  describe('variants', () => {
    it('renders with default variant', () => {
      render(<Header title="Title" variant="default" />);

      expect(screen.getByTestId('header-container')).toBeTruthy();
    });

    it('renders with transparent variant', () => {
      render(<Header title="Title" variant="transparent" />);

      expect(screen.getByTestId('header-container')).toBeTruthy();
    });

    it('renders with elevated variant', () => {
      render(<Header title="Title" variant="elevated" />);

      expect(screen.getByTestId('header-container')).toBeTruthy();
    });
  });

  describe('accessibility', () => {
    it('renders buttons with proper accessibility role', () => {
      const onBackPress = jest.fn();
      render(<Header showBackButton onBackPress={onBackPress} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('renders buttons with proper accessibility labels', () => {
      const rightActions = [
        {
          icon: 'bell' as const,
          onPress: jest.fn(),
          accessibilityLabel: 'Notifications',
        },
      ];
      render(<Header rightActions={rightActions} />);

      expect(screen.getByLabelText('Notifications')).toBeTruthy();
    });
  });
});
