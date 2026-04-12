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
  Alert,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import PRBadge from '../components/PRBadge';
import BreakupModal from '../components/BreakupModal';
import { DATING_TASKS, DATING_DAILY_CAP } from '../config/taskConfig';
import { getCompletionsToday, getTodayEarnedPoints } from '../services/pointsService';

const { width: W } = Dimensions.get('window');

const GENDER_LABEL: Record<string, string> = {
  male: '男',
  female: '女',
  transgender: '跨性別',
  'non-binary': '非二元',
};

const SettingRow: React.FC<{
  icon: string;
  label: string;
  onPress?: () => void;
  danger?: boolean;
}> = ({ icon, label, onPress, danger }) => (
  <TouchableOpacity style={styles.settingRow} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.settingRowIcon}>{icon}</Text>
    <Text style={[styles.settingRowLabel, danger && styles.settingRowLabelDanger]}>{label}</Text>
    <Text style={styles.settingRowArrow}>›</Text>
  </TouchableOpacity>
);

interface Props {
  onOpenTasks?: () => void;
}

const MyProfileScreen: React.FC<Props> = ({ onOpenTasks }) => {
  const { currentUser, isCouple, partnerUser, coupleStartDate, points, pointTransactions, taskCompletions, appMode } = useAppStore();
  const [breakupVisible, setBreakupVisible] = useState(false);
  const [aboutVisible,   setAboutVisible]   = useState(false);

  const openMail = useCallback((subject: string) => {
    const to = 'dragondaddy2021@gmail.com';
    Linking.openURL(`mailto:${to}?subject=${encodeURIComponent(subject)}`).catch(() =>
      Alert.alert('無法開啟郵件 App', `請直接寄信至 ${to}`),
    );
  }, []);

  const handleComingSoon = useCallback((label: string) => {
    Alert.alert(label, '此功能即將推出，敬請期待！', [{ text: '確認' }]);
  }, []);

  const todayPoints = useMemo(
    () => getTodayEarnedPoints(pointTransactions, 'dating'),
    [pointTransactions],
  );
  const completedTodayCount = useMemo(
    () => DATING_TASKS.filter((t) => getCompletionsToday(t.id, taskCompletions) > 0).length,
    [taskCompletions],
  );
  const coupleTemperature = useMemo(() => {
    if (!isCouple) return 0;
    const total = pointTransactions
      .filter((tx) => tx.type === 'earn' && tx.mode === 'couple')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return Math.min(100, Math.round(total / 2));
  }, [isCouple, pointTransactions]);

  const coupleDays = coupleStartDate
    ? Math.max(1, Math.floor((Date.now() - new Date(coupleStartDate).getTime()) / 86_400_000))
    : 0;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 頭像區 ── */}
        <LinearGradient
          colors={isCouple ? ['#FF8E53', '#FF6B6B'] : ['#FF6B6B', '#FF8E53']}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{currentUser.name}</Text>
                <PRBadge value={currentUser.appearancePR} size="md" />
              </View>
              <Text style={styles.userMeta}>
                {currentUser.age} 歲・{GENDER_LABEL[currentUser.gender]}・{currentUser.region}
              </Text>
              <Text style={styles.userOccupation}>{currentUser.occupation}</Text>
            </View>
          </View>

          {/* 點數徽章 */}
          <View style={styles.pointsBadge}>
            <Text style={styles.pointsIcon}>⭐</Text>
            <Text style={styles.pointsText}>{points} 點</Text>
          </View>
        </LinearGradient>

        {/* ── 伴侶狀態卡 ── */}
        {isCouple && partnerUser ? (
          <View style={styles.coupleCard}>
            <View style={styles.coupleCardHeader}>
              <Text style={styles.coupleCardTitle}>💑 伴侶模式</Text>
              <View style={styles.coupleDaysBadge}>
                <Text style={styles.coupleDaysText}>在一起 {coupleDays} 天</Text>
              </View>
            </View>
            <View style={styles.couplePartnerRow}>
              <Image source={{ uri: partnerUser.avatar }} style={styles.partnerAvatar} />
              <View style={{ gap: 2 }}>
                <Text style={styles.partnerName}>{partnerUser.name}</Text>
                <Text style={styles.partnerMeta}>
                  {partnerUser.age} 歲・{partnerUser.region}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.singleCard}>
            <Text style={styles.singleIcon}>🔍</Text>
            <Text style={styles.singleTitle}>交友模式中</Text>
            <Text style={styles.singleDesc}>篩選並滑動配對，找到你的另一半</Text>
          </View>
        )}

        {/* ── 每日任務摘要卡 ── */}
        <TouchableOpacity
          style={styles.taskCard}
          onPress={onOpenTasks}
          activeOpacity={0.85}
        >
          <View style={styles.taskCardLeft}>
            <Text style={styles.taskCardIcon}>{isCouple ? '❤️' : '📋'}</Text>
            <View>
              <Text style={styles.taskCardTitle}>
                {isCouple ? '感情任務' : '每日任務'}
              </Text>
              {isCouple ? (
                <Text style={styles.taskCardSub}>感情溫度 {coupleTemperature}°C</Text>
              ) : (
                <Text style={styles.taskCardSub}>
                  今日 {completedTodayCount}/{DATING_TASKS.length} 完成・{todayPoints}/{DATING_DAILY_CAP} 點
                </Text>
              )}
            </View>
          </View>
          <Text style={styles.taskCardArrow}>›</Text>
        </TouchableOpacity>

        {/* ── 個人資料 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>個人資料</Text>
          <View style={styles.infoGrid}>
            <InfoCell icon="🎓" label="學歷" value={currentUser.education} />
            <InfoCell icon="💼" label="職業" value={currentUser.occupation} />
            <InfoCell icon="💰" label="月收入" value={`${currentUser.income}萬/月`} />
            <InfoCell icon="📏" label="身高" value={`${currentUser.height} cm`} />
          </View>
        </View>

        {/* ── 自我介紹 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自我介紹</Text>
          <Text style={styles.bioText}>{currentUser.bio}</Text>
        </View>

        {/* ── 設定選項 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>設定</Text>
          {/* 💑 關係管理：在情侶模式時置於最頂，方便找到 */}
          {isCouple && (
            <TouchableOpacity
              style={styles.coupleManageRow}
              onPress={() => setBreakupVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.coupleManageIcon}>💑</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.coupleManageLabel}>關係管理</Text>
                <Text style={styles.coupleManageSub}>查看共同回憶・管理伴侶關係</Text>
              </View>
              <Text style={styles.settingRowArrow}>›</Text>
            </TouchableOpacity>
          )}
          <SettingRow icon="✏️" label="編輯個人資料" onPress={() => handleComingSoon('編輯個人資料')} />
          <SettingRow icon="🔔" label="通知設定" onPress={() => handleComingSoon('通知設定')} />
          <SettingRow icon="🔒" label="隱私設定" onPress={() => handleComingSoon('隱私設定')} />
          <SettingRow icon="💎" label="會員方案" onPress={() => handleComingSoon('會員方案')} />
          <SettingRow icon="❓" label="幫助與回饋" onPress={() => handleComingSoon('幫助與回饋')} />
          <SettingRow icon="📜" label="服務條款" onPress={() => handleComingSoon('服務條款')} />
          <SettingRow icon="🐛" label="回報問題" onPress={() => openMail('[PairMaker] 問題回報')} />
          <SettingRow icon="🤝" label="商務合作" onPress={() => openMail('[PairMaker] 商務合作洽談')} />
          <SettingRow icon="ℹ️" label="關於 PairMaker" onPress={() => setAboutVisible(true)} />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── 關於 PairMaker Modal ── */}
      <Modal
        visible={aboutVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setAboutVisible(false)}
      >
        <TouchableOpacity
          style={aboutStyles.overlay}
          activeOpacity={1}
          onPress={() => setAboutVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={aboutStyles.card}>
            <Text style={aboutStyles.appName}>PairMaker</Text>
            <Text style={aboutStyles.version}>版本 1.0.0</Text>
            <Text style={aboutStyles.tagline}>找到屬於你的另一半，開啟甜蜜新旅程</Text>
            <View style={aboutStyles.divider} />
            <Text style={aboutStyles.contactTitle}>聯絡我們</Text>
            <Text style={aboutStyles.contactDesc}>回報問題或商務合作請洽</Text>
            <TouchableOpacity onPress={() => openMail('[PairMaker] 聯絡我們')}>
              <Text style={aboutStyles.email}>dragondaddy2021@gmail.com</Text>
            </TouchableOpacity>
            <View style={aboutStyles.divider} />
            <Text style={aboutStyles.copyright}>© 2025 PairMaker. All Rights Reserved.</Text>
            <TouchableOpacity style={aboutStyles.closeBtn} onPress={() => setAboutVisible(false)}>
              <Text style={aboutStyles.closeBtnText}>關閉</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── 解除伴侶 Modal ── */}
      <BreakupModal
        visible={breakupVisible}
        onClose={() => setBreakupVisible(false)}
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
  scrollContent: { paddingBottom: 24 },

  // Header
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  userInfo: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userName: { fontSize: 22, fontWeight: '800', color: '#fff' },
  userMeta: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  userOccupation: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pointsIcon: { fontSize: 14 },
  pointsText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Couple card
  coupleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    gap: 12,
  },
  coupleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  coupleCardTitle: { fontSize: 15, fontWeight: '700', color: '#FF6B6B' },
  coupleDaysBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  coupleDaysText: { fontSize: 12, fontWeight: '600', color: '#FF8E53' },
  couplePartnerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  partnerAvatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#FFCACA' },
  partnerName: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  partnerMeta: { fontSize: 13, color: '#888' },
  // Single mode card
  singleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  singleIcon: { fontSize: 36 },
  singleTitle: { fontSize: 16, fontWeight: '700', color: '#1A1A1A' },
  singleDesc: { fontSize: 13, color: '#888', textAlign: 'center' },

  // Section
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },

  // Info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  infoCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: (W - 32 - 32 - 10) / 2,
  },
  infoCellIcon: { fontSize: 20 },
  infoCellLabel: { fontSize: 11, color: '#aaa' },
  infoCellValue: { fontSize: 13, fontWeight: '600', color: '#333' },

  // Bio
  bioText: { fontSize: 14, color: '#555', lineHeight: 22 },

  // Couple manage row（置頂、醒目）
  coupleManageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 14,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFCACA',
    gap: 10,
  },
  coupleManageIcon: { fontSize: 22 },
  coupleManageLabel: { fontSize: 15, fontWeight: '700', color: '#FF6B6B' },
  coupleManageSub:   { fontSize: 11, color: '#FF8E53', marginTop: 1 },

  // Settings
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingRowIcon: { fontSize: 18, width: 32 },
  settingRowLabel: { flex: 1, fontSize: 15, color: '#333' },
  settingRowLabelDanger: { color: '#EF4444' },
  settingRowArrow: { fontSize: 18, color: '#CCC' },

  // Contact / About rows (no extra style needed — uses settingRow)

  // Task card
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  taskCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  taskCardIcon: { fontSize: 26 },
  taskCardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  taskCardSub: { fontSize: 12, color: '#888', marginTop: 2 },
  taskCardArrow: { fontSize: 20, color: '#CCC' },
});

// ─── About Modal Styles ───────────────────────────────────────────────────────

const aboutStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 10,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FF6B6B',
    letterSpacing: 1,
  },
  version: {
    fontSize: 13,
    color: '#aaa',
    marginTop: 2,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 14,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  contactDesc: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
  email: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    textDecorationLine: 'underline',
    marginTop: 6,
  },
  copyright: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'center',
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 40,
    paddingVertical: 11,
    borderRadius: 12,
  },
  closeBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default MyProfileScreen;
