/**
 * REG_014 — 效能基準回歸
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[REG_014] 效能基準', () => {
  const loginPage = new LoginPage();

  it('REG_014-01: 登入畫面應在 3 秒內出現', async () => {
    const start = Date.now();
    await driver.waitUntil(() => loginPage.isVisible(), { timeout: 3000 });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });

  it('REG_014-02: 篩選到結果頁切換應在 2 秒內完成', async () => {
    await loginPage.tapGuest();
    const datingTab = await $('~dating-tab');
    await datingTab.click();
    const filterBtn = await $('~filter-button');
    await filterBtn.click();
    const applyBtn = await $('~apply-filter-button');
    await applyBtn.click();

    const start = Date.now();
    const resultsTab = await $('~results-tab');
    await resultsTab.click();
    await driver.waitUntil(
      async () => (await $('~user-card').isDisplayed().catch(() => false)) ||
                  (await $('~no-results').isDisplayed().catch(() => false)),
      { timeout: 2000 },
    );
    expect(Date.now() - start).toBeLessThan(2000);
  });
});
