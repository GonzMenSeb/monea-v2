const { withAppBuildGradle } = require('expo/config-plugins');

function withBundleInDebug(config) {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    // In newer React Native versions, bundling is skipped for variants listed in debuggableVariants.
    // By setting it to an empty list, we force bundling for all variants including debug.
    if (!buildGradle.includes('debuggableVariants')) {
      buildGradle = buildGradle.replace(
        /react\s*\{/,
        `react {
    debuggableVariants = []`
      );
      config.modResults.contents = buildGradle;
    }

    return config;
  });
}

module.exports = withBundleInDebug;
