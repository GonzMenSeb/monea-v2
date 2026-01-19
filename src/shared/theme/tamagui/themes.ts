import type { Variable } from 'tamagui';

import { tokens } from './tokens';

type TokenColor = keyof typeof tokens.color;
type ColorValue = (typeof tokens.color)[TokenColor];

function createTheme<T extends Record<string, ColorValue | Variable>>(theme: T): T {
  return theme;
}

export const darkTheme = createTheme({
  background: tokens.color.backgroundBase,
  backgroundHover: tokens.color.backgroundSurface,
  backgroundPress: tokens.color.backgroundElevated,
  backgroundFocus: tokens.color.backgroundSurface,
  backgroundStrong: tokens.color.backgroundElevated,
  backgroundTransparent: tokens.color.transparent,

  color: tokens.color.textPrimary,
  colorHover: tokens.color.textPrimary,
  colorPress: tokens.color.textSecondary,
  colorFocus: tokens.color.textPrimary,
  colorTransparent: tokens.color.transparent,

  borderColor: tokens.color.border,
  borderColorHover: tokens.color.accentPrimary,
  borderColorPress: tokens.color.accentPrimary,
  borderColorFocus: tokens.color.accentPrimary,

  placeholderColor: tokens.color.textMuted,

  accentBackground: tokens.color.accentPrimary,
  accentColor: tokens.color.textInverse,

  surfaceBackground: tokens.color.backgroundSurface,
  surfaceBorder: tokens.color.border,

  cardBackground: tokens.color.backgroundSurface,
  cardBorder: tokens.color.border,

  inputBackground: tokens.color.backgroundSurface,
  inputBorder: tokens.color.border,
  inputBorderFocus: tokens.color.accentPrimary,

  shadowColor: tokens.color.black,
  shadowColorHover: tokens.color.black,

  primary: tokens.color.accentPrimary,
  secondary: tokens.color.accentSecondary,
  success: tokens.color.transactionIncome,
  warning: tokens.color.accentWarning,
  danger: tokens.color.accentDanger,
  info: tokens.color.accentInfo,

  income: tokens.color.transactionIncome,
  expense: tokens.color.transactionExpense,
  transfer: tokens.color.transactionTransfer,

  textPrimary: tokens.color.textPrimary,
  textSecondary: tokens.color.textSecondary,
  textMuted: tokens.color.textMuted,
  textInverse: tokens.color.textInverse,

  bancolombia: tokens.color.bankBancolombia,
  davivienda: tokens.color.bankDavivienda,
  bbva: tokens.color.bankBbva,
  nequi: tokens.color.bankNequi,
  daviplata: tokens.color.bankDaviplata,
});

export type AppTheme = typeof darkTheme;
