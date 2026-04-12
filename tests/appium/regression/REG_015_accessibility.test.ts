/**
 * REG_015 — 無障礙標籤回歸
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[REG_015] 無障礙標籤', () => {
  const loginPage = new LoginPage();

  it('REG_015-01: 關鍵元素應有 accessibilityLabel', async () => {
    await driver.waitUntil(() => loginPage.isVisible(), { timeout: 8000 });

    const elements = [
      '~email-input',
      '~password-input',
      '~login-button',
      '~guest-button',
    ];

    for (const sel of elements) {
      const el = await $(sel);
      expect(await el.isDisplayed()).toBe(true);
    }
  });
});
