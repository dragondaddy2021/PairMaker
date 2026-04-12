/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../../store/useAppStore';
import PRBadge from '../../components/PRBadge';
import CoupleConfirmModal from '../../components/CoupleConfirmModal';
import type { User } from '../../types';

const { width: W, height: H } = Dimensions.get('window');
const AVATAR_H = H * 0.42;

interface Props {
  userId: string;
  onBack: () => void;
  onNavigateToMap: () => void;
  onCoupleConfirmed?: () => void;
}

// ─── 輔助資料 ──────────────────────────────────────────────────────────────────

const GENDER_LABEL: Record<string, string> = {
  male: '男',
  female: '女',
  transgender: '跨性別',
  'non-binary': '非二元',
};

const ETHNICITY_LABEL: Record<string, string> = {
  taiwanese: '台灣人',
  japanese_korean: '日韓裔',
  southeast_asian: '東南亞裔',
  western: '歐美裔',
  south_asian: '南亞裔',
  other: '其他',
};

const ORIENTATION_LABEL: Record<string, string> = {
  straight: '異性戀',
  gay_top: '同性戀(攻)',
  gay_bottom: '同性戀(受)',
  gay_both: '同性戀(雙)',
  gay_side: '同性戀(side)',
  bisexual: '雙性戀',
  lesbian: '女同性戀',
  transgender: '跨性別',
};

const incomeLabel = (income: number): string => {
  if (income < 3) return '3萬以下/月';
  if (income <= 5) return `${income}萬/月`;
  if (income <= 10) return `${income}萬/月`;
  return `${income}萬+/月`;
};

const bmiLabel = (bmi: number): string => {
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 27) return '微胖';
  return '肥胖';
};

const SIM_LABEL: Record<string, string> = {
  faceShape: '臉型',
  skinTone: '膚色',
  hairStyle: '髮型',
  vibe: '氣質',
  bodyStyle: '身材',
};

const SIM_WEIGHT: Record<string, number> = {
  faceShape: 0.20,
  skinTone: 0.15,
  hairStyle: 0.20,
  vibe: 0.25,
  bodyStyle: 0.20,
};

// ─── 子元件 ────────────────────────────────────────────────────────────────────

const ConditionChip: React.FC<{ icon: string; label: string; active?: boolean }> = ({
  icon, label, active = true,
}) => (
  <View style={[styles.condChip, !active && styles.condChipInactive]}>
    <Text style={styles.condIcon}>{icon}</Text>
    <Text style={[styles.condLabel, !active && styles.condLabelInactive]}>{label}</Text>
  </View>
);

