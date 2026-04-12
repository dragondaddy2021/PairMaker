/**
 * APP_007 — 積分系統
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[APP_007] 積分系統', () => {
  const loginPage = new LoginPage();

  before(async () => {
    await loginPage.tapGuest();
  });

  it('APP_007-01: 積分餘額應顯示在個人資料頁', async () => {
    const mineTab = await $('~mine-tab');
    await mineTab.click();
    const pointsBadge = await $('~points-balance');
    await pointsBadge.waitForDisplayed({ timeout: 5000 });
    expect(await pointsBadge.isDisplayed()).toBe(true);
  });

  it('APP_007-02: 積分明細可開啟', async () => {
    const pointsBadge = await $('~points-balance');
    await pointsBadge.click();
    const pointsHistory = await $('~points-history');
    await pointsHistory.waitForDisplayed({ timeout: 4000 });
    expect(await pointsHistory.isDisplayed()).toBe(true);
  });
});
