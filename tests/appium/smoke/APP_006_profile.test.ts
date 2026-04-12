/**
 * APP_006 — 個人資料頁
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[APP_006] 個人資料', () => {
  const loginPage = new LoginPage();

  before(async () => {
    await loginPage.tapGuest();
  });

  it('APP_006-01: 個人資料頁應正常顯示', async () => {
    const mineTab = await $('~mine-tab');
    await mineTab.waitForDisplayed({ timeout: 5000 });
    await mineTab.click();
    const profileScreen = await $('~profile-screen');
    await profileScreen.waitForDisplayed({ timeout: 5000 });
    expect(await profileScreen.isDisplayed()).toBe(true);
  });

  it('APP_006-02: 編輯資料按鈕可點擊', async () => {
    const editBtn = await $('~edit-profile-button');
    await editBtn.waitForDisplayed({ timeout: 3000 });
    await editBtn.click();
    const editScreen = await $('~edit-profile-screen');
    await editScreen.waitForDisplayed({ timeout: 4000 });
    expect(await editScreen.isDisplayed()).toBe(true);
  });
});
