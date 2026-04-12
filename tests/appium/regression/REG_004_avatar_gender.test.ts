/**
 * REG_004 — 性別正確的頭像顯示
 */
import { LoginPage }  from '../pageObjects/LoginPage';
import { DatingPage } from '../pageObjects/DatingPage';

describe('[REG_004] 性別正確頭像', () => {
  const loginPage  = new LoginPage();
  const datingPage = new DatingPage();

  before(async () => {
    await loginPage.tapGuest();
  });

  it('REG_004-01: 女性用戶卡片應顯示女性頭像', async () => {
    await datingPage.tapFilter();
    const femaleChip = await $('~gender-chip-female');
    await femaleChip.click();
    const applyBtn = await $('~apply-filter-button');
    await applyBtn.click();
    await datingPage.tapResultsTab();

    const firstCard = await $('~user-card');
    await firstCard.waitForDisplayed({ timeout: 5000 });
    const avatar = await firstCard.$('~user-avatar');
    const src = await avatar.getAttribute('src');
    expect(src).toContain('women');
  });
});
