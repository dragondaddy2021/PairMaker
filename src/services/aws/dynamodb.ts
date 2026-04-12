/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

/**
 * AWS DynamoDB — 資料存取服務
 * 透過 API Gateway / Lambda 呼叫（不直接從 App 連 DynamoDB）
 */
import { AWS_CONFIG } from '../../config/aws';
import { getIdToken } from './cognito';

const BASE = `${AWS_CONFIG.apiGateway.baseUrl}/${AWS_CONFIG.apiGateway.stage}`;

async function apiFetch<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = await getIdToken().catch(() => '');
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

// ── Users Table ──────────────────────────────────────────────────────────────

export interface DDBUser {
  userId:    string;
  email:     string;
  nickname:  string;
  gender:    string;
  birthYear: number;
  avatar:    string;
  bio?:      string;
  points:    number;
  createdAt: string;
  updatedAt: string;
}

export const UsersDB = {
  get:    (userId: string)                  => apiFetch<DDBUser>('GET',    `/users/${userId}`),
  put:    (user: Partial<DDBUser> & { userId: string }) =>
                                               apiFetch<DDBUser>('PUT',    `/users/${user.userId}`, user),
  delete: (userId: string)                  => apiFetch<void>  ('DELETE', `/users/${userId}`),
  listNearby: (lat: number, lng: number, km = 10) =>
    apiFetch<DDBUser[]>('GET', `/users?lat=${lat}&lng=${lng}&km=${km}`),
};

// ── Matches Table ────────────────────────────────────────────────────────────

export interface DDBMatch {
  matchId:   string;
  userA:     string;
  userB:     string;
  status:    'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export const MatchesDB = {
  create: (userA: string, userB: string) =>
    apiFetch<DDBMatch>('POST', '/matches', { userA, userB }),
  get:    (matchId: string)              =>
    apiFetch<DDBMatch>('GET',  `/matches/${matchId}`),
  list:   (userId: string)              =>
    apiFetch<DDBMatch[]>('GET', `/matches?userId=${userId}`),
  update: (matchId: string, status: DDBMatch['status']) =>
    apiFetch<DDBMatch>('PATCH', `/matches/${matchId}`, { status }),
};

// ── Points Table ─────────────────────────────────────────────────────────────

export interface DDBPointRecord {
  recordId:  string;
  userId:    string;
  delta:     number;
  reason:    string;
  createdAt: string;
}

export const PointsDB = {
  add:    (userId: string, delta: number, reason: string) =>
    apiFetch<DDBPointRecord>('POST', '/points', { userId, delta, reason }),
  list:   (userId: string) =>
    apiFetch<DDBPointRecord[]>('GET', `/points?userId=${userId}`),
  balance: (userId: string) =>
    apiFetch<{ balance: number }>('GET', `/points/${userId}/balance`),
};
