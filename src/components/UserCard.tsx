/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

import PRBadge from './PRBadge';
import InfoChip from './InfoChip';
import SimilarityBadge from './SimilarityBadge';
import { useAppStore } from '../store/useAppStore';
import { POINTS_CONFIG } from '../config/taskConfig';
import type { User } from '../types';

interface UserCardProps {
  user: User;
  onPress: (user: User) => void;
  /** AI 外貌相似度 0–100，undefined = 未分析（不顯示），null = 分析中顯示「—」 */
  similarityScore?: number | null;
}

const UserCard: React.FC<UserCardProps> = ({ user, onPress, similarityScore }) => {
  const { likedUserIds, superLikedUserIds, passedUserIds, likeUser, superLikeUser, passUser, spendPoints, points } =
    useAppStore();

  const isLiked = likedUserIds.includes(user.id);
  const isSuperLiked = superLikedUserIds.includes(user.id);
  const isPassed = passedUserIds.includes(user.id);

  const handleLike = useCallback(() => {
    if (isLiked) return;
    const ok = spendPoints(POINTS_CONFIG.LIKE_COST);
    if (!ok) {
      Alert.alert('點數不足', `送出喜歡需要 ${POINTS_CONFIG.LIKE_COST} 點（目前 ${points} 點）`);
      return;
    }
    likeUser(user.id);
  }, [isLiked, spendPoints, likeUser, user.id, points]);

  const handleSuperLike = useCallback(() => {
    if (isSuperLiked) return;
    const ok = spendPoints(POINTS_CONFIG.SUPER_LIKE_COST);
    if (!ok) {
      Alert.alert('點數不足', `超級喜歡需要 ${POINTS_CONFIG.SUPER_LIKE_COST} 點（目前 ${points} 點）`);
      return;
    }
    superLikeUser(user.id);
  }, [isSuperLiked, spendPoints, superLikeUser, user.id, points]);

  const handlePass = useCallback(() => {
    passUser(user.id);
  }, [passUser, user.id]);

  return (
    <TouchableOpacity
      style={[styles.card, isPassed && styles.cardPassed]}
      onPress={() => onPress(user)}
      activeOpacity={0.92}
    >
      {/* 頭像 */}
      <View style={styles.avatarWrap}>
        <Image source={{ uri: user.avatar }} style={styles.avatar} />

        {/* PR badge 疊在頭像右上 */}
        <View style={styles.prOverlay}>
          <PRBadge value={user.appearancePR} size="sm" />
        </View>

        {/* 已略過遮罩 */}
        {isPassed && (
          <View style={styles.passedOverlay}>
            <Text style={styles.passedText}>已略過</Text>
          </View>
        )}

        {/* 超級喜歡光環 */}
        {isSuperLiked && <View style={styles.superLikeGlow} />}
      </View>

      {/* 主要資訊 */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.ageHeight}>
            {user.age} 歲・{user.height} cm
          </Text>
          {similarityScore !== undefined && (
            <SimilarityBadge score={similarityScore} size="sm" showLabel={false} />
          )}
        </View>

        <Text style={styles.occupation} numberOfLines={1}>
          {user.occupation}・{user.region}
        </Text>

        {/* 標籤列 */}
        <View style={styles.chips}>
          <InfoChip icon="💰" label={`${user.income} 萬`} />
          <InfoChip icon="🎓" label={user.education} />
          <InfoChip icon="💪" label={user.bodyType} />
          {user.hasCar && <InfoChip icon="🚗" label="有車" highlight />}
          {user.hasHouse && <InfoChip icon="🏠" label="有房" highlight />}
          {!user.isSmoker && <InfoChip icon="🚭" label="不抽菸" />}
        </View>

        {/* 自介（截斷） */}
        <Text style={styles.bio} numberOfLines={2}>
          {user.bio}
        </Text>
      </View>

      {/* 操作按鈕 */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.passBtn, isPassed && styles.actionBtnActive]}
          onPress={handlePass}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>✕</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.superBtn, isSuperLiked && styles.superBtnActive]}
          onPress={handleSuperLike}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>⭐</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.likeBtn, isLiked && styles.likeBtnActive]}
          onPress={handleLike}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIcon}>💘</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  cardPassed: { opacity: 0.45 },

  // Avatar
  avatarWrap: {
    width: 100,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: '100%',
    minHeight: 140,
  },
  prOverlay: {
    position: 'absolute',
    top: 8,
    left: 6,
  },
  passedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passedText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  superLikeGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 3,
    borderColor: '#FFD700',
  },

  // Info
  info: {
    flex: 1,
    padding: 12,
    gap: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  ageHeight: {
    fontSize: 12,
    color: '#888',
  },
  occupation: {
    fontSize: 12,
    color: '#999',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 2,
  },
  bio: {
    fontSize: 12,
    color: '#777',
    lineHeight: 17,
    marginTop: 3,
  },

  // Actions
  actions: {
    width: 46,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 6,
    borderLeftWidth: 1,
    borderLeftColor: '#F5F5F5',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  actionIcon: { fontSize: 16 },
  passBtn: {},
  passedOverlayBtn: { backgroundColor: '#FFECEC' },
  likeBtn: {},
  likeBtnActive: { backgroundColor: '#FFECEC' },
  superBtn: {},
  superBtnActive: { backgroundColor: '#FFF8DC' },
  actionBtnActive: { backgroundColor: '#F0F0F0' },
});

export default UserCard;
