/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import type { User } from '../types';
import { useAppStore } from '../store/useAppStore';

const { width: W, height: H } = Dimensions.get('window');

// 浮動愛心配置
const HEARTS = ['❤️', '💕', '💖', '💗', '💓', '💞', '🌸', '✨'];

interface FloatingHeart {
  id: number;
  emoji: string;
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  scale: Animated.Value;
}

type Step = 'confirm' | 'waiting' | 'celebrate';

interface CoupleConfirmModalProps {
  visible: boolean;
  partner: User;
  onClose: () => void;
  onConfirmed: () => void;
}

const CoupleConfirmModal: React.FC<CoupleConfirmModalProps> = ({
  visible,
  partner,
  onClose,
  onConfirmed,
}) => {
  const { setCouple } = useAppStore();
  const [step, setStep] = useState<Step>('confirm');

  // 慶祝動畫值
  const heartScale = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);

  // 每次開啟重置（包含動畫值）
  useEffect(() => {
    if (visible) {
      setStep('confirm');
      heartScale.setValue(0);
      contentOpacity.setValue(0);
      setFloatingHearts([]);
    }
  }, [visible, heartScale, contentOpacity]);

  // 慶祝動畫
  useEffect(() => {
    if (step !== 'celebrate') return;

    // 主愛心跳動
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1.3, useNativeDriver: true, speed: 8 }),
      Animated.spring(heartScale, { toValue: 1.0, useNativeDriver: true, speed: 12 }),
    ]).start();

    // 文字淡入
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 600,
      delay: 300,
      useNativeDriver: true,
    }).start();

    // 浮動愛心
    const hearts: FloatingHeart[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      emoji: HEARTS[i % HEARTS.length],
      x: new Animated.Value(Math.random() * W),
      y: new Animated.Value(H * 0.8),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5 + Math.random() * 0.8),
    }));
    setFloatingHearts(hearts);

    hearts.forEach((h, i) => {
      Animated.sequence([
        Animated.delay(i * 120),
        Animated.parallel([
          Animated.timing(h.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(h.y, {
            toValue: -50 - Math.random() * 200,
            duration: 1800 + Math.random() * 800,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(h.opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    });
  }, [step, heartScale, contentOpacity]);

  const handleConfirm = useCallback(() => {
    setStep('waiting');
    // 模擬對方接受（2 秒後）
    setTimeout(() => setStep('celebrate'), 2000);
  }, []);

  const handleEnterCoupleMode = useCallback(() => {
    setCouple(partner);
    onConfirmed();
  }, [partner, setCouple, onConfirmed]);

  // ─── Step: Confirm ─────────────────────────────────────────────────────────

  const renderConfirm = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>確認交往關係</Text>
      <Text style={styles.cardDesc}>
        確定要向 <Text style={styles.highlight}>{partner.name}</Text> 送出交往邀請嗎？
      </Text>

      <Image source={{ uri: partner.avatar }} style={styles.partnerAvatar} />
      <Text style={styles.partnerName}>{partner.name}</Text>
      <Text style={styles.partnerInfo}>
        {partner.age} 歲・{partner.region}・{partner.occupation}
      </Text>

      <View style={styles.btnRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.85}>
          <Text style={styles.cancelBtnText}>取消</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
          <Text style={styles.confirmBtnText}>確認交往 💑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── Step: Waiting ─────────────────────────────────────────────────────────

  const renderWaiting = () => (
    <View style={styles.card}>
      <ActivityIndicator size="large" color="#FF6B6B" style={{ marginBottom: 20 }} />
      <Text style={styles.cardTitle}>傳送邀請中⋯</Text>
      <Text style={styles.cardDesc}>
        正在等待 <Text style={styles.highlight}>{partner.name}</Text> 確認
      </Text>
      <View style={styles.waitingDots}>
        {[0, 1, 2].map((i) => (
          <WaitDot key={i} delay={i * 250} />
        ))}
      </View>
    </View>
  );

  // ─── Step: Celebrate ───────────────────────────────────────────────────────

  const renderCelebrate = () => (
    <>
      {/* 浮動愛心背景 */}
      {floatingHearts.map((h) => (
        <Animated.Text
          key={h.id}
          style={[
            styles.floatingHeart,
            {
              left: h.x,
              transform: [{ translateY: h.y }, { scale: h.scale }],
              opacity: h.opacity,
            },
          ]}
        >
          {h.emoji}
        </Animated.Text>
      ))}

      <View style={styles.card}>
        {/* 大愛心 */}
        <Animated.Text style={[styles.bigHeart, { transform: [{ scale: heartScale }] }]}>
          ❤️
        </Animated.Text>

        <Animated.View style={{ opacity: contentOpacity, alignItems: 'center', gap: 8 }}>
          <Text style={styles.celebTitle}>🎉 恭喜！你們已成為伴侶</Text>
          <Text style={styles.celebDesc}>
            <Text style={styles.highlight}>{partner.name}</Text> 接受了你的交往邀請
          </Text>

          <Image source={{ uri: partner.avatar }} style={styles.partnerAvatarSm} />

          <Text style={styles.coupleDate}>
            {new Date().toLocaleDateString('zh-TW', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })} 開始
          </Text>

          <TouchableOpacity
            style={styles.enterCoupleBtn}
            onPress={handleEnterCoupleMode}
            activeOpacity={0.88}
          >
            <Text style={styles.enterCoupleBtnText}>進入伴侶模式 💑</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {step === 'confirm'   && renderConfirm()}
        {step === 'waiting'   && renderWaiting()}
        {step === 'celebrate' && renderCelebrate()}
      </View>
    </Modal>
  );
};

// 跳動等待點
const WaitDot: React.FC<{ delay: number }> = ({ delay }) => {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -8, duration: 300, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0,  duration: 300, useNativeDriver: true }),
        Animated.delay(600),
      ]),
    ).start();
  }, [anim, delay]);
  return (
    <Animated.View
      style={[styles.dot, { transform: [{ translateY: anim }] }]}
    />
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: W * 0.85,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  highlight: { color: '#FF6B6B', fontWeight: '700' },
  partnerAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginVertical: 8,
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  partnerAvatarSm: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginVertical: 6,
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  partnerName: { fontSize: 18, fontWeight: '700', color: '#1A1A1A' },
  partnerInfo: { fontSize: 13, color: '#888' },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, color: '#888', fontWeight: '600' },
  confirmBtn: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: '#FF6B6B',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: { fontSize: 15, color: '#fff', fontWeight: '800' },

  // Waiting dots
  waitingDots: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B6B',
  },

  // Celebration
  floatingHeart: {
    position: 'absolute',
    fontSize: 28,
  },
  bigHeart: {
    fontSize: 72,
    marginBottom: 4,
  },
  celebTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  celebDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  coupleDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 2,
  },
  enterCoupleBtn: {
    marginTop: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FF6B6B',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  enterCoupleBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
});

export default CoupleConfirmModal;
