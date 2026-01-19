export const colors = {
  background: {
    base: '#0A0B0E',
    surface: '#12141A',
    elevated: '#1A1D26',
    overlay: 'rgba(0,0,0,0.8)',
  },
  accent: {
    primary: '#00D4AA',
    secondary: '#7B61FF',
    warning: '#FFB800',
    danger: '#FF4757',
    info: '#3B82F6',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#8B8D97',
    muted: '#5C5E66',
    inverse: '#0A0B0E',
  },
  transaction: {
    income: '#00D4AA',
    expense: '#FF4757',
    transfer: '#7B61FF',
  },
  border: {
    default: '#2A2D36',
    muted: '#1F2128',
  },
  bancolombia: {
    yellow: '#FDDA24',
    blue: '#002D72',
    navy: '#001F4E',
  },
  davivienda: {
    red: '#E30613',
    darkRed: '#B8050F',
  },
  bbva: {
    blue: '#004481',
    aqua: '#1973B8',
    navy: '#002F6C',
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
} as const;

export type ColorPalette = typeof colors;
