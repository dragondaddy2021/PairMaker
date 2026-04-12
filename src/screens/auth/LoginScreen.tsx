/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Linking,
} from 'react-native';
import { signIn, signUp } from '../../services/aws/cognito';
import { grantFirstLoginBonus } from '../../services/marketing/campaigns';

type Mode = 'login' | 'register';

interface Props {
  onSuccess: (userId: string) => void;
}

export default function LoginScreen({ onSuccess }: Props) {
  const [mode,     setMode]     = useState<Mode>('login');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('提示', '請填寫 Email 與密碼');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'login') {
        const session = await signIn(email.trim(), password);
        const userId  = session.getIdToken().payload.sub as string;
        await grantFirstLoginBonus(userId).catch(() => {});
        onSuccess(userId);
      } else {
        if (!nickname.trim()) { Alert.alert('提示', '請填寫暱稱'); return; }
        await signUp(email.trim(), password, nickname.trim());
        Alert.alert('驗證信已寄出', '請查收 Email 並輸入驗證碼');
        setMode('login');
      }
    } catch (err: any) {
      Alert.alert('錯誤', err?.message ?? '操作失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        {/* Logo */}
        <Text style={styles.logo}>PairMaker</Text>
        <Text style={styles.tagline}>找到屬於你的另一半</Text>

        {/* Mode Toggle */}
        <View style={styles.toggleRow}>
          {(['login', 'register'] as Mode[]).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.toggleBtn, mode === m && styles.toggleActive]}
              onPress={() => setMode(m)}
            >
              <Text style={[styles.toggleLabel, mode === m && styles.toggleLabelActive]}>
                {m === 'login' ? '登入' : '註冊'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fields */}
        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="暱稱"
            placeholderTextColor="#aaa"
            value={nickname}
            onChangeText={setNickname}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="密碼"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitLabel}>{mode === 'login' ? '登入' : '建立帳號'}</Text>
          }
        </TouchableOpacity>

        {/* Guest Mode */}
        <TouchableOpacity onPress={() => onSuccess('guest')} style={styles.guestBtn}>
          <Text style={styles.guestLabel}>以訪客身份瀏覽</Text>
        </TouchableOpacity>

        {/* Contact */}
        <View style={styles.contactRow}>
          <Text style={styles.contactText}>回報問題或商務合作請洽 </Text>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL('mailto:dragondaddy2021@gmail.com').catch(() => {})
            }
          >
            <Text style={styles.contactEmail}>dragondaddy2021@gmail.com</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF6B6B',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f3f3',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 32,
  },
  toggleActive: {
    backgroundColor: '#FF6B6B',
    borderRadius: 10,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  toggleLabelActive: {
    color: '#fff',
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  submitBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  submitLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  guestBtn: {
    marginTop: 16,
  },
  guestLabel: {
    color: '#aaa',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  contactText: {
    fontSize: 11,
    color: '#bbb',
  },
  contactEmail: {
    fontSize: 11,
    color: '#FF6B6B',
    textDecorationLine: 'underline',
  },
});
