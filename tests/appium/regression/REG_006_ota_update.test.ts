/**
 * REG_006 — OTA 更新回歸（確保更新邏輯不影響一般啟動）
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[REG_006] OTA 更新不阻塞啟動', () => {
  const loginPage = new LoginPage();

  it('REG_006-01: 模擬無更新環境 — App 應正常啟動', async () => {
    // 設定環境變數讓 Updates mock 回傳 isAvailable=false（測試環境）
    await driver.waitUntil(
      () => loginPage.isVisible(),
      { timeout: 8000 },
    );
    expect(await loginPage.isVisible()).toBe(true);
  });
});
