export const colors = {
  primary: {
    50: '#E8F4EA',
    100: '#C6E4CB',
    200: '#A0D3A9',
    300: '#7AC287',
    400: '#5DB46C',
    500: '#40A652',
    600: '#359845',
    700: '#2A8838',
    800: '#1F782B',
    900: '#0D5E17',
    DEFAULT: '#40A652',
  },
  bancolombia: {
    yellow: '#FDDA24',
    blue: '#002D72',
    navy: '#001F4E',
  },
  davivienda: {
    red: '#E30613',
    darkRed: '#B8050F',
    white: '#FFFFFF',
  },
  bbva: {
    blue: '#004481',
    aqua: '#1973B8',
    navy: '#002F6C',
    white: '#FFFFFF',
  },
  nequi: {
    purple: '#200040',
    pink: '#E6007E',
    magenta: '#CD007F',
  },
  daviplata: {
    red: '#E30613',
    orange: '#F7941D',
    darkRed: '#B8050F',
  },
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#F1F3F5',
  },
  surface: {
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#6B7280',
    muted: '#9CA3AF',
    inverse: '#FFFFFF',
  },
  semantic: {
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  transaction: {
    income: '#10B981',
    expense: '#EF4444',
    transfer: '#3B82F6',
  },
} as const;

export type ColorPalette = typeof colors;
