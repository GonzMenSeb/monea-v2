import { useEffect } from 'react';

import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import { SPRING_CONFIGS, TIMING_CONFIGS } from './presets';

import type { ViewStyle } from 'react-native';

interface UseFadeInOptions {
  duration?: number;
  delay?: number;
  autoStart?: boolean;
}

interface UseSlideUpOptions {
  fromY?: number;
  delay?: number;
  autoStart?: boolean;
}

interface UseScaleOptions {
  initialScale?: number;
  targetScale?: number;
  delay?: number;
  autoStart?: boolean;
}

interface UsePressableOptions {
  scalePressed?: number;
  scaleDefault?: number;
}

export function useFadeIn({ duration = 300, delay = 0, autoStart = true }: UseFadeInOptions = {}): {
  style: ViewStyle;
  start: () => void;
  reset: () => void;
} {
  const opacity = useSharedValue(autoStart ? 0 : 1);

  const start = (): void => {
    opacity.value = 0;
    opacity.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.ease) }));
  };

  const reset = (): void => {
    opacity.value = 0;
  };

  useEffect(() => {
    if (autoStart) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { style, start, reset };
}

export function useSlideUp({ fromY = 30, delay = 0, autoStart = true }: UseSlideUpOptions = {}): {
  style: ViewStyle;
  start: () => void;
  reset: () => void;
} {
  const translateY = useSharedValue(autoStart ? fromY : 0);
  const opacity = useSharedValue(autoStart ? 0 : 1);

  const start = (): void => {
    translateY.value = fromY;
    opacity.value = 0;
    translateY.value = withDelay(delay, withSpring(0, SPRING_CONFIGS.default));
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) })
    );
  };

  const reset = (): void => {
    translateY.value = fromY;
    opacity.value = 0;
  };

  useEffect(() => {
    if (autoStart) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return { style, start, reset };
}

export function useScale({
  initialScale = 0.8,
  targetScale = 1,
  delay = 0,
  autoStart = true,
}: UseScaleOptions = {}): {
  style: ViewStyle;
  start: () => void;
  reset: () => void;
} {
  const scale = useSharedValue(autoStart ? initialScale : targetScale);
  const opacity = useSharedValue(autoStart ? 0 : 1);

  const start = (): void => {
    scale.value = initialScale;
    opacity.value = 0;
    scale.value = withDelay(delay, withSpring(targetScale, SPRING_CONFIGS.bouncy));
    opacity.value = withDelay(
      delay,
      withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) })
    );
  };

  const reset = (): void => {
    scale.value = initialScale;
    opacity.value = 0;
  };

  useEffect(() => {
    if (autoStart) {
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return { style, start, reset };
}

export function usePressable({ scalePressed = 0.95, scaleDefault = 1 }: UsePressableOptions = {}): {
  style: ViewStyle;
  onPressIn: () => void;
  onPressOut: () => void;
} {
  const scale = useSharedValue(scaleDefault);

  const onPressIn = (): void => {
    scale.value = withSpring(scalePressed, SPRING_CONFIGS.stiff);
  };

  const onPressOut = (): void => {
    scale.value = withSpring(scaleDefault, SPRING_CONFIGS.default);
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { style, onPressIn, onPressOut };
}

export function useStaggeredList(
  itemCount: number,
  baseDelay = 50
): {
  getDelayForIndex: (index: number) => number;
  getStyleForIndex: (index: number) => ViewStyle;
} {
  const getDelayForIndex = (index: number): number => index * baseDelay;

  const getStyleForIndex = (index: number): ViewStyle => {
    const delay = getDelayForIndex(index);
    return {
      opacity: withDelay(
        delay,
        withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) })
      ) as unknown as number,
      transform: [
        {
          translateY: withDelay(delay, withSpring(0, SPRING_CONFIGS.default)) as unknown as number,
        },
      ],
    };
  };

  return { getDelayForIndex, getStyleForIndex };
}

export function useShake(): {
  style: ViewStyle;
  trigger: () => void;
} {
  const translateX = useSharedValue(0);

  const trigger = (): void => {
    translateX.value = withTiming(10, TIMING_CONFIGS.fast, () => {
      translateX.value = withTiming(-10, TIMING_CONFIGS.fast, () => {
        translateX.value = withTiming(5, TIMING_CONFIGS.fast, () => {
          translateX.value = withTiming(-5, TIMING_CONFIGS.fast, () => {
            translateX.value = withTiming(0, TIMING_CONFIGS.fast);
          });
        });
      });
    });
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { style, trigger };
}

export function usePulse(): {
  style: ViewStyle;
  trigger: () => void;
} {
  const scale = useSharedValue(1);

  const trigger = (): void => {
    scale.value = withTiming(1.1, TIMING_CONFIGS.fast, () => {
      scale.value = withSpring(1, SPRING_CONFIGS.bouncy);
    });
  };

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { style, trigger };
}
