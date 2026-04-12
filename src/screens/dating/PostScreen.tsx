/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const PostScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>PostScreen（開發中）</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, color: '#FF6B6B' },
});

export default PostScreen;
