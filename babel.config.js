module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
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
