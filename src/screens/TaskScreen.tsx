/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import {
  DATING_TASKS,
  COUPLE_TASKS,
  DATING_DAILY_CAP,
  COUPLE_BONUS_MULTIPLIER,
  TEMPERATURE_MILESTONES,
  type TaskDefinition,
} from '../config/taskConfig';
import {
  getCompletionsToday,
  getTodayEarnedPoints,
  todayDateKey,
} from '../services/pointsService';

const { width: W } = Dimensions.get('window');
const BAR_WIDTH = W - 64;

// ─── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  onBack: () => void;
}

// ─── 感情溫度計 ────────────────────────────────────────────────────────────────

interface TemperatureGaugeProps {
  temperature: number;  // 0–100
}

const TemperatureGauge: React.FC<TemperatureGaugeProps> = ({ temperature }) => {
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue: Math.min(100, Math.max(0, temperature)),
      useNativeDriver: false,
      speed: 3,
      bounciness: 2,
    }).start();
  }, [temperature, fillAnim]);

  const fillWidth = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [0, BAR_WIDTH],
  });

  const fillColor = fillAnim.interpolate({
    inputRange: [0, 25, 50, 75, 100],
    outputRange: ['#86EFAC', '#4ADE80', '#34D399', '#F9A8D4', '#FF6B6B'],
  });

  const currentMilestone = [...TEMPERATURE_MILESTONES]
    .reverse()
    .find((m) => temperature >= m.temp);
  const nextMilestone = TEMPERATURE_MILESTONES.find((m) => m.temp > temperature);

  return (
    <View style={styles.gaugeCard}>
      {/* 標題行 */}
      <View style={styles.gaugeHeader}>
        <Text style={styles.gaugeTitleIcon}>🌡️</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.gaugeTitle}>感情溫度計</Text>
          <Text style={styles.gaugeSubtitle}>
            {currentMilestone
              ? `${currentMilestone.icon} ${currentMilestone.title}`
              : '尚未達到里程碑'}
          </Text>
        </View>
        <View style={styles.gaugeTempBadge}>
          <Text style={styles.gaugeTempText}>{Math.round(temperature)}°C</Text>
        </View>
      </View>

      {/* 進度條 */}
      <View style={styles.gaugeBarWrap}>
        {/* Track */}
        <View style={[styles.gaugeTrack, { width: BAR_WIDTH }]}>
          {/* Fill */}
          <Animated.View
            style={[styles.gaugeFill, { width: fillWidth, backgroundColor: fillColor }]}
          />
        </View>

        {/* 里程碑標記 */}
        {TEMPERATURE_MILESTONES.map((m) => {
          const left = (m.temp / 100) * BAR_WIDTH;
          const passed = temperature >= m.temp;
          return (
            <View key={m.temp} style={[styles.milestonePin, { left }]}>
              <View style={[styles.milestoneTick, passed && { backgroundColor: m.color }]} />
              <Text style={styles.milestoneEmoji}>{m.icon}</Text>
              <Text style={styles.milestoneTemp}>{m.temp}°</Text>
            </View>
          );
        })}
      </View>

      {/* 下一里程碑提示 */}
      {nextMilestone ? (
        <Text style={styles.gaugeHint}>
          距離「{nextMilestone.icon} {nextMilestone.title}」還需{' '}
          <Text style={styles.gaugeHintBold}>{nextMilestone.temp - Math.round(temperature)}°C</Text>
        </Text>
      ) : (
        <Text style={[styles.gaugeHint, { color: '#FF6B6B', fontWeight: '700' }]}>
          🎉 你們已達到最高溫度！
        </Text>
      )}

      {/* 當前里程碑獎勵說明 */}
      {currentMilestone && (
        <View style={[styles.rewardBox, { borderLeftColor: currentMilestone.color }]}>
          <Text style={styles.rewardText}>{currentMilestone.reward}</Text>
        </View>
      )}
    </View>
  );
};

// ─── 每日進度條（交友模式）────────────────────────────────────────────────────

interface DailyProgressProps {
  todayPoints: number;
  completedCount: number;
  totalCount: number;
}

