/**
 * APP_008 — 優惠券兌換
 */
import { LoginPage } from '../pageObjects/LoginPage';

describe('[APP_008] 優惠券兌換', () => {
  const loginPage = new LoginPage();

  before(async () => {
    await loginPage.tapGuest();
  });

  it('APP_008-01: 有效優惠券應兌換成功', async () => {
    const mineTab = await $('~mine-tab');
    await mineTab.click();
    const couponBtn = await $('~coupon-button');
    await couponBtn.waitForDisplayed({ timeout: 5000 });
    await couponBtn.click();

    const couponInput = await $('~coupon-input');
    await couponInput.setValue('WELCOME100');
    const redeemBtn = await $('~redeem-button');
    await redeemBtn.click();

    const successMsg = await $('~coupon-success');
    await successMsg.waitForDisplayed({ timeout: 5000 });
    expect(await successMsg.isDisplayed()).toBe(true);
  });

  it('APP_008-02: 無效優惠券應顯示錯誤', async () => {
    const couponInput = await $('~coupon-input');
    await couponInput.clearValue();
    await couponInput.setValue('INVALID_CODE');
    const redeemBtn = await $('~redeem-button');
    await redeemBtn.click();

    const errorMsg = await $('~coupon-error');
    await errorMsg.waitForDisplayed({ timeout: 5000 });
    expect(await errorMsg.isDisplayed()).toBe(true);
  });
});
