/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import type { Anniversary } from '../../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysLeft(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const base = new Date(dateStr);
  let candidate = new Date(today.getFullYear(), base.getMonth(), base.getDate());
  if (candidate < today) {
    candidate = new Date(today.getFullYear() + 1, base.getMonth(), base.getDate());
  }
  return Math.round((candidate.getTime() - today.getTime()) / 86_400_000);
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const base = new Date(dateStr);
  return today.getMonth() === base.getMonth() && today.getDate() === base.getDate();
}

// ─── Add Anniversary Modal ────────────────────────────────────────────────────

interface AddModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (ann: Omit<Anniversary, 'id'>) => void;
}

const AddAnniversaryModal: React.FC<AddModalProps> = ({ visible, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [recurring, setRecurring] = useState(true);

  const handleAdd = () => {
    if (!title.trim()) { Alert.alert('請輸入紀念日名稱'); return; }
    if (!date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      Alert.alert('請輸入正確日期格式（YYYY-MM-DD）');
      return;
    }
    onAdd({ title: title.trim(), date: date.trim(), recurring, notes: notes.trim() || undefined });
    setTitle(''); setDate(''); setNotes(''); setRecurring(true);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>新增紀念日</Text>

          <Text style={modalStyles.label}>名稱</Text>
          <TextInput
            style={modalStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="例：第一次牽手、求婚紀念日"
            placeholderTextColor="#C0C0C0"
          />

          <Text style={modalStyles.label}>日期（YYYY-MM-DD）</Text>
          <TextInput
            style={modalStyles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2024-02-14"
            placeholderTextColor="#C0C0C0"
            keyboardType="numbers-and-punctuation"
          />

          <Text style={modalStyles.label}>備註（選填）</Text>
          <TextInput
            style={[modalStyles.input, { minHeight: 56 }]}
            value={notes}
            onChangeText={setNotes}
            placeholder="特別的故事…"
            placeholderTextColor="#C0C0C0"
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={modalStyles.recurringRow}
            onPress={() => setRecurring(!recurring)}
          >
            <View style={[modalStyles.checkbox, recurring && modalStyles.checkboxOn]}>
              {recurring && <Text style={modalStyles.checkmark}>✓</Text>}
            </View>
            <Text style={modalStyles.recurringLabel}>每年循環提醒</Text>
          </TouchableOpacity>

          <View style={modalStyles.btnRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.addBtn} onPress={handleAdd}>
              <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={modalStyles.addBtnGrad}>
                <Text style={modalStyles.addBtnText}>新增</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 8,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#1A1A1A', backgroundColor: '#FAFAFA',
  },
  recurringRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#DDD',
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: '#FF6B6B', borderColor: '#FF6B6B' },
  checkmark: { fontSize: 13, color: '#fff', fontWeight: '800' },
  recurringLabel: { fontSize: 14, color: '#555' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#888', fontWeight: '600' },
  addBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  addBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  addBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

// ─── Anniversary Card ─────────────────────────────────────────────────────────

interface AnnCardProps {
  title: string;
  date: string;
  notes?: string;
  isFixed?: boolean;
  onClaim?: () => void;
  onShare?: () => void;
  claimedToday?: boolean;
}

const AnnCard: React.FC<AnnCardProps> = ({
  title, date, notes, isFixed, onClaim, onShare, claimedToday,
}) => {
  const daysLeft = getDaysLeft(date);
  const todayFlag = isToday(date);

  return (
    <View style={[annStyles.root, todayFlag && annStyles.todayRoot]}>
      {todayFlag && (
        <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={annStyles.todayBanner}>
          <Text style={annStyles.todayBannerText}>🎉 今天就是這一天！</Text>
        </LinearGradient>
      )}
      <View style={annStyles.body}>
        <View style={annStyles.iconWrapper}>
          <Text style={annStyles.icon}>{isFixed ? '💑' : '🎂'}</Text>
        </View>
        <View style={annStyles.info}>
          <Text style={annStyles.title}>{title}</Text>
          <Text style={annStyles.date}>{date}</Text>
          {notes ? <Text style={annStyles.notes} numberOfLines={1}>{notes}</Text> : null}
        </View>
        <View style={annStyles.countdown}>
          {todayFlag ? (
            <Text style={annStyles.countdownToday}>TODAY</Text>
          ) : (
            <>
              <Text style={annStyles.countdownNum}>{daysLeft}</Text>
              <Text style={annStyles.countdownLabel}>天後</Text>
            </>
          )}
        </View>
      </View>

      {todayFlag && (
        <View style={annStyles.actionRow}>
          {!claimedToday && onClaim && (
            <TouchableOpacity style={annStyles.claimBtn} onPress={onClaim}>
              <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={annStyles.claimBtnGrad}>
                <Text style={annStyles.claimBtnText}>🎂 打卡領 20 點</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          {claimedToday && (
            <View style={annStyles.claimedBadge}>
              <Text style={annStyles.claimedText}>✅ 已打卡</Text>
            </View>
          )}
          {onShare && (
            <TouchableOpacity style={annStyles.shareBtn} onPress={onShare}>
              <Text style={annStyles.shareBtnText}>📤 分享</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const annStyles = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  todayRoot: {
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  todayBanner: { paddingHorizontal: 14, paddingVertical: 8 },
  todayBannerText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  body: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconWrapper: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center',
  },
  icon: { fontSize: 22 },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  date: { fontSize: 12, color: '#888' },
  notes: { fontSize: 12, color: '#aaa' },
  countdown: { alignItems: 'center', minWidth: 42 },
  countdownNum: { fontSize: 24, fontWeight: '900', color: '#FF6B6B', lineHeight: 28 },
  countdownLabel: { fontSize: 11, color: '#FF8E53', fontWeight: '600' },
  countdownToday: { fontSize: 11, fontWeight: '800', color: '#FF6B6B' },
  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingBottom: 14 },
  claimBtn: { flex: 1, borderRadius: 10, overflow: 'hidden' },
  claimBtnGrad: { paddingVertical: 10, alignItems: 'center' },
  claimBtnText: { fontSize: 13, color: '#fff', fontWeight: '700' },
  claimedBadge: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#F0FFF0', alignItems: 'center',
  },
  claimedText: { fontSize: 13, color: '#4ADE80', fontWeight: '700' },
  shareBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  shareBtnText: { fontSize: 13, color: '#555', fontWeight: '600' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface Props {
  onBack?: () => void;
}

const AnniversaryScreen: React.FC<Props> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const {
    anniversaries, addAnniversary, coupleStartDate,
    currentUser, partnerUser, pointTransactions, completeTask,
  } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);

  // Check if anniversary task was claimed today
  const claimedAnniversaryToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return pointTransactions.some(
      (tx) => tx.taskId === 'anniversary' && tx.timestamp.slice(0, 10) === today,
    );
  }, [pointTransactions]);

  const handleClaim = async (annTitle: string, annDate: string) => {
    if (!isToday(annDate)) return;
    const result = await completeTask('anniversary');
    if (result.success) {
      Alert.alert('紀念日打卡！', result.message);
    } else {
      Alert.alert('打卡失敗', result.message);
    }
  };

  const handleShare = (annTitle: string) => {
    const partnerName = partnerUser?.name ?? '另一半';
    const myName = currentUser.name;
    const daysTogether = coupleStartDate
      ? Math.max(1, Math.floor((Date.now() - new Date(coupleStartDate).getTime()) / 86_400_000))
      : 0;
    Share.share({
      message:
        `💑 今天是我們的${annTitle}！\n` +
        `${myName} & ${partnerName} 在一起第 ${daysTogether} 天\n` +
        `愛你每一天 ❤️\n\n— PairMaker`,
      title: `我們的${annTitle}`,
    });
  };

  const handleAdd = (ann: Omit<Anniversary, 'id'>) => {
    addAnniversary({ ...ann, id: `ann_${Date.now()}` });
  };

  // Sort all anniversaries by upcoming days
  const sorted = useMemo(() => {
    const builtIn = coupleStartDate
      ? [{ id: '__start', title: '在一起紀念日', date: coupleStartDate.slice(0, 10), recurring: true, notes: undefined, isFixed: true }]
      : [];
    const custom = anniversaries.map((a) => ({ ...a, isFixed: false }));
    return [...builtIn, ...custom].sort((a, b) => getDaysLeft(a.date) - getDaysLeft(b.date));
  }, [anniversaries, coupleStartDate]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          {onBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <Text style={styles.backBtnText}>‹</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>紀念日</Text>
            <Text style={styles.headerSub}>{sorted.length} 個紀念日</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>＋ 新增</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {sorted.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎂</Text>
            <Text style={styles.emptyTitle}>還沒有紀念日</Text>
            <Text style={styles.emptyDesc}>點右上角「新增」，記錄你們的重要日子</Text>
          </View>
        ) : (
          sorted.map((ann) => (
            <AnnCard
              key={ann.id}
              title={ann.title}
              date={ann.date}
              notes={ann.notes}
              isFixed={ann.isFixed}
              onClaim={() => handleClaim(ann.title, ann.date)}
              onShare={() => handleShare(ann.title)}
              claimedToday={claimedAnniversaryToday}
            />
          ))
        )}
      </ScrollView>

      <AddAnniversaryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAdd}
      />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8FA' },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: 8 },
  backBtn: { paddingRight: 4 },
  backBtnText: { fontSize: 30, color: '#fff', fontWeight: '300', lineHeight: 34 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  scroll: { flex: 1 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  emptyDesc: { fontSize: 14, color: '#aaa', textAlign: 'center' },
});

export default AnniversaryScreen;
