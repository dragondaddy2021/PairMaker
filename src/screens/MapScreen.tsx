/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo,
} from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, PanResponder, Platform, Linking, Share, ActivityIndicator,
  Dimensions, Alert, TouchableWithoutFeedback,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import {
  searchNearbyByTypes,
  haversineDistance,
  formatDistance,
} from '../services/placesApi';
import { generatePlaceRecommendation } from '../services/claudeApi';
import type { PlaceResult } from '../services/placesApi';

// ─── 常數與類型 ────────────────────────────────────────────────────────────────

const { width: W } = Dimensions.get('window');
const CARD_HEIGHT = 440;
const TAIPEI_DEFAULT = { latitude: 25.044, longitude: 121.510 };

interface MapFilter {
  id: string;
  label: string;
  emoji: string;
  googleType: string;
}

const MAP_FILTERS: MapFilter[] = [
  { id: 'restaurant',      label: '餐廳',    emoji: '🍽️', googleType: 'restaurant' },
  { id: 'cafe',            label: '咖啡廳',  emoji: '☕',  googleType: 'cafe' },
  { id: 'movie_theater',   label: '電影院',  emoji: '🎬', googleType: 'movie_theater' },
  { id: 'museum',          label: '展覽館',  emoji: '🎨', googleType: 'museum' },
  { id: 'park',            label: '公園',    emoji: '🌿', googleType: 'park' },
  { id: 'amusement_park',  label: '主題樂園', emoji: '🎡', googleType: 'amusement_park' },
  { id: 'natural_feature', label: '自然景觀', emoji: '🏖️', googleType: 'natural_feature' },
  { id: 'night_club',      label: '表演',    emoji: '🎭', googleType: 'night_club' },
  { id: 'shopping_mall',   label: '購物',    emoji: '🛍️', googleType: 'shopping_mall' },
  { id: 'spa',             label: '體驗活動', emoji: '🧘', googleType: 'spa' },
];

const PRICE_SYMBOLS = ['免費', '$', '$$', '$$$', '$$$$'];
const ALL_TYPE_IDS = MAP_FILTERS.map((f) => f.id);
const BTN_W = (W - 40 - 8) / 2;  // fixed 2-column button width

export interface SharedMapScreenProps {
  onNavigateToPlan?: () => void;
}

// ─── Mock 地圖視覺標頭 ─────────────────────────────────────────────────────────

// ─── Mock Map Visual ──────────────────────────────────────────────────────────
// 街道、地標、更真實的地圖色彩

// 地圖地標資料（固定，視覺用）
const MAP_LANDMARKS = [
  { x: 0.18, y: 0.28, emoji: '☕', label: '咖啡廳' },
  { x: 0.55, y: 0.20, emoji: '🍽️', label: '餐廳' },
  { x: 0.76, y: 0.52, emoji: '🌿', label: '公園' },
  { x: 0.32, y: 0.60, emoji: '🎬', label: '電影院' },
  { x: 0.82, y: 0.28, emoji: '🛍️', label: '購物' },
  { x: 0.10, y: 0.68, emoji: '🎨', label: '展覽館' },
  { x: 0.60, y: 0.70, emoji: '🧘', label: '體驗' },
  { x: 0.44, y: 0.42, emoji: '🎭', label: '表演' },
];

// 道路節點（用來畫假街道）
const H_ROADS = [0.22, 0.42, 0.62, 0.80];
const V_ROADS = [0.15, 0.33, 0.52, 0.70, 0.86];
// 公園/綠地區塊
const GREEN_BLOCKS = [
  { x: 0.60, y: 0.44, w: 0.22, h: 0.18 },
  { x: 0.05, y: 0.10, w: 0.12, h: 0.14 },
];
// 建築物方塊
const BUILDINGS = [
  { x: 0.06, y: 0.30, w: 0.10, h: 0.08 },
  { x: 0.20, y: 0.48, w: 0.12, h: 0.10 },
  { x: 0.38, y: 0.22, w: 0.16, h: 0.14 },
  { x: 0.64, y: 0.24, w: 0.14, h: 0.10 },
  { x: 0.80, y: 0.58, w: 0.14, h: 0.20 },
  { x: 0.20, y: 0.70, w: 0.18, h: 0.12 },
  { x: 0.44, y: 0.62, w: 0.12, h: 0.10 },
];

