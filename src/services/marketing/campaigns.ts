/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

/**
 * 行銷活動管理 — 優惠券 / 首次登入禮 / 活動積分
 */
import { PointsDB } from '../aws/dynamodb';

// ── 優惠券兌換 ────────────────────────────────────────────────────────────────

const VALID_COUPONS: Record<string, { points: number; desc: string }> = {
  WELCOME100: { points: 100, desc: '新用戶歡迎禮' },
  SUMMER2024: { points: 50,  desc: '夏日特惠' },
  BETA_TESTER: { points: 200, desc: 'Beta 測試感謝' },
};

export interface CouponResult {
  success:  boolean;
  message:  string;
  points?:  number;
}

export async function redeemCoupon(
  userId: string,
  code: string,
): Promise<CouponResult> {
  const coupon = VALID_COUPONS[code.toUpperCase()];
  if (!coupon) return { success: false, message: '無效的優惠券代碼' };

  try {
    await PointsDB.add(userId, coupon.points, `優惠券兌換：${code}`);
    return { success: true, message: `兌換成功！獲得 ${coupon.points} 點`, points: coupon.points };
  } catch {
    return { success: false, message: '兌換失敗，請稍後再試' };
  }
}

// ── 首次登入禮 ────────────────────────────────────────────────────────────────

const FIRST_LOGIN_POINTS = 50;

export async function grantFirstLoginBonus(userId: string): Promise<void> {
  const balance = await PointsDB.balance(userId);
  if (balance.balance === 0) {
    await PointsDB.add(userId, FIRST_LOGIN_POINTS, '首次登入禮');
  }
}

// ── 邀請獎勵 ─────────────────────────────────────────────────────────────────

const REFERRAL_POINTS_REFERRER = 100;
const REFERRAL_POINTS_INVITEE  = 30;

export async function processReferral(
  referrerId: string,
  inviteeId: string,
): Promise<void> {
  await Promise.all([
    PointsDB.add(referrerId, REFERRAL_POINTS_REFERRER, `邀請好友獎勵（被邀請者：${inviteeId}）`),
    PointsDB.add(inviteeId,  REFERRAL_POINTS_INVITEE,  `接受邀請獎勵（邀請者：${referrerId}）`),
  ]);
}

// ── 活動積分計算 ──────────────────────────────────────────────────────────────

export type ActivityType =
  | 'complete_profile'
  | 'upload_photo'
  | 'first_match'
  | 'daily_login'
  | 'send_message';

const ACTIVITY_POINTS: Record<ActivityType, number> = {
  complete_profile: 80,
  upload_photo:     20,
  first_match:      50,
  daily_login:      10,
  send_message:      2,
};

export async function awardActivity(
  userId: string,
  activity: ActivityType,
): Promise<number> {
  const pts = ACTIVITY_POINTS[activity];
  await PointsDB.add(userId, pts, `活動獎勵：${activity}`);
  return pts;
}
