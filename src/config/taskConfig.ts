/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

/**
 * 任務與地點類型設定檔
 * 所有硬編碼的類別皆統一管理於此
 */

export const DATE_ACTIVITY_TYPES = [
  { id: 'coffee', label: '咖啡約會', icon: 'coffee', points: 10 },
  { id: 'dinner', label: '餐廳用餐', icon: 'restaurant', points: 15 },
  { id: 'movie', label: '電影院', icon: 'movie', points: 10 },
  { id: 'outdoor', label: '戶外活動', icon: 'hiking', points: 20 },
  { id: 'museum', label: '博物館/展覽', icon: 'museum', points: 15 },
  { id: 'sports', label: '運動健身', icon: 'sports', points: 20 },
  { id: 'shopping', label: '逛街購物', icon: 'shopping', points: 10 },
  { id: 'travel', label: '旅行', icon: 'travel', points: 50 },
  { id: 'cooking', label: '下廚', icon: 'cooking', points: 15 },
  { id: 'music', label: '音樂/演唱會', icon: 'music', points: 20 },
] as const;

export const PLACE_TYPES = [
  { id: 'cafe', label: '咖啡廳', googleType: 'cafe' },
  { id: 'restaurant', label: '餐廳', googleType: 'restaurant' },
  { id: 'park', label: '公園', googleType: 'park' },
  { id: 'movie_theater', label: '電影院', googleType: 'movie_theater' },
  { id: 'museum', label: '博物館', googleType: 'museum' },
  { id: 'art_gallery', label: '藝術展覽', googleType: 'art_gallery' },
  { id: 'amusement_park', label: '遊樂園', googleType: 'amusement_park' },
  { id: 'night_club', label: '酒吧/夜店', googleType: 'night_club' },
  { id: 'spa', label: 'SPA/按摩', googleType: 'spa' },
  { id: 'shopping_mall', label: '購物中心', googleType: 'shopping_mall' },
] as const;

export const TASK_TYPES = [
  { id: 'daily_checkin', label: '每日簽到', points: 5, cooldownHours: 24 },
  { id: 'complete_profile', label: '完成個人資料', points: 50, cooldownHours: 0 },
  { id: 'first_like', label: '第一次送出喜歡', points: 10, cooldownHours: 0 },
  { id: 'first_match', label: '第一次配對成功', points: 30, cooldownHours: 0 },
  { id: 'date_plan', label: '建立約會計畫', points: 20, cooldownHours: 0 },
  { id: 'diary_entry', label: '新增日記', points: 10, cooldownHours: 24 },
  { id: 'anniversary', label: '紀念日', points: 50, cooldownHours: 8760 },
] as const;

export const FILTER_OPTIONS = {
  ageRange: { min: 18, max: 60 },
  heightRange: { min: 140, max: 220 },
  incomeRange: { min: 0, max: 100 },
  bodyTypes: ['纖細', '適中', '運動型', '壯碩'] as const,
  educationLevels: ['高中/職', '大專', '大學', '碩士', '博士'] as const,
  appearancePROptions: [20, 40, 60, 80, 95] as const,
  regions: [
    '台北市', '新北市', '桃園市', '台中市',
    '台南市', '高雄市', '新竹市', '基隆市', '其他',
  ] as const,
};

export const POINTS_CONFIG = {
  LIKE_COST: 5,
  SUPER_LIKE_COST: 20,
  AI_ANALYSIS_COST: 30,
  VIEW_PROFILE_COST: 0,
  BOOST_COST: 100,
};

export const REGION_GROUPS = {
  北部: ['台北市', '新北市', '桃園市', '基隆市', '新竹市'] as const,
  中部: ['台中市'] as const,
  南部: ['台南市', '高雄市'] as const,
  東部: ['其他'] as const,
} as const;

