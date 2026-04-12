/**
 * APP_010 — OTA 更新檢查（mock 驗證 UI 不崩潰）
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[APP_010] OTA 更新', () => {
  const loginPage = new LoginPage();

  it('APP_010-01: App 啟動時不因更新邏輯崩潰', async () => {
    await driver.waitUntil(
      () => loginPage.isVisible(),
      { timeout: 8000, timeoutMsg: '更新檢查導致 App 崩潰或卡死' },
    );
    expect(await loginPage.isVisible()).toBe(true);
  });
});
