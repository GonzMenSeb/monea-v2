module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      [
        '@tamagui/babel-plugin',
        {
          components: ['tamagui'],
          config: './tamagui.config.ts',
          logTimings: true,
          disableExtraction: process.env.NODE_ENV === 'development',
        },
      ],
      [
        'module-resolver',
        {
          alias: {
            '@/app': './src/app',
            '@/features': './src/features',
            '@/shared': './src/shared',
            '@/core': './src/core',
            '@/infrastructure': './src/infrastructure',
          },
        },
      ],
    ],
  };
};
