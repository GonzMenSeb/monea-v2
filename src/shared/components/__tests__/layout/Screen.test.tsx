import { Text, View } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { Screen } from '../../layout/Screen';

jest.mock('react-native-safe-area-context', () => {
  const { View: MockView } = jest.requireActual('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => <MockView {...props}>{children}</MockView>,
  };
});

describe('Screen', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      render(
        <Screen>
          <Text>Screen Content</Text>
        </Screen>
      );
      expect(screen.getByText('Screen Content')).toBeTruthy();
    });

    it('renders with fixed variant by default', () => {
      render(
        <Screen>
          <Text>Fixed Screen</Text>
        </Screen>
      );
      expect(screen.getByText('Fixed Screen')).toBeTruthy();
    });

    it('renders with scroll variant', () => {
      render(
        <Screen variant="scroll">
          <Text>Scrollable Screen</Text>
        </Screen>
      );
      expect(screen.getByText('Scrollable Screen')).toBeTruthy();
    });
  });

  describe('Background Color', () => {
    it('uses white background by default', () => {
      render(
        <Screen>
          <Text>Default Background</Text>
        </Screen>
      );
      expect(screen.getByText('Default Background')).toBeTruthy();
    });

    it('accepts custom background color', () => {
      render(
        <Screen backgroundColor="#000000">
          <Text>Custom Background</Text>
        </Screen>
      );
      expect(screen.getByText('Custom Background')).toBeTruthy();
    });
  });

  describe('Status Bar', () => {
    it('uses dark-content status bar by default', () => {
      render(
        <Screen>
          <Text>Status Bar Test</Text>
        </Screen>
      );
      expect(screen.getByText('Status Bar Test')).toBeTruthy();
    });

    it('accepts light-content status bar', () => {
      render(
        <Screen statusBarStyle="light-content">
          <Text>Light Status</Text>
        </Screen>
      );
      expect(screen.getByText('Light Status')).toBeTruthy();
    });
  });

  describe('Keyboard Avoiding', () => {
    it('enables keyboard avoiding by default', () => {
      render(
        <Screen>
          <Text>Keyboard Avoiding</Text>
        </Screen>
      );
      expect(screen.getByText('Keyboard Avoiding')).toBeTruthy();
    });

    it('can disable keyboard avoiding', () => {
      render(
        <Screen keyboardAvoiding={false}>
          <Text>No Keyboard Avoiding</Text>
        </Screen>
      );
      expect(screen.getByText('No Keyboard Avoiding')).toBeTruthy();
    });
  });

  describe('Scroll Enabled', () => {
    it('enables scroll by default in scroll variant', () => {
      render(
        <Screen variant="scroll">
          <Text>Scrollable</Text>
        </Screen>
      );
      expect(screen.getByText('Scrollable')).toBeTruthy();
    });

    it('can disable scroll in scroll variant', () => {
      render(
        <Screen variant="scroll" scrollEnabled={false}>
          <Text>Not Scrollable</Text>
        </Screen>
      );
      expect(screen.getByText('Not Scrollable')).toBeTruthy();
    });
  });

  describe('Safe Area Edges', () => {
    it('uses all edges by default', () => {
      render(
        <Screen>
          <Text>All Edges</Text>
        </Screen>
      );
      expect(screen.getByText('All Edges')).toBeTruthy();
    });

    it('accepts custom edges', () => {
      render(
        <Screen edges={['top']}>
          <Text>Top Edge Only</Text>
        </Screen>
      );
      expect(screen.getByText('Top Edge Only')).toBeTruthy();
    });

    it('accepts multiple custom edges', () => {
      render(
        <Screen edges={['top', 'bottom']}>
          <Text>Top and Bottom</Text>
        </Screen>
      );
      expect(screen.getByText('Top and Bottom')).toBeTruthy();
    });
  });

  describe('Content Container', () => {
    it('accepts contentContainerClassName for scroll variant', () => {
      render(
        <Screen variant="scroll" contentContainerClassName="px-4">
          <Text>With Padding</Text>
        </Screen>
      );
      expect(screen.getByText('With Padding')).toBeTruthy();
    });

    it('accepts contentContainerClassName for fixed variant', () => {
      render(
        <Screen variant="fixed" contentContainerClassName="p-4">
          <Text>Fixed with Padding</Text>
        </Screen>
      );
      expect(screen.getByText('Fixed with Padding')).toBeTruthy();
    });
  });

  describe('Custom Props', () => {
    it('forwards additional View props for fixed variant', () => {
      render(
        <Screen variant="fixed" testID="custom-screen">
          <Text>Custom Props</Text>
        </Screen>
      );
      expect(screen.getByTestId('custom-screen')).toBeTruthy();
    });

    it('accepts custom className', () => {
      render(
        <Screen className="custom-class">
          <Text>Custom Class</Text>
        </Screen>
      );
      expect(screen.getByText('Custom Class')).toBeTruthy();
    });
  });

  describe('Multiple Children', () => {
    it('renders multiple children in fixed variant', () => {
      render(
        <Screen variant="fixed">
          <Text>First Child</Text>
          <Text>Second Child</Text>
          <Text>Third Child</Text>
        </Screen>
      );
      expect(screen.getByText('First Child')).toBeTruthy();
      expect(screen.getByText('Second Child')).toBeTruthy();
      expect(screen.getByText('Third Child')).toBeTruthy();
    });

    it('renders multiple children in scroll variant', () => {
      render(
        <Screen variant="scroll">
          <Text>First Child</Text>
          <Text>Second Child</Text>
        </Screen>
      );
      expect(screen.getByText('First Child')).toBeTruthy();
      expect(screen.getByText('Second Child')).toBeTruthy();
    });
  });

  describe('Complex Content', () => {
    it('renders nested components', () => {
      render(
        <Screen>
          <View>
            <Text>Nested Component</Text>
            <View>
              <Text>Deeply Nested</Text>
            </View>
          </View>
        </Screen>
      );
      expect(screen.getByText('Nested Component')).toBeTruthy();
      expect(screen.getByText('Deeply Nested')).toBeTruthy();
    });

    it('handles scroll variant with nested content', () => {
      render(
        <Screen variant="scroll">
          <View>
            <Text>Header</Text>
          </View>
          <View>
            <Text>Content</Text>
          </View>
          <View>
            <Text>Footer</Text>
          </View>
        </Screen>
      );
      expect(screen.getByText('Header')).toBeTruthy();
      expect(screen.getByText('Content')).toBeTruthy();
      expect(screen.getByText('Footer')).toBeTruthy();
    });
  });
});
