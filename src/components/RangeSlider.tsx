/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface RangeSliderProps {
  min: number;
  max: number;
  lowValue: number;
  highValue: number;
  step?: number;
  onLowChange: (value: number) => void;
  onHighChange: (value: number) => void;
  formatLabel?: (value: number) => string;
  trackColor?: string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  lowValue,
  highValue,
  step = 1,
  onLowChange,
  onHighChange,
  formatLabel,
  trackColor = '#FF6B6B',
}) => {
  const fmt = formatLabel ?? ((v: number) => String(v));

  const handleLowChange = useCallback(
    (v: number) => {
      onLowChange(Math.min(v, highValue - step));
    },
    [highValue, step, onLowChange],
  );

  const handleHighChange = useCallback(
    (v: number) => {
      onHighChange(Math.max(v, lowValue + step));
    },
    [lowValue, step, onHighChange],
  );

  return (
    <View style={styles.container}>
      {/* 最小值滑桿 */}
      <View style={styles.row}>
        <Text style={styles.label}>最小</Text>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={lowValue}
          onValueChange={handleLowChange}
          minimumTrackTintColor={trackColor}
          maximumTrackTintColor="#E0E0E0"
          thumbTintColor={trackColor}
        />
        <Text style={styles.valueLabel}>{fmt(lowValue)}</Text>
      </View>

      {/* 最大值滑桿 */}
      <View style={styles.row}>
        <Text style={styles.label}>最大</Text>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          step={step}
          value={highValue}
          onValueChange={handleHighChange}
          minimumTrackTintColor="#E0E0E0"
          maximumTrackTintColor={trackColor}
          thumbTintColor={trackColor}
          inverted={false}
        />
        <Text style={styles.valueLabel}>{fmt(highValue)}</Text>
      </View>

      {/* 視覺範圍指示 */}
      <View style={styles.rangeIndicator}>
        <Text style={styles.rangeText}>
          {fmt(lowValue)}　—　{fmt(highValue)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  label: {
    width: 30,
    fontSize: 11,
    color: '#aaa',
  },
  slider: {
    flex: 1,
    height: 36,
  },
  valueLabel: {
    width: 44,
    textAlign: 'right',
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B6B',
  },
  rangeIndicator: {
    alignItems: 'center',
    marginTop: 2,
  },
  rangeText: {
    fontSize: 13,
    color: '#555',
    fontWeight: '500',
  },
});

export default RangeSlider;
