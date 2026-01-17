/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        sans: ['Inter', 'System'],
        mono: ['JetBrains Mono', 'Courier'],
      },
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
      },
      spacing: {
        18: '72px',
        22: '88px',
      },
      borderRadius: {
        '4xl': '32px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
        elevated: '0 4px 16px rgba(0, 0, 0, 0.12)',
        button: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
