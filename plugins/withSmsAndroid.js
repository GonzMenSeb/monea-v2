const { withAndroidManifest } = require('@expo/config-plugins');

function addSmsPermissions(androidManifest) {
  const { manifest } = androidManifest;

  if (!manifest['uses-permission']) {
    manifest['uses-permission'] = [];
  }

  const permissions = manifest['uses-permission'];

  const requiredPermissions = [
    'android.permission.READ_SMS',
    'android.permission.RECEIVE_SMS',
  ];

  for (const permission of requiredPermissions) {
    const exists = permissions.some(
      (p) => p.$?.['android:name'] === permission
    );

    if (!exists) {
      permissions.push({
        $: {
          'android:name': permission,
        },
      });
    }
  }

  return androidManifest;
}

module.exports = function withSmsAndroid(config) {
  return withAndroidManifest(config, (config) => {
    config.modResults = addSmsPermissions(config.modResults);
    return config;
  });
};
