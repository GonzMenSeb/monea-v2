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
        receiver.$?.['android:name'] === 'com.reactlibrary.SmsReceiver'
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
    let contents = config.modResults.contents;

    if (contents.includes('SmsPackage')) {
      return config;
    }

    const importStatement = 'import com.reactlibrary.SmsPackage';

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

    if (!contents.includes('SmsPackage()')) {
      const packagesApplyMatch = contents.match(
        /PackageList\(this\)\.packages\.apply\s*\{/
      );
      if (packagesApplyMatch) {
        const insertPos = packagesApplyMatch.index + packagesApplyMatch[0].length;
        contents =
          contents.slice(0, insertPos) +
          '\n              add(SmsPackage())' +
          contents.slice(insertPos);
      }
    }

    config.modResults.contents = contents;
    return config;
  });

  return config;
}

module.exports = withSmsReader;
