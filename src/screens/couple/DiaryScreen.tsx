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
  TextInput,
  Modal,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAppStore } from '../../store/useAppStore';
import type { DiaryEntry } from '../../types';

const { width: W } = Dimensions.get('window');

type Mood = DiaryEntry['mood'];

const MOODS: { key: Mood; icon: string; label: string }[] = [
  { key: 'happy',    icon: '😊', label: '開心' },
  { key: 'romantic', icon: '🥰', label: '浪漫' },
  { key: 'excited',  icon: '🎉', label: '興奮' },
  { key: 'neutral',  icon: '😌', label: '平靜' },
  { key: 'sad',      icon: '😢', label: '難過' },
];

const MOOD_COLORS: Record<Mood, string> = {
  happy: '#FDE68A', romantic: '#FBCFE8', excited: '#FCA5A5',
  neutral: '#BAE6FD', sad: '#C7D2FE',
};

// ─── Add Diary Modal ──────────────────────────────────────────────────────────

interface AddDiaryModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (entry: Omit<DiaryEntry, 'id' | 'date'>) => void;
}

const AddDiaryModal: React.FC<AddDiaryModalProps> = ({ visible, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<Mood>('happy');
  const [photos, setPhotos] = useState<string[]>([]);

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('需要相片權限', '請在設定中允許存取相片');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      // Android content:// URIs — copy to cache so Image component can display them reliably
      const resolvedUris = await Promise.all(
        result.assets.map(async (a) => {
          if (a.uri.startsWith('content://')) {
            const ext = a.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
            const dest = `${FileSystem.cacheDirectory ?? ''}diary_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
            await FileSystem.copyAsync({ from: a.uri, to: dest });
            return dest;
          }
          return a.uri;
        }),
      );
      setPhotos((prev) => [...prev, ...resolvedUris].slice(0, 9));
    }
  };

  const handleAdd = () => {
    if (!title.trim()) { Alert.alert('請輸入標題'); return; }
    if (!content.trim()) { Alert.alert('請輸入內容'); return; }
    onAdd({ title: title.trim(), content: content.trim(), mood, photos: photos.length > 0 ? photos : undefined });
    setTitle(''); setContent(''); setMood('happy'); setPhotos([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={modalStyles.title}>新增日記</Text>

            {/* Mood selector */}
            <Text style={modalStyles.label}>今天的心情</Text>
            <View style={modalStyles.moodRow}>
              {MOODS.map((m) => (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    modalStyles.moodBtn,
                    mood === m.key && { backgroundColor: MOOD_COLORS[m.key] },
                  ]}
                  onPress={() => setMood(m.key)}
                >
                  <Text style={modalStyles.moodIcon}>{m.icon}</Text>
                  <Text style={[modalStyles.moodLabel, mood === m.key && { fontWeight: '700' }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={modalStyles.label}>標題</Text>
            <TextInput
              style={modalStyles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="今天的日記標題"
              placeholderTextColor="#C0C0C0"
            />

            <Text style={modalStyles.label}>內容</Text>
            <TextInput
              style={[modalStyles.input, modalStyles.textarea]}
              value={content}
              onChangeText={setContent}
              placeholder="記錄今天的點點滴滴…"
              placeholderTextColor="#C0C0C0"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />

            {/* Photos */}
            <Text style={modalStyles.label}>照片（最多 9 張）</Text>
            <View style={modalStyles.photoRow}>
              {photos.map((uri, i) => (
                <View key={i} style={modalStyles.thumbWrapper}>
                  <Image source={{ uri }} style={modalStyles.thumb} />
                  <TouchableOpacity
                    style={modalStyles.removePhoto}
                    onPress={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}
                  >
                    <Text style={modalStyles.removePhotoText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 9 && (
                <TouchableOpacity style={modalStyles.addPhotoBtn} onPress={handlePickPhoto}>
                  <Text style={modalStyles.addPhotoIcon}>📷</Text>
                  <Text style={modalStyles.addPhotoText}>新增</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={modalStyles.btnRow}>
              <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
                <Text style={modalStyles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.saveBtn} onPress={handleAdd}>
                <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={modalStyles.saveBtnGrad}>
                  <Text style={modalStyles.saveBtnText}>儲存日記</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    maxHeight: '90%',
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#1A1A1A', backgroundColor: '#FAFAFA',
  },
  textarea: { minHeight: 100 },
  moodRow: { flexDirection: 'row', gap: 8 },
  moodBtn: {
    flex: 1, alignItems: 'center', gap: 4,
    paddingVertical: 8, borderRadius: 10, backgroundColor: '#F5F5F5',
  },
  moodIcon: { fontSize: 22 },
  moodLabel: { fontSize: 10, color: '#555' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  thumbWrapper: { position: 'relative' },
  thumb: { width: 72, height: 72, borderRadius: 8 },
  removePhoto: {
    position: 'absolute', top: -6, right: -6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center',
  },
  removePhotoText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  addPhotoBtn: {
    width: 72, height: 72, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addPhotoIcon: { fontSize: 22 },
  addPhotoText: { fontSize: 10, color: '#aaa' },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center',
  },
  cancelText: { fontSize: 15, color: '#888', fontWeight: '600' },
  saveBtn: { flex: 2, borderRadius: 12, overflow: 'hidden' },
  saveBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: 15, color: '#fff', fontWeight: '700' },
});

// ─── Diary Entry Card ─────────────────────────────────────────────────────────

const DiaryCard: React.FC<{ entry: DiaryEntry }> = ({ entry }) => {
  const moodObj = MOODS.find((m) => m.key === entry.mood) ?? MOODS[0];

  return (
    <View style={entryStyles.root}>
      {/* Timeline dot */}
      <View style={entryStyles.timelineColumn}>
        <View style={[entryStyles.dot, { backgroundColor: MOOD_COLORS[entry.mood] }]}>
          <Text style={entryStyles.dotIcon}>{moodObj.icon}</Text>
        </View>
        <View style={entryStyles.line} />
      </View>

      {/* Content */}
      <View style={entryStyles.content}>
        <Text style={entryStyles.date}>{entry.date.slice(0, 10)}</Text>
        <View style={entryStyles.card}>
          <Text style={entryStyles.title}>{entry.title}</Text>
          <Text style={entryStyles.body} numberOfLines={4}>{entry.content}</Text>
          {entry.photos && entry.photos.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={entryStyles.photoScroll}>
              {entry.photos.map((uri, i) => (
                <Image key={i} source={{ uri }} style={entryStyles.photo} />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

const entryStyles = StyleSheet.create({
  root: { flexDirection: 'row', marginBottom: 4 },
  timelineColumn: { alignItems: 'center', width: 40 },
  dot: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  dotIcon: { fontSize: 18 },
  line: { flex: 1, width: 2, backgroundColor: '#F0F0F0', marginTop: 4 },
  content: { flex: 1, paddingBottom: 16 },
  date: { fontSize: 11, color: '#aaa', marginLeft: 10, marginBottom: 6, marginTop: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  title: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  body: { fontSize: 14, color: '#555', lineHeight: 20 },
  photoScroll: { marginTop: 4 },
  photo: { width: 80, height: 80, borderRadius: 8, marginRight: 6 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

const DiaryScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { diaryEntries, addDiaryEntry, completeTask } = useAppStore();
  const [modalVisible, setModalVisible] = useState(false);

  const sorted = useMemo(
    () => [...diaryEntries].sort((a, b) => b.date.localeCompare(a.date)),
    [diaryEntries],
  );

  const handleAdd = async (entry: Omit<DiaryEntry, 'id' | 'date'>) => {
    const newEntry: DiaryEntry = {
      ...entry,
      id: `diary_${Date.now()}`,
      date: new Date().toISOString(),
    };
    addDiaryEntry(newEntry);

    // Complete write_diary task
    const r1 = await completeTask('write_diary');
    let msg = r1.success ? r1.message : '';

    // If photos were uploaded, also complete upload_photo task
    if (entry.photos && entry.photos.length > 0) {
      const r2 = await completeTask('upload_photo');
      if (r2.success) msg += `\n${r2.message}`;
    }

    if (msg) Alert.alert('任務完成！', msg.trim());
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>愛情日記</Text>
            <Text style={styles.headerSub}>{sorted.length} 篇記憶</Text>
          </View>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>✏️ 新增</Text>
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
            <Text style={styles.emptyIcon}>📔</Text>
            <Text style={styles.emptyTitle}>還沒有日記</Text>
            <Text style={styles.emptyDesc}>記錄你們每一個珍貴的時刻</Text>
          </View>
        ) : (
          sorted.map((entry) => <DiaryCard key={entry.id} entry={entry} />)
        )}
      </ScrollView>

      <AddDiaryModal
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
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
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

export default DiaryScreen;
