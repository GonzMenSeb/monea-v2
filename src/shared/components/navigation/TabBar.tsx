import { useCallback, useEffect } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';

import { useHaptics } from '@/shared/hooks/useHaptics';
import { colors } from '@/shared/theme';

import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

interface TabItemProps {
  route: BottomTabBarProps['state']['routes'][number];
  index: number;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  options: BottomTabBarProps['descriptors'][string]['options'];
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 200,
  mass: 0.5,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TabItem({ isFocused, onPress, onLongPress, options }: TabItemProps): React.ReactElement {
  const { selection } = useHaptics();
  const scale = useSharedValue(1);
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, SPRING_CONFIG);
  }, [isFocused, progress]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedContainerStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', colors.accent.primary + '20']
    );
    return {
      backgroundColor,
      borderRadius: 12,
      paddingVertical: 6,
      paddingHorizontal: 16,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };
  });

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 5 }],
    fontSize: 10 + progress.value * 2,
  }));

  const handlePressIn = useCallback(() => {
    selection();
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutable by design
    scale.value = withSpring(0.9, SPRING_CONFIG);
  }, [scale, selection]);

  const handlePressOut = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutable by design
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  const iconColor = isFocused ? colors.accent.primary : colors.text.muted;
  const label = options.tabBarLabel ?? options.title ?? '';

  const renderIcon = (): React.ReactNode => {
    if (options.tabBarIcon) {
      return options.tabBarIcon({
        focused: isFocused,
        color: iconColor,
        size: 24,
      });
    }
    return <MaterialCommunityIcons name="circle" size={24} color={iconColor} />;
  };

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarButtonTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.tabItem}
    >
      <Animated.View style={animatedContainerStyle}>
        <Animated.View style={animatedIconStyle}>{renderIcon()}</Animated.View>
        <Animated.Text style={[styles.label, animatedLabelStyle]} numberOfLines={1}>
          {typeof label === 'string' ? label : ''}
        </Animated.Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        const descriptor = descriptors[route.key];
        if (!descriptor) {
          return null;
        }
        const { options } = descriptor;
        const isFocused = state.index === index;

        const onPress = (): void => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = (): void => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TabItem
            key={route.key}
            route={route}
            index={index}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- options type is correctly inferred from BottomTabBarProps
            options={options}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.background.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    paddingTop: 8,
    paddingBottom: 24,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '500',
    marginTop: 4,
    color: colors.text.secondary,
  },
});
