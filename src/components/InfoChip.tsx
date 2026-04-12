/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InfoChipProps {
  icon: string;
  label: string;
  highlight?: boolean;
}

const InfoChip: React.FC<InfoChipProps> = ({ icon, label, highlight }) => (
  <View style={[styles.chip, highlight && styles.chipHL]}>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={[styles.label, highlight && styles.labelHL]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F4F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  chipHL: { backgroundColor: '#FFF0F0' },
  icon: { fontSize: 13 },
  label: { fontSize: 12, color: '#555', fontWeight: '500' },
  labelHL: { color: '#FF6B6B', fontWeight: '600' },
});

export default InfoChip;
