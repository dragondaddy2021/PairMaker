/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

/**
 * Feature Flag 設定檔
 * 所有功能開關統一在此管理，方便 A/B 測試或灰度發布
 */
export const FEATURE_FLAGS = {
  // AI 功能
  AI_MATCH_ANALYSIS: true,        // AI 配對分析
  AI_DATE_SUGGESTIONS: true,      // AI 約會建議
  AI_COMPATIBILITY_REPORT: false, // AI 深度相容報告（開發中）

  // 地圖功能
  GOOGLE_MAPS_ENABLED: true,      // Google Maps 整合
  NEARBY_USERS: false,            // 附近用戶（需要後端）

  // 伴侶模式
  COUPLE_MODE: true,              // 伴侶模式
  COUPLE_DIARY: true,             // 伴侶日記
  COUPLE_ANNIVERSARY: true,       // 紀念日提醒
  COUPLE_DATE_PLAN: true,         // 約會計畫

  // 點數系統
  POINTS_SYSTEM: true,            // 點數系統
  POINTS_PURCHASE: false,         // 點數購買（需串金流）
  DAILY_CHECK_IN: true,           // 每日簽到

  // 通知
  PUSH_NOTIFICATIONS: false,      // 推播通知（需後端）
  LOCAL_NOTIFICATIONS: true,      // 本地通知

  // 安全性
  JWT_AUTH: false,                // JWT 驗證（Demo 用 Mock）
  BIOMETRIC_AUTH: false,          // 生物辨識登入

  // 社交功能
  LIKE_SYSTEM: true,              // 喜歡功能
  SUPER_LIKE: true,               // 超級喜歡
  BLOCK_USER: true,               // 封鎖用戶
  REPORT_USER: true,              // 檢舉用戶
} as const;

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

export const isFeatureEnabled = (flag: FeatureFlagKey): boolean => {
  return FEATURE_FLAGS[flag];
};