export const OCCUPATION_KEYWORDS: Record<string, string[]> = {
  科技業: ['工程師', 'UI', 'UX', '半導體', '軟體', '科技', 'IT', '程式'],
  金融業: ['金融', '分析師', '銀行', '會計', '投資', '財務', '保險'],
  醫療業: ['醫生', '護理師', '藥師', '醫療', '牙醫', '復健', '醫師'],
  公務員: ['公務員', '公職', '政府'],
  自營商: ['創業者', '老闆', '自營', '業主', '商人'],
  創意文化: ['設計師', '美術', '行銷', '品牌', '藝術', '插畫', '廣告', '文案'],
  教育業: ['老師', '教師', '教授', '補習', '教育', '輔導'],
  法律業: ['律師', '法官', '檢察官', '法務', '司法'],
  建築業: ['建築師', '土木', '室內設計', '工程', '營造'],
  餐飲業: ['廚師', '餐飲', '烘焙', '咖啡師', '調酒師', '外場'],
  服務業: ['業務', '客服', '銷售', '零售', '顧問'],
  製造業: ['工廠', '製造', '技術員', '操作員', '品管'],
  傳播媒體: ['記者', '主播', '媒體', '電視', '廣播', '攝影師', '導演'],
  軍警消: ['軍人', '警察', '消防員', '軍官', '警官'],
  農漁業: ['農夫', '漁民', '農業', '畜牧'],
  其他: [],
};

// ─── 新增篩選選項設定 ──────────────────────────────────────────────────────────

export const GENDER_OPTIONS = [
  { value: 'male',       label: '男性',     icon: '♂' },
  { value: 'female',     label: '女性',     icon: '♀' },
  { value: 'transgender',label: '跨性別',   icon: '⚧' },
  { value: 'non-binary', label: '非二元',   icon: '⚧' },
] as const;

/**
 * 性傾向選項：依性別分組顯示
 */
export const SEXUAL_ORIENTATION_OPTIONS = {
  male: [
    { value: 'straight',    label: '異性戀' },
    { value: 'gay_top',     label: '男同（攻）' },
    { value: 'gay_bottom',  label: '男同（受）' },
    { value: 'gay_both',    label: '男同（不限）' },
    { value: 'gay_side',    label: '男同（側）' },
    { value: 'bisexual',    label: '雙性戀' },
    { value: 'transgender', label: '跨性別' },
  ],
  female: [
    { value: 'straight',    label: '異性戀' },
    { value: 'lesbian',     label: '女同志' },
    { value: 'bisexual',    label: '雙性戀' },
    { value: 'transgender', label: '跨性別' },
  ],
  transgender: [
    { value: 'straight',    label: '異性戀' },
    { value: 'gay_top',     label: '同（攻）' },
    { value: 'gay_bottom',  label: '同（受）' },
    { value: 'gay_both',    label: '同（不限）' },
    { value: 'bisexual',    label: '雙性戀' },
    { value: 'lesbian',     label: '女同志' },
    { value: 'transgender', label: '跨性別' },
  ],
  'non-binary': [
    { value: 'straight',    label: '異性戀' },
    { value: 'bisexual',    label: '雙性戀' },
    { value: 'gay_both',    label: '同（不限）' },
    { value: 'transgender', label: '跨性別' },
  ],
} as const;

export const ETHNICITY_OPTIONS = [
  { value: 'taiwanese',      label: '台灣人' },
  { value: 'japanese_korean',label: '日韓裔' },
  { value: 'southeast_asian',label: '東南亞裔' },
  { value: 'western',        label: '歐美裔' },
  { value: 'south_asian',    label: '南亞裔' },
  { value: 'other',          label: '其他' },
] as const;

export const CUP_SIZE_OPTIONS = ['A', 'B', 'C', 'D', 'E'] as const;

export const SEX_FREQUENCY_OPTIONS = [
  { value: 'casual',         label: '機緣到就好' },
  { value: '1-3_per_month',  label: '每月 1–3 次' },
  { value: '1_per_week',     label: '每週 1 次' },
  { value: '2-3_per_week',   label: '每週 2–3 次' },
  { value: '4-5_per_week',   label: '每週 4–5 次' },
  { value: 'daily',          label: '每天' },
] as const;

export type DateActivityType = typeof DATE_ACTIVITY_TYPES[number];
export type PlaceType = typeof PLACE_TYPES[number];
export type TaskType = typeof TASK_TYPES[number];

