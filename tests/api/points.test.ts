/**
 * API Tests — 積分模組
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { apiRequest, randomEmail, setAuthToken } from './helpers';

describe('Points API', () => {
  let userId = '';

  beforeAll(async () => {
    const email = randomEmail();
    await apiRequest('POST', '/auth/register', { email, password: 'Test@12345!', nickname: 'PointsTest' });
    const { body } = await apiRequest<any>('POST', '/auth/login', { email, password: 'Test@12345!' });
    setAuthToken(body.token);
    userId = body.userId;
  });

  it('GET /points/:id/balance — 新帳號餘額應為 0', async () => {
    const { status, body } = await apiRequest<any>('GET', `/points/${userId}/balance`);
    expect(status).toBe(200);
    expect(body.balance).toBe(0);
  });

  it('POST /points — 增加積分', async () => {
    const { status, body } = await apiRequest<any>('POST', '/points', {
      userId, delta: 100, reason: 'test_award',
    });
    expect(status).toBe(201);
    expect(body.delta).toBe(100);
  });

  it('GET /points/:id/balance — 加分後餘額應為 100', async () => {
    const { body } = await apiRequest<any>('GET', `/points/${userId}/balance`);
    expect(body.balance).toBe(100);
  });

  it('POST /points — 扣減積分', async () => {
    const { status } = await apiRequest<any>('POST', '/points', {
      userId, delta: -30, reason: 'test_deduct',
    });
    expect(status).toBe(201);
  });

  it('GET /points/:id/balance — 扣分後餘額應為 70', async () => {
    const { body } = await apiRequest<any>('GET', `/points/${userId}/balance`);
    expect(body.balance).toBe(70);
  });

  it('GET /points?userId=:id — 明細列表應有記錄', async () => {
    const { status, body } = await apiRequest<any>('GET', `/points?userId=${userId}`);
    expect(status).toBe(200);
    expect(body.length).toBeGreaterThanOrEqual(2);
  });
});
