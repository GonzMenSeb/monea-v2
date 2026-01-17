const { withMainApplication } = require('expo/config-plugins');

function withSmsReader(config) {
  config = withMainApplication(config, async (config) => {
    let contents = config.modResults.contents;

    if (contents.includes('RNExpoReadSmsPackage')) {
      return config;
    }

    const importStatement = 'import com.reactlibrary.RNExpoReadSmsPackage';

    if (!contents.includes(importStatement)) {
      const packageMatch = contents.match(/^package\s+[\w.]+\s*\n/m);
      if (packageMatch) {
        const insertPos = packageMatch.index + packageMatch[0].length;
        contents =
          contents.slice(0, insertPos) +
          '\n' +
          importStatement +
          '\n' +
          contents.slice(insertPos);
      }
    }

    if (!contents.includes('RNExpoReadSmsPackage()')) {
      const packagesApplyMatch = contents.match(
        /PackageList\(this\)\.packages\.apply\s*\{/
      );
      if (packagesApplyMatch) {
        const insertPos = packagesApplyMatch.index + packagesApplyMatch[0].length;
        contents =
          contents.slice(0, insertPos) +
          '\n              add(RNExpoReadSmsPackage())' +
          contents.slice(insertPos);
      }
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
}

module.exports = withSmsReader;