// ─── 點數任務系統 ─────────────────────────────────────────────────────────────

export interface TaskDefinition {
  id: string;
  title: string;
  description: string;
  points: number;
  mode: 'dating' | 'couple';
  dailyLimit?: number;   // undefined = 無每日上限
  icon: string;
}

/** 交友模式每日任務 */
export const DATING_TASKS: TaskDefinition[] = [
  { id: 'daily_login',      title: '每日登入簽到',   description: '每天開啟 App 打開任務頁簽到',     points: 3,  mode: 'dating', dailyLimit: 1, icon: '📅' },
  { id: 'browse_10',        title: '瀏覽 10 個對象', description: '在探索頁瀏覽 10 位用戶',         points: 5,  mode: 'dating', dailyLimit: 1, icon: '👀' },
  { id: 'send_invite',      title: '送出配對邀請',   description: '向對方送出喜歡（每日最多 3 次）', points: 3,  mode: 'dating', dailyLimit: 3, icon: '💌' },
  { id: 'use_filter',       title: '完成條件篩選',   description: '使用篩選功能搜尋心儀對象',        points: 2,  mode: 'dating', dailyLimit: 1, icon: '🔍' },
  { id: 'update_photo',     title: '更新個人照片',   description: '上傳一張新的個人照片',           points: 5,  mode: 'dating', dailyLimit: 1, icon: '📸' },
  { id: 'complete_profile', title: '完成個人資料',   description: '填寫完整的個人資料',             points: 8,  mode: 'dating', dailyLimit: 1, icon: '✏️' },
  { id: 'explore_map',      title: '使用地圖探索',   description: '打開地圖查看附近約會地點',        points: 3,  mode: 'dating', dailyLimit: 1, icon: '🗺️' },
];

/** 交友模式每日點數上限 */
export const DATING_DAILY_CAP = 30;

/** 伴侶模式感情任務（無每日上限，雙人加成 x1.5） */
export const COUPLE_TASKS: TaskDefinition[] = [
  { id: 'checkin_location', title: '打卡約會地點',   description: '在地圖標記你們去過的地方',        points: 10, mode: 'couple', icon: '📍' },
  { id: 'upload_photo',     title: '上傳共同照片',   description: '在日記中上傳一起拍的照片',         points: 8,  mode: 'couple', icon: '📷' },
  { id: 'write_diary',      title: '撰寫共同日記',   description: '記錄一段共同的珍貴回憶',           points: 10, mode: 'couple', icon: '📔' },
  { id: 'complete_plan',    title: '完成約會計畫',   description: '將約會計畫標記為已完成',           points: 15, mode: 'couple', icon: '✅' },
  { id: 'anniversary',      title: '紀念日打卡',     description: '在紀念日當天完成任意任務',         points: 20, mode: 'couple', icon: '🎂' },
  { id: 'send_message',     title: '傳送甜蜜訊息',   description: '傳送一則特別的訊息給對方',         points: 5,  mode: 'couple', icon: '💬' },
  { id: 'streak_bonus',     title: '連續互動獎勵',   description: '連續 7 天完成任意任務',           points: 30, mode: 'couple', icon: '🔥' },
];

/** 伴侶模式雙人同時完成倍率 */
export const COUPLE_BONUS_MULTIPLIER = 1.5;

/** 感情溫度計里程碑（溫度 = 伴侶任務累積點數 / 2，上限 100） */
export const TEMPERATURE_MILESTONES = [
  { temp: 25,  title: '甜蜜初期', icon: '🌱', color: '#86EFAC', reward: '你們的感情正在升溫中，繼續保持！' },
  { temp: 50,  title: '默契夥伴', icon: '🌿', color: '#4ADE80', reward: '你們已建立深厚默契，彼此越來越了解。' },
  { temp: 75,  title: '靈魂伴侶', icon: '🌸', color: '#F9A8D4', reward: '你們的心靈緊緊相連，是真正的靈魂伴侶。' },
  { temp: 100, title: '永恆之約', icon: '💍', color: '#FF6B6B', reward: '你們的愛已到達最高溫度，是彼此最完美的歸宿！' },
] as const;
