/**
 * API Tests — 用戶模組
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { apiRequest, randomEmail, setAuthToken } from './helpers';

describe('Users API', () => {
  let userId = '';

  beforeAll(async () => {
    const email = randomEmail();
    await apiRequest('POST', '/auth/register', {
      email, password: 'Test@12345!', nickname: 'UserTest',
    });
    const { body } = await apiRequest<any>('POST', '/auth/login', {
      email, password: 'Test@12345!',
    });
    setAuthToken(body.token);
    userId = body.userId;
  });

  it('GET /users/:id — 取得自己的資料', async () => {
    const { status, body } = await apiRequest<any>('GET', `/users/${userId}`);
    expect(status).toBe(200);
    expect(body.userId).toBe(userId);
  });

  it('PUT /users/:id — 更新暱稱', async () => {
    const { status, body } = await apiRequest<any>('PUT', `/users/${userId}`, {
      userId, nickname: 'UpdatedName',
    });
    expect(status).toBe(200);
    expect(body.nickname).toBe('UpdatedName');
  });

  it('GET /users — 附近用戶列表（需 lat/lng）', async () => {
    const { status, body } = await apiRequest<any>('GET', '/users?lat=25.04&lng=121.53&km=10');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it('GET /users/:id — 不存在 ID 應返回 404', async () => {
    const { status } = await apiRequest<any>('GET', '/users/nonexistent_id_xyz');
    expect(status).toBe(404);
  });

  it('GET /users/:id — 未授權應返回 401', async () => {
    const { status } = await apiRequest<any>('GET', `/users/${userId}`, undefined, '');
    expect(status).toBe(401);
  });
});
