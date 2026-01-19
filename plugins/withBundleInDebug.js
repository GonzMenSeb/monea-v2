const { withAppBuildGradle } = require('expo/config-plugins');

function withBundleInDebug(config) {
  return withAppBuildGradle(config, (config) => {
    let buildGradle = config.modResults.contents;

    if (!buildGradle.includes('bundleInDebug')) {
      buildGradle = buildGradle.replace(
        /react\s*\{/,
        `react {
    bundleInDebug = true`
      );
      config.modResults.contents = buildGradle;
    }

    return config;
  });
}

module.exports = withBundleInDebug;
