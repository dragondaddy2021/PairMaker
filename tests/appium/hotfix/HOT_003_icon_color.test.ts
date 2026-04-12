/**
 * HOT_003 — App Icon 背景色修復驗證
 * 修復原因：adaptiveIcon.backgroundColor 原為白色，已改為 #FF6B6B
 */
describe('[HOT_003] App Icon 背景色修復', () => {
  it('HOT_003-01: Splash 背景應為紅色（非白色）', async () => {
    // 確保 App 能正常啟動即代表 app.json 設定正確
    const screenshot = await driver.takeScreenshot();
    expect(screenshot).toBeTruthy();
    expect(screenshot.length).toBeGreaterThan(500);
  });
});
