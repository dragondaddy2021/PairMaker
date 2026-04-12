/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

/**
 * Deep Links — 動態連結服務
 */
import { Linking } from 'react-native';

const WEB_PREFIX = process.env.EXPO_PUBLIC_FIREBASE_DYNAMIC_LINKS_PREFIX
  ?? 'https://pairmaker.page.link';

// ── 建立分享連結 ─────────────────────────────────────────────────────────────

export function buildProfileLink(userId: string): string {
  return `${WEB_PREFIX}/profile?uid=${userId}`;
}

export function buildCouponLink(code: string): string {
  return `${WEB_PREFIX}/coupon?code=${code}`;
}

export function buildInviteLink(referrerId: string): string {
  return `${WEB_PREFIX}/invite?ref=${referrerId}`;
}

// ── 解析 Deep Link ──────────────────────────────────────────────────────────

export interface ParsedLink {
  type: 'profile' | 'coupon' | 'invite' | 'unknown';
  params: Record<string, string>;
}

export function parseDeepLink(url: string): ParsedLink {
  let path   = '';
  const params: Record<string, string> = {};

  try {
    const parsed = new URL(url);
    path = parsed.pathname;
    parsed.searchParams.forEach((v, k) => { params[k] = v; });
  } catch {
    // 非標準 URL（pairmaker://profile?uid=xxx）
    const [schemePath, query = ''] = url.split('?');
    path = schemePath.split('://')[1] ?? schemePath;
    query.split('&').forEach((pair) => {
      const [k, v] = pair.split('=');
      if (k) params[k] = decodeURIComponent(v ?? '');
    });
  }

  if (path.includes('profile')) return { type: 'profile', params };
  if (path.includes('coupon'))  return { type: 'coupon',  params };
  if (path.includes('invite'))  return { type: 'invite',  params };
  return { type: 'unknown', params };
}

// ── 取得初始 URL（App 冷啟動）────────────────────────────────────────────────

export async function getInitialDeepLink(): Promise<ParsedLink | null> {
  const url = await Linking.getInitialURL();
  if (!url) return null;
  return parseDeepLink(url);
}

// ── 訂閱後續 Deep Link ───────────────────────────────────────────────────────

export function subscribeDeepLinks(
  handler: (link: ParsedLink) => void,
): () => void {
  const sub = Linking.addEventListener('url', ({ url }: { url: string }) => {
    handler(parseDeepLink(url));
  });
  return () => sub.remove();
}
