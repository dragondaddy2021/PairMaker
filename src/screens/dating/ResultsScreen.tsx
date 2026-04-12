/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';

import UserCard from '../../components/UserCard';
import ProfileModal from '../../components/ProfileModal';
import SimilarityBadge from '../../components/SimilarityBadge';
import { useAppStore } from '../../store/useAppStore';
import {
  analyzeAppearancePhoto,
  rankUsersByAppearance,
} from '../../services/claudeApi';
import type { FilterCriteriaExtended, User } from '../../types';

// ─── 排序選項 ─────────────────────────────────────────────────────────────────

type SortKey = 'similarity' | 'pr' | 'income' | 'age' | 'height';

const SORT_OPTIONS: Array<{ key: SortKey; label: string; icon: string }> = [
  { key: 'similarity', label: 'AI 相似', icon: '🤖' },
  { key: 'pr',        label: 'PR 值',  icon: '✨' },
  { key: 'income',    label: '收入',   icon: '💰' },
  { key: 'age',       label: '年齡',   icon: '🎂' },
  { key: 'height',    label: '身高',   icon: '📏' },
];

// ─── AI 分析狀態 ──────────────────────────────────────────────────────────────

type AIStatus = 'idle' | 'analyzing' | 'done' | 'error' | 'no_photo';

// ─── helper：排序 ─────────────────────────────────────────────────────────────

const sortUsers = (
  users: User[],
  key: SortKey,
  similarityScores: Record<string, { score: number }>,
): User[] =>
  [...users].sort((a, b) => {
    switch (key) {
      case 'similarity': {
        const sa = similarityScores[a.id]?.score ?? -1;
        const sb = similarityScores[b.id]?.score ?? -1;
        return sb - sa;
      }
      case 'pr':     return b.appearancePR - a.appearancePR;
      case 'income': return b.income - a.income;
      case 'age':    return a.age - b.age;
      case 'height': return b.height - a.height;
    }
  });

// ─── 元件 ─────────────────────────────────────────────────────────────────────

interface Props {
  criteria: FilterCriteriaExtended;
  onBack: () => void;
  onOpenProfile?: (userId: string) => void;
}

