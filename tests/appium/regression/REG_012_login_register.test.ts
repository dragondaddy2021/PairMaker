/**
 * REG_012 — 登入/註冊切換回歸
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[REG_012] 登入/註冊切換', () => {
  const loginPage = new LoginPage();

  it('REG_012-01: 切換到註冊模式應顯示暱稱欄位', async () => {
    await loginPage.tapRegister();
    const nicknameInput = await $('~nickname-input');
    await nicknameInput.waitForDisplayed({ timeout: 3000 });
    expect(await nicknameInput.isDisplayed()).toBe(true);
  });

  it('REG_012-02: 切回登入模式暱稱欄位應消失', async () => {
    await $('~login-toggle').then(e => e.click());
    const nicknameInput = await $('~nickname-input');
    await driver.waitUntil(
      async () => !(await nicknameInput.isDisplayed().catch(() => false)),
      { timeout: 3000 },
    );
    expect(await nicknameInput.isDisplayed().catch(() => false)).toBe(false);
  });
});
