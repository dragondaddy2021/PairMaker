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
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';
import type { DatePlan } from '../../types';

const { width: W } = Dimensions.get('window');

// ─── Add Plan Modal ───────────────────────────────────────────────────────────

interface AddPlanModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (plan: Omit<DatePlan, 'id' | 'completed'>) => void;
}

const AddPlanModal: React.FC<AddPlanModalProps> = ({ visible, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!title.trim()) {
      Alert.alert('請輸入約會主題');
      return;
    }
    if (!date.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      Alert.alert('請輸入正確日期格式（YYYY-MM-DD）');
      return;
    }
    if (!location.trim()) {
      Alert.alert('請輸入地點');
      return;
    }
    onAdd({ title: title.trim(), date: date.trim(), location: location.trim(), notes: notes.trim() || undefined });
    setTitle(''); setDate(''); setLocation(''); setNotes('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>新增約會計畫</Text>

          <Text style={modalStyles.label}>約會主題</Text>
          <TextInput
            style={modalStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="例：去看夕陽、美食探險"
            placeholderTextColor="#C0C0C0"
          />

          <Text style={modalStyles.label}>日期（YYYY-MM-DD）</Text>
          <TextInput
            style={modalStyles.input}
            value={date}
            onChangeText={setDate}
            placeholder="2025-06-15"
            placeholderTextColor="#C0C0C0"
            keyboardType="numbers-and-punctuation"
          />

          <Text style={modalStyles.label}>地點</Text>
          <TextInput
            style={modalStyles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="例：台北 101、夜市、陽明山"
            placeholderTextColor="#C0C0C0"
          />

          <Text style={modalStyles.label}>備註（選填）</Text>
          <TextInput
            style={[modalStyles.input, modalStyles.textarea]}
            value={notes}
            onChangeText={setNotes}
            placeholder="想說的話、特別安排…"
            placeholderTextColor="#C0C0C0"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={modalStyles.btnRow}>
            <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
              <Text style={modalStyles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={modalStyles.addBtn} onPress={handleAdd}>
              <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={modalStyles.addBtnGrad}>
                <Text style={modalStyles.addBtnText}>新增計畫</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    gap: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFAFA',
  },
  textarea: { minHeight: 72 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#888', fontWeight: '600' },
  addBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  addBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  addBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

// ─── Plan Card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: DatePlan;
  onComplete: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onComplete }) => (
  <View style={cardStyles.root}>
    <View style={cardStyles.header}>
      <View style={cardStyles.dateBadge}>
        <Text style={cardStyles.dateMonth}>{plan.date.slice(5, 7)}月</Text>
        <Text style={cardStyles.dateDay}>{plan.date.slice(8, 10)}</Text>
      </View>
      <View style={cardStyles.info}>
        <Text style={cardStyles.title} numberOfLines={1}>{plan.title}</Text>
        <Text style={cardStyles.location} numberOfLines={1}>📍 {plan.location}</Text>
        {plan.notes ? <Text style={cardStyles.notes} numberOfLines={2}>{plan.notes}</Text> : null}
      </View>
      {plan.completed ? (
        <View style={cardStyles.completedBadge}>
          <Text style={cardStyles.completedText}>✅ 完成</Text>
        </View>
      ) : (
        <TouchableOpacity style={cardStyles.doneBtn} onPress={onComplete}>
          <Text style={cardStyles.doneBtnText}>完成</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const cardStyles = StyleSheet.create({
  root: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBadge: {
    width: 48,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  dateMonth: { fontSize: 11, color: '#FF6B6B', fontWeight: '600' },
  dateDay: { fontSize: 22, color: '#FF6B6B', fontWeight: '900', lineHeight: 26 },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  location: { fontSize: 12, color: '#888' },
  notes: { fontSize: 12, color: '#aaa', marginTop: 2 },
  completedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#F0FFF0',
  },
  completedText: { fontSize: 12, color: '#4ADE80', fontWeight: '700' },
  doneBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFF0F0',
  },
  doneBtnText: { fontSize: 13, color: '#FF6B6B', fontWeight: '700' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

const DatePlanScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { datePlans, addDatePlan, updateDatePlan, completeTask } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);

  const upcoming = useMemo(
    () => datePlans.filter((p) => !p.completed).sort((a, b) => a.date.localeCompare(b.date)),
    [datePlans],
  );
  const completed = useMemo(
    () => datePlans.filter((p) => p.completed).sort((a, b) => b.date.localeCompare(a.date)),
    [datePlans],
  );

  const handleAdd = (plan: Omit<DatePlan, 'id' | 'completed'>) => {
    addDatePlan({ ...plan, id: `plan_${Date.now()}`, completed: false });
  };

  const handleComplete = async (planId: string) => {
    updateDatePlan(planId, { completed: true });
    const result = await completeTask('complete_plan');
    if (result.success) {
      Alert.alert('約會完成！', result.message);
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>約會計畫</Text>
            <Text style={styles.headerSub}>{upcoming.length} 個進行中・{completed.length} 個已完成</Text>
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
        {/* Upcoming */}
        {upcoming.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📅 即將到來</Text>
            {upcoming.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onComplete={() => handleComplete(plan.id)} />
            ))}
          </>
        )}

        {upcoming.length === 0 && completed.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗓️</Text>
            <Text style={styles.emptyTitle}>還沒有任何約會計畫</Text>
            <Text style={styles.emptyDesc}>點右上角「新增」，和伴侶規劃美好約會吧！</Text>
          </View>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: upcoming.length > 0 ? 16 : 0 }]}>
              ✅ 已完成的約會
            </Text>
            {completed.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onComplete={() => {}} />
            ))}
          </>
        )}
      </ScrollView>

      <AddPlanModal
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  scroll: { flex: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#555', marginBottom: 10 },

  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#333' },
  emptyDesc: { fontSize: 14, color: '#aaa', textAlign: 'center' },
});

export default DatePlanScreen;
