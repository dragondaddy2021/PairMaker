/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, { useState, useCallback, useEffect, useRef, Component } from 'react';
import * as Updates from 'expo-updates';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  BackHandler,
  Platform,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppStore } from './src/store/useAppStore';
import type { FilterCriteriaExtended } from './src/types';

// ── Dating Screens
import HomeScreen from './src/screens/dating/HomeScreen';
import FilterScreen from './src/screens/dating/FilterScreen';
import ResultsScreen from './src/screens/dating/ResultsScreen';
import ProfileScreen from './src/screens/dating/ProfileScreen';
import MapScreen from './src/screens/dating/MapScreen';

// ── Couple Screens
import CoupleHomeScreen from './src/screens/couple/CoupleHomeScreen';
import CoupleMapScreen from './src/screens/couple/CoupleMapScreen';
import DatePlanScreen from './src/screens/couple/DatePlanScreen';
import DiaryScreen from './src/screens/couple/DiaryScreen';
import AnniversaryScreen from './src/screens/couple/AnniversaryScreen';

// ── Shared Screens
import MyProfileScreen from './src/screens/MyProfileScreen';
import TaskScreen from './src/screens/TaskScreen';

// ─── Navigation Types ─────────────────────────────────────────────────────────

type DatingTab = 'filter' | 'explore' | 'map' | 'mine';
type CoupleTab = 'home' | 'plan' | 'map' | 'diary' | 'mine';

// Sub-navigation for the Filter tab flow
type FilterSubPage = 'filter' | 'results' | 'profile';
// Sub-navigation for the Mine tab
type MineSubPage = 'main' | 'tasks';

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

interface TabItem {
  key: string;
  icon: string;
  label: string;
}

const DATING_TABS: TabItem[] = [
  { key: 'filter',  icon: '🔍', label: '篩選' },
  { key: 'explore', icon: '💘', label: '探索' },
  { key: 'map',     icon: '🗺️', label: '地圖' },
  { key: 'mine',    icon: '👤', label: '我的' },
];

const COUPLE_TABS: TabItem[] = [
  { key: 'home',  icon: '💑', label: '我們' },
  { key: 'plan',  icon: '📅', label: '計畫' },
  { key: 'map',   icon: '🗺️', label: '地圖' },
  { key: 'diary', icon: '📔', label: '日記' },
  { key: 'mine',  icon: '👤', label: '我的' },
];

