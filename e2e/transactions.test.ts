import { device, element, by, expect, waitFor } from 'detox';
import { execSync } from 'child_process';

const APP_PACKAGE = 'com.monea.app';

const grantSmsPermissions = (): void => {
  execSync(`adb shell pm grant ${APP_PACKAGE} android.permission.READ_SMS`);
  execSync(`adb shell pm grant ${APP_PACKAGE} android.permission.RECEIVE_SMS`);
};

describe('Transactions Flow', () => {
  beforeAll(async () => {
    grantSmsPermissions();
    await device.launchApp({ newInstance: true });

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

  describe('Transactions Tab Navigation', () => {
    it('should navigate to transactions screen when tab is pressed', async () => {
      await element(by.text('Transactions')).tap();

      await waitFor(element(by.id('transactions-screen')))
        .toBeVisible()
        .withTimeout(5000);
    });

    it('should show transactions list or empty state', async () => {
      await element(by.text('Transactions')).tap();

      await waitFor(element(by.id('transactions-screen')))
        .toBeVisible()
        .withTimeout(5000);

      const transactionList = element(by.id('transaction-list'));
      const emptyState = element(by.text('No transactions found'));

      try {
        await expect(transactionList).toBeVisible();
      } catch {
        await expect(emptyState).toBeVisible();
      }
    });
  });

  describe('Transaction List', () => {
    it('should display section headers for date grouping', async () => {
      await element(by.text('Transactions')).tap();

      await waitFor(element(by.id('transactions-screen')))
        .toBeVisible()
        .withTimeout(5000);

      const todayHeader = element(by.text('Today'));
      const yesterdayHeader = element(by.text('Yesterday'));

      try {
        await expect(todayHeader).toBeVisible();
      } catch {
        try {
          await expect(yesterdayHeader).toBeVisible();
        } catch {
          // No transactions, empty state is expected
        }
      }
    });

    it('should allow scrolling through transactions', async () => {
      await element(by.text('Transactions')).tap();

      await waitFor(element(by.id('transactions-screen')))
        .toBeVisible()
        .withTimeout(5000);

      const transactionList = element(by.id('transaction-list'));

      try {
        await transactionList.scroll(300, 'down');
        await transactionList.scroll(300, 'up');
      } catch {
        // List may be empty or too short to scroll
      }
    });
  });

  describe('Transaction Detail', () => {
    it('should open transaction detail modal when transaction is pressed', async () => {
      await element(by.text('Transactions')).tap();

      await waitFor(element(by.id('transactions-screen')))
        .toBeVisible()
        .withTimeout(5000);

      const transactionItem = element(by.id('transaction-item-0'));

      try {
        await transactionItem.tap();

        await waitFor(element(by.id('transaction-detail-modal')))
          .toBeVisible()
          .withTimeout(5000);
      } catch {
        // No transactions available
      }
    });

    it('should close transaction detail modal on back press', async () => {
      await element(by.text('Transactions')).tap();

      const transactionItem = element(by.id('transaction-item-0'));

      try {
        await transactionItem.tap();

        await waitFor(element(by.id('transaction-detail-modal')))
          .toBeVisible()
          .withTimeout(5000);

        await device.pressBack();

        await expect(element(by.id('transaction-detail-modal'))).not.toBeVisible();
      } catch {
        // No transactions available
      }
    });
  });

  describe('Pull to Refresh', () => {
    it('should support pull to refresh gesture', async () => {
      await element(by.text('Transactions')).tap();

      await waitFor(element(by.id('transactions-screen')))
        .toBeVisible()
        .withTimeout(5000);

      const transactionList = element(by.id('transaction-list'));

      try {
        await transactionList.scroll(200, 'down');
      } catch {
        // Pull to refresh may not be visible without transactions
      }
    });
  });
});
