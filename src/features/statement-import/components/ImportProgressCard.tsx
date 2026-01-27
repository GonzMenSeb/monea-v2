import { useEffect, useMemo } from 'react';

import { StyleSheet } from 'react-native';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { styled, Stack, Text, YStack, XStack } from 'tamagui';

import { Body, Caption } from '@/shared/components/ui';
import { colors } from '@/shared/theme';

import type { ImportProgress } from '../types';

interface ImportProgressCardProps {
  progress: ImportProgress;
  transactionsCount?: number;
}

const PHASE_CONFIG: Record<
  ImportProgress['phase'],
  { icon: string; label: string; color: string }
> = {
  reading: { icon: '📖', label: 'Reading File', color: colors.accent.info },
  parsing: { icon: '🔍', label: 'Parsing Statement', color: colors.accent.info },
  detecting_duplicates: { icon: '🔎', label: 'Checking Duplicates', color: colors.accent.warning },
  importing: { icon: '💾', label: 'Importing Transactions', color: colors.accent.primary },
  updating_balances: { icon: '📊', label: 'Updating Balances', color: colors.accent.secondary },
  complete: { icon: '✅', label: 'Complete', color: colors.accent.primary },
};

const CardContainer = styled(YStack, {
  name: 'ImportProgressCard',
  backgroundColor: '$backgroundSurface',
  borderRadius: '$4',
  padding: '$4',
  gap: '$4',
});

const ProgressHeader = styled(XStack, {
  name: 'ProgressHeader',
  alignItems: 'center',
  gap: '$3',
});

const PhaseIconContainer = styled(Stack, {
  name: 'PhaseIconContainer',
  width: 48,
  height: 48,
  borderRadius: '$full',
  backgroundColor: '$backgroundElevated',
  alignItems: 'center',
  justifyContent: 'center',
});

const ProgressBarContainer = styled(Stack, {
  name: 'ProgressBarContainer',
  height: 8,
  backgroundColor: '$backgroundElevated',
  borderRadius: '$full',
  overflow: 'hidden',
});

const StatsRow = styled(XStack, {
  name: 'StatsRow',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const StatItem = styled(YStack, {
  name: 'StatItem',
  alignItems: 'center',
  flex: 1,
});

const FileNameContainer = styled(XStack, {
  name: 'FileNameContainer',
  backgroundColor: '$backgroundElevated',
  borderRadius: '$2',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  alignSelf: 'flex-start',
});

const styles = StyleSheet.create({
  progressBarFill: {
    height: '100%',
    borderRadius: 9999,
  },
});

export function ImportProgressCard({
  progress,
  transactionsCount,
}: ImportProgressCardProps): React.ReactElement {
  const progressValue = useSharedValue(0);
  const phaseConfig = PHASE_CONFIG[progress.phase];

  const progressPercent =
    progress.totalSteps > 0 ? (progress.currentStep / progress.totalSteps) * 100 : 0;

  useEffect(() => {
    progressValue.value = withSpring(progressPercent / 100, {
      damping: 15,
      stiffness: 100,
    });
  }, [progressPercent, progressValue]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressValue.value, [0, 1], [0, 100])}%`,
  }));

  const pulseValue = useSharedValue(0);

  useEffect(() => {
    if (progress.phase === 'complete') {
      return;
    }

    pulseValue.value = withTiming(1, {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
    });

    const interval = setInterval(() => {
      pulseValue.value = 0;
      pulseValue.value = withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [progress.phase, pulseValue]);

  const iconPulseStyle = useAnimatedStyle(() => {
    if (progress.phase === 'complete') {
      return { opacity: 1, transform: [{ scale: 1 }] };
    }
    return {
      opacity: interpolate(pulseValue.value, [0, 0.5, 1], [0.7, 1, 0.7]),
      transform: [{ scale: interpolate(pulseValue.value, [0, 0.5, 1], [0.95, 1.05, 0.95]) }],
    };
  });

  const isComplete = progress.phase === 'complete';

  const progressBarFillStyle = useMemo(
    () => [progressBarStyle, styles.progressBarFill, { backgroundColor: phaseConfig.color }],
    [progressBarStyle, phaseConfig.color]
  );

  return (
    <CardContainer
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: Math.round(progressPercent),
      }}
      accessibilityLabel={`Import progress: ${phaseConfig.label}, ${Math.round(progressPercent)}% complete`}
    >
      <ProgressHeader>
        <Animated.View style={iconPulseStyle}>
          <PhaseIconContainer>
            <Text fontSize="$5">{phaseConfig.icon}</Text>
          </PhaseIconContainer>
        </Animated.View>
        <YStack flex={1}>
          <Body fontWeight="600" color="$textPrimary">
            {phaseConfig.label}
          </Body>
          <Caption color="$textSecondary" numberOfLines={2}>
            {progress.message}
          </Caption>
        </YStack>
      </ProgressHeader>

      <YStack gap="$2">
        <ProgressBarContainer>
          <Animated.View style={progressBarFillStyle} />
        </ProgressBarContainer>
        <XStack justifyContent="space-between">
          <Caption color="$textMuted">
            Step {progress.currentStep} of {progress.totalSteps}
          </Caption>
          <Caption color="$textMuted">{Math.round(progressPercent)}%</Caption>
        </XStack>
      </YStack>

      <StatsRow>
        <StatItem>
          <Caption color="$textMuted">Status</Caption>
          <Body
            fontWeight="500"
            color={isComplete ? '$accentPrimary' : '$textPrimary'}
            testID="import-status"
          >
            {isComplete ? 'Done' : 'In Progress'}
          </Body>
        </StatItem>

        {transactionsCount !== undefined && (
          <StatItem>
            <Caption color="$textMuted">Transactions</Caption>
            <Body
              fontWeight="600"
              fontFamily="$mono"
              color="$textPrimary"
              testID="transactions-count"
            >
              {transactionsCount}
            </Body>
          </StatItem>
        )}

        <StatItem>
          <Caption color="$textMuted">Progress</Caption>
          <Body fontWeight="600" fontFamily="$mono" color="$textPrimary">
            {Math.round(progressPercent)}%
          </Body>
        </StatItem>
      </StatsRow>

      <FileNameContainer>
        <Caption color="$textSecondary" numberOfLines={1}>
          📄 {progress.fileName}
        </Caption>
      </FileNameContainer>
    </CardContainer>
  );
}

export type { ImportProgressCardProps };
