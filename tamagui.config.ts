import { createAnimations } from '@tamagui/animations-react-native';
import { createFont, createTamagui } from 'tamagui';

import { darkTheme } from './src/shared/theme/tamagui/themes';
import { tokens } from './src/shared/theme/tamagui/tokens';

const animations = createAnimations({
  fast: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
  medium: {
    type: 'spring',
    damping: 15,
    mass: 1,
    stiffness: 150,
  },
  slow: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  bouncy: {
    type: 'spring',
    damping: 10,
    mass: 0.9,
    stiffness: 100,
  },
  lazy: {
    type: 'spring',
    damping: 20,
    stiffness: 60,
  },
  quick: {
    type: 'spring',
    damping: 20,
    mass: 1.2,
    stiffness: 250,
  },
});

const interFont = createFont({
  family: 'Inter',
  size: {
    1: 10,
    2: 12,
    3: 14,
    4: 16,
    5: 18,
    6: 20,
    7: 24,
    8: 30,
    9: 36,
    10: 48,
    true: 16,
  },
  lineHeight: {
    1: 14,
    2: 16,
    3: 20,
    4: 24,
    5: 28,
    6: 28,
    7: 32,
    8: 36,
    9: 40,
    10: 56,
    true: 24,
  },
  weight: {
    1: '400',
    2: '400',
    3: '400',
    4: '500',
    5: '500',
    6: '600',
    7: '600',
    8: '700',
    9: '700',
    10: '700',
    true: '400',
  },
  letterSpacing: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: -0.5,
    7: -0.5,
    8: -0.5,
    9: -1,
    10: -1,
    true: 0,
  },
  face: {
    400: { normal: 'Inter' },
    500: { normal: 'InterMedium' },
    600: { normal: 'InterSemiBold' },
    700: { normal: 'InterBold' },
  },
});

const monoFont = createFont({
  family: 'JetBrainsMono',
  size: {
    1: 10,
    2: 12,
    3: 14,
    4: 16,
    5: 18,
    6: 20,
    7: 24,
    8: 30,
    9: 36,
    10: 48,
    true: 16,
  },
  lineHeight: {
    1: 14,
    2: 16,
    3: 20,
    4: 24,
    5: 28,
    6: 28,
    7: 32,
    8: 36,
    9: 40,
    10: 56,
    true: 24,
  },
  weight: {
    1: '400',
    2: '400',
    3: '400',
    4: '500',
    5: '500',
    6: '600',
    7: '700',
    8: '700',
    9: '700',
    10: '700',
    true: '400',
  },
  letterSpacing: {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    6: 0,
    7: 0,
    8: 0,
    9: 0,
    10: 0,
    true: 0,
  },
});

export const config = createTamagui({
  animations,
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  defaultTheme: 'dark',
  fonts: {
    body: interFont,
    heading: interFont,
    mono: monoFont,
  },
  themes: {
    dark: darkTheme,
  },
  tokens,
  shorthands: {
    px: 'paddingHorizontal',
    py: 'paddingVertical',
    mx: 'marginHorizontal',
    my: 'marginVertical',
    bg: 'backgroundColor',
    br: 'borderRadius',
    bw: 'borderWidth',
    bc: 'borderColor',
    ai: 'alignItems',
    jc: 'justifyContent',
    fd: 'flexDirection',
    fw: 'flexWrap',
    fg: 'flexGrow',
    fs: 'flexShrink',
    fb: 'flexBasis',
    f: 'flex',
    w: 'width',
    h: 'height',
    maw: 'maxWidth',
    mah: 'maxHeight',
    miw: 'minWidth',
    mih: 'minHeight',
  } as const,
});

export default config;

export type AppConfig = typeof config;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends AppConfig {}
}
