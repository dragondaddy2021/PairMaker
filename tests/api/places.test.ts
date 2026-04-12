/**
 * API Tests — 地點模組
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { apiRequest, randomEmail, setAuthToken } from './helpers';

describe('Places API', () => {
  beforeAll(async () => {
    const email = randomEmail();
    await apiRequest('POST', '/auth/register', { email, password: 'Test@12345!', nickname: 'PlaceTest' });
    const { body } = await apiRequest<any>('POST', '/auth/login', { email, password: 'Test@12345!' });
    setAuthToken(body.token);
  });

  it('GET /places — 附近地點列表', async () => {
    const { status, body } = await apiRequest<any>('GET', '/places?lat=25.04776&lng=121.53185&km=2');
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it('GET /places?type=restaurant — 按類型篩選', async () => {
    const { status, body } = await apiRequest<any>('GET', '/places?lat=25.04776&lng=121.53185&type=restaurant');
    expect(status).toBe(200);
    if (body.length > 0) {
      expect(body[0].type).toBe('restaurant');
    }
  });

  it('GET /places — 無 lat/lng 應返回 400', async () => {
    const { status } = await apiRequest<any>('GET', '/places');
    expect(status).toBe(400);
  });
});
