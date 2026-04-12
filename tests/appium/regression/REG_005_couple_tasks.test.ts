/**
 * REG_005 — 情侶任務完整流程
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[REG_005] 情侶任務流程', () => {
  const loginPage = new LoginPage();

  before(async () => {
    await loginPage.tapGuest();
    const coupleTab = await $('~couple-tab');
    await coupleTab.click();
    const tasksBtn = await $('~couple-tasks-button');
    await tasksBtn.click();
  });

  it('REG_005-01: 任務列表應顯示至少一項任務', async () => {
    const taskItems = await $$('~task-item');
    expect(taskItems.length).toBeGreaterThan(0);
  });

  it('REG_005-02: 可標記任務完成', async () => {
    const firstTask = await $('~task-item');
    await firstTask.click();
    const completeBtn = await $('~task-complete-button');
    await completeBtn.waitForDisplayed({ timeout: 3000 });
    await completeBtn.click();
    const doneIcon = await $('~task-done-icon');
    await doneIcon.waitForDisplayed({ timeout: 3000 });
    expect(await doneIcon.isDisplayed()).toBe(true);
  });
});
