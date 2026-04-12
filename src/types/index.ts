/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

export type Gender = 'male' | 'female' | 'transgender' | 'non-binary';

export type SexualOrientation =
  | 'straight'
  | 'gay_top'
  | 'gay_bottom'
  | 'gay_both'
  | 'gay_side'
  | 'bisexual'
  | 'lesbian'
  | 'transgender';

export type Ethnicity =
  | 'taiwanese'
  | 'japanese_korean'
  | 'southeast_asian'
  | 'western'
  | 'south_asian'
  | 'other';

export type CupSize = 'A' | 'B' | 'C' | 'D' | 'E';

export type SexualNeed = 'none' | 'needed';

export type SexFrequency =
  | 'casual'
  | '1-3_per_month'
  | '1_per_week'
  | '2-3_per_week'
  | '4-5_per_week'
  | 'daily';

export type BodyType = '纖細' | '適中' | '運動型' | '壯碩';

export type AppearancePR = 20 | 40 | 60 | 80 | 95;

export type EducationLevel =
  | '高中/職'
  | '大專'
  | '大學'
  | '碩士'
  | '博士';

export type Region =
  | '台北市'
  | '新北市'
  | '桃園市'
  | '台中市'
  | '台南市'
  | '高雄市'
  | '新竹市'
  | '基隆市'
  | '其他';

export interface AppearanceFeatures {
  faceShape: string;   // 臉型
  skinTone: string;    // 膚色
  hairStyle: string;   // 髮型
  vibe: string;        // 氣質
  bodyStyle: string;   // 身材風格
}

export interface User {
  id: string;
  name: string;
  gender: Gender;
  age: number;
  height: number;           // cm
  region: Region;
  income: number;           // 月收入（萬元）
  education: EducationLevel;
  occupation: string;
  isMarried: boolean;
  bmi: number;
  hasCar: boolean;
  hasHouse: boolean;
  isSmoker: boolean;
  bodyType: BodyType;
  appearancePR: AppearancePR;
  avatar: string;
  bio: string;
  appearanceFeatures: AppearanceFeatures;
  points?: number;

  // 性別認同與性傾向
  sexualOrientation: SexualOrientation;
  ethnicity: Ethnicity;

  // 身體資料（性別特定）
  cupSize: CupSize | null;      // 女性填寫，男性為 null
  penisLength: number | null;   // 男性填寫（cm），女性為 null

  // 性需求
  sexualNeed: SexualNeed;
  sexFrequency: SexFrequency | null;  // sexualNeed 為 'none' 時填 null
}

export interface FilterCriteria {
  genders?: Gender[];
  ageMin?: number;
  ageMax?: number;
  heightMin?: number;
  heightMax?: number;
  regions?: Region[];
  incomeMin?: number;
  educationLevels?: EducationLevel[];
  isMarried?: boolean;
  hasCar?: boolean;
  hasHouse?: boolean;
  isSmoker?: boolean;
  bodyTypes?: BodyType[];
  appearancePRMin?: AppearancePR;
}

export interface MatchScore {
  userId: string;
  score: number;
  breakdown: {
    appearance: number;
    lifestyle: number;
    values: number;
    compatibility: number;
  };
  aiAnalysis?: string;
}

export interface DatePlan {
  id: string;
  title: string;
  date: string;
  location: string;
  placeId?: string;      // Google Places ID（對應地圖標記）
  notes?: string;
  completed: boolean;
}

export interface Anniversary {
  id: string;
  title: string;
  date: string;
  recurring: boolean;
  notes?: string;
}

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'romantic';
  photos?: string[];
}

export interface PointTransaction {
  id: string;
  amount: number;
  type: 'earn' | 'spend';
  reason: string;            // 顯示用文字
  taskId?: string;           // 對應 TaskDefinition.id
  mode: AppMode;             // 發生時的 App 模式
  bonus?: boolean;           // 是否為伴侶雙人加成
  timestamp: string;         // ISO 8601
}

export type AppMode = 'dating' | 'couple';

export type RegionGroup = '北部' | '中部' | '南部' | '東部';

export type OccupationCategory =
  | '科技業'
  | '金融業'
  | '醫療業'
  | '公務員'
  | '自營商'
  | '創意文化'
  | '教育業'
  | '法律業'
  | '建築業'
  | '餐飲業'
  | '服務業'
  | '製造業'
  | '傳播媒體'
  | '軍警消'
  | '農漁業'
  | '其他';

/** 雙性別分條件搜尋時，每個性別獨立的篩選子條件 */
export interface SubCriteria {
  ageMin?: number;
  ageMax?: number;
  heightMin?: number;
  heightMax?: number;
  regionGroups?: RegionGroup[];
  incomeMin?: number;
  educationLevels?: EducationLevel[];
  occupationCategories?: OccupationCategory[];
  bodyTypes?: BodyType[];
  appearancePRMin?: AppearancePR;
  excludeHighBMI?: boolean;
  isMarried?: boolean;
  hasCar?: boolean;
  hasHouse?: boolean;
  isSmoker?: boolean;
  parentsFriendly?: boolean;
  ethnicities?: Ethnicity[];
  penisLengthMin?: number;   // 僅對男性有效
  cupSizeMin?: CupSize;      // 僅對女性有效
}

export interface FilterCriteriaExtended extends FilterCriteria {
  regionGroups?: RegionGroup[];
  occupationCategories?: OccupationCategory[];
  appearancePhotoUri?: string;
  analyzedAppearance?: AppearanceFeatures; // AI 分析結果（photo → features）
  excludeHighBMI?: boolean;       // 排除 BMI 30+
  parentsFriendly?: boolean;      // 父母好相處
  penisLengthMin?: number;        // 男性最小尺寸 (cm)
  cupSizeMin?: CupSize;           // 女性最低罩杯
  ethnicities?: Ethnicity[];      // 種族偏好（#7）
  genderSplit?: {                 // 雙性別分條件（#8）
    male?: SubCriteria;
    female?: SubCriteria;
  };
}

// Navigation param types
export type DatingStackParamList = {
  Home: undefined;
  Filter: undefined;
  Results: { criteria: FilterCriteriaExtended };
  Profile: { userId: string };
  Map: undefined;
  Post: undefined;
};

export type CoupleStackParamList = {
  CoupleHome: undefined;
  CoupleMap: undefined;
  DatePlan: undefined;
  Anniversary: undefined;
  Diary: undefined;
};

export type RootTabParamList = {
  DatingTab: undefined;
  CoupleTab: undefined;
};
