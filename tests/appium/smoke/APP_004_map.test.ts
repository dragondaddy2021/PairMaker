/**
 * APP_004 — 地圖功能
 */
import { LoginPage }  from '../pageObjects/LoginPage';
import { DatingPage } from '../pageObjects/DatingPage';

describe('[APP_004] 地圖功能', () => {
  const loginPage  = new LoginPage();
  const datingPage = new DatingPage();

  before(async () => {
    await loginPage.tapGuest();
  });

  it('APP_004-01: 切換至地圖頁籤應顯示地圖', async () => {
    await datingPage.tapMapTab();
    const mapView = await $('~map-view');
    await mapView.waitForDisplayed({ timeout: 6000 });
    expect(await mapView.isDisplayed()).toBe(true);
  });

  it('APP_004-02: 地圖可拖曳', async () => {
    const mapView = await $('~map-view');
    const { x, y, width, height } = await mapView.getRect();
    const cx = Math.floor(x + width / 2);
    const cy = Math.floor(y + height / 2);

    await driver.touchAction([
      { action: 'press',   x: cx,      y: cy      },
      { action: 'moveTo',  x: cx + 80, y: cy      },
      { action: 'release' },
    ]);

    const resetBtn = await $('~reset-center-button');
    await resetBtn.waitForDisplayed({ timeout: 3000 });
    expect(await resetBtn.isDisplayed()).toBe(true);
  });

  it('APP_004-03: 重置按鈕應回到原點', async () => {
    const resetBtn = await $('~reset-center-button');
    await resetBtn.click();
    await driver.waitUntil(
      async () => !(await resetBtn.isDisplayed()),
      { timeout: 3000 },
    );
    expect(await resetBtn.isDisplayed()).toBe(false);
  });
});
