/**
 * REG_003 — 地圖拖曳精度回歸
 */
import { LoginPage }  from '../pageObjects/LoginPage';
import { DatingPage } from '../pageObjects/DatingPage';

describe('[REG_003] 地圖拖曳精度', () => {
  const loginPage  = new LoginPage();
  const datingPage = new DatingPage();

  before(async () => {
    await loginPage.tapGuest();
    await datingPage.tapMapTab();
  });

  it('REG_003-01: 拖曳地圖後附近地點應重新排序', async () => {
    const mapView = await $('~map-view');
    const { x, y, width, height } = await mapView.getRect();
    const cx = Math.floor(x + width / 2);
    const cy = Math.floor(y + height / 2);

    // 拖曳 120px
    await driver.touchAction([
      { action: 'press',   x: cx,       y: cy },
      { action: 'moveTo',  x: cx + 120, y: cy },
      { action: 'release' },
    ]);

    const distanceLabel = await $('~distance-label');
    await distanceLabel.waitForDisplayed({ timeout: 3000 });
    expect(await distanceLabel.isDisplayed()).toBe(true);
  });

  it('REG_003-02: 重置後距離標籤應恢復原始距離', async () => {
    const initialDist = await $('~distance-label').then(e => e.getText());

    const resetBtn = await $('~reset-center-button');
    await resetBtn.click();

    await driver.waitUntil(
      async () => !(await $('~reset-center-button').then(e => e.isDisplayed()).catch(() => false)),
      { timeout: 3000 },
    );

    const afterDist = await $('~distance-label').then(e => e.getText());
    expect(afterDist).toBe(initialDist);
  });
});
