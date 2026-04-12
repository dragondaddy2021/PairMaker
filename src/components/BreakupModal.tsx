/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';

const { width: W } = Dimensions.get('window');
const CONFIRM_PHRASE = '解除伴侶';

type Layer = 1 | 2 | 3 | 4;

interface BreakupModalProps {
  visible: boolean;
  onClose: () => void;
}

const BreakupModal: React.FC<BreakupModalProps> = ({ visible, onClose }) => {
  const {
    partnerUser,
    coupleStartDate,
    diaryEntries,
    datePlans,
    breakCouple,
  } = useAppStore();

  const [layer, setLayer] = useState<Layer>(1);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // 計算統計資料
  const stats = useMemo(() => {
    const start = coupleStartDate ? new Date(coupleStartDate) : new Date();
    const days = Math.floor((Date.now() - start.getTime()) / 86_400_000);
    const photos = diaryEntries.reduce((acc, e) => acc + (e.photos?.length ?? 0), 0);
    const places = datePlans.filter((p) => p.completed).length;
    return { days: Math.max(days, 1), photos, diaries: diaryEntries.length, places };
  }, [coupleStartDate, diaryEntries, datePlans]);

  const reset = useCallback(() => {
    setLayer(1);
    setInputText('');
    setIsProcessing(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // Layer 2 → 3（模擬送出通知）
  const handleConfirmBreakup = useCallback(async () => {
    if (inputText !== CONFIRM_PHRASE) return;
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1800));
    setIsProcessing(false);
    setLayer(3);
  }, [inputText]);

  // Layer 4（執行解除）
  const handleComplete = useCallback(() => {
    breakCouple();
    reset();
    onClose();
  }, [breakCouple, reset, onClose]);

  // ─── Layer 1：回憶數據提示 ──────────────────────────────────────────────

  const renderLayer1 = () => (
    <ScrollView contentContainerStyle={styles.layerContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.layerTitle}>⏸ 先暫停一下</Text>
      <Text style={styles.layerDesc}>
        你們在一起已經{' '}
        <Text style={styles.statsHighlight}>{stats.days} 天</Text>
      </Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCell}>
          <Text style={styles.statEmoji}>📸</Text>
          <Text style={styles.statValue}>{stats.photos}</Text>
          <Text style={styles.statLabel}>張照片</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statEmoji}>📔</Text>
          <Text style={styles.statValue}>{stats.diaries}</Text>
          <Text style={styles.statLabel}>篇日記</Text>
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statEmoji}>📍</Text>
          <Text style={styles.statValue}>{stats.places}</Text>
          <Text style={styles.statLabel}>個地方</Text>
        </View>
      </View>

      <View style={styles.reminderBox}>
        <Text style={styles.reminderText}>
          💭 這些回憶都是你們共同走過的痕跡，確定要放棄嗎？
        </Text>
      </View>

      <View style={styles.btnCol}>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleClose} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>💕 我再想想</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dangerOutlineBtn}
          onPress={() => setLayer(2)}
          activeOpacity={0.85}
        >
          <Text style={styles.dangerOutlineBtnText}>繼續解除</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ─── Layer 2：手動輸入確認 ─────────────────────────────────────────────

  const renderLayer2 = () => (
    <View style={styles.layerContent}>
      <Text style={styles.layerTitle}>✍️ 請手動確認</Text>
      <Text style={styles.layerDesc}>
        在下方輸入框中輸入「<Text style={styles.phraseHighlight}>{CONFIRM_PHRASE}</Text>」{'\n'}
        才能啟用送出按鈕
      </Text>

      <TextInput
        style={[
          styles.confirmInput,
          inputText === CONFIRM_PHRASE && styles.confirmInputValid,
        ]}
        value={inputText}
        onChangeText={setInputText}
        placeholder={`請輸入「${CONFIRM_PHRASE}」`}
        placeholderTextColor="#CCC"
        autoFocus
        autoCapitalize="none"
        autoCorrect={false}
      />

      {inputText.length > 0 && inputText !== CONFIRM_PHRASE && (
        <Text style={styles.inputHint}>✗ 文字不符，請重新輸入</Text>
      )}
      {inputText === CONFIRM_PHRASE && (
        <Text style={styles.inputHintOk}>✓ 已確認</Text>
      )}

      <View style={styles.btnCol}>
        <TouchableOpacity
          style={[
            styles.sendBreakupBtn,
            inputText !== CONFIRM_PHRASE && styles.sendBreakupBtnDisabled,
          ]}
          onPress={handleConfirmBreakup}
          disabled={inputText !== CONFIRM_PHRASE || isProcessing}
          activeOpacity={0.85}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendBreakupBtnText}>送出解除申請</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => { setInputText(''); setLayer(1); }} activeOpacity={0.85}>
          <Text style={styles.backBtnText}>← 返回</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Layer 3：執行後通知 ────────────────────────────────────────────────

  const renderLayer3 = () => (
    <View style={styles.layerContent}>
      <Text style={styles.notifIcon}>🔔</Text>
      <Text style={styles.layerTitle}>通知已送出</Text>
      <View style={styles.notifBox}>
        <Text style={styles.notifText}>
          系統已向 <Text style={styles.phraseHighlight}>{partnerUser?.name ?? '對方'}</Text> 發送推播通知，告知關係已解除。
        </Text>
      </View>

      <View style={styles.retentionBox}>
        <Text style={styles.retentionTitle}>📦 資料保留說明</Text>
        <Text style={styles.retentionItem}>✅ 共同回憶保留 30 天</Text>
        <Text style={styles.retentionItem}>📁 可至「我的 → 回憶封存」查看</Text>
        <Text style={styles.retentionItem}>🚫 對方不再出現於推薦結果</Text>
        <Text style={styles.retentionItem}>⏱ 30 天後自動永久刪除</Text>
      </View>

      <TouchableOpacity style={styles.completeBtn} onPress={() => setLayer(4)} activeOpacity={0.85}>
        <Text style={styles.completeBtnText}>我已了解，確認解除</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Layer 4：完成 ─────────────────────────────────────────────────────

  const renderLayer4 = () => (
    <View style={styles.layerContent}>
      <Text style={styles.notifIcon}>🕊️</Text>
      <Text style={styles.layerTitle}>關係已解除</Text>
      <Text style={styles.layerDesc}>
        你們的共同回憶將安全保留 30 天。{'\n'}
        期間可在「我的 → 回憶封存」中查看或手動刪除。
      </Text>

      <View style={styles.finalInfoBox}>
        <Text style={styles.finalInfoText}>
          解除後，雙方將回到交友模式，各自繼續尋找緣份。
          祝你一切都好 🙏
        </Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={handleComplete} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>完成</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* 頂部指示條 */}
          <View style={styles.handle} />

          {/* 進度指示 */}
          <View style={styles.layerIndicator}>
            {([1, 2, 3, 4] as Layer[]).map((l) => (
              <View
                key={l}
                style={[styles.layerDot, layer >= l && styles.layerDotActive]}
              />
            ))}
          </View>

          {layer === 1 && renderLayer1()}
          {layer === 2 && renderLayer2()}
          {layer === 3 && renderLayer3()}
          {layer === 4 && renderLayer4()}
        </View>
      </View>
    </Modal>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '90%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  layerIndicator: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  layerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  layerDotActive: { backgroundColor: '#FF6B6B' },

  // Content
  layerContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
    gap: 14,
  },
  layerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  layerDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 21,
  },

  // Layer 1: Stats
  statsHighlight: { color: '#FF6B6B', fontWeight: '800', fontSize: 18 },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  statCell: {
    flex: 1,
    backgroundColor: '#FFF5F5',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#FF6B6B' },
  statLabel: { fontSize: 11, color: '#aaa' },
  reminderBox: {
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8E53',
    width: '100%',
  },
  reminderText: { fontSize: 13, color: '#666', lineHeight: 19 },

  // Layer 2: Input
  phraseHighlight: { color: '#FF6B6B', fontWeight: '800' },
  confirmInput: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 16,
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: 2,
  },
  confirmInputValid: { borderColor: '#22C55E', backgroundColor: '#F0FFF4' },
  inputHint: { fontSize: 12, color: '#EF4444' },
  inputHintOk: { fontSize: 12, color: '#22C55E', fontWeight: '600' },

  // Layer 3: Notification
  notifIcon: { fontSize: 52, marginTop: 8 },
  notifBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
    width: '100%',
  },
  notifText: { fontSize: 13, color: '#3B82F6', lineHeight: 19 },
  retentionBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    gap: 6,
  },
  retentionTitle: { fontSize: 13, fontWeight: '700', color: '#333', marginBottom: 4 },
  retentionItem: { fontSize: 13, color: '#555' },

  // Layer 4: Final
  finalInfoBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    width: '100%',
  },
  finalInfoText: { fontSize: 13, color: '#666', lineHeight: 20, textAlign: 'center' },

  // Buttons
  btnCol: { width: '100%', gap: 10, marginTop: 4 },
  primaryBtn: {
    width: '100%',
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
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  dangerOutlineBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
  },
  dangerOutlineBtnText: { color: '#94A3B8', fontSize: 14, fontWeight: '500' },
  sendBreakupBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#6B7280',
    alignItems: 'center',
  },
  sendBreakupBtnDisabled: { backgroundColor: '#D1D5DB' },
  sendBreakupBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  backBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  backBtnText: { color: '#9CA3AF', fontSize: 14 },
  completeBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#6B7280',
    alignItems: 'center',
  },
  completeBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

export default BreakupModal;
