import { Text } from 'react-native';

import { fireEvent, render, screen } from '@testing-library/react-native';

import { TabBar } from '../../navigation/TabBar';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

interface MockNavigation {
  emit: jest.Mock<{ defaultPrevented: boolean }>;
  navigate: jest.Mock;
}

const createMockNavigation = (): MockNavigation => ({
  emit: jest.fn(() => ({ defaultPrevented: false })),
  navigate: jest.fn(),
});

const createMockDescriptors = (routeKey: string): BottomTabBarProps['descriptors'] => ({
  [routeKey]: {
    options: {
      title: 'Test Tab',
      tabBarIcon: ({ color, size }: { color: string; size: number }) => (
        <Text testID="tab-icon">{`Icon ${color} ${size}`}</Text>
      ),
    },
    navigation:
      createMockNavigation() as unknown as BottomTabBarProps['descriptors'][string]['navigation'],
    route: { key: routeKey, name: 'test' },
    render: jest.fn(),
  },
});

const createMockState = (
  routes: { key: string; name: string }[],
  index: number
): BottomTabBarProps['state'] => ({
  index,
  routes: routes.map((r) => ({ ...r, params: undefined })),
  stale: false,
  type: 'tab' as const,
  key: 'tab-state',
  routeNames: routes.map((r) => r.name),
  history: [{ type: 'route' as const, key: routes[index]?.key ?? '' }],
  preloadedRouteKeys: [],
});

