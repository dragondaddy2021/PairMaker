/**
 * APP_002 — 登入流程
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[APP_002] 登入流程', () => {
  const loginPage = new LoginPage();
  const TEST_EMAIL    = process.env.TEST_USER_EMAIL    ?? 'test@pairmaker.app';
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD ?? 'Test@12345';

  beforeEach(async () => {
    await driver.reloadSession();
  });

  it('APP_002-01: 有效帳號應登入成功', async () => {
    await loginPage.fillEmail(TEST_EMAIL);
    await loginPage.fillPassword(TEST_PASSWORD);
    await loginPage.tapLogin();
    const tabBar = await $('~tab-bar');
    await tabBar.waitForDisplayed({ timeout: 8000 });
    expect(await tabBar.isDisplayed()).toBe(true);
  });

  it('APP_002-02: 錯誤密碼應顯示錯誤訊息', async () => {
    await loginPage.fillEmail(TEST_EMAIL);
    await loginPage.fillPassword('wrongpassword');
    await loginPage.tapLogin();
    await driver.waitUntil(() => loginPage.getErrorMessage().then(t => t.length > 0), {
      timeout: 5000,
    });
    const msg = await loginPage.getErrorMessage();
    expect(msg).toBeTruthy();
  });

  it('APP_002-03: 空白欄位應阻止送出', async () => {
    await loginPage.tapLogin();
    expect(await loginPage.isVisible()).toBe(true);
  });
});
