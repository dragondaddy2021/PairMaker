/**
 * APP_009 — Android BackHandler
 */
import { LoginPage }  from '../pageObjects/LoginPage';
import { DatingPage } from '../pageObjects/DatingPage';

describe('[APP_009] Android BackHandler', () => {
  const loginPage  = new LoginPage();
  const datingPage = new DatingPage();

  before(async () => {
    await loginPage.tapGuest();
  });

  it('APP_009-01: 在結果頁按返回應回到篩選頁', async () => {
    await datingPage.tapFilter();
    const applyBtn = await $('~apply-filter-button');
    await applyBtn.click();
    await datingPage.tapResultsTab();

    await driver.pressKeyCode(4); // Android BACK key
    const filterScreen = await $('~filter-screen');
    await filterScreen.waitForDisplayed({ timeout: 4000 });
    expect(await filterScreen.isDisplayed()).toBe(true);
  });

  it('APP_009-02: 在篩選頁按返回應回到主頁', async () => {
    await driver.pressKeyCode(4);
    const tabBar = await $('~tab-bar');
    await tabBar.waitForDisplayed({ timeout: 4000 });
    expect(await tabBar.isDisplayed()).toBe(true);
  });
});