const DailyProgress: React.FC<DailyProgressProps> = ({
  todayPoints, completedCount, totalCount,
}) => {
  const pct = Math.min(1, todayPoints / DATING_DAILY_CAP);
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(fillAnim, { toValue: pct, useNativeDriver: false, speed: 4, bounciness: 2 }).start();
  }, [pct, fillAnim]);

  const fillW = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BAR_WIDTH],
  });

  return (
    <View style={styles.progressCard}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressTitle}>今日任務進度</Text>
        <Text style={styles.progressCount}>{completedCount} / {totalCount} 完成</Text>
      </View>

      <View style={[styles.gaugeTrack, { width: BAR_WIDTH, marginVertical: 8 }]}>
        <Animated.View style={[styles.gaugeFill, { width: fillW, backgroundColor: '#FF6B6B' }]} />
      </View>

      <View style={styles.progressFooter}>
        <Text style={styles.progressPts}>
          今日已獲得 <Text style={{ color: '#FF6B6B', fontWeight: '800' }}>{todayPoints}</Text> 點
        </Text>
        <Text style={styles.progressCap}>上限 {DATING_DAILY_CAP} 點</Text>
      </View>

      {todayPoints >= DATING_DAILY_CAP && (
        <View style={styles.capReachedBanner}>
          <Text style={styles.capReachedText}>🎉 今日點數已達上限，明天繼續！</Text>
        </View>
      )}
    </View>
  );
};

// ─── TaskRow ──────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: TaskDefinition;
  completedToday: number;
  isCouple: boolean;
  onComplete: () => void;
  disabled: boolean;
}