const ResultsScreen: React.FC<Props> = ({ criteria, onBack, onOpenProfile }) => {
  const {
    filteredUsers,
    likedUserIds,
    passedUserIds,
    points,
    similarityScores,
    setSimilarityScores,
    clearSimilarityScores,
  } = useAppStore();

  const [sortKey, setSortKey] = useState<SortKey>(
    criteria.appearancePhotoUri ? 'similarity' : 'pr',
  );
  const [showPassed, setShowPassed] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [aiStatus, setAiStatus] = useState<AIStatus>(
    criteria.appearancePhotoUri ? 'analyzing' : 'no_photo',
  );
  const [aiError, setAiError] = useState<string | null>(null);

  const analysisStarted = useRef(false);

  // ─── AI 分析（mount 時執行一次）──────────────────────────────────────────

  useEffect(() => {
    if (!criteria.appearancePhotoUri || analysisStarted.current) return;
    analysisStarted.current = true;

    clearSimilarityScores();

    const run = async () => {
      try {
        const features = await analyzeAppearancePhoto(criteria.appearancePhotoUri!);

        if (!features) {
          // API 未設定或回傳 null → 使用 mock 相似度
          const mockScores = filteredUsers.map((u, i) => ({
            userId: u.id,
            score: Math.max(10, 95 - i * 4 + (u.appearancePR / 5)),
            breakdown: {
              faceShape: 70,
              skinTone: 70,
              hairStyle: 70,
              vibe: 70,
              bodyStyle: 70,
            },
          }));
          setSimilarityScores(mockScores);
          setAiStatus('done');
          return;
        }

        const ranked = rankUsersByAppearance(features, filteredUsers);
        setSimilarityScores(ranked);
        setAiStatus('done');
      } catch (err) {
        const msg = err instanceof Error ? err.message : '分析失敗';
        setAiError(msg);
        setAiStatus('error');
        Alert.alert('AI 分析失敗', msg, [{ text: '確認' }]);
      }
    };

    run();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 排序後列表 ──────────────────────────────────────────────────────────

  const displayUsers = useMemo(() => {
    const base = showPassed
      ? filteredUsers
      : filteredUsers.filter((u) => !passedUserIds.includes(u.id));
    return sortUsers(base, sortKey, similarityScores);
  }, [filteredUsers, passedUserIds, sortKey, showPassed, similarityScores]);

  const likedCount = useMemo(
    () => filteredUsers.filter((u) => likedUserIds.includes(u.id)).length,
    [filteredUsers, likedUserIds],
  );

  const hasPhoto = !!criteria.appearancePhotoUri;

  // ─── render helpers ────────────────────────────────────────────────────

  const handleCardPress = useCallback(
    (user: User) => {
      if (onOpenProfile) {
        onOpenProfile(user.id);
      } else {
        setSelectedUser(user);
      }
    },
    [onOpenProfile],
  );

  const isSplitMode = !!criteria.genderSplit;

  const renderItem = useCallback(
    ({ item }: { item: User }) => {
      const simScore = hasPhoto ? (similarityScores[item.id]?.score ?? null) : undefined;
      return (
        <View>
          {isSplitMode && (
            <View style={[
              styles.genderBadge,
              item.gender === 'male' ? styles.genderBadgeMale : styles.genderBadgeFemale,
            ]}>
              <Text style={styles.genderBadgeText}>
                {item.gender === 'male' ? '♂ 男性' : '♀ 女性'}
              </Text>
            </View>
          )}
          <UserCard
            user={item}
            onPress={handleCardPress}
            similarityScore={simScore}
          />
        </View>
      );
    },
    [hasPhoto, similarityScores, handleCardPress, isSplitMode],
  );

  const keyExtractor = useCallback((item: User) => item.id, []);

  // ─── Header（含 AI 狀態提示）─────────────────────────────────────────────

  const AIStatusBar = useMemo(() => {
    if (!hasPhoto) return null;

    if (aiStatus === 'analyzing') {
      return (
        <View style={styles.aiBar}>
          <ActivityIndicator size="small" color="#FF6B6B" />
          <Text style={styles.aiBarText}>🤖 AI 正在分析照片外貌特徵⋯</Text>
        </View>
      );
    }
    if (aiStatus === 'done') {
      return (
        <View style={[styles.aiBar, styles.aiBarDone]}>
          <Text style={styles.aiBarTextDone}>✅ AI 分析完成，已依外貌相似度排列</Text>
        </View>
      );
    }
    if (aiStatus === 'error') {
      return (
        <View style={[styles.aiBar, styles.aiBarError]}>
          <Text style={styles.aiBarTextError}>⚠️ AI 分析失敗：{aiError}</Text>
        </View>
      );
    }
    return null;
  }, [hasPhoto, aiStatus, aiError]);

  const ListHeaderComponent = useMemo(
    () => (
      <View>
        {/* AI 狀態提示列 */}
        {AIStatusBar}

        {/* 統計 bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{filteredUsers.length}</Text>
            <Text style={styles.statLabel}>符合條件</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#FF6B6B' }]}>{likedCount}</Text>
            <Text style={styles.statLabel}>已喜歡</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            {hasPhoto && aiStatus === 'done' ? (
              <SimilarityBadge
                score={
                  displayUsers[0]
                    ? (similarityScores[displayUsers[0].id]?.score ?? null)
                    : null
                }
                size="md"
                showLabel={false}
              />
            ) : (
              <Text style={[styles.statNum, { color: '#F59E0B' }]}>{points}</Text>
            )}
            <Text style={styles.statLabel}>
              {hasPhoto && aiStatus === 'done' ? '最高相似' : '剩餘點數'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#F59E0B' }]}>{points}</Text>
            <Text style={styles.statLabel}>點數餘額</Text>
          </View>
        </View>

        {/* 排序列 */}
        <View style={styles.sortBar}>
          <Text style={styles.sortBarLabel}>排序：</Text>
          {SORT_OPTIONS.filter((o) => o.key !== 'similarity' || hasPhoto).map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={[
                styles.sortBtn,
                sortKey === opt.key && styles.sortBtnActive,
                opt.key === 'similarity' && aiStatus === 'analyzing' && styles.sortBtnDisabled,
              ]}
              onPress={() => setSortKey(opt.key)}
              disabled={opt.key === 'similarity' && aiStatus === 'analyzing'}
              activeOpacity={0.8}
            >
              <Text style={styles.sortBtnIcon}>{opt.icon}</Text>
              <Text style={[styles.sortBtnLabel, sortKey === opt.key && styles.sortBtnLabelActive]}>
                {opt.label}
              </Text>
              {opt.key === 'similarity' && aiStatus === 'analyzing' && (
                <ActivityIndicator size="small" color="#FF6B6B" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* 略過切換 */}
        <TouchableOpacity
          style={styles.showPassedBtn}
          onPress={() => setShowPassed((v) => !v)}
          activeOpacity={0.8}
        >
          <Text style={styles.showPassedText}>
            {showPassed ? '🙈 隱藏已略過' : '👁 顯示已略過'}
          </Text>
        </TouchableOpacity>
      </View>
    ),
    [
      AIStatusBar, filteredUsers.length, likedCount, points, hasPhoto,
      aiStatus, sortKey, showPassed, displayUsers, similarityScores,
    ],
  );

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyIcon}>😢</Text>
        <Text style={styles.emptyTitle}>沒有符合的對象</Text>
        <Text style={styles.emptyDesc}>試著放寬篩選條件，發現更多可能！</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={onBack} activeOpacity={0.85}>
          <Text style={styles.emptyBtnText}>重新設定條件</Text>
        </TouchableOpacity>
      </View>
    ),
    [onBack],
  );

  // ─── render ────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backText}>← 篩選</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>配對結果</Text>
          {hasPhoto && aiStatus === 'analyzing' && (
            <ActivityIndicator size="small" color="#FF6B6B" style={{ marginLeft: 6 }} />
          )}
        </View>

        <View style={styles.pointsBadge}>
          <Text style={styles.pointsText}>💎 {points}</Text>
        </View>
      </View>

      {/* 結果列表 */}
      <FlatList
        data={displayUsers}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={10}
      />

      {/* 用戶詳情 Modal */}
      <ProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} />
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F8FA' },

  // Gender badge (split mode)
  genderBadge: {
    alignSelf: 'flex-start',
    marginLeft: 16,
    marginTop: 8,
    marginBottom: -4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  genderBadgeMale: { backgroundColor: '#DBEAFE' },
  genderBadgeFemale: { backgroundColor: '#FCE7F3' },
  genderBadgeText: { fontSize: 11, fontWeight: '700', color: '#555' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backText: { fontSize: 15, color: '#FF6B6B', fontWeight: '600', minWidth: 60 },
  headerCenter: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1A1A1A' },
  pointsBadge: {
    backgroundColor: '#FFF8DC',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
    minWidth: 60,
    alignItems: 'flex-end',
  },
  pointsText: { fontSize: 13, fontWeight: '700', color: '#B8860B' },

  // List
  listContent: { paddingTop: 8, paddingBottom: 24 },

  // AI 狀態 bar
  aiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  aiBarText: { fontSize: 13, color: '#FF6B6B', fontWeight: '500', flex: 1 },
  aiBarDone: { backgroundColor: '#F0FFF4', borderColor: '#86EFAC' },
  aiBarTextDone: { fontSize: 13, color: '#16A34A', fontWeight: '600' },
  aiBarError: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  aiBarTextError: { fontSize: 12, color: '#DC2626', flex: 1 },

  // Stats bar
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statDivider: { width: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },
  statNum: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  statLabel: { fontSize: 10, color: '#aaa', fontWeight: '500' },

  // Sort bar
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    flexWrap: 'wrap',
  },
  sortBarLabel: { fontSize: 12, color: '#aaa', marginRight: 2 },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    backgroundColor: '#FAFAFA',
  },
  sortBtnActive: { borderColor: '#FF6B6B', backgroundColor: '#FFF0F0' },
  sortBtnDisabled: { opacity: 0.5 },
  sortBtnIcon: { fontSize: 12 },
  sortBtnLabel: { fontSize: 12, color: '#888', fontWeight: '500' },
  sortBtnLabelActive: { color: '#FF6B6B', fontWeight: '700' },

  // Show passed toggle
  showPassedBtn: {
    alignSelf: 'flex-end',
    marginRight: 16,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
  },
  showPassedText: { fontSize: 12, color: '#666', fontWeight: '500' },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333' },
  emptyDesc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default ResultsScreen;
