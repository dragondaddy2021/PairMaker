/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';

interface FilterRowProps {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  description?: string;
}

const FilterRow: React.FC<FilterRowProps> = ({ label, value, onValueChange, description }) => (
  <View style={styles.row}>
    <View style={styles.labelWrap}>
      <Text style={styles.label}>{label}</Text>
      {description && <Text style={styles.desc}>{description}</Text>}
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#E0E0E0', true: '#FF6B6B' }}
      thumbColor={value ? '#fff' : '#fff'}
      ios_backgroundColor="#E0E0E0"
    />
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  labelWrap: { flex: 1, marginRight: 12 },
  label: { fontSize: 14, color: '#333', fontWeight: '500' },
  desc: { fontSize: 11, color: '#aaa', marginTop: 1 },
});

export default FilterRow;
