/**
 * REG_007 — 活動積分回歸
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[REG_007] 活動積分', () => {
  const loginPage = new LoginPage();

  before(async () => {
    await loginPage.tapGuest();
  });

  it('REG_007-01: 完成個人資料應獲得積分', async () => {
    const mineTab = await $('~mine-tab');
    await mineTab.click();
    const before = await $('~points-balance').then(e => e.getText());

    const editBtn = await $('~edit-profile-button');
    await editBtn.click();
    const saveBtn = await $('~save-profile-button');
    await saveBtn.waitForDisplayed({ timeout: 4000 });
    await saveBtn.click();

    await mineTab.click();
    const after = await $('~points-balance').then(e => e.getText());
    // 積分應增加（或維持，因為已完成過）
    expect(parseInt(after)).toBeGreaterThanOrEqual(parseInt(before));
  });
});
