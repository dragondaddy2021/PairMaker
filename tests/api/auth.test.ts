/**
 * API Tests — 認證模組
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { apiRequest, randomEmail, setAuthToken } from './helpers';

const email    = randomEmail();
const password = 'Test@12345!';
const nickname = 'TestUser';

describe('Auth API', () => {
  let userId = '';

  it('POST /auth/register — 正常註冊', async () => {
    const { status, body } = await apiRequest<any>('POST', '/auth/register', {
      email, password, nickname,
    });
    expect(status).toBe(201);
    expect(body.userId).toBeTruthy();
    userId = body.userId;
  });

  it('POST /auth/register — 重複 email 應返回 409', async () => {
    const { status } = await apiRequest<any>('POST', '/auth/register', {
      email, password, nickname,
    });
    expect(status).toBe(409);
  });

  it('POST /auth/login — 正確帳密應返回 token', async () => {
    const { status, body } = await apiRequest<any>('POST', '/auth/login', {
      email, password,
    });
    expect(status).toBe(200);
    expect(body.token).toBeTruthy();
    setAuthToken(body.token);
  });

  it('POST /auth/login — 錯誤密碼應返回 401', async () => {
    const { status } = await apiRequest<any>('POST', '/auth/login', {
      email, password: 'wrongpass',
    });
    expect(status).toBe(401);
  });

  it('POST /auth/forgot-password — 存在的 email 應送出驗證碼', async () => {
    const { status } = await apiRequest<any>('POST', '/auth/forgot-password', { email });
    expect([200, 204]).toContain(status);
  });

  it('GET /auth/me — 已登入應返回用戶資料', async () => {
    const { status, body } = await apiRequest<any>('GET', '/auth/me');
    expect(status).toBe(200);
    expect(body.email).toBe(email);
  });
});
