/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import { isFeatureEnabled } from '../config/featureFlags';

const PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';
const PLACES_BASE_URL = 'https://maps.googleapis.com/maps/api/place';

export interface PlaceResult {
  placeId: string;
  name: string;
  address: string;
  rating: number;
  priceLevel?: number;      // 0–4：免費/便宜/中等/稍貴/昂貴
  photoReference?: string;
  location: {
    lat: number;
    lng: number;
  };
  openNow?: boolean;
  types: string[];
}

export interface AutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

/**
 * 附近地點搜尋
 */
export const searchNearbyPlaces = async (
  lat: number,
  lng: number,
  type: string,
  radius = 3000,
): Promise<PlaceResult[]> => {
  if (!isFeatureEnabled('GOOGLE_MAPS_ENABLED') || !PLACES_API_KEY) {
    return getMockPlaces(type, lat, lng);
  }

  const url = `${PLACES_BASE_URL}/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${PLACES_API_KEY}&language=zh-TW`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Places API 錯誤: ${response.status}`);

    const data = await response.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Places API 狀態: ${data.status}`);
    }

    return (data.results ?? []).slice(0, 12).map((place: Record<string, unknown>) => ({
      placeId: place.place_id as string,
      name: place.name as string,
      address: place.vicinity as string,
      rating: (place.rating as number) ?? 0,
      priceLevel: place.price_level as number | undefined,
      photoReference: (place.photos as Array<Record<string, string>>)?.[0]?.photo_reference,
      location: (place.geometry as Record<string, Record<string, number>>).location,
      openNow: (place.opening_hours as Record<string, boolean> | undefined)?.open_now,
      types: (place.types as string[]) ?? [],
    }));
  } catch {
    return getMockPlaces(type, lat, lng);
  }
};

/**
 * 批次搜尋多個類型（去除重複）
 */
export const searchNearbyByTypes = async (
  lat: number,
  lng: number,
  types: string[],
  radius = 3000,
): Promise<PlaceResult[]> => {
  if (types.length === 0) return [];

  const results = await Promise.all(
    types.map((t) => searchNearbyPlaces(lat, lng, t, radius)),
  );

  const merged = results.flat();
  const seen = new Set<string>();
  return merged.filter((p) => {
    if (seen.has(p.placeId)) return false;
    seen.add(p.placeId);
    return true;
  });
};

/**
 * 地點自動完成
 */
export const autocompletePlaces = async (
  input: string,
  region = 'tw',
): Promise<AutocompleteResult[]> => {
  if (!PLACES_API_KEY || input.length < 2) return [];

  const encodedInput = encodeURIComponent(input);
  const url = `${PLACES_BASE_URL}/autocomplete/json?input=${encodedInput}&region=${region}&language=zh-TW&key=${PLACES_API_KEY}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Places Autocomplete 錯誤: ${response.status}`);

    const data = await response.json();
    if (data.status !== 'OK') return [];

    return data.predictions.map((p: Record<string, unknown>) => ({
      placeId: p.place_id as string,
      description: p.description as string,
      mainText: (p.structured_formatting as Record<string, string>).main_text,
      secondaryText: (p.structured_formatting as Record<string, string>).secondary_text ?? '',
    }));
  } catch {
    return [];
  }
};

/**
 * 地點照片 URL
 */
export const getPlacePhotoUrl = (photoReference: string, maxWidth = 400): string => {
  if (!PLACES_API_KEY) return '';
  return `${PLACES_BASE_URL}/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${PLACES_API_KEY}`;
};

/**
 * Haversine 距離（公尺）
 */
