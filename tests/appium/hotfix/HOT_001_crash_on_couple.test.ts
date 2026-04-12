/**
 * HOT_001 — 情侶模式崩潰修復驗證
 * 修復原因：CoupleHomeScreen 使用 TouchableOpacity 但未 import
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[HOT_001] 情侶模式崩潰修復', () => {
  const loginPage = new LoginPage();

  it('HOT_001-01: 情侶模式不應崩潰（TouchableOpacity import 修復）', async () => {
    await loginPage.tapGuest();
    const coupleTab = await $('~couple-tab');
    await coupleTab.waitForDisplayed({ timeout: 5000 });
    await coupleTab.click();

    const coupleHome = await $('~couple-home');
    await coupleHome.waitForDisplayed({ timeout: 5000 });
    expect(await coupleHome.isDisplayed()).toBe(true);
  });
});
