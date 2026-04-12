/**
 * API Tests — 配對模組
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { apiRequest, randomEmail, setAuthToken } from './helpers';

describe('Matching API', () => {
  let userAId  = '';
  let userBId  = '';
  let matchId  = '';

  beforeAll(async () => {
    // 建立兩個測試帳號
    for (const [label, setter] of [['A', (v: string) => { userAId = v; }], ['B', (v: string) => { userBId = v; }]] as const) {
      const email = randomEmail();
      await apiRequest('POST', '/auth/register', { email, password: 'Test@12345!', nickname: `User${label}` });
      const { body } = await apiRequest<any>('POST', '/auth/login', { email, password: 'Test@12345!' });
      setter(body.userId);
    }
    setAuthToken((await apiRequest<any>('POST', '/auth/login', {
      email: userAId, password: 'Test@12345!',
    })).body.token);
  });

  it('POST /matches — 建立配對請求', async () => {
    const { status, body } = await apiRequest<any>('POST', '/matches', {
      userA: userAId, userB: userBId,
    });
    expect(status).toBe(201);
    expect(body.matchId).toBeTruthy();
    matchId = body.matchId;
  });

  it('GET /matches/:id — 取得配對詳情', async () => {
    const { status, body } = await apiRequest<any>('GET', `/matches/${matchId}`);
    expect(status).toBe(200);
    expect(body.status).toBe('pending');
  });

  it('PATCH /matches/:id — 接受配對', async () => {
    const { status, body } = await apiRequest<any>('PATCH', `/matches/${matchId}`, {
      status: 'accepted',
    });
    expect(status).toBe(200);
    expect(body.status).toBe('accepted');
  });

  it('GET /matches?userId=:id — 列出用戶所有配對', async () => {
    const { status, body } = await apiRequest<any>('GET', `/matches?userId=${userAId}`);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  it('POST /matches — 重複配對應返回 409', async () => {
    const { status } = await apiRequest<any>('POST', '/matches', {
      userA: userAId, userB: userBId,
    });
    expect(status).toBe(409);
  });
});
