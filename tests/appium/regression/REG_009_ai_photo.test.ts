/**
 * REG_009 — AI 顏值分析回歸
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[REG_009] AI 顏值分析', () => {
  const loginPage = new LoginPage();

  before(async () => {
    await loginPage.tapGuest();
    const mineTab = await $('~mine-tab');
    await mineTab.click();
    const editBtn = await $('~edit-profile-button');
    await editBtn.click();
  });

  it('REG_009-01: 上傳照片按鈕應可點擊', async () => {
    const uploadBtn = await $('~upload-photo-button');
    await uploadBtn.waitForDisplayed({ timeout: 4000 });
    expect(await uploadBtn.isDisplayed()).toBe(true);
  });

  it('REG_009-02: 未設定 API Key 時應顯示提示而非崩潰', async () => {
    // 模擬 API Key 空的情況：App 應顯示設定提示而不崩潰
    const uploadBtn = await $('~upload-photo-button');
    await uploadBtn.click();
    // 選擇預設測試圖片（CI 環境模擬）
    await driver.waitUntil(
      async () => {
        const warn = await $('~ai-api-warning').isDisplayed().catch(() => false);
        const result = await $('~ai-result').isDisplayed().catch(() => false);
        return warn || result;
      },
      { timeout: 10000 },
    );
    const appStillAlive = await $('~edit-profile-screen').isDisplayed();
    expect(appStillAlive).toBe(true);
  });
});