// 像素→座標偏移換算（220px ≈ 2km，1px ≈ 9m）
const LAT_PER_PX = 0.000081;
const LNG_PER_PX = 0.000090;

const MockMapHeader: React.FC<{
  coords: { latitude: number; longitude: number } | null;
  isLoading: boolean;
  placeCount: number;
  locationError: string | null;
  onShift: (dLat: number, dLng: number) => void;
  onResetCenter: () => void;
  isDragged: boolean;
}> = ({ coords, isLoading, placeCount, locationError, onShift, onResetCenter, isDragged }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // 本地拖曳偏移（px），用於視覺位移地圖圖層
  const panOffset = useRef({ x: 0, y: 0 }).current;
  const visualOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        visualOffset.setValue({ x: gs.dx + panOffset.x, y: gs.dy + panOffset.y });
      },
      onPanResponderRelease: (_, gs) => {
        const totalDx = gs.dx + panOffset.x;
        const totalDy = gs.dy + panOffset.y;
        panOffset.x = totalDx;
        panOffset.y = totalDy;
        // 通知父層更新地圖中心座標
        onShift(-totalDy * LAT_PER_PX, totalDx * LNG_PER_PX);
      },
    }),
  ).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const coordText = coords
    ? `${coords.latitude.toFixed(4)}°N, ${coords.longitude.toFixed(4)}°E`
    : '台北市, 台灣';

  return (
    <View style={mockMapStyles.root} {...panResponder.panHandlers}>
      {/* 可拖曳圖層 */}
      <Animated.View style={[mockMapStyles.draggableLayer, {
        transform: [
          { translateX: visualOffset.x },
          { translateY: visualOffset.y },
        ],
      }]}>
      {/* 地圖底色（仿 Google Maps 淺色主題） */}
      <View style={mockMapStyles.mapBase} />

      {/* 綠地區塊 */}
      {GREEN_BLOCKS.map((b, i) => (
        <View
          key={`g${i}`}
          style={[mockMapStyles.greenBlock, {
            left: `${b.x * 100}%` as any,
            top: `${b.y * 100}%` as any,
            width: `${b.w * 100}%` as any,
            height: `${b.h * 100}%` as any,
          }]}
        />
      ))}

      {/* 建築物方塊 */}
      {BUILDINGS.map((b, i) => (
        <View
          key={`b${i}`}
          style={[mockMapStyles.building, {
            left: `${b.x * 100}%` as any,
            top: `${b.y * 100}%` as any,
            width: `${b.w * 100}%` as any,
            height: `${b.h * 100}%` as any,
          }]}
        />
      ))}

      {/* 橫向道路 */}
      {H_ROADS.map((pct, i) => (
        <View key={`h${i}`} style={[mockMapStyles.roadH, { top: `${pct * 100}%` as any }]} />
      ))}
      {/* 縱向道路 */}
      {V_ROADS.map((pct, i) => (
        <View key={`v${i}`} style={[mockMapStyles.roadV, { left: `${pct * 100}%` as any }]} />
      ))}

      {/* 主幹道（較寬） */}
      <View style={[mockMapStyles.roadHMain, { top: '42%' as any }]} />
      <View style={[mockMapStyles.roadVMain, { left: '33%' as any }]} />

      {/* 地標 */}
      {MAP_LANDMARKS.map((lm, i) => (
        <View
          key={`lm${i}`}
          style={[mockMapStyles.landmark, {
            left: `${lm.x * 100}%` as any,
            top: `${lm.y * 100}%` as any,
          }]}
        >
          <View style={mockMapStyles.landmarkBubble}>
            <Text style={mockMapStyles.landmarkEmoji}>{lm.emoji}</Text>
          </View>
        </View>
      ))}

      {/* 目前位置：藍色脈衝圓（跟著拖曳移動） */}
      <View style={mockMapStyles.myLocWrap}>
        <Animated.View
          style={[mockMapStyles.myLocRing, { transform: [{ scale: pulseAnim }], opacity: isLoading ? pulseAnim : 0.35 }]}
        />
        <View style={mockMapStyles.myLocDot} />
      </View>
      </Animated.View>{/* ← close draggableLayer */}

      {/* 固定 UI（不跟著拖曳） */}

      {/* 拖曳提示 */}
      <View style={mockMapStyles.dragHint} pointerEvents="none">
        <Text style={mockMapStyles.dragHintText}>
          {isDragged ? '✋ 已移動中心點' : '👆 拖曳地圖可移動中心點'}
        </Text>
      </View>

      {/* 方位指南針 */}
      <View style={mockMapStyles.compass}>
        <Text style={mockMapStyles.compassN}>N</Text>
        <Text style={mockMapStyles.compassArrow}>↑</Text>
      </View>

      {/* 比例尺 */}
      <View style={mockMapStyles.scaleBar}>
        <View style={mockMapStyles.scaleLine} />
        <Text style={mockMapStyles.scaleText}>500m</Text>
      </View>

      {/* 資訊疊層 */}
      <View style={mockMapStyles.overlay}>
        <View style={mockMapStyles.coordBadge}>
          <Text style={mockMapStyles.coordIcon}>📍</Text>
          <Text style={mockMapStyles.coordText}>{isLoading ? '定位中…' : coordText}</Text>
        </View>
        <View style={mockMapStyles.rightBadges}>
          {isDragged && (
            <TouchableOpacity style={mockMapStyles.resetBtn} onPress={onResetCenter}>
              <Text style={mockMapStyles.resetBtnText}>↺ 回原點</Text>
            </TouchableOpacity>
          )}
          {!isLoading && placeCount > 0 && (
            <View style={mockMapStyles.countBadge}>
              <Text style={mockMapStyles.countText}>找到 {placeCount} 個地點</Text>
            </View>
          )}
          {locationError && (
            <View style={mockMapStyles.errorBadge}>
              <Text style={mockMapStyles.errorText}>⚠️ 預設位置</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const mockMapStyles = StyleSheet.create({
  root: {
    height: 220,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E8ECE0',
  },
  mapBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EEF2E8',
  },
  greenBlock: {
    position: 'absolute',
    backgroundColor: '#C8DDB0',
    borderRadius: 4,
  },
  building: {
    position: 'absolute',
    backgroundColor: '#D4D0C8',
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: '#C0BCB4',
  },
  roadH: {
    position: 'absolute',
    left: 0, right: 0,
    height: 4,
    backgroundColor: '#fff',
    borderTopWidth: 0.5, borderBottomWidth: 0.5,
    borderColor: '#DDD',
  },
  roadV: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 4,
    backgroundColor: '#fff',
    borderLeftWidth: 0.5, borderRightWidth: 0.5,
    borderColor: '#DDD',
  },
  roadHMain: {
    position: 'absolute',
    left: 0, right: 0,
    height: 8,
    backgroundColor: '#FFF9C4',
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: '#E8D44D',
  },
  roadVMain: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: 8,
    backgroundColor: '#FFF9C4',
    borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: '#E8D44D',
  },
  landmark: {
    position: 'absolute',
    alignItems: 'center',
  },
  landmarkBubble: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  landmarkEmoji: { fontSize: 13 },
  myLocWrap: {
    position: 'absolute',
    top: '38%', left: '46%',
    alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32,
  },
  myLocRing: {
    position: 'absolute',
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(66,133,244,0.2)',
    borderWidth: 1, borderColor: 'rgba(66,133,244,0.4)',
  },
  myLocDot: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: '#4285F4',
    borderWidth: 2.5, borderColor: '#fff',
    shadowColor: '#4285F4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  compass: {
    position: 'absolute',
    top: 10, right: 12,
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15, shadowRadius: 2, elevation: 2,
  },
  compassN: { fontSize: 7, fontWeight: '800', color: '#E53935', lineHeight: 8 },
  compassArrow: { fontSize: 9, color: '#E53935', lineHeight: 10 },
  scaleBar: {
    position: 'absolute',
    bottom: 38, right: 12,
    alignItems: 'flex-end', gap: 1,
  },
  scaleLine: {
    width: 50, height: 3,
    backgroundColor: '#555',
    borderRadius: 1,
  },
  scaleText: { fontSize: 9, color: '#555', fontWeight: '600' },
  overlay: {
    position: 'absolute',
    bottom: 8, left: 10, right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coordBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 2, elevation: 2,
  },
  coordIcon: { fontSize: 11 },
  coordText: { fontSize: 10, color: '#333', fontWeight: '600' },
  rightBadges: { flexDirection: 'row', gap: 6 },
  countBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  countText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  errorBadge: {
    backgroundColor: 'rgba(255,152,0,0.9)',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  errorText: { fontSize: 10, color: '#fff', fontWeight: '600' },

  // 拖曳相關
  draggableLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  dragHint: {
    position: 'absolute',
    top: 8, left: 0, right: 0,
    alignItems: 'center',
  },
  dragHintText: {
    fontSize: 10, color: 'rgba(0,0,0,0.45)', fontWeight: '500',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  resetBtn: {
    backgroundColor: '#4285F4',
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
  resetBtnText: { fontSize: 10, color: '#fff', fontWeight: '700' },
});

// ─── 地點列表卡片 ──────────────────────────────────────────────────────────────

interface PlaceListCardProps {
  place: PlaceResult;
  distanceLabel: string;
  emoji: string;
  isVisited: boolean;
  isWished: boolean;
  onPress: () => void;
}

const PlaceListCard: React.FC<PlaceListCardProps> = ({
  place, distanceLabel, emoji, isVisited, isWished, onPress,
}) => (
  <TouchableOpacity style={listCardStyles.root} onPress={onPress} activeOpacity={0.85}>
    <View style={listCardStyles.emojiBox}>
      <Text style={listCardStyles.emoji}>{emoji}</Text>
    </View>
    <View style={listCardStyles.info}>
      <Text style={listCardStyles.name} numberOfLines={1}>{place.name}</Text>
      <Text style={listCardStyles.address} numberOfLines={1}>📍 {place.address}</Text>
      <View style={listCardStyles.metaRow}>
        <Text style={listCardStyles.rating}>⭐ {place.rating.toFixed(1)}</Text>
        {place.priceLevel !== undefined && (
          <Text style={listCardStyles.price}>{PRICE_SYMBOLS[place.priceLevel] ?? ''}</Text>
        )}
        {distanceLabel ? <Text style={listCardStyles.distance}>{distanceLabel}</Text> : null}
      </View>
    </View>
    <View style={listCardStyles.badges}>
      {isWished && <Text style={listCardStyles.badge}>💝</Text>}
      {isVisited && <Text style={listCardStyles.badge}>✅</Text>}
      <Text style={listCardStyles.chevron}>›</Text>
    </View>
  </TouchableOpacity>
);

const listCardStyles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  emojiBox: {
    width: 48, height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 24 },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  address: { fontSize: 12, color: '#888' },
  metaRow: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  rating: { fontSize: 12, color: '#F59E0B', fontWeight: '600' },
  price: { fontSize: 12, color: '#888' },
  distance: { fontSize: 12, color: '#4B9EFF' },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badge: { fontSize: 16 },
  chevron: { fontSize: 20, color: '#CCC' },
});

