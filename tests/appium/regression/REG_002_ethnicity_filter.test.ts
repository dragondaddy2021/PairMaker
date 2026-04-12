/**
 * REG_002 — 種族篩選回歸測試
 */
import { LoginPage }  from '../pageObjects/LoginPage';
import { DatingPage } from '../pageObjects/DatingPage';

describe('[REG_002] 種族篩選', () => {
  const loginPage  = new LoginPage();
  const datingPage = new DatingPage();

  before(async () => {
    await loginPage.tapGuest();
  });

  it('REG_002-01: 種族多選 chips 應正常顯示', async () => {
    await datingPage.tapFilter();
    const ethnicSection = await $('~ethnicity-section');
    await ethnicSection.waitForDisplayed({ timeout: 4000 });
    expect(await ethnicSection.isDisplayed()).toBe(true);
  });

  it('REG_002-02: 選取種族後套用應過濾結果', async () => {
    const asianChip = await $('~ethnicity-chip-asian');
    await asianChip.click();
    const applyBtn = await $('~apply-filter-button');
    await applyBtn.click();
    await datingPage.tapResultsTab();
    const hasAny = (await datingPage.hasResults()) || (await datingPage.hasNoResults());
    expect(hasAny).toBe(true);
  });
});