export const haversineDistance = (
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number => {
  const R = 6_371_000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const formatDistance = (metres: number): string => {
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
};

// ─── Mock 地點資料（API 未啟用時使用）────────────────────────────────────────

const getMockPlaces = (type: string, baseLat = 25.044, baseLng = 121.510): PlaceResult[] => {
  const base = MOCK_PLACES[type] ?? MOCK_PLACES['cafe'];
  // 根據請求中心小幅偏移 mock 座標，使之分散在用戶周圍
  return base.map((p, i) => ({
    ...p,
    location: {
      lat: baseLat + (p.location.lat - 25.044) + (i % 2 === 0 ? 0.001 : -0.001),
      lng: baseLng + (p.location.lng - 121.510) + (i % 3 === 0 ? 0.001 : -0.001),
    },
  }));
};

const MOCK_PLACES: Record<string, PlaceResult[]> = {
  restaurant: [
    { placeId: 'mock_rest_1', name: '鼎泰豐（信義店）', address: '台北市信義區松壽路9號', rating: 4.8, priceLevel: 3, location: { lat: 25.036, lng: 121.566 }, types: ['restaurant'] },
    { placeId: 'mock_rest_2', name: '欣葉台菜（雙城店）', address: '台北市中山區雙城街34-1號', rating: 4.4, priceLevel: 2, location: { lat: 25.061, lng: 121.526 }, types: ['restaurant'] },
    { placeId: 'mock_rest_3', name: '山海樓', address: '台北市中正區忠孝東路一段', rating: 4.6, priceLevel: 4, location: { lat: 25.044, lng: 121.518 }, types: ['restaurant'] },
    { placeId: 'mock_rest_4', name: '響日本料理', address: '台北市大安區仁愛路四段27號', rating: 4.7, priceLevel: 4, location: { lat: 25.034, lng: 121.548 }, types: ['restaurant'] },
    { placeId: 'mock_rest_5', name: '茶六燒肉堂', address: '台北市信義區基隆路一段', rating: 4.3, priceLevel: 3, location: { lat: 25.040, lng: 121.565 }, types: ['restaurant'] },
  ],
  cafe: [
    { placeId: 'mock_cafe_1', name: 'Simple Kaffa興波', address: '台北市大安區富錦街', rating: 4.7, priceLevel: 2, location: { lat: 25.057, lng: 121.556 }, types: ['cafe'] },
    { placeId: 'mock_cafe_2', name: 'Fika Fika Cafe', address: '台北市中山區伊通街33號', rating: 4.6, priceLevel: 2, location: { lat: 25.052, lng: 121.533 }, types: ['cafe'] },
    { placeId: 'mock_cafe_3', name: '路易莎咖啡（大安店）', address: '台北市大安區信義路四段', rating: 4.2, priceLevel: 1, location: { lat: 25.033, lng: 121.542 }, types: ['cafe'] },
    { placeId: 'mock_cafe_4', name: '閱樂書店咖啡', address: '台北市中正區南海路45號', rating: 4.5, priceLevel: 2, location: { lat: 25.031, lng: 121.512 }, types: ['cafe'] },
  ],
  movie_theater: [
    { placeId: 'mock_movie_1', name: '信義威秀影城', address: '台北市信義區松壽路20號', rating: 4.5, priceLevel: 2, location: { lat: 25.037, lng: 121.564 }, types: ['movie_theater'] },
    { placeId: 'mock_movie_2', name: '喜樂時代影城', address: '台北市中正區衡陽路', rating: 4.3, priceLevel: 2, location: { lat: 25.045, lng: 121.509 }, types: ['movie_theater'] },
    { placeId: 'mock_movie_3', name: 'MUVIE CINEMAS台茂', address: '桃園市蘆竹區南崁路', rating: 4.4, priceLevel: 2, location: { lat: 25.052, lng: 121.338 }, types: ['movie_theater'] },
  ],
  museum: [
    { placeId: 'mock_museum_1', name: '台北當代藝術館', address: '台北市大同區長安西路39號', rating: 4.4, priceLevel: 1, location: { lat: 25.050, lng: 121.519 }, types: ['museum'] },
    { placeId: 'mock_museum_2', name: '國立故宮博物院', address: '台北市士林區至善路二段221號', rating: 4.7, priceLevel: 1, location: { lat: 25.102, lng: 121.548 }, types: ['museum'] },
    { placeId: 'mock_museum_3', name: '台灣當代文化實驗場', address: '台北市中正區青島東路3號', rating: 4.5, priceLevel: 0, location: { lat: 25.044, lng: 121.520 }, types: ['museum'] },
  ],
  art_gallery: [
    { placeId: 'mock_art_1', name: '台北市立美術館', address: '台北市中山區中山北路三段181號', rating: 4.6, priceLevel: 1, location: { lat: 25.072, lng: 121.524 }, types: ['art_gallery'] },
    { placeId: 'mock_art_2', name: '就在藝術空間', address: '台北市中山區北京東路', rating: 4.3, priceLevel: 0, location: { lat: 25.055, lng: 121.527 }, types: ['art_gallery'] },
  ],
  park: [
    { placeId: 'mock_park_1', name: '大安森林公園', address: '台北市大安區新生南路二段1號', rating: 4.8, priceLevel: 0, location: { lat: 25.029, lng: 121.535 }, types: ['park'] },
    { placeId: 'mock_park_2', name: '植物園', address: '台北市中正區南海路53號', rating: 4.6, priceLevel: 0, location: { lat: 25.030, lng: 121.511 }, types: ['park'] },
    { placeId: 'mock_park_3', name: '象山步道入口', address: '台北市信義區信義路五段150巷', rating: 4.7, priceLevel: 0, location: { lat: 25.026, lng: 121.577 }, types: ['park'] },
    { placeId: 'mock_park_4', name: '碧潭風景區', address: '新北市新店區碧潭路', rating: 4.5, priceLevel: 0, location: { lat: 24.960, lng: 121.539 }, types: ['park'] },
  ],
  amusement_park: [
    { placeId: 'mock_theme_1', name: '台北市立動物園', address: '台北市文山區新光路二段30號', rating: 4.6, priceLevel: 1, location: { lat: 24.999, lng: 121.580 }, types: ['amusement_park'] },
    { placeId: 'mock_theme_2', name: '八仙海岸', address: '新北市金山區民生路', rating: 4.0, priceLevel: 2, location: { lat: 25.207, lng: 121.636 }, types: ['amusement_park'] },
  ],
  natural_feature: [
    { placeId: 'mock_nature_1', name: '陽明山國家公園', address: '台北市士林區格致路89號', rating: 4.7, priceLevel: 0, location: { lat: 25.162, lng: 121.550 }, types: ['natural_feature'] },
    { placeId: 'mock_nature_2', name: '淡水老街', address: '新北市淡水區中正路', rating: 4.4, priceLevel: 1, location: { lat: 25.170, lng: 121.440 }, types: ['natural_feature'] },
    { placeId: 'mock_nature_3', name: '基隆嶼', address: '基隆市中正區', rating: 4.5, priceLevel: 1, location: { lat: 25.126, lng: 121.769 }, types: ['natural_feature'] },
  ],
  night_club: [
    { placeId: 'mock_perf_1', name: '國家戲劇院', address: '台北市中正區中山南路21-1號', rating: 4.7, priceLevel: 3, location: { lat: 25.040, lng: 121.510 }, types: ['night_club'] },
    { placeId: 'mock_perf_2', name: '台北流行音樂中心', address: '台北市南港區市民大道八段', rating: 4.5, priceLevel: 2, location: { lat: 25.050, lng: 121.599 }, types: ['night_club'] },
  ],
  shopping_mall: [
    { placeId: 'mock_shop_1', name: '台北101購物中心', address: '台北市信義區信義路五段7號', rating: 4.6, priceLevel: 4, location: { lat: 25.034, lng: 121.564 }, types: ['shopping_mall'] },
    { placeId: 'mock_shop_2', name: '微風信義', address: '台北市信義區忠孝東路五段68號', rating: 4.4, priceLevel: 3, location: { lat: 25.041, lng: 121.567 }, types: ['shopping_mall'] },
    { placeId: 'mock_shop_3', name: '誠品生活松菸', address: '台北市信義區菸廠路88號', rating: 4.5, priceLevel: 2, location: { lat: 25.044, lng: 121.558 }, types: ['shopping_mall'] },
  ],
  spa: [
    { placeId: 'mock_spa_1', name: '北投溫泉博物館', address: '台北市北投區中山路2號', rating: 4.5, priceLevel: 0, location: { lat: 25.136, lng: 121.504 }, types: ['spa'] },
    { placeId: 'mock_spa_2', name: '春天酒店溫泉', address: '台北市北投區幽雅路18號', rating: 4.6, priceLevel: 3, location: { lat: 25.148, lng: 121.510 }, types: ['spa'] },
    { placeId: 'mock_spa_3', name: 'Cit.isme 陶瓷體驗工坊', address: '台北市大安區金山南路二段', rating: 4.4, priceLevel: 2, location: { lat: 25.031, lng: 121.527 }, types: ['spa'] },
  ],
};
