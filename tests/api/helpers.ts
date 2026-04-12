import fetch from 'node-fetch';

export const BASE_URL = process.env.API_BASE_URL
  ?? 'https://xxxxxxxxxx.execute-api.ap-northeast-1.amazonaws.com/prod';

export let authToken = '';

export function setAuthToken(token: string) {
  authToken = token;
}

export async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
): Promise<{ status: number; body: T }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type':  'application/json',
      ...(token ?? authToken ? { Authorization: `Bearer ${token ?? authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json() as T;
  return { status: res.status, body: json };
}

export function randomEmail() {
  return `test_${Date.now()}@pairmaker-test.app`;
}
