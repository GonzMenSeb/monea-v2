const baseConfig = {
  globals: {
    __DEV__: true,
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    'src/core/': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

module.exports = {
  ...baseConfig,
  projects: [
    {
      displayName: 'core',
      testMatch: ['<rootDir>/src/core/**/__tests__/**/*.test.[jt]s?(x)'],
      testEnvironment: 'node',
      transform: {
        '^.+\\.(ts|tsx)$': 'babel-jest',
      },
      moduleNameMapper: baseConfig.moduleNameMapper,
    },
    {
      displayName: 'react-native',
      preset: 'jest-expo',
      testMatch: [
        '<rootDir>/src/features/**/__tests__/**/*.test.[jt]s?(x)',
        '<rootDir>/src/shared/**/__tests__/**/*.test.[jt]s?(x)',
        '<rootDir>/src/infrastructure/**/__tests__/**/*.test.[jt]s?(x)',
        '<rootDir>/src/app/**/__tests__/**/*.test.[jt]s?(x)',
      ],
      transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-gifted-charts|gifted-charts-core)',
      ],
      moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '^expo/src/winter/(.*)$': '<rootDir>/node_modules/expo/src/winter/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
  ],
};
