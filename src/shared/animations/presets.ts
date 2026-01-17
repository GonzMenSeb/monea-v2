import { withSpring, withTiming, withDelay, withSequence, Easing } from 'react-native-reanimated';

import type { WithSpringConfig, WithTimingConfig } from 'react-native-reanimated';

export const SPRING_CONFIGS = {
  gentle: { damping: 20, stiffness: 90, mass: 1 } as WithSpringConfig,
  bouncy: { damping: 10, stiffness: 180, mass: 0.8 } as WithSpringConfig,
  stiff: { damping: 20, stiffness: 300, mass: 0.6 } as WithSpringConfig,
  default: { damping: 15, stiffness: 200, mass: 0.5 } as WithSpringConfig,
};

export const TIMING_CONFIGS = {
  fast: { duration: 150, easing: Easing.out(Easing.ease) } as WithTimingConfig,
  normal: { duration: 250, easing: Easing.out(Easing.ease) } as WithTimingConfig,
  slow: { duration: 400, easing: Easing.out(Easing.ease) } as WithTimingConfig,
  linear: { duration: 300, easing: Easing.linear } as WithTimingConfig,
};

export const fadeIn = (duration = 250): number =>
  withTiming(1, { duration, easing: Easing.out(Easing.ease) });

export const fadeOut = (duration = 250): number =>
  withTiming(0, { duration, easing: Easing.in(Easing.ease) });

export const fadeInWithDelay = (delay: number, duration = 250): number =>
  withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.ease) }));

export const slideUpSpring = (_fromY = 50, config = SPRING_CONFIGS.default): number =>
  withSpring(0, config);

export const slideDownSpring = (toY = 50, config = SPRING_CONFIGS.default): number =>
  withSpring(toY, config);

export const slideUpTiming = (duration = 250): number =>
  withTiming(0, { duration, easing: Easing.out(Easing.back(1.5)) });

export const slideDownTiming = (toY = 50, duration = 250): number =>
  withTiming(toY, { duration, easing: Easing.in(Easing.ease) });

export const slideInFromLeft = (duration = 300): number =>
  withTiming(0, { duration, easing: Easing.out(Easing.cubic) });

export const slideOutToLeft = (toX: number, duration = 300): number =>
  withTiming(toX, { duration, easing: Easing.in(Easing.cubic) });

export const slideInFromRight = (duration = 300): number =>
  withTiming(0, { duration, easing: Easing.out(Easing.cubic) });

export const slideOutToRight = (toX: number, duration = 300): number =>
  withTiming(toX, { duration, easing: Easing.in(Easing.cubic) });

export const scaleIn = (config = SPRING_CONFIGS.bouncy): number => withSpring(1, config);

export const scaleOut = (config = SPRING_CONFIGS.stiff): number => withSpring(0, config);

export const scaleInTiming = (duration = 200): number =>
  withTiming(1, { duration, easing: Easing.out(Easing.back(1.5)) });

export const scaleOutTiming = (duration = 150): number =>
  withTiming(0, { duration, easing: Easing.in(Easing.ease) });

export const pulse = (): number =>
  withSequence(withTiming(1.1, { duration: 100 }), withTiming(1, { duration: 100 }));

export const shake = (intensity = 10): number =>
  withSequence(
    withTiming(intensity, { duration: 50 }),
    withTiming(-intensity, { duration: 50 }),
    withTiming(intensity / 2, { duration: 50 }),
    withTiming(-intensity / 2, { duration: 50 }),
    withTiming(0, { duration: 50 })
  );

export const bounce = (): number =>
  withSequence(withSpring(1.2, SPRING_CONFIGS.stiff), withSpring(1, SPRING_CONFIGS.bouncy));

export const press = (): number => withSpring(0.95, SPRING_CONFIGS.stiff);

export const release = (): number => withSpring(1, SPRING_CONFIGS.default);

export const rotate = (degrees: number, duration = 300): number =>
  withTiming(degrees, { duration, easing: Easing.inOut(Easing.ease) });

export const rotateSpring = (degrees: number, config = SPRING_CONFIGS.default): number =>
  withSpring(degrees, config);
