/**
 * APP_005 — 情侶模式
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[APP_005] 情侶模式', () => {
  const loginPage = new LoginPage();

  before(async () => {
    await loginPage.tapGuest();
  });

  it('APP_005-01: 進入情侶模式不應崩潰', async () => {
    const coupleTab = await $('~couple-tab');
    await coupleTab.waitForDisplayed({ timeout: 5000 });
    await coupleTab.click();
    const coupleHome = await $('~couple-home');
    await coupleHome.waitForDisplayed({ timeout: 5000 });
    expect(await coupleHome.isDisplayed()).toBe(true);
  });

  it('APP_005-02: 情侶首頁應顯示紀念日', async () => {
    const anniversary = await $('~anniversary-display');
    await anniversary.waitForDisplayed({ timeout: 3000 });
    expect(await anniversary.isDisplayed()).toBe(true);
  });

  it('APP_005-03: 情侶任務列表可開啟', async () => {
    const tasksBtn = await $('~couple-tasks-button');
    await tasksBtn.waitForDisplayed({ timeout: 3000 });
    await tasksBtn.click();
    const tasksList = await $('~tasks-list');
    await tasksList.waitForDisplayed({ timeout: 4000 });
    expect(await tasksList.isDisplayed()).toBe(true);
  });
});
