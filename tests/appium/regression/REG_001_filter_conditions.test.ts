/**
 * REG_001 — 雙性別分條件篩選回歸測試
 */
import { LoginPage }  from '../pageObjects/LoginPage';
import { DatingPage } from '../pageObjects/DatingPage';

describe('[REG_001] 雙性別分條件篩選', () => {
  const loginPage  = new LoginPage();
  const datingPage = new DatingPage();

  before(async () => {
    await loginPage.tapGuest();
  });

  it('REG_001-01: 同時選男女應出現性別條件分頁', async () => {
    await datingPage.tapFilter();
    const maleChip   = await $('~gender-chip-male');
    const femaleChip = await $('~gender-chip-female');
    await maleChip.click();
    await femaleChip.click();

    const genderTabBar = await $('~gender-tab-bar');
    await genderTabBar.waitForDisplayed({ timeout: 3000 });
    expect(await genderTabBar.isDisplayed()).toBe(true);
  });

  it('REG_001-02: 男女條件可獨立設定', async () => {
    const maleTab = await $('~gender-tab-male');
    await maleTab.click();
    const maleAgeMin = await $('~age-min-input');
    await maleAgeMin.setValue('25');

    const femaleTab = await $('~gender-tab-female');
    await femaleTab.click();
    const femaleAgeMin = await $('~age-min-input');
    const femaleVal = await femaleAgeMin.getValue();
    expect(femaleVal).not.toBe('25'); // 獨立狀態
  });

  it('REG_001-03: 套用雙性別篩選後結果頁應有性別徽章', async () => {
    const applyBtn = await $('~apply-filter-button');
    await applyBtn.click();
    await datingPage.tapResultsTab();

    const badge = await $('~gender-badge');
    await badge.waitForDisplayed({ timeout: 5000 });
    expect(await badge.isDisplayed()).toBe(true);
  });
});