// ─── 地點詳細卡片（底部滑出） ─────────────────────────────────────────────────

interface PlaceDetailCardProps {
  place: PlaceResult;
  isCouple: boolean;
  aiReason: string;
  isLoadingAi: boolean;
  isVisited: boolean;
  isWished: boolean;
  distanceLabel: string;
  emoji: string;
  onClose: () => void;
  onNavigate: () => void;
  onShare: () => void;
  onWishlist: () => void;
  onVisited: () => void;
  onAddToPlan?: () => void;
}

const PlaceDetailCard: React.FC<PlaceDetailCardProps> = ({
  place, isCouple, aiReason, isLoadingAi,
  isVisited, isWished, distanceLabel, emoji,
  onClose, onNavigate, onShare, onWishlist, onVisited, onAddToPlan,
}) => (
  <ScrollView style={detailStyles.scroll} showsVerticalScrollIndicator={false}>
    {/* Header */}
    <View style={detailStyles.header}>
      <View style={detailStyles.emojiBox}>
        <Text style={detailStyles.emoji}>{emoji}</Text>
      </View>
      <View style={detailStyles.headerInfo}>
        <Text style={detailStyles.name}>{place.name}</Text>
        <Text style={detailStyles.address} numberOfLines={2}>📍 {place.address}</Text>
        <View style={detailStyles.metaRow}>
          <Text style={detailStyles.rating}>⭐ {place.rating.toFixed(1)}</Text>
          {place.priceLevel !== undefined && (
            <Text style={detailStyles.price}>{PRICE_SYMBOLS[place.priceLevel] ?? ''}</Text>
          )}
          {distanceLabel ? <Text style={detailStyles.distance}>{distanceLabel}</Text> : null}
        </View>
      </View>
      <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose}>
        <Text style={detailStyles.closeBtnText}>✕</Text>
      </TouchableOpacity>
    </View>

    {/* AI 推薦理由 */}
    <View style={detailStyles.aiBox}>
      <Text style={detailStyles.aiLabel}>✨ AI 推薦理由</Text>
      {isLoadingAi ? (
        <ActivityIndicator size="small" color="#FF6B6B" style={{ marginTop: 6 }} />
      ) : (
        <Text style={detailStyles.aiText}>{aiReason || '正在分析這個地點…'}</Text>
      )}
    </View>

    {/* 操作按鈕 */}
    <View style={detailStyles.actionGrid}>
      <TouchableOpacity style={detailStyles.actionBtn} onPress={onNavigate}>
        <Text style={detailStyles.actionIcon}>🗺️</Text>
        <Text style={detailStyles.actionLabel}>導航前往</Text>
      </TouchableOpacity>
      <TouchableOpacity style={detailStyles.actionBtn} onPress={onShare}>
        <Text style={detailStyles.actionIcon}>📤</Text>
        <Text style={detailStyles.actionLabel}>分享地點</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[detailStyles.actionBtn, isWished && detailStyles.actionBtnActive]}
        onPress={onWishlist}
      >
        <Text style={detailStyles.actionIcon}>{isWished ? '💝' : '🤍'}</Text>
        <Text style={[detailStyles.actionLabel, isWished && detailStyles.actionLabelActive]}>
          {isWished ? '已收藏' : '加入心願'}
        </Text>
      </TouchableOpacity>
      {isCouple && (
        <TouchableOpacity
          style={[detailStyles.actionBtn, isVisited && detailStyles.actionBtnActive]}
          onPress={onVisited}
        >
          <Text style={detailStyles.actionIcon}>{isVisited ? '✅' : '📌'}</Text>
          <Text style={[detailStyles.actionLabel, isVisited && detailStyles.actionLabelActive]}>
            {isVisited ? '已去過' : '標記去過'}
          </Text>
        </TouchableOpacity>
      )}
    </View>

    {/* 加入約會計畫（伴侶模式） */}
    {isCouple && onAddToPlan && (
      <TouchableOpacity style={detailStyles.planBtn} onPress={onAddToPlan}>
        <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={detailStyles.planBtnGrad}>
          <Text style={detailStyles.planBtnText}>📅 加入約會計畫</Text>
        </LinearGradient>
      </TouchableOpacity>
    )}
  </ScrollView>
);

