/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PointTransaction, AppMode } from '../types';
import {
  TaskDefinition,
  DATING_DAILY_CAP,
  COUPLE_BONUS_MULTIPLIER,
} from '../config/taskConfig';

// ─── AsyncStorage 鍵值 ────────────────────────────────────────────────────────

const KEYS = {
  POINTS:      '@pm:points',
  TRANSACTIONS:'@pm:transactions',
  COMPLETIONS: '@pm:completions',
} as const;

// ─── 型別 ─────────────────────────────────────────────────────────────────────

export interface PersistedPointsData {
  points: number;
  transactions: PointTransaction[];
  /** taskId → ISO timestamp 陣列（所有歷史，不只今日） */
  completions: Record<string, string[]>;
}

export interface CompleteTaskResult {
  success: boolean;
  points: number;
  isBonus: boolean;
  message: string;
}

// ─── AsyncStorage I/O ─────────────────────────────────────────────────────────

/**
 * 從 AsyncStorage 載入所有點數相關資料
 * 若讀取失敗或無資料，回傳預設值（不拋出例外）
 */
export const loadPersistedPoints = async (): Promise<PersistedPointsData> => {
  try {
    const pairs = await AsyncStorage.multiGet([
      KEYS.POINTS,
      KEYS.TRANSACTIONS,
      KEYS.COMPLETIONS,
    ]);
    const map: Record<string, string | null> = Object.fromEntries(
      pairs.map(([k, v]) => [k, v]),
    );

    const points = map[KEYS.POINTS] != null
      ? parseInt(map[KEYS.POINTS]!, 10)
      : 100;

    const transactions: PointTransaction[] = map[KEYS.TRANSACTIONS]
      ? (JSON.parse(map[KEYS.TRANSACTIONS]!) as PointTransaction[])
      : [];

    const completions: Record<string, string[]> = map[KEYS.COMPLETIONS]
      ? (JSON.parse(map[KEYS.COMPLETIONS]!) as Record<string, string[]>)
      : {};

    return { points: isNaN(points) ? 100 : points, transactions, completions };
  } catch (e) {
    console.warn('[pointsService] loadPersistedPoints failed:', e);
    return { points: 100, transactions: [], completions: {} };
  }
};

/**
 * 將點數資料一次性寫入 AsyncStorage
 * 交易記錄最多保留 200 筆
 */
export const persistPoints = async (data: PersistedPointsData): Promise<void> => {
  try {
    const trimmedTx = data.transactions.slice(0, 200);
    await AsyncStorage.multiSet([
      [KEYS.POINTS,       String(data.points)],
      [KEYS.TRANSACTIONS, JSON.stringify(trimmedTx)],
      [KEYS.COMPLETIONS,  JSON.stringify(data.completions)],
    ]);
  } catch (e) {
    console.warn('[pointsService] persistPoints failed:', e);
  }
};

// ─── 日期工具 ─────────────────────────────────────────────────────────────────

/** 今日的 ISO 日期字串（e.g. "2025-04-11"） */
export const todayDateKey = (): string =>
  new Date().toISOString().split('T')[0];

/** 某任務今日已完成次數 */
export const getCompletionsToday = (
  taskId: string,
  completions: Record<string, string[]>,
): number => {
  const today = todayDateKey();
  return (completions[taskId] ?? []).filter((ts) => ts.startsWith(today)).length;
};

/** 今日在指定模式下已獲得的點數（earn only） */
export const getTodayEarnedPoints = (
  transactions: PointTransaction[],
  mode: AppMode,
): number => {
  const today = todayDateKey();
  return transactions
    .filter(
      (tx) =>
        tx.type === 'earn' &&
        tx.mode === mode &&
        tx.timestamp.startsWith(today),
    )
    .reduce((sum, tx) => sum + tx.amount, 0);
};

// ─── 任務驗證 ─────────────────────────────────────────────────────────────────

export interface CanCompleteResult {
  allowed: boolean;
  reason?: string;
}

/**
 * 驗證是否可完成指定任務
 */
export const canCompleteTask = (
  task: TaskDefinition,
  completions: Record<string, string[]>,
  transactions: PointTransaction[],
  appMode: AppMode,
): CanCompleteResult => {
  // 模式不符
  if (task.mode !== appMode) {
    return { allowed: false, reason: '此任務不適用於目前模式' };
  }

  // 每日次數上限
  if (task.dailyLimit !== undefined) {
    const count = getCompletionsToday(task.id, completions);
    if (count >= task.dailyLimit) {
      return {
        allowed: false,
        reason: `今日已達上限（${task.dailyLimit} 次）`,
      };
    }
  }

  // 交友模式每日點數總上限
  if (appMode === 'dating') {
    const todayPts = getTodayEarnedPoints(transactions, 'dating');
    if (todayPts >= DATING_DAILY_CAP) {
      return {
        allowed: false,
        reason: `今日點數已達上限（${DATING_DAILY_CAP} 點）`,
      };
    }
  }

  return { allowed: true };
};

// ─── 點數計算 ─────────────────────────────────────────────────────────────────

/**
 * 計算任務實際獲得點數（伴侶模式套用 x1.5 加成）
 */
export const calcEarnedPoints = (
  task: TaskDefinition,
  appMode: AppMode,
  partnerAlsoCompleted = true,   // Demo: 預設視為雙方同時完成
): { points: number; isBonus: boolean } => {
  if (appMode === 'couple' && task.mode === 'couple' && partnerAlsoCompleted) {
    return {
      points: Math.round(task.points * COUPLE_BONUS_MULTIPLIER),
      isBonus: true,
    };
  }
  return { points: task.points, isBonus: false };
};

// ─── 舊版相容（保留給 UserCard/ProfileModal 使用）─────────────────────────────

export const POINTS_CONFIG_COMPAT = {
  LIKE_COST: 5,
  SUPER_LIKE_COST: 20,
  AI_ANALYSIS_COST: 30,
};
