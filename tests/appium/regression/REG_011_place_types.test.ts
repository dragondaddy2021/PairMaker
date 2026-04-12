/**
 * REG_011 — 地點類型全選/單選回歸
 */
import { LoginPage }  from '../pageObjects/LoginPage';
import { DatingPage } from '../pageObjects/DatingPage';

describe('[REG_011] 地點類型篩選', () => {
  const loginPage  = new LoginPage();
  const datingPage = new DatingPage();

  before(async () => {
    await loginPage.tapGuest();
    await datingPage.tapMapTab();
  });

  it('REG_011-01: 「全部」chip 應預設選中', async () => {
    const allChip = await $('~type-chip-all');
    await allChip.waitForDisplayed({ timeout: 4000 });
    const isActive = await allChip.getAttribute('data-active');
    expect(isActive).toBe('true');
  });

  it('REG_011-02: 點擊單一類型應取消全選', async () => {
    const restaurantChip = await $('~type-chip-restaurant');
    await restaurantChip.click();
    const allChip = await $('~type-chip-all');
    const isActive = await allChip.getAttribute('data-active');
    expect(isActive).toBe('false');
  });
});
