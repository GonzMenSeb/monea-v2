import { render, screen, fireEvent } from '@testing-library/react-native';

import { TabBar } from '../TabBar';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const createMockNavigation = (): {
  emit: jest.Mock;
  navigate: jest.Mock;
} => ({
  emit: jest.fn(() => ({ defaultPrevented: false })),
  navigate: jest.fn(),
});

const createMockDescriptors = (
  routes: { key: string; name: string }[]
): BottomTabBarProps['descriptors'] => {
  const descriptors: BottomTabBarProps['descriptors'] = {};
  routes.forEach((route) => {
    descriptors[route.key] = {
      options: {
        title: route.name,
        tabBarLabel: route.name,
        tabBarIcon: ({ color: _color, size: _size }) => null,
      },
      navigation:
        createMockNavigation() as unknown as BottomTabBarProps['descriptors'][string]['navigation'],
      route,
      render: () => null,
    };
  });
  return descriptors;
};

const createMockState = (
  routes: { key: string; name: string }[],
  activeIndex: number
): BottomTabBarProps['state'] => ({
  index: activeIndex,
  routes: routes.map((route) => ({ ...route, params: undefined })),
  key: 'tab-state',
  type: 'tab' as const,
  routeNames: routes.map((r) => r.name),
  stale: false,
  history: [],
});

describe('TabBar', () => {
  const defaultRoutes = [
    { key: 'home-1', name: 'Home' },
    { key: 'transactions-2', name: 'Transactions' },
    { key: 'settings-3', name: 'Settings' },
  ];

  describe('rendering', () => {
    it('renders all tab items', () => {
      const state = createMockState(defaultRoutes, 0);
      const descriptors = createMockDescriptors(defaultRoutes);
      const navigation = createMockNavigation();

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      expect(screen.getByText('Home')).toBeTruthy();
      expect(screen.getByText('Transactions')).toBeTruthy();
      expect(screen.getByText('Settings')).toBeTruthy();
    });

    it('renders correct number of tab items', () => {
      const state = createMockState(defaultRoutes, 0);
      const descriptors = createMockDescriptors(defaultRoutes);
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
      expect(buttons).toHaveLength(3);
    });
  });

  describe('tab press behavior', () => {
    it('emits tabPress event when tab is pressed', () => {
      const state = createMockState(defaultRoutes, 0);
      const descriptors = createMockDescriptors(defaultRoutes);
      const navigation = createMockNavigation();

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      fireEvent.press(screen.getByText('Transactions'));

      expect(navigation.emit).toHaveBeenCalledWith({
        type: 'tabPress',
        target: 'transactions-2',
        canPreventDefault: true,
      });
    });

    it('navigates to tab when inactive tab is pressed', () => {
      const state = createMockState(defaultRoutes, 0);
      const descriptors = createMockDescriptors(defaultRoutes);
      const navigation = createMockNavigation();

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      fireEvent.press(screen.getByText('Transactions'));

      expect(navigation.navigate).toHaveBeenCalledWith('Transactions', undefined);
    });

    it('does not navigate when already focused tab is pressed', () => {
      const state = createMockState(defaultRoutes, 0);
      const descriptors = createMockDescriptors(defaultRoutes);
      const navigation = createMockNavigation();

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      fireEvent.press(screen.getByText('Home'));

      expect(navigation.navigate).not.toHaveBeenCalled();
    });

    it('does not navigate when event is prevented', () => {
      const state = createMockState(defaultRoutes, 0);
      const descriptors = createMockDescriptors(defaultRoutes);
      const navigation = createMockNavigation();
      navigation.emit.mockReturnValue({ defaultPrevented: true });

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      fireEvent.press(screen.getByText('Transactions'));

      expect(navigation.navigate).not.toHaveBeenCalled();
    });
  });

  describe('tab long press behavior', () => {
    it('emits tabLongPress event when tab is long pressed', () => {
      const state = createMockState(defaultRoutes, 0);
      const descriptors = createMockDescriptors(defaultRoutes);
      const navigation = createMockNavigation();

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      fireEvent(screen.getByText('Transactions'), 'longPress');

      expect(navigation.emit).toHaveBeenCalledWith({
        type: 'tabLongPress',
        target: 'transactions-2',
      });
    });
  });

  describe('accessibility', () => {
    it('renders tabs with button accessibility role', () => {
      const state = createMockState(defaultRoutes, 0);
      const descriptors = createMockDescriptors(defaultRoutes);
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
      expect(buttons).toHaveLength(3);
    });

    it('marks focused tab as selected', () => {
      const state = createMockState(defaultRoutes, 1);
      const descriptors = createMockDescriptors(defaultRoutes);
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
      expect(buttons[1].props.accessibilityState).toEqual({ selected: true });
    });

    it('marks non-focused tabs as not selected', () => {
      const state = createMockState(defaultRoutes, 1);
      const descriptors = createMockDescriptors(defaultRoutes);
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
      expect(buttons[0].props.accessibilityState).toEqual({});
      expect(buttons[2].props.accessibilityState).toEqual({});
    });
  });

  describe('focus state', () => {
    it('applies focused state to active tab', () => {
      const state = createMockState(defaultRoutes, 0);
      const descriptors = createMockDescriptors(defaultRoutes);
      const navigation = createMockNavigation();

      render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      expect(screen.getByText('Home')).toBeTruthy();
    });

    it('changes active tab when state index changes', () => {
      const routes = defaultRoutes;
      let state = createMockState(routes, 0);
      const descriptors = createMockDescriptors(routes);
      const navigation = createMockNavigation();

      const { rerender } = render(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      let buttons = screen.getAllByRole('button');
      expect(buttons[0].props.accessibilityState).toEqual({ selected: true });

      state = createMockState(routes, 2);
      rerender(
        <TabBar
          state={state}
          descriptors={descriptors}
          navigation={navigation as unknown as BottomTabBarProps['navigation']}
          insets={{ top: 0, bottom: 0, left: 0, right: 0 }}
        />
      );

      buttons = screen.getAllByRole('button');
      expect(buttons[2].props.accessibilityState).toEqual({ selected: true });
    });
  });
});