interface TabBarProps {
  tabs: TabItem[];
  activeKey: string;
  onPress: (key: string) => void;
  accentColor: string;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, activeKey, onPress, accentColor }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, isActive && { borderTopColor: accentColor, borderTopWidth: 2 }]}
            onPress={() => onPress(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && { color: accentColor, fontWeight: '700' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Dating Mode Navigator ────────────────────────────────────────────────────

const DatingNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DatingTab>('filter');
  const [filterPage, setFilterPage] = useState<FilterSubPage>('filter');
  const [lastCriteria, setLastCriteria] = useState<FilterCriteriaExtended>({});
  const [profileUserId, setProfileUserId] = useState<string>('');
  const [mineSubPage, setMineSubPage] = useState<MineSubPage>('main');

  // Android 實體返回鍵
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (mineSubPage === 'tasks') { setMineSubPage('main'); return true; }
      if (filterPage === 'profile') { setFilterPage('results'); return true; }
      if (filterPage === 'results') { setFilterPage('filter'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [filterPage, mineSubPage]);

  const handleStartMatching = useCallback((criteria: FilterCriteriaExtended) => {
    setLastCriteria(criteria);
    setFilterPage('results');
  }, []);

  const handleOpenProfile = useCallback((userId: string) => {
    setProfileUserId(userId);
    setFilterPage('profile');
  }, []);

  const handleCoupleConfirmed = useCallback(() => {
    // 交往確認後切到探索頁（或讓 Zustand appMode 自然切換）
    setFilterPage('filter');
  }, []);

  const renderFilterStack = () => {
    switch (filterPage) {
      case 'results':
        return (
          <ResultsScreen
            criteria={lastCriteria}
            onBack={() => setFilterPage('filter')}
            onOpenProfile={handleOpenProfile}
          />
        );
      case 'profile':
        return (
          <ProfileScreen
            userId={profileUserId}
            onBack={() => setFilterPage('results')}
            onNavigateToMap={() => setActiveTab('map')}
            onCoupleConfirmed={handleCoupleConfirmed}
          />
        );
      default:
        return <FilterScreen onStartMatching={handleStartMatching} />;
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'filter':  return renderFilterStack();
      case 'explore': return <HomeScreen />;
      case 'map':     return <MapScreen />;
      case 'mine':
        return mineSubPage === 'tasks'
          ? <TaskScreen onBack={() => setMineSubPage('main')} />
          : <MyProfileScreen onOpenTasks={() => setMineSubPage('tasks')} />;
      default:        return <HomeScreen />;
    }
  };

  // Switching tab resets sub-navigation
  const handleTabPress = (key: string) => {
    if (key === 'filter') setFilterPage('filter');
    if (key === 'mine') setMineSubPage('main');
    setActiveTab(key as DatingTab);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.flex}>{renderContent()}</View>
      <TabBar
        tabs={DATING_TABS}
        activeKey={activeTab}
        onPress={handleTabPress}
        accentColor="#FF6B6B"
      />
    </View>
  );
};

// ─── Couple Mode Navigator ────────────────────────────────────────────────────

type HomeSubPage = 'home' | 'anniversary';

const CoupleNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CoupleTab>('home');
  const [mineSubPage, setMineSubPage] = useState<MineSubPage>('main');
  const [homeSubPage, setHomeSubPage] = useState<HomeSubPage>('home');

  // Android 實體返回鍵
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (mineSubPage === 'tasks') { setMineSubPage('main'); return true; }
      if (homeSubPage === 'anniversary') { setHomeSubPage('home'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [mineSubPage, homeSubPage]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return homeSubPage === 'anniversary'
          ? <AnniversaryScreen onBack={() => setHomeSubPage('home')} />
          : <CoupleHomeScreen onOpenAnniversary={() => setHomeSubPage('anniversary')} />;
      case 'plan':  return <DatePlanScreen />;
      case 'map':   return <CoupleMapScreen onNavigateToPlan={() => setActiveTab('plan')} />;
      case 'diary': return <DiaryScreen />;
      case 'mine':
        return mineSubPage === 'tasks'
          ? <TaskScreen onBack={() => setMineSubPage('main')} />
          : <MyProfileScreen onOpenTasks={() => setMineSubPage('tasks')} />;
      default:      return <CoupleHomeScreen onOpenAnniversary={() => setHomeSubPage('anniversary')} />;
    }
  };

  const handleTabPress = (key: string) => {
    if (key === 'mine') setMineSubPage('main');
    if (key === 'home') setHomeSubPage('home');
    setActiveTab(key as CoupleTab);
  };

  return (
    <View style={styles.flex}>
      <View style={styles.flex}>{renderContent()}</View>
      <TabBar
        tabs={COUPLE_TABS}
        activeKey={activeTab}
        onPress={handleTabPress}
        accentColor="#FF8E53"
      />
    </View>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────

function RootApp() {
  const { appMode, loadPersistedData } = useAppStore();

  // 啟動時從 AsyncStorage 載入點數資料
  useEffect(() => {
    loadPersistedData();
  }, []);

  // 啟動時檢查並套用熱更新（生產環境）
  useEffect(() => {
    if (__DEV__) return;
    (async () => {
      try {
        const check = await Updates.checkForUpdateAsync();
        if (check.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // 更新失敗不影響 App 正常運作
      }
    })();
  }, []);

  return (
    <View style={styles.flex}>
      <StatusBar style="dark" />
      {appMode === 'couple' ? <CoupleNavigator /> : <DatingNavigator />}
    </View>
  );
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.root}>
          <ScrollView contentContainerStyle={errorStyles.scroll}>
            <Text style={errorStyles.icon}>⚠️</Text>
            <Text style={errorStyles.title}>發生了一點問題</Text>
            <Text style={errorStyles.desc}>App 遇到錯誤，請點下方按鈕重新載入。</Text>
            {__DEV__ && this.state.error && (
              <View style={errorStyles.debugBox}>
                <Text style={errorStyles.debugTitle}>錯誤訊息（Dev Only）</Text>
                <Text style={errorStyles.debugText}>{this.state.error.toString()}</Text>
              </View>
            )}
            <TouchableOpacity style={errorStyles.retryBtn} onPress={this.handleRetry}>
              <Text style={errorStyles.retryBtnText}>🔄 重新載入</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F8FA' },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  icon: { fontSize: 56 },
  title: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', textAlign: 'center' },
  desc: { fontSize: 14, color: '#888', textAlign: 'center', lineHeight: 22 },
  debugBox: {
    width: '100%',
    backgroundColor: '#FFF3F3',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B6B',
    gap: 4,
  },
  debugTitle: { fontSize: 11, fontWeight: '700', color: '#FF6B6B' },
  debugText: { fontSize: 11, color: '#555', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FF6B6B',
  },
  retryBtnText: { fontSize: 16, color: '#fff', fontWeight: '700' },
});

// ─── App Entry ────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <RootApp />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F8F8FA' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    gap: 2,
    borderTopWidth: 2,
    borderTopColor: 'transparent',
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.45,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 10,
    color: '#B0B0B0',
    fontWeight: '500',
  },
});
