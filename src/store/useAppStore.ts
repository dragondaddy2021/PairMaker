/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import { create } from 'zustand';
import { User, FilterCriteria, FilterCriteriaExtended, SubCriteria, AppMode, DatePlan, Anniversary, DiaryEntry, PointTransaction } from '../types';
import { mockUsers } from '../data/mockUsers';
import { REGION_GROUPS, OCCUPATION_KEYWORDS, DATING_TASKS, COUPLE_TASKS } from '../config/taskConfig';
import type { SimilarityResult } from '../services/claudeApi';
import {
  loadPersistedPoints,
  persistPoints,
  canCompleteTask,
  calcEarnedPoints,
  todayDateKey,
  getTodayEarnedPoints,
  type CompleteTaskResult,
} from '../services/pointsService';

interface AppState {
  // 應用模式
  appMode: AppMode;
  setAppMode: (mode: AppMode) => void;

  // 當前用戶（Mock 用固定用戶）
  currentUser: User;
  setCurrentUser: (user: User) => void;

  // 用戶列表
  users: User[];
  filteredUsers: User[];
  setFilteredUsers: (users: User[]) => void;
  applyFilter: (criteria: FilterCriteriaExtended) => void;

  // 篩選條件（保存上次設定）
  lastFilter: FilterCriteriaExtended;
  setLastFilter: (criteria: FilterCriteriaExtended) => void;

  // AI 外貌相似度分數 userId → score(0-100)
  similarityScores: Record<string, SimilarityResult>;
  setSimilarityScores: (scores: SimilarityResult[]) => void;
  clearSimilarityScores: () => void;

  // 喜歡 / 超級喜歡 / 略過
  likedUserIds: string[];
  superLikedUserIds: string[];
  passedUserIds: string[];
  likeUser: (userId: string) => void;
  superLikeUser: (userId: string) => void;
  passUser: (userId: string) => void;

  // 點數
  points: number;
  addPoints: (amount: number) => void;
  spendPoints: (amount: number) => boolean;

  // 點數歷史 & 任務完成記錄
  pointTransactions: PointTransaction[];
  taskCompletions: Record<string, string[]>;   // taskId → ISO timestamp[]
  isDataLoaded: boolean;
  loadPersistedData: () => Promise<void>;
  completeTask: (taskId: string) => Promise<CompleteTaskResult>;
  recordSpend: (amount: number, reason: string) => void;

  // 伴侶關係狀態
  isCouple: boolean;
  coupleStartDate: string | null;
  partnerUser: User | null;
  setPartnerUser: (user: User | null) => void;
  setCouple: (partner: User) => void;
  breakCouple: () => void;

  // 伴侶模式資料
  datePlans: DatePlan[];
  addDatePlan: (plan: DatePlan) => void;
  updateDatePlan: (id: string, updates: Partial<DatePlan>) => void;
  anniversaries: Anniversary[];
  addAnniversary: (anniversary: Anniversary) => void;
  diaryEntries: DiaryEntry[];
  addDiaryEntry: (entry: DiaryEntry) => void;