const TaskRow: React.FC<TaskRowProps> = ({
  task, completedToday, isCouple, onComplete, disabled,
}) => {
  const [pressing, setPressing] = useState(false);
  const displayPoints = isCouple && task.mode === 'couple'
    ? Math.round(task.points * COUPLE_BONUS_MULTIPLIER)
    : task.points;

  const isDone = task.dailyLimit !== undefined && completedToday >= task.dailyLimit;
  const isNolimit = task.dailyLimit === undefined;

  return (
    <View style={[styles.taskRow, isDone && styles.taskRowDone]}>
      <View style={styles.taskIcon}>
        <Text style={styles.taskIconEmoji}>{task.icon}</Text>
      </View>

      <View style={styles.taskInfo}>
        <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>{task.title}</Text>
        <Text style={styles.taskDesc}>{task.description}</Text>
        <View style={styles.taskMeta}>
          {task.dailyLimit !== undefined ? (
            <Text style={styles.taskLimitText}>
              今日 {completedToday} / {task.dailyLimit}
            </Text>
          ) : (
            <Text style={styles.taskLimitText}>無次數限制</Text>
          )}
        </View>
      </View>

      <View style={styles.taskRight}>
        {/* 點數徽章 */}
        <View style={[styles.pointsBadge, isCouple && task.mode === 'couple' && styles.pointsBadgeBonus]}>
          <Text style={styles.pointsBadgeText}>+{displayPoints}</Text>
          {isCouple && task.mode === 'couple' && (
            <Text style={styles.bonusMark}>×1.5</Text>
          )}
        </View>

        {/* 完成按鈕 */}
        <TouchableOpacity
          style={[
            styles.completeBtn,
            (disabled || isDone) && styles.completeBtnDisabled,
          ]}
          onPress={onComplete}
          disabled={disabled || isDone}
          activeOpacity={0.75}
          onPressIn={() => setPressing(true)}
          onPressOut={() => setPressing(false)}
        >
          <Text style={[
            styles.completeBtnText,
            (disabled || isDone) && styles.completeBtnTextDisabled,
          ]}>
            {isDone ? '✓ 完成' : isNolimit ? '完成' : '完成'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── TransactionRow ───────────────────────────────────────────────────────────

const TransactionRow: React.FC<{ tx: { amount: number; type: 'earn' | 'spend'; reason: string; bonus?: boolean; timestamp: string } }> = ({ tx }) => {
  const dateStr = new Date(tx.timestamp).toLocaleString('zh-TW', {
    month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  return (
    <View style={styles.txRow}>
      <View style={[styles.txDot, tx.type === 'earn' ? styles.txDotEarn : styles.txDotSpend]} />
      <View style={{ flex: 1 }}>
        <Text style={styles.txReason}>{tx.reason}</Text>
        <Text style={styles.txDate}>{dateStr}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, tx.type === 'earn' ? styles.txAmountEarn : styles.txAmountSpend]}>
          {tx.type === 'earn' ? '+' : '-'}{tx.amount}
        </Text>
        {tx.bonus && <Text style={styles.txBonus}>×1.5</Text>}
      </View>
    </View>
  );
};

// ─── 主元件 ────────────────────────────────────────────────────────────────────

const TaskScreen: React.FC<Props> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const {
    appMode,
    pointTransactions,
    taskCompletions,
    completeTask,
    points,
  } = useAppStore();

  const isCouple = appMode === 'couple';
  const tasks = isCouple ? COUPLE_TASKS : DATING_TASKS;
  const today = todayDateKey();

  // 今日交友點數
  const todayPoints = useMemo(
    () => getTodayEarnedPoints(pointTransactions, 'dating'),
    [pointTransactions],
  );

  // 今日完成任務數（交友模式）
  const completedTodayCount = useMemo(() => {
    if (isCouple) return 0;
    return DATING_TASKS.filter((t) => getCompletionsToday(t.id, taskCompletions) > 0).length;
  }, [isCouple, taskCompletions]);

  // 感情溫度（伴侶模式）
  const coupleTemperature = useMemo(() => {
    if (!isCouple) return 0;
    const total = pointTransactions
      .filter((tx) => tx.type === 'earn' && tx.mode === 'couple')
      .reduce((sum, tx) => sum + tx.amount, 0);
    return Math.min(100, Math.round(total / 2));
  }, [isCouple, pointTransactions]);

  // 每日點數是否達上限（交友模式）
  const isDailyCapped = !isCouple && todayPoints >= DATING_DAILY_CAP;

  const handleComplete = useCallback(async (taskId: string) => {
    const result = await completeTask(taskId);
    Alert.alert(
      result.success ? '任務完成！' : '無法完成',
      result.message,
      [{ text: '好的' }],
    );
  }, [completeTask]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isCouple ? '❤️ 感情任務' : '📋 每日任務'}
        </Text>
        <View style={styles.headerPoints}>
          <Text style={styles.headerPointsText}>⭐ {points}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Demo 提示 ── */}
        <View style={styles.demoHint}>
          <Text style={styles.demoHintText}>
            🛠 Demo 模式：點擊「完成」按鈕可手動觸發任務獎勵
          </Text>
        </View>

        {/* ── 感情溫度計（伴侶模式）── */}
        {isCouple && <TemperatureGauge temperature={coupleTemperature} />}

        {/* ── 今日進度（交友模式）── */}
        {!isCouple && (
          <DailyProgress
            todayPoints={todayPoints}
            completedCount={completedTodayCount}
            totalCount={DATING_TASKS.length}
          />
        )}

        {/* ── 任務列表 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isCouple ? '伴侶任務' : '今日任務'}
          </Text>

          {isCouple && (
            <View style={styles.bonusNote}>
              <Text style={styles.bonusNoteText}>
                💑 雙人同時完成任務，自動獲得 ×{COUPLE_BONUS_MULTIPLIER} 點數加成
              </Text>
            </View>
          )}

          {tasks.map((task) => {
            const completedToday = getCompletionsToday(task.id, taskCompletions);
            const isDone = task.dailyLimit !== undefined && completedToday >= task.dailyLimit;
            return (
              <TaskRow
                key={task.id}
                task={task}
                completedToday={completedToday}
                isCouple={isCouple}
                onComplete={() => handleComplete(task.id)}
                disabled={isDailyCapped && !isCouple}
              />
            );
          })}
        </View>

        {/* ── 里程碑說明（伴侶模式）── */}
        {isCouple && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>感情里程碑</Text>
            {TEMPERATURE_MILESTONES.map((m) => {
              const unlocked = coupleTemperature >= m.temp;
              return (
                <View key={m.temp} style={[styles.milestoneCard, unlocked && { borderLeftColor: m.color, borderLeftWidth: 3 }]}>
                  <Text style={styles.milestoneCardEmoji}>{m.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.milestoneCardHeader}>
                      <Text style={[styles.milestoneCardTitle, !unlocked && { color: '#BBB' }]}>
                        {m.title}
                      </Text>
                      <Text style={[styles.milestoneCardTemp, !unlocked && { color: '#DDD' }]}>
                        {m.temp}°C
                      </Text>
                    </View>
                    <Text style={[styles.milestoneCardReward, !unlocked && { color: '#CCC' }]}>
                      {unlocked ? m.reward : `累積至 ${m.temp}°C 解鎖`}
                    </Text>
                  </View>
                  {unlocked && <Text style={styles.milestoneCardCheck}>✓</Text>}
                </View>
              );
            })}
          </View>
        )}

        {/* ── 點數歷史 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>點數紀錄</Text>
          {pointTransactions.length === 0 ? (
            <Text style={styles.emptyText}>尚無點數紀錄</Text>
          ) : (
            pointTransactions.slice(0, 30).map((tx) => (
              <TransactionRow key={tx.id} tx={tx} />
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 20, color: '#FF6B6B', fontWeight: '600' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  headerPoints: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerPointsText: { fontSize: 13, fontWeight: '700', color: '#FF6B6B' },

  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },

  // Demo hint
  demoHint: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  demoHintText: { fontSize: 12, color: '#3B82F6' },

  // Temperature gauge
  gaugeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 10,
  },
  gaugeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gaugeTitleIcon: { fontSize: 28 },
  gaugeTitle: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  gaugeSubtitle: { fontSize: 13, color: '#888', marginTop: 1 },
  gaugeTempBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gaugeTempText: { fontSize: 18, fontWeight: '900', color: '#FF6B6B' },

  gaugeBarWrap: {
    position: 'relative',
    height: 52,
    justifyContent: 'center',
    marginTop: 4,
  },
  gaugeTrack: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F0F0F0',
    overflow: 'hidden',
  },
  gaugeFill: {
    height: 10,
    borderRadius: 5,
  },
  milestonePin: {
    position: 'absolute',
    alignItems: 'center',
    top: 0,
    marginLeft: -10,
  },
  milestoneTick: {
    width: 2,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 1,
  },
  milestoneEmoji: { fontSize: 14, marginTop: 2 },
  milestoneTemp: { fontSize: 9, color: '#BBB', marginTop: 1 },

  gaugeHint: { fontSize: 13, color: '#888' },
  gaugeHintBold: { fontWeight: '800', color: '#FF6B6B' },
  rewardBox: {
    backgroundColor: '#FFF8F0',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD93D',
  },
  rewardText: { fontSize: 13, color: '#666', lineHeight: 19 },

  // Daily progress
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  progressCount: { fontSize: 13, color: '#888', fontWeight: '600' },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  progressPts: { fontSize: 13, color: '#666' },
  progressCap: { fontSize: 12, color: '#BBB' },
  capReachedBanner: {
    marginTop: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  capReachedText: { fontSize: 13, color: '#FF6B6B', fontWeight: '600' },

  // Section
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  bonusNote: {
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  bonusNoteText: { fontSize: 12, color: '#FF8E53' },

  // Task row
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8FA',
    gap: 10,
  },
  taskRowDone: { opacity: 0.55 },
  taskIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIconEmoji: { fontSize: 20 },
  taskInfo: { flex: 1, gap: 2 },
  taskTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  taskTitleDone: { color: '#AAA', textDecorationLine: 'line-through' },
  taskDesc: { fontSize: 11, color: '#AAA', lineHeight: 15 },
  taskMeta: { flexDirection: 'row', gap: 6, marginTop: 2 },
  taskLimitText: { fontSize: 11, color: '#BDBDBD' },

  taskRight: { alignItems: 'center', gap: 5 },
  pointsBadge: {
    backgroundColor: '#FFF0F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
  },
  pointsBadgeBonus: { backgroundColor: '#FFF8E1' },
  pointsBadgeText: { fontSize: 13, fontWeight: '800', color: '#FF6B6B' },
  bonusMark: { fontSize: 9, color: '#F59E0B', fontWeight: '700' },

  completeBtn: {
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 54,
    alignItems: 'center',
  },
  completeBtnDisabled: { backgroundColor: '#E0E0E0' },
  completeBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  completeBtnTextDisabled: { color: '#AAA' },

  // Milestones
  milestoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#FAFAFA',
    marginBottom: 6,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F0F0F0',
  },
  milestoneCardEmoji: { fontSize: 24 },
  milestoneCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  milestoneCardTitle: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  milestoneCardTemp: { fontSize: 12, fontWeight: '600', color: '#FF6B6B' },
  milestoneCardReward: { fontSize: 12, color: '#888', marginTop: 2, lineHeight: 17 },
  milestoneCardCheck: { fontSize: 16, color: '#22C55E', fontWeight: '800' },

  // Transaction rows
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F8FA',
    gap: 10,
  },
  txDot: { width: 8, height: 8, borderRadius: 4 },
  txDotEarn: { backgroundColor: '#22C55E' },
  txDotSpend: { backgroundColor: '#EF4444' },
  txReason: { fontSize: 13, fontWeight: '600', color: '#333' },
  txDate: { fontSize: 11, color: '#BBB', marginTop: 1 },
  txRight: { alignItems: 'flex-end', gap: 2 },
  txAmount: { fontSize: 14, fontWeight: '800' },
  txAmountEarn: { color: '#22C55E' },
  txAmountSpend: { color: '#EF4444' },
  txBonus: { fontSize: 9, color: '#F59E0B', fontWeight: '700' },

  emptyText: { fontSize: 13, color: '#CCC', textAlign: 'center', paddingVertical: 16 },
});

export default TaskScreen;
