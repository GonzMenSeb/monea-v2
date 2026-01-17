import { device, element, by, expect, waitFor } from 'detox';

describe('Settings Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { sms: 'granted' },
    });

    await waitFor(element(by.text('Skip for Now')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('Skip for Now')).tap();
  });

  beforeEach(async () => {
    await device.reloadReactNative();

    await waitFor(element(by.text('Skip for Now')))
      .toBeVisible()
      .withTimeout(5000);
    await element(by.text('Skip for Now')).tap();
  });

  describe('Settings Tab Navigation', () => {
    it('should navigate to settings screen when tab is pressed', async () => {
      await element(by.text('Settings')).tap();

      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should display settings header', async () => {
      await element(by.text('Settings')).tap();

      await waitFor(element(by.text('Settings')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Settings List Items', () => {
    beforeEach(async () => {
      await element(by.text('Settings')).tap();
      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should display Accounts section', async () => {
      await expect(element(by.text('Accounts'))).toBeVisible();
    });

    it('should display SMS Settings section', async () => {
      await expect(element(by.text('SMS Settings'))).toBeVisible();
    });

    it('should display About section', async () => {
      await element(by.id('settings-screen')).scroll(300, 'down');
      await expect(element(by.text('About'))).toBeVisible();
    });
  });

  describe('Accounts Management', () => {
    beforeEach(async () => {
      await element(by.text('Settings')).tap();
      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should navigate to accounts management screen', async () => {
      await element(by.text('Manage Accounts')).tap();

      await waitFor(element(by.id('accounts-management-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should display accounts list or empty state', async () => {
      await element(by.text('Manage Accounts')).tap();

      await waitFor(element(by.id('accounts-management-screen')))
        .toBeVisible()
        .withTimeout(5000);

      const accountsList = element(by.id('accounts-list'));
      const emptyState = element(by.text('No accounts linked'));

      try {
        await expect(accountsList).toBeVisible();
      } catch {
        await expect(emptyState).toBeVisible();
      }
    });

    it('should show Add Account button', async () => {
      await element(by.text('Manage Accounts')).tap();

      await waitFor(element(by.id('accounts-management-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await expect(element(by.id('add-account-button'))).toBeVisible();
    });

    it('should open account form when Add Account is pressed', async () => {
      await element(by.text('Manage Accounts')).tap();

      await waitFor(element(by.id('accounts-management-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await element(by.id('add-account-button')).tap();

      await waitFor(element(by.id('account-form')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should navigate back from accounts management', async () => {
      await element(by.text('Manage Accounts')).tap();

      await waitFor(element(by.id('accounts-management-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await device.pressBack();

      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('SMS Settings', () => {
    beforeEach(async () => {
      await element(by.text('Settings')).tap();
      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should navigate to SMS settings screen', async () => {
      await element(by.text('SMS Preferences')).tap();

      await waitFor(element(by.id('sms-settings-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should display SMS permission status', async () => {
      await element(by.text('SMS Preferences')).tap();

      await waitFor(element(by.id('sms-settings-screen')))
        .toBeVisible()
        .withTimeout(5000);

      const permissionStatus = element(by.id('sms-permission-status'));
      await expect(permissionStatus).toBeVisible();
    });

    it('should navigate back from SMS settings', async () => {
      await element(by.text('SMS Preferences')).tap();

      await waitFor(element(by.id('sms-settings-screen')))
        .toBeVisible()
        .withTimeout(5000);

      await device.pressBack();

      await waitFor(element(by.id('settings-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });
  });

  describe('Account Form Validation', () => {
    beforeEach(async () => {
      await element(by.text('Settings')).tap();
      await element(by.text('Manage Accounts')).tap();
      await waitFor(element(by.id('accounts-management-screen')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.id('add-account-button')).tap();
      await waitFor(element(by.id('account-form')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should display bank selection dropdown', async () => {
      await expect(element(by.id('bank-selector'))).toBeVisible();
    });

    it('should display account number input', async () => {
      await expect(element(by.id('account-number-input'))).toBeVisible();
    });

    it('should show validation error for empty account number', async () => {
      await element(by.id('save-account-button')).tap();

      await waitFor(element(by.text('Account number is required')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should close form on cancel', async () => {
      await element(by.id('cancel-button')).tap();

      await expect(element(by.id('account-form'))).not.toBeVisible();
    });
  });
});
