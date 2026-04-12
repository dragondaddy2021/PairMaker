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
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';

import PRBadge from './PRBadge';
import InfoChip from './InfoChip';
import { useAppStore } from '../store/useAppStore';
import { POINTS_CONFIG } from '../config/taskConfig';
import type { User } from '../types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const AVATAR_H = SCREEN_H * 0.42;

interface ProfileModalProps {
  user: User | null;
  onClose: () => void;
}

const GENDER_LABEL: Record<string, string> = {
  male: '男',
  female: '女',
  transgender: '跨性別',
  'non-binary': '非二元',
};

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose }) => {
  const { likedUserIds, superLikedUserIds, passedUserIds, likeUser, superLikeUser, passUser, spendPoints, points } =
    useAppStore();

  const isLiked = user ? likedUserIds.includes(user.id) : false;
  const isSuperLiked = user ? superLikedUserIds.includes(user.id) : false;

  const handleLike = useCallback(() => {
    if (!user || isLiked) return;
    const ok = spendPoints(POINTS_CONFIG.LIKE_COST);
    if (!ok) {
      Alert.alert('點數不足', `送出喜歡需要 ${POINTS_CONFIG.LIKE_COST} 點\n目前餘額：${points} 點`);
      return;
    }
    likeUser(user.id);
  }, [user, isLiked, spendPoints, likeUser, points]);

  const handleSuperLike = useCallback(() => {
    if (!user || isSuperLiked) return;
    const ok = spendPoints(POINTS_CONFIG.SUPER_LIKE_COST);
    if (!ok) {
      Alert.alert('點數不足', `超級喜歡需要 ${POINTS_CONFIG.SUPER_LIKE_COST} 點\n目前餘額：${points} 點`);
      return;
    }
    superLikeUser(user.id);
  }, [user, isSuperLiked, spendPoints, superLikeUser, points]);

  const handlePass = useCallback(() => {
    if (!user) return;
    passUser(user.id);
    onClose();
  }, [user, passUser, onClose]);

  if (!user) return null;

  const infoRows: Array<{ icon: string; label: string; value: string; highlight?: boolean }> = [
    { icon: '🎂', label: '年齡', value: `${user.age} 歲` },
    { icon: '📏', label: '身高', value: `${user.height} cm` },
    { icon: '⚖️', label: 'BMI', value: String(user.bmi), highlight: user.bmi > 27 },
    { icon: '💰', label: '月收入', value: `${user.income} 萬` },
    { icon: '🎓', label: '學歷', value: user.education },
    { icon: '💍', label: '婚姻', value: user.isMarried ? '已婚' : '未婚', highlight: user.isMarried },
    { icon: '🚗', label: '有車', value: user.hasCar ? '✅' : '—' },
    { icon: '🏠', label: '有房', value: user.hasHouse ? '✅' : '—' },
    { icon: '🚬', label: '抽菸', value: user.isSmoker ? '是' : '不抽菸', highlight: user.isSmoker },
  ];

  return (
    <Modal
      visible={!!user}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* ── 頭像區域 ─────────────────────────────────────── */}
        <View style={[styles.avatarContainer, { height: AVATAR_H }]}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} resizeMode="cover" />

          {/* 漸層遮罩（純 View 模擬） */}
          <View style={styles.gradientOverlay} />

          {/* 頂部關閉按鈕 */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* 底部姓名資訊 */}
          <View style={styles.avatarInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.genderAge}>
                {GENDER_LABEL[user.gender]}・{user.age} 歲
              </Text>
            </View>
            <Text style={styles.subInfo}>
              {user.occupation}・{user.region}
            </Text>
            <View style={styles.prRow}>
              <PRBadge value={user.appearancePR} size="md" />
              <InfoChip icon="💪" label={user.bodyType} />
            </View>
          </View>
        </View>

        {/* ── 詳情 ScrollView ───────────────────────────────── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 自我介紹 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💬 自我介紹</Text>
            <Text style={styles.bioText}>{user.bio}</Text>
          </View>

          {/* 基本資料表格 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 基本資料</Text>
            <View style={styles.infoGrid}>
              {infoRows.map((row) => (
                <View key={row.label} style={styles.infoCell}>
                  <Text style={styles.infoCellIcon}>{row.icon}</Text>
                  <Text style={styles.infoCellLabel}>{row.label}</Text>
                  <Text
                    style={[
                      styles.infoCellValue,
                      row.highlight && styles.infoCellValueHL,
                    ]}
                  >
                    {row.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* 外貌特徵 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ 外貌特徵</Text>
            <View style={styles.featureChips}>
              {Object.entries(user.appearanceFeatures).map(([key, val]) => (
                <View key={key} style={styles.featureChip}>
                  <Text style={styles.featureChipText}>{val as string}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── 底部操作列 ────────────────────────────────────── */}
        <View style={styles.footer}>
          {/* 略過 */}
          <TouchableOpacity
            style={[styles.footerBtn, styles.passFooterBtn]}
            onPress={handlePass}
            activeOpacity={0.85}
          >
            <Text style={styles.footerBtnIcon}>✕</Text>
            <Text style={[styles.footerBtnLabel, { color: '#888' }]}>略過</Text>
          </TouchableOpacity>

          {/* 超級喜歡 */}
          <TouchableOpacity
            style={[
              styles.footerBtn,
              styles.superFooterBtn,
              isSuperLiked && styles.superFooterBtnActive,
            ]}
            onPress={handleSuperLike}
            activeOpacity={0.85}
          >
            <Text style={styles.footerBtnIcon}>⭐</Text>
            <Text style={[styles.footerBtnLabel, { color: '#F59E0B' }]}>
              {isSuperLiked ? '已送出' : `超喜歡 -${POINTS_CONFIG.SUPER_LIKE_COST}pt`}
            </Text>
          </TouchableOpacity>

          {/* 喜歡 */}
          <TouchableOpacity
            style={[
              styles.footerBtn,
              styles.likeFooterBtn,
              isLiked && styles.likeFooterBtnActive,
            ]}
            onPress={handleLike}
            activeOpacity={0.85}
          >
            <Text style={styles.footerBtnIcon}>💘</Text>
            <Text style={[styles.footerBtnLabel, { color: isLiked ? '#fff' : '#FF6B6B' }]}>
              {isLiked ? '已喜歡' : `喜歡 -${POINTS_CONFIG.LIKE_COST}pt`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8FA' },

  // Avatar
  avatarContainer: {
    width: SCREEN_W,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  closeBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 16 : 12,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  avatarInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    gap: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  genderAge: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  subInfo: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  prRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginTop: 4,
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 4 },

  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },

  // Bio
  bioText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },

  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoCell: {
    width: (SCREEN_W - 32 - 32 - 16) / 3,
    backgroundColor: '#F8F8FA',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    gap: 3,
  },
  infoCellIcon: { fontSize: 18 },
  infoCellLabel: { fontSize: 10, color: '#aaa', fontWeight: '500' },
  infoCellValue: { fontSize: 13, color: '#333', fontWeight: '700', textAlign: 'center' },
  infoCellValueHL: { color: '#FF6B6B' },

  // Appearance features
  featureChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureChip: {
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#FFD0D0',
  },
  featureChipText: { fontSize: 13, color: '#FF6B6B', fontWeight: '500' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 5,
    borderWidth: 1.5,
  },
  footerBtnIcon: { fontSize: 18 },
  footerBtnLabel: { fontSize: 12, fontWeight: '600' },
  passFooterBtn: {
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  superFooterBtn: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  superFooterBtnActive: {
    backgroundColor: '#FEF3C7',
  },
  likeFooterBtn: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF0F0',
  },
  likeFooterBtnActive: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
});

export default ProfileModal;
