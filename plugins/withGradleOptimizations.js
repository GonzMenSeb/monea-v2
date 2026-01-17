const { withGradleProperties } = require('expo/config-plugins');

function withGradleOptimizations(config) {
  return withGradleProperties(config, (config) => {
    const gradleProperties = config.modResults;

    const optimizations = [
      { type: 'property', key: 'org.gradle.caching', value: 'true' },
      { type: 'property', key: 'org.gradle.configuration-cache', value: 'true' },
      {
        type: 'property',
        key: 'org.gradle.configuration-cache.problems',
        value: 'warn',
      },
    ];

    for (const opt of optimizations) {
      const existingIndex = gradleProperties.findIndex(
        (p) => p.type === 'property' && p.key === opt.key
      );

      if (existingIndex >= 0) {
        gradleProperties[existingIndex] = opt;
      } else {
        gradleProperties.push(opt);
      }
    }

    return config;
  });
}

module.exports = withGradleOptimizations;
