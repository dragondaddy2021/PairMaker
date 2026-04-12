/**
 * API Tests — 優惠券模組
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { apiRequest, randomEmail, setAuthToken } from './helpers';

describe('Coupon API', () => {
  let userId = '';

  beforeAll(async () => {
    const email = randomEmail();
    await apiRequest('POST', '/auth/register', { email, password: 'Test@12345!', nickname: 'CouponTest' });
    const { body } = await apiRequest<any>('POST', '/auth/login', { email, password: 'Test@12345!' });
    setAuthToken(body.token);
    userId = body.userId;
  });

  it('POST /coupons/redeem — 有效優惠券應兌換成功', async () => {
    const { status, body } = await apiRequest<any>('POST', '/coupons/redeem', {
      userId, code: 'WELCOME100',
    });
    expect(status).toBe(200);
    expect(body.points).toBe(100);
  });

  it('POST /coupons/redeem — 無效優惠券應返回 400', async () => {
    const { status } = await apiRequest<any>('POST', '/coupons/redeem', {
      userId, code: 'FAKE_CODE',
    });
    expect(status).toBe(400);
  });

  it('POST /coupons/redeem — 重複兌換同一券應返回 409', async () => {
    const { status } = await apiRequest<any>('POST', '/coupons/redeem', {
      userId, code: 'WELCOME100',
    });
    expect(status).toBe(409);
  });
});
