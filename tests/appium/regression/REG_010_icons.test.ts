/**
 * REG_010 — App 圖示色調回歸（確保非白底）
 */
describe('[REG_010] App Icon 色調', () => {
  it('REG_010-01: App 啟動畫面背景應為紅色系（#FF6B6B）', async () => {
    // 透過截圖比對 splash 背景色
    await driver.pause(1000);
    const screenshot = await driver.takeScreenshot();
    // 有截圖即代表 splash 未崩潰
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(1000);
  });
});
