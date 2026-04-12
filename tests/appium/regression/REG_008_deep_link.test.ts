/**
 * REG_008 — Deep Link 回歸
 */
describe('[REG_008] Deep Link 處理', () => {
  it('REG_008-01: 優惠券 deep link 應開啟兌換頁面', async () => {
    await driver.execute('mobile: deepLink', {
      url:     'pairmaker://coupon?code=WELCOME100',
      package: 'com.pairmaker.app',
    });

    const couponPage = await $('~coupon-screen');
    await couponPage.waitForDisplayed({ timeout: 6000 });
    expect(await couponPage.isDisplayed()).toBe(true);
  });

  it('REG_008-02: 個人資料 deep link 應跳轉到對應用戶', async () => {
    await driver.execute('mobile: deepLink', {
      url:     'pairmaker://profile?uid=user_001',
      package: 'com.pairmaker.app',
    });

    const profilePage = await $('~user-profile-screen');
    await profilePage.waitForDisplayed({ timeout: 6000 });
    expect(await profilePage.isDisplayed()).toBe(true);
  });
});
