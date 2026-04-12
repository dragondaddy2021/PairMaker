/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TagSelectorProps<T extends string> {
  options: readonly T[];
  selected: T[];
  onToggle: (value: T) => void;
  multi?: boolean;
  activeColor?: string;
  nullLabel?: string;   // 「不限」選項的顯示文字
  nullValue?: T;        // 代表「不限」的值
}

function TagSelector<T extends string>({
  options,
  selected,
  onToggle,
  multi = true,
  activeColor = '#FF6B6B',
  nullLabel,
  nullValue,
}: TagSelectorProps<T>) {
  const isActive = (v: T) => selected.includes(v);

  return (
    <View style={styles.wrap}>
      {nullLabel && nullValue !== undefined && (
        <TouchableOpacity
          style={[
            styles.tag,
            selected.length === 0 && styles.tagActiveNull,
            selected.length === 0 && { borderColor: activeColor, backgroundColor: `${activeColor}18` },
          ]}
          onPress={() => {
            // 選「不限」時清空所有選項
            if (selected.length > 0) {
              selected.forEach((s) => onToggle(s));
            }
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.tagText,
              selected.length === 0 && { color: activeColor, fontWeight: '700' },
            ]}
          >
            {nullLabel}
          </Text>
        </TouchableOpacity>
      )}
      {options.map((opt) => {
        const active = isActive(opt);
        return (
          <TouchableOpacity
            key={opt}
            style={[
              styles.tag,
              active && { borderColor: activeColor, backgroundColor: `${activeColor}18` },
            ]}
            onPress={() => onToggle(opt)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tagText,
                active && { color: activeColor, fontWeight: '700' },
              ]}
            >
              {opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  tagActiveNull: {},
  tagText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
});

export default TagSelector;