  // 地圖：心願清單 & 去過紀錄
  wishlistPlaceIds: string[];
  addToWishlist: (placeId: string) => void;
  removeFromWishlist: (placeId: string) => void;
  visitedPlaceIds: string[];
  markPlaceVisited: (placeId: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  appMode: 'dating',
  setAppMode: (mode) => set({ appMode: mode }),

  currentUser: mockUsers[0],
  setCurrentUser: (user) => set({ currentUser: user }),

  users: mockUsers,
  filteredUsers: mockUsers.slice(1),
  setFilteredUsers: (users) => set({ filteredUsers: users }),

  lastFilter: {},
  setLastFilter: (criteria) => set({ lastFilter: criteria }),

  similarityScores: {},
  setSimilarityScores: (scores) =>
    set({
      similarityScores: Object.fromEntries(scores.map((s) => [s.userId, s])),
    }),
  clearSimilarityScores: () => set({ similarityScores: {} }),

  applyFilter: (criteria) => {
    const { users, currentUser } = get();

    // ── 輔助函式：將地區群組展開 ──────────────────────────────────────────
    const expandRegions = (groups?: string[]): string[] => {
      if (!groups?.length) return [];
      return groups.flatMap((g) => REGION_GROUPS[g as keyof typeof REGION_GROUPS] ?? []);
    };

    const CUP_ORDER = ['A', 'B', 'C', 'D', 'E'];

    // ── 輔助函式：將 SubCriteria 應用到單一用戶 ──────────────────────────
    const matchesSub = (user: User, sub: SubCriteria): boolean => {
      if (sub.ageMin !== undefined && user.age < sub.ageMin) return false;
      if (sub.ageMax !== undefined && user.age > sub.ageMax) return false;
      if (sub.heightMin !== undefined && user.height < sub.heightMin) return false;
      if (sub.heightMax !== undefined && user.height > sub.heightMax) return false;
      if (sub.incomeMin !== undefined && user.income < sub.incomeMin) return false;
      if (sub.educationLevels?.length && !sub.educationLevels.includes(user.education)) return false;

      if (sub.occupationCategories?.length) {
        const kws = sub.occupationCategories.flatMap((c) => OCCUPATION_KEYWORDS[c] ?? []);
        if (!kws.some((kw) => user.occupation.includes(kw))) return false;
      }

      const subRegions = expandRegions(sub.regionGroups);
      if (subRegions.length && !subRegions.includes(user.region)) return false;

      if (sub.isMarried !== undefined && user.isMarried !== sub.isMarried) return false;
      if (sub.hasCar !== undefined && user.hasCar !== sub.hasCar) return false;
      if (sub.hasHouse !== undefined && user.hasHouse !== sub.hasHouse) return false;
      if (sub.isSmoker !== undefined && user.isSmoker !== sub.isSmoker) return false;
      if (sub.bodyTypes?.length && !sub.bodyTypes.includes(user.bodyType)) return false;
      if (sub.appearancePRMin !== undefined && user.appearancePR < sub.appearancePRMin) return false;
      if (sub.excludeHighBMI && user.bmi >= 30) return false;
      if (sub.ethnicities?.length && !sub.ethnicities.includes(user.ethnicity)) return false;

      if (sub.penisLengthMin !== undefined && user.gender === 'male') {
        if (user.penisLength === null || user.penisLength < sub.penisLengthMin) return false;
      }
      if (sub.cupSizeMin !== undefined && user.gender === 'female') {
        const ui = user.cupSize ? CUP_ORDER.indexOf(user.cupSize) : -1;
        if (ui < CUP_ORDER.indexOf(sub.cupSizeMin)) return false;
      }
      return true;
    };

    const expandedRegions = expandRegions(criteria.regionGroups);

    const filtered = users.filter((user) => {
      if (user.id === currentUser.id) return false;

      // ── 雙性別分條件模式（#8）──────────────────────────────────────────
      if (criteria.genderSplit && criteria.genders?.includes('male') && criteria.genders?.includes('female')) {
        if (user.gender === 'male') {
          const sub = criteria.genderSplit.male;
          return sub ? matchesSub(user, sub) : true;
        }
        if (user.gender === 'female') {
          const sub = criteria.genderSplit.female;
          return sub ? matchesSub(user, sub) : true;
        }
        return false; // 其他性別在雙性別模式下不顯示
      }

      // ── 標準篩選模式 ────────────────────────────────────────────────────
      if (criteria.genders?.length && !criteria.genders.includes(user.gender)) return false;
      if (criteria.ageMin !== undefined && user.age < criteria.ageMin) return false;
      if (criteria.ageMax !== undefined && user.age > criteria.ageMax) return false;
      if (criteria.heightMin !== undefined && user.height < criteria.heightMin) return false;
      if (criteria.heightMax !== undefined && user.height > criteria.heightMax) return false;

      if (expandedRegions.length && !expandedRegions.includes(user.region)) return false;
      else if (!expandedRegions.length && criteria.regions?.length && !criteria.regions.includes(user.region)) return false;

      if (criteria.incomeMin !== undefined && user.income < criteria.incomeMin) return false;
      if (criteria.educationLevels?.length && !criteria.educationLevels.includes(user.education)) return false;

      if (criteria.occupationCategories?.length) {
        const keywords = criteria.occupationCategories.flatMap(
          (cat) => OCCUPATION_KEYWORDS[cat] ?? [],
        );
        if (!keywords.some((kw) => user.occupation.includes(kw))) return false;
      }

      if (criteria.isMarried !== undefined && user.isMarried !== criteria.isMarried) return false;
      if (criteria.hasCar !== undefined && user.hasCar !== criteria.hasCar) return false;
      if (criteria.hasHouse !== undefined && user.hasHouse !== criteria.hasHouse) return false;
      if (criteria.isSmoker !== undefined && user.isSmoker !== criteria.isSmoker) return false;
      if (criteria.bodyTypes?.length && !criteria.bodyTypes.includes(user.bodyType)) return false;
      if (criteria.appearancePRMin !== undefined && user.appearancePR < criteria.appearancePRMin) return false;
      if (criteria.excludeHighBMI && user.bmi >= 30) return false;

      // 種族偏好篩選（#7）
      if (criteria.ethnicities?.length && !criteria.ethnicities.includes(user.ethnicity)) return false;

      if (criteria.penisLengthMin !== undefined && user.gender === 'male') {
        if (user.penisLength === null || user.penisLength < criteria.penisLengthMin) return false;
      }
      if (criteria.cupSizeMin !== undefined && user.gender === 'female') {
        const userIdx = user.cupSize ? CUP_ORDER.indexOf(user.cupSize) : -1;
        if (userIdx < CUP_ORDER.indexOf(criteria.cupSizeMin)) return false;
      }

      return true;
    });

    set({ filteredUsers: filtered, lastFilter: criteria });
  },

  likedUserIds: [],
  superLikedUserIds: [],
  passedUserIds: [],

  likeUser: (userId) =>
    set((state) => ({
      likedUserIds: state.likedUserIds.includes(userId)
        ? state.likedUserIds
        : [...state.likedUserIds, userId],
    })),

  superLikeUser: (userId) =>
    set((state) => ({
      superLikedUserIds: state.superLikedUserIds.includes(userId)
        ? state.superLikedUserIds
        : [...state.superLikedUserIds, userId],
      likedUserIds: state.likedUserIds.includes(userId)
        ? state.likedUserIds
        : [...state.likedUserIds, userId],
    })),

  passUser: (userId) =>
    set((state) => ({
      passedUserIds: [...state.passedUserIds, userId],
    })),

  points: 100,
  addPoints: (amount) => set((state) => ({ points: state.points + amount })),
  spendPoints: (amount) => {
    const { points } = get();
    if (points < amount) return false;
    set((state) => ({ points: state.points - amount }));
    return true;
  },

  pointTransactions: [],
  taskCompletions: {},
  isDataLoaded: false,

  loadPersistedData: async () => {
    const data = await loadPersistedPoints();
    set({
      points: data.points,
      pointTransactions: data.transactions,
      taskCompletions: data.completions,
      isDataLoaded: true,
    });
  },

  completeTask: async (taskId: string): Promise<CompleteTaskResult> => {
    const { appMode, points, pointTransactions, taskCompletions } = get();
    const allTasks = [...DATING_TASKS, ...COUPLE_TASKS];
    const task = allTasks.find((t) => t.id === taskId);
    if (!task) return { success: false, points: 0, isBonus: false, message: '任務不存在' };

    const check = canCompleteTask(task, taskCompletions, pointTransactions, appMode);
    if (!check.allowed) {
      return { success: false, points: 0, isBonus: false, message: check.reason ?? '無法完成' };
    }

    const { points: earned, isBonus } = calcEarnedPoints(task, appMode);
    const now = new Date().toISOString();

    const newTx: PointTransaction = {
      id: `tx_${Date.now()}`,
      amount: earned,
      type: 'earn',
      reason: task.title,
      taskId: task.id,
      mode: appMode,
      bonus: isBonus,
      timestamp: now,
    };

    const newCompletions: Record<string, string[]> = {
      ...taskCompletions,
      [taskId]: [...(taskCompletions[taskId] ?? []), now],
    };
    const newTransactions = [newTx, ...pointTransactions].slice(0, 200);
    const newPoints = points + earned;

    set({
      points: newPoints,
      pointTransactions: newTransactions,
      taskCompletions: newCompletions,
    });

    // 非同步持久化，不阻塞 UI
    persistPoints({ points: newPoints, transactions: newTransactions, completions: newCompletions })
      .catch((e) => console.warn('[store] persistPoints failed:', e));

    const bonusNote = isBonus ? `（含雙人加成 ×${1.5}）` : '';
    return {
      success: true,
      points: earned,
      isBonus,
      message: `🎉 獲得 ${earned} 點${bonusNote}`,
    };
  },

  recordSpend: (amount: number, reason: string) => {
    const { appMode, pointTransactions } = get();
    const newTx: PointTransaction = {
      id: `tx_${Date.now()}`,
      amount,
      type: 'spend',
      reason,
      mode: appMode,
      timestamp: new Date().toISOString(),
    };
    const newTransactions = [newTx, ...pointTransactions].slice(0, 200);
    set({ pointTransactions: newTransactions });
    persistPoints({
      points: get().points,
      transactions: newTransactions,
      completions: get().taskCompletions,
    }).catch(() => {});
  },

  isCouple: false,
  coupleStartDate: null,
  partnerUser: null,
  setPartnerUser: (user) => set({ partnerUser: user }),
  setCouple: (partner) =>
    set({
      isCouple: true,
      partnerUser: partner,
      coupleStartDate: new Date().toISOString(),
      appMode: 'couple',
    }),
  breakCouple: () =>
    set({
      isCouple: false,
      partnerUser: null,
      coupleStartDate: null,
      appMode: 'dating',
    }),

  datePlans: [],
  addDatePlan: (plan) => set((state) => ({ datePlans: [...state.datePlans, plan] })),
  updateDatePlan: (id, updates) =>
    set((state) => ({
      datePlans: state.datePlans.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  anniversaries: [
    {
      id: 'ann_1',
      title: '在一起紀念日',
      date: '2024-02-14',
      recurring: true,
      notes: '第一次約會的地方',
    },
  ],
  addAnniversary: (anniversary) =>
    set((state) => ({ anniversaries: [...state.anniversaries, anniversary] })),

  diaryEntries: [],
  addDiaryEntry: (entry) =>
    set((state) => ({ diaryEntries: [entry, ...state.diaryEntries] })),

  wishlistPlaceIds: [],
  addToWishlist: (placeId) =>
    set((state) => ({
      wishlistPlaceIds: state.wishlistPlaceIds.includes(placeId)
        ? state.wishlistPlaceIds
        : [...state.wishlistPlaceIds, placeId],
    })),
  removeFromWishlist: (placeId) =>
    set((state) => ({
      wishlistPlaceIds: state.wishlistPlaceIds.filter((id) => id !== placeId),
    })),
  visitedPlaceIds: [],
  markPlaceVisited: (placeId) =>
    set((state) => ({
      visitedPlaceIds: state.visitedPlaceIds.includes(placeId)
        ? state.visitedPlaceIds
        : [...state.visitedPlaceIds, placeId],
    })),
}));