const detailStyles = StyleSheet.create({
  scroll: { flex: 1 },
  header: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  emojiBox: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: { fontSize: 28 },
  headerInfo: { flex: 1, gap: 4 },
  name: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  address: { fontSize: 12, color: '#888', lineHeight: 16 },
  metaRow: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  rating: { fontSize: 13, color: '#F59E0B', fontWeight: '600' },
  price: { fontSize: 13, color: '#888' },
  distance: { fontSize: 13, color: '#4B9EFF' },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  closeBtnText: { fontSize: 12, color: '#888', fontWeight: '700' },
  aiBox: {
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8E53',
    gap: 4,
  },
  aiLabel: { fontSize: 12, fontWeight: '700', color: '#FF8E53' },
  aiText: { fontSize: 13, color: '#555', lineHeight: 20 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  actionBtn: {
    width: BTN_W,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 12,
    backgroundColor: '#F8F8FA', borderRadius: 12,
    borderWidth: 1, borderColor: '#EBEBEB',
  },
  actionBtnActive: { backgroundColor: '#FFF0F0', borderColor: '#FFCACA' },
  actionIcon: { fontSize: 22 },
  actionLabel: { fontSize: 11, color: '#555', fontWeight: '600' },
  actionLabelActive: { color: '#FF6B6B' },
  planBtn: { borderRadius: 14, overflow: 'hidden' },
  planBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  planBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

// ─── 主元件 ────────────────────────────────────────────────────────────────────

const SharedMapScreen: React.FC<SharedMapScreenProps> = ({ onNavigateToPlan }) => {
  const insets = useSafeAreaInsets();
  const {
    appMode,
    partnerUser,
    datePlans,
    wishlistPlaceIds,
    addToWishlist,
    removeFromWishlist,
    visitedPlaceIds,
    markPlaceVisited,
    addDatePlan,
  } = useAppStore();

  const isCouple = appMode === 'couple';

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  // mapCenter = 地圖中心點（可被拖曳偏移）
  const [mapCenter, setMapCenter] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isDragged, setIsDragged] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(ALL_TYPE_IDS);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [aiReasons, setAiReasons] = useState<Record<string, string>>({});
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const cardAnim = useRef(new Animated.Value(0)).current;

  // ── 取得定位 ──────────────────────────────────────────────────────────────

  const requestLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('無法取得位置權限，顯示台北市預設地點');
        setUserCoords(TAIPEI_DEFAULT);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserCoords(coords);
      setMapCenter(coords);
    } catch {
      setLocationError('定位失敗，顯示台北市預設地點');
      setUserCoords(TAIPEI_DEFAULT);
      setMapCenter(TAIPEI_DEFAULT);
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  // 若權限拒絕時也設定 mapCenter
  useEffect(() => {
    if (userCoords && !mapCenter) setMapCenter(userCoords);
  }, [userCoords, mapCenter]);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  // ── 拖曳地圖：更新中心點 ──────────────────────────────────────────────────

  const handleMapShift = useCallback((dLat: number, dLng: number) => {
    setMapCenter((prev) => {
      const base = prev ?? userCoords ?? TAIPEI_DEFAULT;
      return { latitude: base.latitude + dLat, longitude: base.longitude + dLng };
    });
    setIsDragged(true);
  }, [userCoords]);

  const handleResetCenter = useCallback(() => {
    setMapCenter(userCoords ?? TAIPEI_DEFAULT);
    setIsDragged(false);
  }, [userCoords]);

  // ── 搜尋地點 ──────────────────────────────────────────────────────────────

  const fetchPlaces = useCallback(async () => {
    if (!userCoords || selectedTypes.length === 0) return;
    setIsLoadingPlaces(true);
    try {
      const results = await searchNearbyByTypes(
        userCoords.latitude,
        userCoords.longitude,
        selectedTypes,
      );
      setPlaces(results);
    } finally {
      setIsLoadingPlaces(false);
    }
  }, [userCoords, selectedTypes]);

  useEffect(() => {
    if (userCoords) fetchPlaces();
  }, [fetchPlaces]);

  // ── 篩選切換 ──────────────────────────────────────────────────────────────

  const isAllSelected = selectedTypes.length === ALL_TYPE_IDS.length;

  const toggleAll = useCallback(() => {
    setSelectedTypes(ALL_TYPE_IDS);
    setSelectedPlace(null);
  }, []);

  const toggleType = useCallback((typeId: string) => {
    setSelectedTypes((prev) => {
      // If currently showing all, switch to just this type
      if (prev.length === ALL_TYPE_IDS.length) return [typeId];
      if (prev.includes(typeId)) {
        if (prev.length === 1) return ALL_TYPE_IDS;
        return prev.filter((t) => t !== typeId);
      }
      return [...prev, typeId];
    });
    setSelectedPlace(null);
  }, []);

  // ── 選擇地點 ──────────────────────────────────────────────────────────────

  const openCard = useCallback((place: PlaceResult) => {
    setSelectedPlace(place);
    Animated.spring(cardAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 16,
      bounciness: 4,
    }).start();
  }, [cardAnim]);

  const closeCard = useCallback(() => {
    Animated.timing(cardAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setSelectedPlace(null));
  }, [cardAnim]);

  // ── AI 推薦理由 ────────────────────────────────────────────────────────────

  const fetchAiReason = useCallback(async (place: PlaceResult) => {
    if (aiReasons[place.placeId]) return;
    setIsLoadingAi(true);
    const recentDateLocations = datePlans
      .filter((p) => p.completed)
      .slice(0, 3)
      .map((p) => p.location);
    const reason = await generatePlaceRecommendation(
      { name: place.name, rating: place.rating, address: place.address, types: place.types },
      { isCouple, partnerName: partnerUser?.name, recentDateLocations },
    );
    setAiReasons((prev) => ({ ...prev, [place.placeId]: reason }));
    setIsLoadingAi(false);
  }, [aiReasons, isCouple, partnerUser, datePlans]);

  useEffect(() => {
    if (selectedPlace) fetchAiReason(selectedPlace);
  }, [selectedPlace, fetchAiReason]);

  // ── 操作 ──────────────────────────────────────────────────────────────────

  const openNavigation = useCallback((place: PlaceResult) => {
    const { lat, lng } = place.location;
    const label = encodeURIComponent(place.name);
    const url = Platform.OS === 'ios'
      ? `maps://?daddr=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`),
    );
  }, []);

  const sharePlace = useCallback(async (place: PlaceResult) => {
    const reason = aiReasons[place.placeId] ?? '';
    await Share.share({
      message: `推薦你去：${place.name}\n📍 ${place.address}\n⭐ ${place.rating}${reason ? `\n\n${reason}` : ''}`,
      title: '約會地點推薦',
    });
  }, [aiReasons]);

  const addToPlan = useCallback((place: PlaceResult) => {
    const plan = {
      id: `plan_${Date.now()}`,
      title: `去 ${place.name}`,
      date: new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0],
      location: place.name,
      placeId: place.placeId,
      notes: aiReasons[place.placeId] ?? '',
      completed: false,
    };
    addDatePlan(plan);
    Alert.alert('✅ 已加入約會計畫', `「${place.name}」已排入下週行程`, [
      { text: '查看計畫', onPress: () => { closeCard(); onNavigateToPlan?.(); } },
      { text: '繼續瀏覽', style: 'cancel' },
    ]);
  }, [aiReasons, addDatePlan, closeCard, onNavigateToPlan]);

  const handleToggleWishlist = useCallback((placeId: string) => {
    if (wishlistPlaceIds.includes(placeId)) {
      removeFromWishlist(placeId);
    } else {
      addToWishlist(placeId);
      Alert.alert('💝 已加入心願清單', '這個地方已加入你的心願清單');
    }
  }, [wishlistPlaceIds, addToWishlist, removeFromWishlist]);

  const handleToggleVisited = useCallback((placeId: string) => {
    if (visitedPlaceIds.includes(placeId)) {
      Alert.alert('已標記去過', '目前暫不支援移除去過紀錄');
    } else {
      markPlaceVisited(placeId);
      Alert.alert('❤️ 已標記', '這個地方已加入你們的去過紀錄');
    }
  }, [visitedPlaceIds, markPlaceVisited]);

  // ── 工具 ──────────────────────────────────────────────────────────────────

  const getDistanceLabel = useCallback((place: PlaceResult): string => {
    const center = mapCenter ?? userCoords;
    if (!center) return '';
    const m = haversineDistance(
      center.latitude, center.longitude,
      place.location.lat, place.location.lng,
    );
    return formatDistance(m);
  }, [mapCenter, userCoords]);

  const getPlaceEmoji = useCallback((place: PlaceResult): string => {
    const type = place.types[0];
    const f = MAP_FILTERS.find((m) => m.googleType === type) ?? MAP_FILTERS[0];
    return f.emoji;
  }, []);

  const cardTranslateY = cardAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CARD_HEIGHT, 0],
  });

  // ── 排序地點（選取的類別優先，再按評分） ─────────────────────────────────

  // 拖曳後依距離重新排序，未拖曳時依評分排序
  const sortedPlaces = useMemo(() => {
    const center = mapCenter ?? userCoords;
    if (isDragged && center) {
      return [...places].sort((a, b) => {
        const da = haversineDistance(center.latitude, center.longitude, a.location.lat, a.location.lng);
        const db = haversineDistance(center.latitude, center.longitude, b.location.lat, b.location.lng);
        return da - db;
      });
    }
    return [...places].sort((a, b) => b.rating - a.rating);
  }, [places, mapCenter, userCoords, isDragged]);

  // ── Loading ─────────────────────────────────────────────────────────────

  if (isLoadingLocation && !userCoords) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>正在取得您的位置…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── 篩選列 ── */}
      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <TouchableOpacity
            style={[styles.filterChip, isAllSelected && styles.filterChipActive]}
            onPress={toggleAll}
            activeOpacity={0.8}
            delayPressIn={0}
          >
            <Text style={styles.filterChipEmoji}>🗺️</Text>
            <Text style={[styles.filterChipLabel, isAllSelected && styles.filterChipLabelActive]}>
              全部
            </Text>
          </TouchableOpacity>
          {MAP_FILTERS.map((f) => {
            const active = !isAllSelected && selectedTypes.includes(f.id);
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => toggleType(f.id)}
                activeOpacity={0.8}
                delayPressIn={0}
              >
                <Text style={styles.filterChipEmoji}>{f.emoji}</Text>
                <Text style={[styles.filterChipLabel, active && styles.filterChipLabelActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Mock 地圖標頭 ── */}
      <MockMapHeader
        coords={mapCenter ?? userCoords}
        isLoading={isLoadingLocation}
        placeCount={places.length}
        locationError={locationError}
        onShift={handleMapShift}
        onResetCenter={handleResetCenter}
        isDragged={isDragged}
      />

      {/* ── 地點列表 ── */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingPlaces ? (
          <View style={styles.listLoading}>
            <ActivityIndicator size="small" color="#FF6B6B" />
            <Text style={styles.listLoadingText}>搜尋附近地點中…</Text>
          </View>
        ) : sortedPlaces.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyTitle}>附近沒有符合的地點</Text>
            <Text style={styles.emptyDesc}>試試切換上方的地點類別</Text>
          </View>
        ) : (
          sortedPlaces.map((place) => (
            <PlaceListCard
              key={place.placeId}
              place={place}
              distanceLabel={getDistanceLabel(place)}
              emoji={getPlaceEmoji(place)}
              isVisited={visitedPlaceIds.includes(place.placeId)}
              isWished={wishlistPlaceIds.includes(place.placeId)}
              onPress={() => openCard(place)}
            />
          ))
        )}
      </ScrollView>

      {/* ── 地點詳細卡片（底部滑出） ── */}
      {selectedPlace && (
        <>
          <TouchableWithoutFeedback onPress={closeCard}>
            <View style={styles.backdrop} />
          </TouchableWithoutFeedback>
          <Animated.View
            style={[styles.detailCard, { transform: [{ translateY: cardTranslateY }] }]}
          >
            <View style={styles.detailHandle} />
            <PlaceDetailCard
              place={selectedPlace}
              isCouple={isCouple}
              aiReason={aiReasons[selectedPlace.placeId] ?? ''}
              isLoadingAi={isLoadingAi}
              isVisited={visitedPlaceIds.includes(selectedPlace.placeId)}
              isWished={wishlistPlaceIds.includes(selectedPlace.placeId)}
              distanceLabel={getDistanceLabel(selectedPlace)}
              emoji={getPlaceEmoji(selectedPlace)}
              onClose={closeCard}
              onNavigate={() => openNavigation(selectedPlace)}
              onShare={() => sharePlace(selectedPlace)}
              onWishlist={() => handleToggleWishlist(selectedPlace.placeId)}
              onVisited={() => handleToggleVisited(selectedPlace.placeId)}
              onAddToPlan={isCouple ? () => addToPlan(selectedPlace) : undefined}
            />
          </Animated.View>
        </>
      )}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8FA' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#888' },

  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  filterScroll: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  filterChipActive: {
    backgroundColor: '#FFF0F0',
    borderColor: '#FF6B6B',
  },
  filterChipEmoji: { fontSize: 14 },
  filterChipLabel: { fontSize: 12, color: '#666', fontWeight: '500' },
  filterChipLabelActive: { color: '#FF6B6B', fontWeight: '700' },

  list: { flex: 1 },
  listContent: { padding: 14, paddingBottom: 32 },
  listLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 40 },
  listLoadingText: { fontSize: 14, color: '#888' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  emptyDesc: { fontSize: 13, color: '#aaa' },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  detailCard: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  detailHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 14,
  },
});

export default SharedMapScreen;
