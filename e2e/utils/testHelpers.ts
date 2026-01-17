import { device, element, by, waitFor } from 'detox';

export async function reloadApp(): Promise<void> {
  await device.reloadReactNative();
}

export async function waitForElement(
  testID: string,
  timeout = 10000
): Promise<Detox.IndexableNativeElement> {
  const el = element(by.id(testID));
  await waitFor(el).toBeVisible().withTimeout(timeout);
  return el;
}

export async function waitForText(text: string, timeout = 10000): Promise<void> {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
}

export async function tapElement(testID: string): Promise<void> {
  await element(by.id(testID)).tap();
}

export async function tapText(text: string): Promise<void> {
  await element(by.text(text)).tap();
}

export async function typeText(testID: string, text: string): Promise<void> {
  await element(by.id(testID)).typeText(text);
}

export async function clearAndTypeText(testID: string, text: string): Promise<void> {
  const el = element(by.id(testID));
  await el.clearText();
  await el.typeText(text);
}

export async function scrollDown(testID: string, distance = 500): Promise<void> {
  await element(by.id(testID)).scroll(distance, 'down');
}

export async function scrollUp(testID: string, distance = 500): Promise<void> {
  await element(by.id(testID)).scroll(distance, 'up');
}

export async function expectElementToBeVisible(testID: string): Promise<void> {
  await expect(element(by.id(testID))).toBeVisible();
}

export async function expectElementNotToBeVisible(testID: string): Promise<void> {
  await expect(element(by.id(testID))).not.toBeVisible();
}

export async function expectTextToBeVisible(text: string): Promise<void> {
  await expect(element(by.text(text))).toBeVisible();
}

export async function pressBack(): Promise<void> {
  await device.pressBack();
}

export async function takeScreenshot(name: string): Promise<void> {
  await device.takeScreenshot(name);
}
