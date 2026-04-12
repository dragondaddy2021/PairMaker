/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SimilarityBadgeProps {
  score: number | null;   // 0–100，null 表示「未分析」
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

/**
 * 顏色分級：
 *  80+  → 綠（高度相似）
 *  60-79 → 藍（相似）
 *  40-59 → 橘（普通）
 *  <40  → 灰（低相似）
 */
const getColor = (score: number): { bg: string; text: string; border: string } => {
  if (score >= 80) return { bg: '#DCFCE7', text: '#16A34A', border: '#86EFAC' };
  if (score >= 60) return { bg: '#DBEAFE', text: '#2563EB', border: '#93C5FD' };
  if (score >= 40) return { bg: '#FFEDD5', text: '#EA580C', border: '#FDBA74' };
  return             { bg: '#F3F4F6', text: '#6B7280', border: '#D1D5DB' };
};

const SimilarityBadge: React.FC<SimilarityBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
}) => {
  if (score === null) {
    return (
      <View style={[styles.base, styles.null, sizeStyles[size]]}>
        <Text style={[styles.text, styles.nullText, textSizeStyles[size]]}>— %</Text>
      </View>
    );
  }

  const { bg, text, border } = getColor(score);

  return (
    <View style={[styles.base, { backgroundColor: bg, borderColor: border }, sizeStyles[size]]}>
      {showLabel && (
        <Text style={[styles.icon, iconSizeStyles[size]]}>🤖</Text>
      )}
      <Text style={[styles.text, { color: text }, textSizeStyles[size]]}>
        {score}%
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 3,
    alignSelf: 'flex-start',
  },
  null: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  nullText: { color: '#9CA3AF' },
  icon: {},
});

const sizeStyles = StyleSheet.create({
  sm: { paddingHorizontal: 6,  paddingVertical: 2 },
  md: { paddingHorizontal: 9,  paddingVertical: 4 },
  lg: { paddingHorizontal: 12, paddingVertical: 6 },
});

const textSizeStyles = StyleSheet.create({
  sm: { fontSize: 11 },
  md: { fontSize: 13 },
  lg: { fontSize: 15 },
});

const iconSizeStyles = StyleSheet.create({
  sm: { fontSize: 10 },
  md: { fontSize: 12 },
  lg: { fontSize: 14 },
});

export default SimilarityBadge;