const SimBar: React.FC<{ label: string; score: number; weight: number }> = ({
  label, score, weight,
}) => {
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#3B82F6' : score >= 40 ? '#F97316' : '#9CA3AF';
  return (
    <View style={styles.simBarRow}>
      <Text style={styles.simBarLabel}>{label}</Text>
      <View style={styles.simBarTrack}>
        <View style={[styles.simBarFill, { width: `${score}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.simBarScore, { color }]}>{score}</Text>
      <Text style={styles.simBarWeight}>×{weight.toFixed(2)}</Text>
    </View>
  );
};

const FeatureChip: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.featureChip}>
    <Text style={styles.featureChipText}>{label}</Text>
  </View>
);

// ─── 主元件 ────────────────────────────────────────────────────────────────────

const ProfileScreen: React.FC<Props> = ({ userId, onBack, onNavigateToMap, onCoupleConfirmed }) => {
  const { users, similarityScores, isCouple } = useAppStore();
  const [coupleModalVisible, setCoupleModalVisible] = useState(false);

  const user: User | null = useMemo(
    () => users.find((u) => u.id === userId) ?? null,
    [users, userId],
  );

  const simResult = similarityScores[userId];

  if (!user) {
    return (
      <View style={styles.errorWrap}>
        <Text style={styles.errorText}>找不到用戶資料</Text>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← 返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCoupleConfirmed = () => {
    setCoupleModalVisible(false);
    onCoupleConfirmed?.();
  };

  return (
    <View style={styles.root}>
      {/* ── ScrollView 主體 ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 大頭照區塊 ── */}
        <View style={{ height: AVATAR_H }}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.72)']}
            style={styles.avatarGradient}
          >
            {/* 返回按鈕 */}
            <TouchableOpacity onPress={onBack} style={styles.backCircle} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.backCircleText}>←</Text>
            </TouchableOpacity>

            {/* 名字 / 基本資訊 */}
            <View style={styles.avatarInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{user.name}</Text>
                <Text style={styles.userAge}>{user.age} 歲</Text>
                <PRBadge value={user.appearancePR} size="md" />
              </View>
              <Text style={styles.userSubInfo}>
                {user.height} cm・{user.region}・{GENDER_LABEL[user.gender]}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── 詳細資料卡 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本資料</Text>
          <View style={styles.infoGrid}>
            <InfoCell icon="🎓" label="學歷" value={user.education} />
            <InfoCell icon="💼" label="職業" value={user.occupation} />
            <InfoCell icon="💰" label="月收入" value={incomeLabel(user.income)} />
            <InfoCell icon="📍" label="地區" value={user.region} />
            <InfoCell icon="🌏" label="族裔" value={ETHNICITY_LABEL[user.ethnicity]} />
            <InfoCell icon="🏳️‍🌈" label="性向" value={ORIENTATION_LABEL[user.sexualOrientation]} />
          </View>
        </View>

        {/* ── 生活條件 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>生活條件</Text>
          <View style={styles.condRow}>
            <ConditionChip icon="🚗" label="有車" active={user.hasCar} />
            <ConditionChip icon="🏠" label="有房" active={user.hasHouse} />
            <ConditionChip icon="🚭" label="不抽菸" active={!user.isSmoker} />
            <ConditionChip icon="⚖️" label={`BMI ${bmiLabel(user.bmi)}`} active={user.bmi < 27} />
            <ConditionChip icon="💍" label={user.isMarried ? '已婚' : '未婚'} active={!user.isMarried} />
          </View>
        </View>

        {/* ── AI 相似度 ── */}
        {simResult && (
          <View style={styles.section}>
            <View style={styles.simHeader}>
              <Text style={styles.sectionTitle}>🤖 AI 外貌相似度</Text>
              <View style={styles.simScoreBadge}>
                <Text style={styles.simScoreText}>{simResult.score}%</Text>
              </View>
            </View>
            <Text style={styles.simHint}>根據你上傳的照片，與對方外貌的相似程度分析：</Text>
            <View style={styles.simBars}>
              {(Object.keys(SIM_LABEL) as Array<keyof typeof SIM_LABEL>).map((key) => (
                <SimBar
                  key={key}
                  label={SIM_LABEL[key]}
                  score={(simResult.breakdown as any)[key]}
                  weight={SIM_WEIGHT[key]}
                />
              ))}
            </View>
          </View>
        )}

        {/* ── 外貌特徵 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>外貌特徵</Text>
          <View style={styles.featureRow}>
            <FeatureChip label={`臉型：${user.appearanceFeatures.faceShape}`} />
            <FeatureChip label={`膚色：${user.appearanceFeatures.skinTone}`} />
            <FeatureChip label={`髮型：${user.appearanceFeatures.hairStyle}`} />
            <FeatureChip label={`氣質：${user.appearanceFeatures.vibe}`} />
            <FeatureChip label={`身材：${user.appearanceFeatures.bodyStyle}`} />
            <FeatureChip label={`體型：${user.bodyType}`} />
            {user.gender === 'female' && user.cupSize && (
              <FeatureChip label={`罩杯：${user.cupSize}`} />
            )}
          </View>
        </View>

        {/* ── 自我介紹 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自我介紹</Text>
          <View style={styles.bioCard}>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── 底部操作列 ── */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.mapBtn} onPress={onNavigateToMap} activeOpacity={0.85}>
          <Text style={styles.mapBtnText}>🗺️ 推薦約會地點</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.coupleBtn, isCouple && styles.coupleBtnDisabled]}
          onPress={() => !isCouple && setCoupleModalVisible(true)}
          activeOpacity={0.85}
          disabled={isCouple}
        >
          <Text style={styles.coupleBtnText}>
            {isCouple ? '💑 已有伴侶' : '💑 確認交往'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── 確認交往 Modal ── */}
      <CoupleConfirmModal
        visible={coupleModalVisible}
        partner={user}
        onClose={() => setCoupleModalVisible(false)}
        onConfirmed={handleCoupleConfirmed}
      />
    </View>
  );
};

// ─── InfoCell ─────────────────────────────────────────────────────────────────

const InfoCell: React.FC<{ icon: string; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <View style={styles.infoCell}>
    <Text style={styles.infoCellIcon}>{icon}</Text>
    <View>
      <Text style={styles.infoCellLabel}>{label}</Text>
      <Text style={styles.infoCellValue}>{value}</Text>
    </View>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8FA' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 16 },

  // Error
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { fontSize: 16, color: '#aaa' },
  backBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  backBtnText: { fontSize: 15, color: '#FF6B6B' },

  // Avatar
  avatar: { width: W, height: AVATAR_H },
  avatarGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: AVATAR_H,
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 54 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backCircleText: { fontSize: 18, color: '#fff', fontWeight: '600' },
  avatarInfo: { gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 26, fontWeight: '800', color: '#fff' },
  userAge: { fontSize: 18, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },
  userSubInfo: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },

  // Section
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },

  // Info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: (W - 32 - 32 - 10) / 2,
  },
  infoCellIcon: { fontSize: 20 },
  infoCellLabel: { fontSize: 11, color: '#aaa' },
  infoCellValue: { fontSize: 13, fontWeight: '600', color: '#333' },

  // Conditions
  condRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  condChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFCACA',
  },
  condChipInactive: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E5E5E5',
  },
  condIcon: { fontSize: 14 },
  condLabel: { fontSize: 12, fontWeight: '600', color: '#FF6B6B' },
  condLabelInactive: { color: '#BBB' },

  // AI Similarity
  simHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  simScoreBadge: {
    backgroundColor: '#22C55E',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  simScoreText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  simHint: { fontSize: 12, color: '#999', marginBottom: 10 },
  simBars: { gap: 8 },
  simBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  simBarLabel: { fontSize: 12, color: '#666', width: 30 },
  simBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  simBarFill: { height: 6, borderRadius: 3 },
  simBarScore: { fontSize: 12, fontWeight: '700', width: 26, textAlign: 'right' },
  simBarWeight: { fontSize: 10, color: '#bbb', width: 36 },

  // Features
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  featureChip: {
    backgroundColor: '#F3F0FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  featureChipText: { fontSize: 12, color: '#7C3AED', fontWeight: '500' },

  // Bio
  bioCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 12,
  },
  bioText: { fontSize: 14, color: '#555', lineHeight: 22 },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  mapBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FF6B6B',
    alignItems: 'center',
  },
  mapBtnText: { fontSize: 14, fontWeight: '700', color: '#FF6B6B' },
  coupleBtn: {
    flex: 1.4,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  coupleBtnDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  coupleBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

export default ProfileScreen;
