const { withAndroidManifest, withMainApplication } = require('expo/config-plugins');

function withSmsReader(config) {
  config = withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    if (!mainApplication.receiver) {
      mainApplication.receiver = [];
    }

    const smsReceiverExists = mainApplication.receiver.some(
      (receiver) =>
        receiver.$?.['android:name'] ===
        'com.reactlibrary.SmsReceiver'
    );

    if (!smsReceiverExists) {
      mainApplication.receiver.push({
        $: {
          'android:name': 'com.reactlibrary.SmsReceiver',
          'android:enabled': 'true',
          'android:exported': 'true',
          'android:permission': 'android.permission.BROADCAST_SMS',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.provider.Telephony.SMS_RECEIVED',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });

  config = withMainApplication(config, async (config) => {
    const mainApplication = config.modResults;
    const contents = mainApplication.contents;

    if (!contents.includes('SmsPackage')) {
      const importStatement = 'import com.reactlibrary.SmsPackage;';
      const packageStatement = 'packages.add(new SmsPackage());';

      if (!contents.includes(importStatement)) {
        const lastImportIndex = contents.lastIndexOf('import ');
        const endOfLastImport = contents.indexOf(';', lastImportIndex);
        mainApplication.contents =
          contents.slice(0, endOfLastImport + 1) +
          '\n' +
          importStatement +
          contents.slice(endOfLastImport + 1);
      }

      if (!contents.includes(packageStatement)) {
        const getPackagesIndex = contents.indexOf('getPackages()');
        if (getPackagesIndex !== -1) {
          const returnIndex = contents.indexOf('return packages;', getPackagesIndex);
          if (returnIndex !== -1) {
            mainApplication.contents =
              contents.slice(0, returnIndex) +
              packageStatement +
              '\n            ' +
              contents.slice(returnIndex);
          }
        }
      }
    }

    return config;
  });

  return config;
}

module.exports = withSmsReader;
