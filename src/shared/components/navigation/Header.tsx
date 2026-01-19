import { useCallback } from 'react';

import { Pressable, StyleSheet, View } from 'react-native';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors } from '@/shared/theme';

type HeaderVariant = 'default' | 'transparent' | 'elevated';

interface HeaderAction {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
}

interface HeaderProps {
  title?: string;
  subtitle?: string;
  variant?: HeaderVariant;
  showBackButton?: boolean;
  onBackPress?: () => void;
  leftAction?: HeaderAction;
  rightActions?: HeaderAction[];
  centerContent?: React.ReactNode;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 200,
  mass: 0.5,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface HeaderButtonProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  testID?: string;
}

function HeaderButton({
  icon,
  onPress,
  accessibilityLabel,
  testID,
}: HeaderButtonProps): React.ReactElement {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutable by design
    scale.value = withSpring(0.9, SPRING_CONFIG);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared values are mutable by design
    scale.value = withSpring(1, SPRING_CONFIG);
  }, [scale]);

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.iconButton, animatedStyle]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <MaterialCommunityIcons name={icon} size={24} color={colors.text.primary} />
    </AnimatedPressable>
  );
}

const VARIANT_STYLES: Record<HeaderVariant, object> = {
  default: {
    backgroundColor: colors.background.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  elevated: {
    backgroundColor: colors.background.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
};

export function Header({
  title,
  subtitle,
  variant = 'default',
  showBackButton = false,
  onBackPress,
  leftAction,
  rightActions = [],
  centerContent,
}: HeaderProps): React.ReactElement {
  const variantStyle = VARIANT_STYLES[variant];

  const renderLeftSection = (): React.ReactNode => {
    if (showBackButton && onBackPress) {
      return (
        <HeaderButton
          icon="arrow-left"
          onPress={onBackPress}
          accessibilityLabel="Go back"
          testID="header-back-button"
        />
      );
    }

    if (leftAction) {
      return (
        <HeaderButton
          icon={leftAction.icon}
          onPress={leftAction.onPress}
          accessibilityLabel={leftAction.accessibilityLabel}
          testID={leftAction.testID}
        />
      );
    }

    return <View style={styles.placeholder} />;
  };

  const renderCenterSection = (): React.ReactNode => {
    if (centerContent) {
      return <View style={styles.centerContent}>{centerContent}</View>;
    }

    if (title) {
      return (
        <View style={styles.titleContainer}>
          <Animated.Text style={styles.title} numberOfLines={1} accessibilityRole="header">
            {title}
          </Animated.Text>
          {subtitle && (
            <Animated.Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Animated.Text>
          )}
        </View>
      );
    }

    return null;
  };

  const renderRightSection = (): React.ReactNode => {
    if (rightActions.length === 0) {
      return <View style={styles.placeholder} />;
    }

    return (
      <View style={styles.rightActions}>
        {rightActions.map((action, index) => (
          <HeaderButton
            key={`${action.icon}-${index}`}
            icon={action.icon}
            onPress={action.onPress}
            accessibilityLabel={action.accessibilityLabel}
            testID={action.testID}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, variantStyle]} testID="header-container">
      <View style={styles.leftSection}>{renderLeftSection()}</View>
      {renderCenterSection()}
      <View style={styles.rightSection}>{renderRightSection()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 8,
  },
  leftSection: {
    minWidth: 48,
    alignItems: 'flex-start',
  },
  rightSection: {
    minWidth: 48,
    alignItems: 'flex-end',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 2,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
