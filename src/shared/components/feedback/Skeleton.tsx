import { useEffect, memo } from 'react';

import { View, StyleSheet } from 'react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

import { colors } from '@/shared/theme';

import type { DimensionValue, ViewStyle } from 'react-native';

type SkeletonVariant = 'text' | 'title' | 'avatar' | 'card' | 'button' | 'rectangle';

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
}

interface SkeletonGroupProps {
  count?: number;
  gap?: number;
  children?: React.ReactNode;
}

const ANIMATION_DURATION = 1200;

const VARIANT_STYLES: Record<
  SkeletonVariant,
  { width: DimensionValue; height: number; borderRadius: number }
> = {
  text: { width: '100%', height: 14, borderRadius: 4 },
  title: { width: '60%', height: 20, borderRadius: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  card: { width: '100%', height: 80, borderRadius: 12 },
  button: { width: 120, height: 40, borderRadius: 8 },
  rectangle: { width: '100%', height: 60, borderRadius: 8 },
};

const SkeletonBase = memo(function SkeletonBase({
  variant = 'text',
  width,
  height,
  borderRadius,
}: SkeletonProps): React.ReactElement {
  const shimmerProgress = useSharedValue(0);

  useEffect(() => {
    shimmerProgress.value = withRepeat(
      withTiming(1, { duration: ANIMATION_DURATION, easing: Easing.linear }),
      -1,
      false
    );
  }, [shimmerProgress]);

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shimmerProgress.value, [0, 0.5, 1], [0.3, 0.6, 0.3]);
    return { opacity };
  });

  const variantConfig = VARIANT_STYLES[variant];
  const finalWidth = width ?? variantConfig.width;
  const finalHeight = height ?? variantConfig.height;
  const finalBorderRadius = borderRadius ?? variantConfig.borderRadius;

  const dimensionStyle: ViewStyle = {
    width: finalWidth,
    height: finalHeight,
    borderRadius: finalBorderRadius,
  };

  return (
    <Animated.View style={[styles.skeleton, animatedStyle, dimensionStyle]} testID="skeleton" />
  );
});

export function Skeleton(props: SkeletonProps): React.ReactElement {
  return <SkeletonBase {...props} />;
}

export function SkeletonGroup({
  count = 3,
  gap = 12,
  children,
}: SkeletonGroupProps): React.ReactElement {
  if (children) {
    return <View style={[styles.group, { gap }]}>{children}</View>;
  }

  const items = Array.from({ length: count }, (_, i) => (
    <SkeletonBase key={i} variant="text" width={i === count - 1 ? '70%' : '100%'} />
  ));

  return <View style={[styles.group, { gap }]}>{items}</View>;
}

export function TransactionItemSkeleton(): React.ReactElement {
  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <SkeletonBase variant="avatar" width={44} height={44} />
        <View style={styles.transactionText}>
          <SkeletonBase variant="text" width={120} height={16} />
          <SkeletonBase variant="text" width={80} height={12} />
        </View>
      </View>
      <View style={styles.transactionRight}>
        <SkeletonBase variant="text" width={70} height={16} />
        <SkeletonBase variant="text" width={50} height={12} />
      </View>
    </View>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }): React.ReactElement {
  const items = Array.from({ length: count }, (_, i) => <TransactionItemSkeleton key={i} />);

  return (
    <View style={styles.transactionList}>
      <SkeletonBase variant="text" width={100} height={14} />
      <View style={styles.transactionListItems}>{items}</View>
    </View>
  );
}

export function CardSkeleton(): React.ReactElement {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonBase variant="avatar" width={40} height={40} />
        <View style={styles.cardHeaderText}>
          <SkeletonBase variant="text" width={100} height={16} />
          <SkeletonBase variant="text" width={60} height={12} />
        </View>
      </View>
      <SkeletonBase variant="text" width="100%" height={14} />
      <SkeletonBase variant="text" width="80%" height={14} />
    </View>
  );
}

export function BalanceCardSkeleton(): React.ReactElement {
  return (
    <View style={styles.balanceCard}>
      <SkeletonBase variant="text" width={80} height={14} />
      <SkeletonBase variant="title" width={180} height={32} />
      <View style={styles.balanceCardRow}>
        <View style={styles.balanceCardItem}>
          <SkeletonBase variant="text" width={50} height={12} />
          <SkeletonBase variant="text" width={70} height={18} />
        </View>
        <View style={styles.balanceCardItem}>
          <SkeletonBase variant="text" width={50} height={12} />
          <SkeletonBase variant="text" width={70} height={18} />
        </View>
      </View>
    </View>
  );
}

export function AccountCardSkeleton(): React.ReactElement {
  return (
    <View style={styles.accountCard}>
      <View style={styles.accountCardLeft}>
        <SkeletonBase variant="avatar" width={36} height={36} borderRadius={8} />
        <View style={styles.accountCardText}>
          <SkeletonBase variant="text" width={100} height={14} />
          <SkeletonBase variant="text" width={70} height={12} />
        </View>
      </View>
      <SkeletonBase variant="text" width={80} height={16} />
    </View>
  );
}

export function ChartSkeleton(): React.ReactElement {
  return (
    <View style={styles.chart}>
      <SkeletonBase variant="text" width={120} height={16} />
      <SkeletonBase variant="rectangle" width="100%" height={180} borderRadius={12} />
    </View>
  );
}

export function DashboardSkeleton(): React.ReactElement {
  return (
    <View style={styles.dashboard}>
      <BalanceCardSkeleton />
      <View style={styles.dashboardSection}>
        <SkeletonBase variant="text" width={100} height={14} />
        <View style={styles.accountsRow}>
          <AccountCardSkeleton />
          <AccountCardSkeleton />
        </View>
      </View>
      <ChartSkeleton />
      <TransactionListSkeleton count={3} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.background.tertiary,
  },
  group: {
    flexDirection: 'column',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  transactionText: {
    gap: 6,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  transactionList: {
    gap: 8,
  },
  transactionListItems: {
    gap: 4,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardHeaderText: {
    gap: 4,
  },
  balanceCard: {
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  balanceCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  balanceCardItem: {
    gap: 4,
  },
  accountCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  accountCardText: {
    gap: 4,
  },
  chart: {
    gap: 12,
  },
  dashboard: {
    gap: 20,
    padding: 16,
  },
  dashboardSection: {
    gap: 12,
  },
  accountsRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
