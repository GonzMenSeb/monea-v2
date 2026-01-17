import { device, element, by, expect, waitFor } from 'detox';
import { execSync } from 'child_process';

const APP_PACKAGE = 'com.monea.app';

const grantSmsPermissions = (): void => {
  execSync(`adb shell pm grant ${APP_PACKAGE} android.permission.READ_SMS`);
  execSync(`adb shell pm grant ${APP_PACKAGE} android.permission.RECEIVE_SMS`);
};

const revokeSmsPermissions = (): void => {
  execSync(`adb shell pm revoke ${APP_PACKAGE} android.permission.READ_SMS`);
  execSync(`adb shell pm revoke ${APP_PACKAGE} android.permission.RECEIVE_SMS`);
};

describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Permissions Screen', () => {
    it('should display the permissions request screen on first launch', async () => {
      await waitFor(element(by.text('SMS Access Required')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.text('Read SMS Messages'))).toBeVisible();
      await expect(element(by.text('Receive SMS'))).toBeVisible();
      await expect(element(by.text('Your Privacy Matters'))).toBeVisible();
    });

    it('should show Grant Permissions button', async () => {
      await waitFor(element(by.text('Grant Permissions')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show Skip for Now option', async () => {
      await waitFor(element(by.text('Skip for Now')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should navigate to main app when Skip for Now is pressed', async () => {
      await element(by.text('Skip for Now')).tap();

      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  describe('Permission Request Flow', () => {
    beforeEach(async () => {
      revokeSmsPermissions();
      await device.launchApp({ newInstance: true });
    });

    it('should request SMS permissions when Grant Permissions is pressed', async () => {
      await waitFor(element(by.text('Grant Permissions')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.text('Grant Permissions')).tap();

      await waitFor(element(by.text('Checking Permissions...')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Permission Denied State', () => {
    beforeEach(async () => {
      revokeSmsPermissions();
      await device.launchApp({ newInstance: true });
    });

    it('should show denied state message when permission is denied', async () => {
      await element(by.text('Grant Permissions')).tap();

      await waitFor(element(by.text('Permission Denied')))
        .toBeVisible()
        .withTimeout(10000);

      await expect(element(by.text('Try Again'))).toBeVisible();
    });
  });

  describe('Permission Granted State', () => {
    beforeEach(async () => {
      grantSmsPermissions();
      await device.launchApp({ newInstance: true });
    });

    it('should navigate to dashboard when permissions are granted', async () => {
      await element(by.text('Grant Permissions')).tap();

      await waitFor(element(by.text('Permissions Granted!')))
        .toBeVisible()
        .withTimeout(10000);

      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });
});