describe('TabBar', () => {
  describe('Rendering', () => {
    it('renders all tab items', () => {
      const routes = [
        { key: 'home', name: 'Home' },
        { key: 'settings', name: 'Settings' },
      ];
      const state = createMockState(routes, 0);
      const descriptors = {
        home: {
          options: { title: 'Home' },
          navigation:
            createMockNavigation() as unknown as BottomTabBarProps['descriptors'][string]['navigation'],
          route: { key: 'home', name: 'Home' },
          render: jest.fn(),
        },
        settings: {
          options: { title: 'Settings' },
          navigation:
            createMockNavigation() as unknown as BottomTabBarProps['descriptors'][string]['navigation'],
          route: { key: 'settings', name: 'Settings' },
          render: jest.fn(),
        },
      };
      const navigation = createMockNavigation() as unknown as BottomTabBarProps['navigation'];

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      expect(screen.getAllByRole('button')).toHaveLength(2);
    });

    it('renders custom tab bar icon when provided', () => {
      const state = createMockState([{ key: 'test', name: 'Test' }], 0);
      const descriptors = createMockDescriptors('test');
      const navigation = createMockNavigation() as unknown as BottomTabBarProps['navigation'];

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      expect(screen.getByTestId('tab-icon')).toBeTruthy();
    });

    it('renders tab label from options.title', () => {
      const state = createMockState([{ key: 'test', name: 'Test' }], 0);
      const descriptors = createMockDescriptors('test');
      const navigation = createMockNavigation() as unknown as BottomTabBarProps['navigation'];

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      expect(screen.getByText('Test Tab')).toBeTruthy();
    });
  });

  describe('Tab Selection', () => {
    it('marks current tab as selected in accessibility', () => {
      const routes = [
        { key: 'home', name: 'Home' },
        { key: 'settings', name: 'Settings' },
      ];
      const state = createMockState(routes, 0);
      const descriptors = {
        home: {
          options: { title: 'Home' },
          navigation:
            createMockNavigation() as unknown as BottomTabBarProps['descriptors'][string]['navigation'],
          route: { key: 'home', name: 'Home' },
          render: jest.fn(),
        },
        settings: {
          options: { title: 'Settings' },
          navigation:
            createMockNavigation() as unknown as BottomTabBarProps['descriptors'][string]['navigation'],
          route: { key: 'settings', name: 'Settings' },
          render: jest.fn(),
        },
      };
      const navigation = createMockNavigation() as unknown as BottomTabBarProps['navigation'];

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      const buttons = screen.getAllByRole('button');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Testing Library returns typed elements
      expect(buttons[0].props.accessibilityState).toEqual({ selected: true });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Testing Library returns typed elements
      expect(buttons[1].props.accessibilityState).toEqual({});
    });
  });

  describe('Interactions', () => {
    it('emits tabPress event on press', () => {
      const state = createMockState([{ key: 'test', name: 'Test' }], 0);
      const descriptors = createMockDescriptors('test');
      const navigation = createMockNavigation();

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      fireEvent.press(screen.getByRole('button'));

      expect(navigation.emit).toHaveBeenCalledWith({
        type: 'tabPress',
        target: 'test',
        canPreventDefault: true,
      });
    });

    it('navigates when pressing inactive tab', () => {
      const routes = [
        { key: 'home', name: 'Home' },
        { key: 'settings', name: 'Settings' },
      ];
      const state = createMockState(routes, 0);
      const descriptors = {
        home: {
          options: { title: 'Home' },
          navigation:
            createMockNavigation() as unknown as BottomTabBarProps['descriptors'][string]['navigation'],
          route: { key: 'home', name: 'Home' },
          render: jest.fn(),
        },
        settings: {
          options: { title: 'Settings' },
          navigation:
            createMockNavigation() as unknown as BottomTabBarProps['descriptors'][string]['navigation'],
          route: { key: 'settings', name: 'Settings' },
          render: jest.fn(),
        },
      };
      const navigation = createMockNavigation();

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      const buttons = screen.getAllByRole('button');
      fireEvent.press(buttons[1]);

      expect(navigation.navigate).toHaveBeenCalledWith('Settings', undefined);
    });

    it('does not navigate when pressing already focused tab', () => {
      const state = createMockState([{ key: 'test', name: 'Test' }], 0);
      const descriptors = createMockDescriptors('test');
      const navigation = createMockNavigation();

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      fireEvent.press(screen.getByRole('button'));

      expect(navigation.navigate).not.toHaveBeenCalled();
    });

    it('emits tabLongPress event on long press', () => {
      const state = createMockState([{ key: 'test', name: 'Test' }], 0);
      const descriptors = createMockDescriptors('test');
      const navigation = createMockNavigation();

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      fireEvent(screen.getByRole('button'), 'longPress');

      expect(navigation.emit).toHaveBeenCalledWith({
        type: 'tabLongPress',
        target: 'test',
      });
    });

    it('does not navigate when tabPress is prevented', () => {
      const routes = [
        { key: 'home', name: 'Home' },
        { key: 'settings', name: 'Settings' },
      ];
      const state = createMockState(routes, 0);
      const descriptors = {
        home: {
          options: { title: 'Home' },
          navigation:
            createMockNavigation() as unknown as BottomTabBarProps['descriptors'][string]['navigation'],
          route: { key: 'home', name: 'Home' },
          render: jest.fn(),
        },
        settings: {
          options: { title: 'Settings' },
          navigation:
            createMockNavigation() as unknown as BottomTabBarProps['descriptors'][string]['navigation'],
          route: { key: 'settings', name: 'Settings' },
          render: jest.fn(),
        },
      };
      const navigation = {
        ...createMockNavigation(),
        emit: jest.fn(() => ({ defaultPrevented: true })),
      };

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      const buttons = screen.getAllByRole('button');
      fireEvent.press(buttons[1]);

      expect(navigation.navigate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('sets correct accessibility role on tabs', () => {
      const state = createMockState([{ key: 'test', name: 'Test' }], 0);
      const descriptors = createMockDescriptors('test');
      const navigation = createMockNavigation() as unknown as BottomTabBarProps['navigation'];

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      expect(screen.getByRole('button')).toBeTruthy();
    });

    it('uses tabBarAccessibilityLabel when provided', () => {
      const state = createMockState([{ key: 'test', name: 'Test' }], 0);
      const descriptors: BottomTabBarProps['descriptors'] = {
        test: {
          options: {
            title: 'Test',
            tabBarAccessibilityLabel: 'Navigate to Test',
          },
          navigation:
            createMockNavigation() as unknown as BottomTabBarProps['descriptors'][string]['navigation'],
          route: { key: 'test', name: 'Test' },
          render: jest.fn(),
        },
      };
      const navigation = createMockNavigation() as unknown as BottomTabBarProps['navigation'];

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      expect(screen.getByLabelText('Navigate to Test')).toBeTruthy();
    });

    it('uses tabBarButtonTestID when provided', () => {
      const state = createMockState([{ key: 'test', name: 'Test' }], 0);
      const descriptors: BottomTabBarProps['descriptors'] = {
        test: {
          options: {
            title: 'Test',
            tabBarButtonTestID: 'test-tab-button',
          },
          navigation:
            createMockNavigation() as unknown as BottomTabBarProps['descriptors'][string]['navigation'],
          route: { key: 'test', name: 'Test' },
          render: jest.fn(),
        },
      };
      const navigation = createMockNavigation() as unknown as BottomTabBarProps['navigation'];

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      expect(screen.getByTestId('test-tab-button')).toBeTruthy();
    });
  });
});
