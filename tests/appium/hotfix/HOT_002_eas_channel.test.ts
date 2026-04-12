/**
 * HOT_002 — EAS Channel 無分支問題驗證
 * 修復原因：Channel preview 沒有綁定 branch，導致熱更新無法推送
 */
describe('[HOT_002] EAS Channel 熱更新驗證', () => {
  it('HOT_002-01: App 啟動時不因 Update 邏輯崩潰', async () => {
    await driver.waitUntil(
      async () => {
        const loginBtn = await $('~login-button').isDisplayed().catch(() => false);
        const tabBar   = await $('~tab-bar').isDisplayed().catch(() => false);
        return loginBtn || tabBar;
      },
      { timeout: 10000, timeoutMsg: 'App 疑似在更新邏輯中崩潰' },
    );
    const isAlive =
      (await $('~login-button').isDisplayed().catch(() => false)) ||
      (await $('~tab-bar').isDisplayed().catch(() => false));
    expect(isAlive).toBe(true);
  });
});
