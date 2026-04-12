/**
 * APP_003 — 交友篩選功能
 */
import { LoginPage }  from '../pageObjects/LoginPage';
import { DatingPage } from '../pageObjects/DatingPage';

describe('[APP_003] 交友篩選', () => {
  const loginPage  = new LoginPage();
  const datingPage = new DatingPage();

  before(async () => {
    await loginPage.tapGuest();
  });

  it('APP_003-01: 點擊篩選按鈕應開啟 FilterScreen', async () => {
    await datingPage.tapFilter();
    const filterScreen = await $('~filter-screen');
    await filterScreen.waitForDisplayed({ timeout: 4000 });
    expect(await filterScreen.isDisplayed()).toBe(true);
  });

  it('APP_003-02: 套用篩選後應顯示結果', async () => {
    await datingPage.tapFilter();
    const applyBtn = await $('~apply-filter-button');
    await applyBtn.click();
    await datingPage.tapResultsTab();
    await driver.waitUntil(
      async () => (await datingPage.hasResults()) || (await datingPage.hasNoResults()),
      { timeout: 5000 },
    );
    const hasAny = (await datingPage.hasResults()) || (await datingPage.hasNoResults());
    expect(hasAny).toBe(true);
  });
});
