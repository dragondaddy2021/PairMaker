/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { AppearancePR } from '../types';

const PR_CONFIG: Record<AppearancePR, { label: string; bg: string; text: string }> = {
  95: { label: 'PR 95', bg: '#FFD700', text: '#7A5A00' },
  80: { label: 'PR 80', bg: '#FF6B9D', text: '#fff' },
  60: { label: 'PR 60', bg: '#9B59B6', text: '#fff' },
  40: { label: 'PR 40', bg: '#3498DB', text: '#fff' },
  20: { label: 'PR 20', bg: '#BDC3C7', text: '#555' },
};

interface PRBadgeProps {
  value: AppearancePR;
  size?: 'sm' | 'md';
}

const PRBadge: React.FC<PRBadgeProps> = ({ value, size = 'md' }) => {
  const cfg = PR_CONFIG[value];
  const isSmall = size === 'sm';
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: cfg.bg },
        isSmall && styles.badgeSm,
      ]}
    >
      <Text style={[styles.label, { color: cfg.text }, isSmall && styles.labelSm]}>
        {cfg.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  badgeSm: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 7 },
  label: { fontSize: 12, fontWeight: '700' },
  labelSm: { fontSize: 10 },
});

export default PRBadge;
