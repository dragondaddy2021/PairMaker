/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import * as FileSystem from 'expo-file-system/legacy';
import { User, MatchScore, AppearanceFeatures } from '../types';
import { isFeatureEnabled } from '../config/featureFlags';

const CLAUDE_API_KEY = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// ─── 型別定義 ─────────────────────────────────────────────────────────────────

type ContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'image';
      source: {
        type: 'base64';
        media_type: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
        data: string;
      };
    };

interface ClaudeTextMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeVisionMessage {
  role: 'user' | 'assistant';
  content: ContentBlock[];
}

interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: (ClaudeTextMessage | ClaudeVisionMessage)[];
  system?: string;
}

interface ClaudeResponse {
  content: Array<{ type: string; text: string }>;
  error?: { message: string };
}

export interface SimilarityResult {
  userId: string;
  score: number;        // 0–100
  breakdown: {
    faceShape: number;
    skinTone: number;
    hairStyle: number;
    vibe: number;
    bodyStyle: number;
  };
}

// ─── 核心 API 呼叫 ────────────────────────────────────────────────────────────

const callClaude = async (
  messages: (ClaudeTextMessage | ClaudeVisionMessage)[],
  systemPrompt?: string,
  maxTokens = 1024,
): Promise<string> => {
  if (!CLAUDE_API_KEY) {
    throw new Error('Claude API Key 未設定，請在 .env 中設定 EXPO_PUBLIC_CLAUDE_API_KEY');
  }

  const body: ClaudeRequest = {
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    messages,
    ...(systemPrompt && { system: systemPrompt }),
  };

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Claude API 錯誤: ${response.status} - ${JSON.stringify(errorData)}`);
  }

  const data: ClaudeResponse = await response.json();

  if (data.error) {
    throw new Error(`Claude API 錯誤: ${data.error.message}`);
  }

  const textContent = data.content.find((c) => c.type === 'text');
  if (!textContent) throw new Error('Claude API 未返回文字內容');

  return textContent.text;
};

// ─── 圖片工具 ─────────────────────────────────────────────────────────────────

/**
 * 將本地 URI 轉為 base64 字串
 * 支援 file:// (iOS/Android)、content:// (Android ImagePicker)、http(s)://
 */
const uriToBase64 = async (uri: string): Promise<string> => {
  console.log('[claudeApi] uriToBase64 開始');
  console.log('[claudeApi]   uri scheme:', uri.split('://')[0] + '://');
  console.log('[claudeApi]   uri 前80字:', uri.slice(0, 80));

  // 網路 URL：先下載到暫存檔
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    console.log('[claudeApi] 偵測為網路 URL，下載中…');
    const tmpPath = (FileSystem.cacheDirectory ?? '') + `tmp_photo_${Date.now()}.jpg`;
    const downloadResult = await FileSystem.downloadAsync(uri, tmpPath);
    console.log('[claudeApi] 下載完成，暫存路徑:', downloadResult.uri);
    const b64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('[claudeApi] base64 長度:', b64.length);
    return b64;
  }

  // Android content:// URI：需先複製到 cache，再讀取
  if (uri.startsWith('content://')) {
    console.log('[claudeApi] 偵測為 Android content:// URI，複製到 cache…');
    const tmpPath = (FileSystem.cacheDirectory ?? '') + `tmp_photo_${Date.now()}.jpg`;
    await FileSystem.copyAsync({ from: uri, to: tmpPath });
    console.log('[claudeApi] 複製完成，cache 路徑:', tmpPath);
    const b64 = await FileSystem.readAsStringAsync(tmpPath, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('[claudeApi] base64 長度:', b64.length);
    return b64;
  }

  // 本地 file:// URI（expo-image-picker iOS 或 Android file://）
  console.log('[claudeApi] 偵測為本地 file:// URI，直接讀取…');
  const b64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  console.log('[claudeApi] base64 長度:', b64.length);
  return b64;
};

/**
 * 從 URI 推斷 MIME 類型
 */
const getMimeType = (uri: string): 'image/jpeg' | 'image/png' | 'image/webp' => {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
};

// ─── Vision：照片外貌分析 ─────────────────────────────────────────────────────

const APPEARANCE_ANALYSIS_PROMPT = `請分析這張照片中人物的外貌特徵。
只回傳 JSON，不要任何其他文字或 markdown：
{
  "faceShape": "圓臉或方臉或瓜子臉或菱形臉或橢圓臉",
  "skinTone": "白皙或自然或健康小麥或古銅",
  "hairStyle": "短髮或長直髮或長捲髮或中長髮或造型髮",
  "vibe": "清新或成熟或帥氣或甜美或知性或陽光或文藝",
  "bodyStyle": "纖細或適中或運動型或壯碩"
}`;

/**
 * 分析照片外貌特徵（Claude Vision）
 * 若 API 未設定或發生錯誤，回傳 null
 */
export const analyzeAppearancePhoto = async (
  photoUri: string,
): Promise<AppearanceFeatures | null> => {
  if (!isFeatureEnabled('AI_MATCH_ANALYSIS')) {
    console.log('[claudeApi] AI_MATCH_ANALYSIS 功能未啟用，跳過分析');
    return null;
  }
  if (!CLAUDE_API_KEY) {
    console.warn('[claudeApi] ⚠️ 未設定 EXPO_PUBLIC_CLAUDE_API_KEY，無法分析照片。請在 .env 加入 EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-xxx');
    return null;
  }

  console.log('[claudeApi] 開始分析照片，URI:', photoUri.slice(0, 80));

  try {
    const [base64, mimeType] = await Promise.all([
      uriToBase64(photoUri),
      Promise.resolve(getMimeType(photoUri)),
    ]);

    const message: ClaudeVisionMessage = {
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mimeType, data: base64 },
        },
        { type: 'text', text: APPEARANCE_ANALYSIS_PROMPT },
      ],
    };

    const raw = await callClaude([message], undefined, 512);

    // 容錯：從回傳文字中萃取 JSON
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('無法解析外貌 JSON');

    const parsed = JSON.parse(jsonMatch[0]) as AppearanceFeatures;

    // 基本欄位驗證
    if (!parsed.faceShape || !parsed.skinTone || !parsed.hairStyle || !parsed.vibe || !parsed.bodyStyle) {
      throw new Error('外貌 JSON 欄位不完整: ' + JSON.stringify(parsed));
    }

    console.log('[claudeApi] 照片分析成功:', parsed);
    return parsed;
  } catch (err) {
    console.error('[claudeApi] analyzeAppearancePhoto 失敗:', err);
    return null;
  }
};

// ─── 外貌相似度計算（本地，無需 API）────────────────────────────────────────

/**
 * 兩個字串的關鍵字重疊度（0–1）
 * 例："長直髮" vs "長捲髮" → 共享「長」→ 部分相似
 */
const keywordSimilarity = (a: string, b: string): number => {
  if (a === b) return 1;
  const aChars = new Set(a.split(''));
  const bChars = new Set(b.split(''));
  let overlap = 0;
  aChars.forEach((c) => { if (bChars.has(c)) overlap++; });
  const union = new Set([...aChars, ...bChars]).size;
  return union > 0 ? overlap / union : 0;
};

/**
 * 計算兩組外貌特徵的相似度（0–100）
 */
export const calculateAppearanceSimilarity = (
  reference: AppearanceFeatures,
  target: AppearanceFeatures,
): SimilarityResult['breakdown'] & { total: number } => {
  const faceShape = Math.round(keywordSimilarity(reference.faceShape, target.faceShape) * 100);
  const skinTone  = Math.round(keywordSimilarity(reference.skinTone,  target.skinTone)  * 100);
  const hairStyle = Math.round(keywordSimilarity(reference.hairStyle, target.hairStyle) * 100);
  const vibe      = Math.round(keywordSimilarity(reference.vibe,      target.vibe)      * 100);
  const bodyStyle = Math.round(keywordSimilarity(reference.bodyStyle, target.bodyStyle) * 100);

  // 加權：vibe + bodyStyle 權重較高，比較影響整體印象
  const total = Math.round(
    faceShape * 0.20 +
    skinTone  * 0.15 +
    hairStyle * 0.20 +
    vibe      * 0.25 +
    bodyStyle * 0.20,
  );

  return { faceShape, skinTone, hairStyle, vibe, bodyStyle, total };
};

/**
 * 批次計算一組用戶與參考外貌的相似度，並由高至低排序
 */
export const rankUsersByAppearance = (
  reference: AppearanceFeatures,
  users: User[],
): SimilarityResult[] =>
  users
    .map((user) => {
      const bd = calculateAppearanceSimilarity(reference, user.appearanceFeatures);
      return {
        userId: user.id,
        score: bd.total,
        breakdown: {
          faceShape: bd.faceShape,
          skinTone:  bd.skinTone,
          hairStyle: bd.hairStyle,
          vibe:      bd.vibe,
          bodyStyle: bd.bodyStyle,
        },
      };
    })
    .sort((a, b) => b.score - a.score);

// ─── 地點推薦理由（Map 頁使用）───────────────────────────────────────────────

export interface PlaceRecommendationContext {
  isCouple?: boolean;
  partnerName?: string;
  recentDateLocations?: string[];   // 最近約會地點名稱（最多 3 筆）
}

/**
 * 根據地點資訊生成 AI 推薦理由（1–2 句，約 30–50 字）
 * API 未設定時回傳預設文案，不拋出例外
 */
export const generatePlaceRecommendation = async (
  place: { name: string; rating: number; address: string; types: string[] },
  context: PlaceRecommendationContext = {},
): Promise<string> => {
  if (!isFeatureEnabled('AI_DATE_SUGGESTIONS') || !CLAUDE_API_KEY) {
    return getDefaultRecommendation(place.types[0] ?? '', place.rating);
  }

  const coupleCtx = context.isCouple && context.partnerName
    ? `\n這對情侶最近的約會地點：${(context.recentDateLocations ?? []).slice(0, 3).join('、') || '尚無記錄'}。伴侶名字：${context.partnerName}。請帶入互動感，讓推薦更個人化。`
    : '';

  const prompt = `地點：${place.name}
評分：${place.rating} 星
地址：${place.address}
類型：${place.types.slice(0, 2).join('、')}${coupleCtx}

請用繁體中文，以 1 句話（25–45 字）說明為何推薦此地點作為約會場所。語氣輕鬆親切。只回覆這句話本身，不加任何標點符號以外的多餘文字。`;

  try {
    const text = await callClaude(
      [{ role: 'user', content: prompt }],
      '你是台灣本地約會規劃顧問。只回覆推薦理由，不要任何其他文字。',
      120,
    );
    return text.trim();
  } catch {
    return getDefaultRecommendation(place.types[0] ?? '', place.rating);
  }
};

const getDefaultRecommendation = (type: string, rating: number): string => {
  const map: Record<string, string> = {
    restaurant:      '環境舒適、料理用心，適合邊品嚐美食邊細細交流，留下共同的味覺記憶。',
    cafe:            '氛圍溫馨，一杯好咖啡配上輕鬆的對話，是最自然的約會開場白。',
    movie_theater:   '在電影院並肩坐著，感受同樣的情節，是製造共鳴最簡單的方式。',
    museum:          '邊欣賞展覽邊分享觀點，很容易找到彼此意想不到的話題。',
    art_gallery:     '藝術空間讓對話更有深度，也很適合拍出有質感的紀念照。',
    park:            '空氣清新、步調舒緩，散步中更容易打開心房、聊出真心話。',
    amusement_park:  '一起尖叫、一起笑，遊樂園式的約會最容易留下開心的共同回憶。',
    natural_feature: '遠離城市喧囂，在大自然中的對話往往格外坦誠、格外珍貴。',
    night_club:      '現場音樂或表演讓氣氛瞬間升溫，非常適合想要不同刺激感的約會。',
    shopping_mall:   '逛街時互相挑選、互相分享品味，是了解彼此個性的好機會。',
    spa:             '一起放鬆身心，舒壓的體驗讓兩人更容易敞開心扉、拉近距離。',
  };
  return map[type] ?? `評分高達 ${rating} 星，口碑絕佳，非常值得一起探訪。`;
};

// ─── 相容性分析（保留原有功能）───────────────────────────────────────────────

export const analyzeCompatibility = async (
  currentUser: Partial<User>,
  targetUser: User,
): Promise<MatchScore> => {
  if (!isFeatureEnabled('AI_MATCH_ANALYSIS')) {
    return getMockCompatibilityScore(targetUser.id);
  }

  const systemPrompt = `你是一位專業的感情顧問和心理分析師，擅長分析兩個人的相容性。
請根據用戶的外貌特徵、生活條件和個性描述，給出客觀的相容性分析。
回覆必須是合法的 JSON 格式。`;

  const userMessage = `請分析以下兩位用戶的相容性：

【用戶A（當前用戶）】
${JSON.stringify(currentUser, null, 2)}

【用戶B（目標用戶）】
${JSON.stringify(targetUser, null, 2)}

請回傳以下 JSON 格式：
{
  "score": 0-100的整體分數,
  "breakdown": {
    "appearance": 0-100外貌相似度分,
    "lifestyle": 0-100生活方式相容分,
    "values": 0-100價值觀相容分,
    "compatibility": 0-100整體相容分
  },
  "aiAnalysis": "100字以內的分析摘要"
}`;

  try {
    const result = await callClaude(
      [{ role: 'user', content: userMessage }],
      systemPrompt,
    );

    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('無法解析 AI 回應');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      userId: targetUser.id,
      score: parsed.score ?? 50,
      breakdown: parsed.breakdown ?? { appearance: 50, lifestyle: 50, values: 50, compatibility: 50 },
      aiAnalysis: parsed.aiAnalysis,
    };
  } catch {
    return getMockCompatibilityScore(targetUser.id);
  }
};

export const suggestDateLocations = async (
  userA: Partial<User>,
  userB: Partial<User>,
  region: string,
): Promise<string[]> => {
  if (!isFeatureEnabled('AI_DATE_SUGGESTIONS')) {
    return ['台北 101', '大安森林公園', '誠品書店', '饒河夜市'];
  }

  const systemPrompt = `你是一位熟悉台灣各地的約會規劃專家，請根據兩位用戶的喜好推薦合適的約會地點。`;

  const userMessage = `請為以下兩位用戶推薦 5 個在 ${region} 的約會地點：

用戶A興趣描述：${userA.bio ?? ''}
用戶B興趣描述：${userB.bio ?? ''}

請回傳 JSON 陣列，例如：["地點1", "地點2", "地點3", "地點4", "地點5"]`;

  try {
    const result = await callClaude(
      [{ role: 'user', content: userMessage }],
      systemPrompt,
    );
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
};

const getMockCompatibilityScore = (userId: string): MatchScore => {
  const seed = userId.charCodeAt(userId.length - 1);
  const score = 50 + (seed % 50);
  return {
    userId,
    score,
    breakdown: {
      appearance: 40 + (seed % 60),
      lifestyle:  50 + (seed % 40),
      values:     45 + (seed % 50),
      compatibility: score,
    },
    aiAnalysis: '（AI 分析功能未啟用）',
  };
};
