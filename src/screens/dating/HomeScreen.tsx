/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import PRBadge from '../../components/PRBadge';
import type { User } from '../../types';

const { width: W } = Dimensions.get('window');
const CARD_W = (W - 32 - 10) / 2;

// ─── Sort / Filter ────────────────────────────────────────────────────────────

type SortKey = 'pr' | 'income' | 'age' | 'height';

const SORT_TABS: Array<{ key: SortKey | 'all'; label: string }> = [
  { key: 'all',    label: '全部' },
  { key: 'pr',     label: '顏值' },
  { key: 'income', label: '收入' },
  { key: 'age',    label: '年齡' },
  { key: 'height', label: '身高' },
];

function sortUsers(users: User[], key: SortKey | 'all'): User[] {
  if (key === 'all') return users;
  return [...users].sort((a, b) => {
    switch (key) {
      case 'pr':     return b.appearancePR - a.appearancePR;
      case 'income': return b.income - a.income;
      case 'age':    return a.age - b.age;
      case 'height': return b.height - a.height;
    }
  });
}

// ─── User Explore Card ────────────────────────────────────────────────────────

const ExploreCard: React.FC<{
  user: User;
  isLiked: boolean;
  onLike: () => void;
  onPress: () => void;
}> = ({ user, isLiked, onLike, onPress }) => (
  <TouchableOpacity
    style={cardStyles.root}
    onPress={onPress}
    activeOpacity={0.9}
    delayPressIn={0}
  >
    <Image source={{ uri: user.avatar }} style={cardStyles.avatar} />
    <LinearGradient
      colors={['transparent', 'rgba(0,0,0,0.75)']}
      style={cardStyles.gradient}
    >
      <View style={cardStyles.info}>
        <View style={cardStyles.nameRow}>
          <Text style={cardStyles.name} numberOfLines={1}>{user.name}</Text>
          <Text style={cardStyles.age}>{user.age}</Text>
        </View>
        <Text style={cardStyles.region} numberOfLines={1}>📍 {user.region}</Text>
        <PRBadge value={user.appearancePR} size="sm" />
      </View>
    </LinearGradient>

    {/* Like button */}
    <TouchableOpacity
      style={[cardStyles.likeBtn, isLiked && cardStyles.likeBtnActive]}
      onPress={(e) => { e.stopPropagation(); onLike(); }}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      delayPressIn={0}
    >
      <Text style={cardStyles.likeIcon}>{isLiked ? '❤️' : '🤍'}</Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

const cardStyles = StyleSheet.create({
  root: {
    width: CARD_W,
    height: CARD_W * 1.35,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#EEE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: { width: '100%', height: '100%', position: 'absolute' },
  gradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '55%',
    justifyContent: 'flex-end',
    padding: 10,
  },
  info: { gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  name: { fontSize: 14, fontWeight: '800', color: '#fff', flex: 1 },
  age: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  region: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  likeBtn: {
    position: 'absolute',
    top: 8, right: 8,
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center', justifyContent: 'center',
  },
  likeBtnActive: { backgroundColor: '#FFF0F0' },
  likeIcon: { fontSize: 16 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { users, currentUser, likedUserIds, likeUser } = useAppStore();
  const [sortKey, setSortKey] = useState<SortKey | 'all'>('all');

  const displayUsers = useMemo(() => {
    const others = users.filter((u) => u.id !== currentUser.id);
    return sortUsers(others, sortKey);
  }, [users, currentUser.id, sortKey]);

  const handleLike = useCallback((user: User) => {
    if (likedUserIds.includes(user.id)) return;
    likeUser(user.id);
    Alert.alert('💘 已喜歡', `你喜歡了 ${user.name}！`, [{ text: '繼續探索' }]);
  }, [likedUserIds, likeUser]);

  const handlePress = useCallback((user: User) => {
    Alert.alert(
      user.name,
      `${user.age} 歲・${user.region}\n${user.occupation}\n月收入：${user.income} 萬\n\n${user.bio.slice(0, 60)}…`,
      [
        { text: '喜歡 ❤️', onPress: () => handleLike(user) },
        { text: '關閉', style: 'cancel' },
      ],
    );
  }, [handleLike]);

  const renderItem = useCallback(({ item, index }: { item: User; index: number }) => (
    <View style={{ marginLeft: index % 2 === 0 ? 0 : 10 }}>
      <ExploreCard
        user={item}
        isLiked={likedUserIds.includes(item.id)}
        onLike={() => handleLike(item)}
        onPress={() => handlePress(item)}
      />
    </View>
  ), [likedUserIds, handleLike, handlePress]);

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <Text style={styles.headerTitle}>探索</Text>
        <Text style={styles.headerSub}>{displayUsers.length} 位等你認識</Text>
      </LinearGradient>

      {/* Sort tabs */}
      <View style={styles.tabBar}>
        {SORT_TABS.map((tab) => {
          const active = sortKey === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setSortKey(tab.key)}
              activeOpacity={0.7}
              delayPressIn={0}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Grid */}
      <FlatList
        data={displayUsers}
        keyExtractor={(u) => u.id}
        numColumns={2}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8FA' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 2,
  },
  headerTitle: { fontSize: 24, fontWeight: '900', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingHorizontal: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#FF6B6B' },
  tabLabel: { fontSize: 14, fontWeight: '500', color: '#888' },
  tabLabelActive: { color: '#FF6B6B', fontWeight: '700' },

  grid: { padding: 16, paddingBottom: 32 },
  row: { justifyContent: 'flex-start', gap: 10, marginBottom: 10 },
});

export default HomeScreen;
