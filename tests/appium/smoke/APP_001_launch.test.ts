/**
 * APP_001 — App 啟動與 Splash Screen
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[APP_001] App 啟動', () => {
  const loginPage = new LoginPage();

  it('APP_001-01: App 冷啟動應在 5 秒內顯示登入畫面', async () => {
    await driver.waitUntil(
      () => loginPage.isVisible(),
      { timeout: 5000, timeoutMsg: '登入畫面未在 5 秒內出現' },
    );
    expect(await loginPage.isVisible()).toBe(true);
  });

  it('APP_001-02: 訪客模式可跳過登入', async () => {
    await loginPage.tapGuest();
    const tabBar = await $('~tab-bar');
    await tabBar.waitForDisplayed({ timeout: 5000 });
    expect(await tabBar.isDisplayed()).toBe(true);
  });
});
