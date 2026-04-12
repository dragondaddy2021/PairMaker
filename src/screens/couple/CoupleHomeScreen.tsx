/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, { useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../../store/useAppStore';

const { width: W } = Dimensions.get('window');

const MOCK_COUPLE_PHOTOS = [
  'https://picsum.photos/seed/couple1/200/200',
  'https://picsum.photos/seed/couple2/200/200',
  'https://picsum.photos/seed/couple3/200/200',
  'https://picsum.photos/seed/couple4/200/200',
  'https://picsum.photos/seed/couple5/200/200',
  'https://picsum.photos/seed/couple6/200/200',
];

// ─── Compact Temperature Gauge ────────────────────────────────────────────────

const CompactTemperatureGauge: React.FC<{ temperature: number }> = ({ temperature }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: temperature / 100,
      useNativeDriver: false,
      tension: 60,
      friction: 8,
    }).start();
  }, [temperature]);

  const barColor = anim.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['#86EFAC', '#86EFAC', '#4ADE80', '#F9A8D4', '#FF6B6B'],
  });

  return (
    <View style={gaugeStyles.root}>
      <View style={gaugeStyles.labelRow}>
        <Text style={gaugeStyles.label}>感情溫度</Text>
        <Text style={gaugeStyles.value}>{temperature}°C</Text>
      </View>
      <View style={gaugeStyles.track}>
        <Animated.View
          style={[
            gaugeStyles.fill,
            {
              width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

const gaugeStyles = StyleSheet.create({
  root: { gap: 6 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  value: { fontSize: 15, color: '#fff', fontWeight: '800' },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 4 },
});

// ─── Plan Row ─────────────────────────────────────────────────────────────────

const PlanRow: React.FC<{ title: string; date: string; location: string }> = ({
  title, date, location,
}) => (
  <View style={planStyles.root}>
    <View style={planStyles.dateBadge}>
      <Text style={planStyles.dateText}>{date.slice(5).replace('-', '/')}</Text>
    </View>
    <View style={planStyles.info}>
      <Text style={planStyles.title} numberOfLines={1}>{title}</Text>
      <Text style={planStyles.location} numberOfLines={1}>📍 {location}</Text>
    </View>
  </View>
);

const planStyles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dateBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: { fontSize: 12, fontWeight: '700', color: '#FF6B6B' },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  location: { fontSize: 12, color: '#888' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface Props {
  onOpenAnniversary?: () => void;
}

const CoupleHomeScreen: React.FC<Props> = ({ onOpenAnniversary }) => {
  const insets = useSafeAreaInsets();
  const {
    currentUser, partnerUser, coupleStartDate,
    anniversaries, pointTransactions, datePlans, diaryEntries,
  } = useAppStore();

  const daysTogether = useMemo(() => {
    if (!coupleStartDate) return 0;
    return Math.max(1, Math.floor((Date.now() - new Date(coupleStartDate).getTime()) / 86_400_000));
  }, [coupleStartDate]);

  const temperature = useMemo(() => {
    const total = pointTransactions
      .filter((tx) => tx.type === 'earn' && tx.mode === 'couple')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return Math.min(100, Math.round(total / 2));
  }, [pointTransactions]);

  const nextAnniversary = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allAnns = [
      ...(coupleStartDate
        ? [{ title: '在一起紀念日', date: coupleStartDate.slice(0, 10) }]
        : []),
      ...anniversaries.map((a) => ({ title: a.title, date: a.date })),
    ];

    let minDays = Infinity;
    let found: { title: string; daysLeft: number } | null = null;

    allAnns.forEach(({ title, date }) => {
      const base = new Date(date);
      let candidate = new Date(today.getFullYear(), base.getMonth(), base.getDate());
      if (candidate < today) {
        candidate = new Date(today.getFullYear() + 1, base.getMonth(), base.getDate());
      }
      const daysLeft = Math.round((candidate.getTime() - today.getTime()) / 86_400_000);
      if (daysLeft < minDays) {
        minDays = daysLeft;
        found = { title, daysLeft };
      }
    });

    return found as { title: string; daysLeft: number } | null;
  }, [anniversaries, coupleStartDate]);

  const albumPhotos = useMemo(() => {
    const diaryPhotos = diaryEntries.flatMap((e) => e.photos ?? []);
    return [...diaryPhotos, ...MOCK_COUPLE_PHOTOS].slice(0, 6);
  }, [diaryEntries]);

  const upcomingPlans = useMemo(
    () =>
      datePlans
        .filter((p) => !p.completed)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3),
    [datePlans],
  );

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.avatarsRow}>
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
              <Text style={styles.avatarName}>{currentUser.name}</Text>
            </View>
            <View style={styles.heartContainer}>
              <Text style={styles.heartIcon}>💗</Text>
            </View>
            <View style={styles.avatarWrapper}>
              <Image
                source={{ uri: partnerUser?.avatar ?? 'https://picsum.photos/seed/partner/200/200' }}
                style={styles.avatar}
              />
              <Text style={styles.avatarName}>{partnerUser?.name ?? '伴侶'}</Text>
            </View>
          </View>

          <View style={styles.daysRow}>
            <Text style={styles.daysNumber}>{daysTogether}</Text>
            <Text style={styles.daysLabel}> 天</Text>
            <Text style={styles.daysSuffix}>  在一起了</Text>
          </View>

          {nextAnniversary && (
            <TouchableOpacity
              style={styles.anniversaryBanner}
              onPress={onOpenAnniversary}
              activeOpacity={0.8}
            >
              <Text style={styles.anniversaryIcon}>🎂</Text>
              <Text style={styles.anniversaryText}>
                {nextAnniversary.daysLeft === 0
                  ? `今天是${nextAnniversary.title}！`
                  : `距離${nextAnniversary.title}還有 ${nextAnniversary.daysLeft} 天`}
              </Text>
              <Text style={styles.anniversaryArrow}>›</Text>
            </TouchableOpacity>
          )}
          {!nextAnniversary && onOpenAnniversary && (
            <TouchableOpacity style={styles.anniversaryBanner} onPress={onOpenAnniversary} activeOpacity={0.8}>
              <Text style={styles.anniversaryIcon}>🎂</Text>
              <Text style={styles.anniversaryText}>查看紀念日</Text>
              <Text style={styles.anniversaryArrow}>›</Text>
            </TouchableOpacity>
          )}

          <View style={styles.gaugeWrapper}>
            <CompactTemperatureGauge temperature={temperature} />
          </View>
        </LinearGradient>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{datePlans.filter((p) => p.completed).length}</Text>
            <Text style={styles.statLabel}>約會次數</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{diaryEntries.length}</Text>
            <Text style={styles.statLabel}>日記篇數</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{temperature}°</Text>
            <Text style={styles.statLabel}>感情溫度</Text>
          </View>
        </View>

        {/* ── Photo Album ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📸 我們的相冊</Text>
            <Text style={styles.sectionSub}>
              {diaryEntries.flatMap((e) => e.photos ?? []).length} 張照片
            </Text>
          </View>
          <View style={styles.photoGrid}>
            {albumPhotos.map((uri, i) => (
              <Image key={i} source={{ uri }} style={styles.albumPhoto} />
            ))}
          </View>
        </View>

        {/* ── Upcoming Plans ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📅 即將到來的約會</Text>
            <Text style={styles.sectionSub}>
              {datePlans.filter((p) => !p.completed).length} 個計畫
            </Text>
          </View>
          {upcomingPlans.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🗓️</Text>
              <Text style={styles.emptyText}>還沒有約會計畫，快去計畫頁新增吧！</Text>
            </View>
          ) : (
            upcomingPlans.map((plan) => (
              <PlanRow key={plan.id} title={plan.title} date={plan.date} location={plan.location} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8FA' },
  scroll: { flex: 1 },

  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 16,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  avatarWrapper: { alignItems: 'center', gap: 6, width: 90 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  avatarName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heartContainer: { width: 48, alignItems: 'center', marginBottom: 20 },
  heartIcon: { fontSize: 32 },

  daysRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
  },
  daysNumber: { fontSize: 52, fontWeight: '900', color: '#fff' },
  daysLabel: { fontSize: 22, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  daysSuffix: { fontSize: 16, color: 'rgba(255,255,255,0.75)' },

  anniversaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'center',
  },
  anniversaryIcon: { fontSize: 16 },
  anniversaryText: { fontSize: 13, color: '#fff', fontWeight: '600', flex: 1 },
  anniversaryArrow: { fontSize: 16, color: 'rgba(255,255,255,0.75)' },

  gaugeWrapper: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 14,
    padding: 14,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: { fontSize: 22, fontWeight: '800', color: '#FF6B6B' },
  statLabel: { fontSize: 11, color: '#888' },

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
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  sectionSub: { fontSize: 12, color: '#888' },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  albumPhoto: {
    width: (W - 32 - 32 - 8) / 3,
    height: (W - 32 - 32 - 8) / 3,
    borderRadius: 8,
  },

  emptyState: { alignItems: 'center', paddingVertical: 20, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 13, color: '#aaa', textAlign: 'center' },
});

export default CoupleHomeScreen;
