/**
 * PairMaker
 * Copyright (c) 2025 Dragon & PairMaker Studio. All Rights Reserved.
 * 未經授權，禁止複製、修改或散布本程式碼。
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';

import { analyzeAppearancePhoto } from '../../services/claudeApi';
import SectionCard from '../../components/SectionCard';
import TagSelector from '../../components/TagSelector';
import FilterRow from '../../components/FilterRow';
import RangeSlider from '../../components/RangeSlider';

import { useAppStore } from '../../store/useAppStore';
import type {
  Gender,
  BodyType,
  EducationLevel,
  RegionGroup,
  OccupationCategory,
  FilterCriteriaExtended,
  SubCriteria,
  CupSize,
  Ethnicity,
  AppearanceFeatures,
} from '../../types';

// ─── 靜態設定 ─────────────────────────────────────────────────────────────────

const REGION_GROUPS: RegionGroup[] = ['北部', '中部', '南部', '東部'];

const OCCUPATION_CATEGORIES: OccupationCategory[] = [
  '科技業', '金融業', '醫療業', '公務員', '自營商', '創意文化',
  '教育業', '法律業', '建築業', '餐飲業', '服務業', '製造業',
  '傳播媒體', '軍警消', '農漁業', '其他',
];

const EDUCATION_OPTIONS: Array<{ label: string; value: EducationLevel | null }> = [
  { label: '不限', value: null },
  { label: '大學', value: '大學' },
  { label: '碩士', value: '碩士' },
  { label: '博士', value: '博士' },
];

const BODY_TYPES: BodyType[] = ['纖細', '適中', '運動型', '壯碩'];

// Issue #13 — PR 改為「前幾%」顯示
const PR_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: '不限',  value: null },
  { label: '前80%', value: 20  },
  { label: '前60%', value: 40  },
  { label: '前40%', value: 60  },
  { label: '前20%', value: 80  },
  { label: '前5%',  value: 95  },
];

// Issue #9 — 罩杯選項（女性）
const CUP_OPTIONS: Array<{ label: string; value: CupSize | null }> = [
  { label: '不限', value: null },
  { label: 'A+',  value: 'A' },
  { label: 'B+',  value: 'B' },
  { label: 'C+',  value: 'C' },
  { label: 'D+',  value: 'D' },
  { label: 'E+',  value: 'E' },
];

// Item #7 — 種族選項
const ETHNICITY_OPTIONS: Array<{ label: string; value: Ethnicity }> = [
  { label: '台灣',   value: 'taiwanese' },
  { label: '日韓',   value: 'japanese_korean' },
  { label: '東南亞', value: 'southeast_asian' },
  { label: '歐美',   value: 'western' },
  { label: '南亞',   value: 'south_asian' },
  { label: '其他',   value: 'other' },
];

// Item #8 — 雙性別模式：每個 gender 各自的條件預設值
interface GenderConditions {
  ageMin: number; ageMax: number;
  heightMin: number; heightMax: number;
  incomeMin: number;
  minEducation: EducationLevel | null;
  occupationCats: OccupationCategory[];
  regionGroups: RegionGroup[];
  excludeMarried: boolean;
  excludeHighBMI: boolean;
  needCar: boolean; needHouse: boolean; noSmoker: boolean;
  parentsFriendly: boolean;
  bodyTypes: BodyType[];
  prMin: number | null;
  ethnicities: Ethnicity[];
  penisFilterOn: boolean; penisLengthMin: number;
  cupSizeMin: CupSize | null;
}

const DEFAULT_MALE_COND: GenderConditions = {
  ageMin: 25, ageMax: 38, heightMin: 168, heightMax: 195,
  incomeMin: 5, minEducation: null, occupationCats: [], regionGroups: [],
  excludeMarried: false, excludeHighBMI: false,
  needCar: false, needHouse: false, noSmoker: false, parentsFriendly: false,
  bodyTypes: [], prMin: null, ethnicities: [],
  penisFilterOn: false, penisLengthMin: 12, cupSizeMin: null,
};
const DEFAULT_FEMALE_COND: GenderConditions = {
  ageMin: 20, ageMax: 33, heightMin: 155, heightMax: 175,
  incomeMin: 3, minEducation: null, occupationCats: [], regionGroups: [],
  excludeMarried: false, excludeHighBMI: false,
  needCar: false, needHouse: false, noSmoker: false, parentsFriendly: false,
  bodyTypes: [], prMin: null, ethnicities: [],
  penisFilterOn: false, penisLengthMin: 12, cupSizeMin: null,
};

// ─── 元件 ─────────────────────────────────────────────────────────────────────

interface Props {
  onStartMatching: (criteria: FilterCriteriaExtended) => void;
}

const FilterScreen: React.FC<Props> = ({ onStartMatching }) => {
  const { lastFilter, applyFilter } = useAppStore();

  // 基本條件
  const [genders, setGenders] = useState<Gender[]>(lastFilter.genders ?? ['female']);
  const [ageMin, setAgeMin] = useState(lastFilter.ageMin ?? 22);
  const [ageMax, setAgeMax] = useState(lastFilter.ageMax ?? 35);
  const [heightMin, setHeightMin] = useState(lastFilter.heightMin ?? 155);
  const [heightMax, setHeightMax] = useState(lastFilter.heightMax ?? 180);
  const [regionGroups, setRegionGroups] = useState<RegionGroup[]>(lastFilter.regionGroups ?? []);

  // 經濟條件
  const [incomeMin, setIncomeMin] = useState(lastFilter.incomeMin ?? 5);
  const [minEducation, setMinEducation] = useState<EducationLevel | null>(
    lastFilter.educationLevels?.[0] ?? null,
  );
  const [occupationCats, setOccupationCats] = useState<OccupationCategory[]>(
    lastFilter.occupationCategories ?? [],
  );

  // 生活條件
  const [excludeMarried, setExcludeMarried] = useState(lastFilter.isMarried === false);
  const [excludeHighBMI, setExcludeHighBMI] = useState(lastFilter.excludeHighBMI ?? false);
  const [needCar, setNeedCar] = useState(lastFilter.hasCar === true);
  const [needHouse, setNeedHouse] = useState(lastFilter.hasHouse === true);
  const [noSmoker, setNoSmoker] = useState(lastFilter.isSmoker === false);
  const [parentsFriendly, setParentsFriendly] = useState(lastFilter.parentsFriendly ?? false);

  // 外貌條件
  const [bodyTypes, setBodyTypes] = useState<BodyType[]>(lastFilter.bodyTypes ?? []);
  const [prMin, setPrMin] = useState<number | null>(lastFilter.appearancePRMin ?? null);

  // 性別特定條件（Issue #9）
  const [penisLengthMin, setPenisLengthMin] = useState(lastFilter.penisLengthMin ?? 12);
  const [penisFilterOn, setPenisFilterOn] = useState(lastFilter.penisLengthMin !== undefined);
  const [cupSizeMin, setCupSizeMin] = useState<CupSize | null>(lastFilter.cupSizeMin ?? null);

  // Item #7 — 種族偏好
  const [ethnicities, setEthnicities] = useState<Ethnicity[]>(lastFilter.ethnicities ?? []);

  // AI 外貌比對
  const [photoUri,          setPhotoUri]          = useState<string | null>(lastFilter.appearancePhotoUri ?? null);
  const [analyzedFeatures,  setAnalyzedFeatures]  = useState<AppearanceFeatures | null>(lastFilter.analyzedAppearance ?? null);
  const [analyzing,         setAnalyzing]         = useState(false);

  // Item #8 — 雙性別分條件
  const [genderTab, setGenderTab] = useState<'male' | 'female'>('male');
  const [maleCond, setMaleCond] = useState<GenderConditions>(DEFAULT_MALE_COND);
  const [femaleCond, setFemaleCond] = useState<GenderConditions>(DEFAULT_FEMALE_COND);

  const seekingMale   = genders.includes('male');
  const seekingFemale = genders.includes('female');
  const splitMode     = seekingMale && seekingFemale;

  // 分條件模式時，取當前 tab 的條件
  const activeCond = splitMode ? (genderTab === 'male' ? maleCond : femaleCond) : null;
  const setActiveCond = useCallback((updater: (prev: GenderConditions) => GenderConditions) => {
    if (genderTab === 'male') setMaleCond(updater);
    else setFemaleCond(updater);
  }, [genderTab]);

  // 分條件模式下的欄位讀寫幫手
  const sc = <K extends keyof GenderConditions>(key: K): GenderConditions[K] =>
    splitMode && activeCond ? activeCond[key] : ({
      ageMin, ageMax, heightMin, heightMax, incomeMin,
      minEducation, occupationCats, regionGroups,
      excludeMarried, excludeHighBMI, needCar, needHouse, noSmoker, parentsFriendly,
      bodyTypes, prMin, ethnicities,
      penisFilterOn, penisLengthMin, cupSizeMin,
    } as GenderConditions)[key];

  const setSc = useCallback(<K extends keyof GenderConditions>(key: K, val: GenderConditions[K]) => {
    if (splitMode) {
      setActiveCond((prev) => ({ ...prev, [key]: val }));
    } else {
      // 更新對應的單條件 state
      switch (key) {
        case 'ageMin': setAgeMin(val as number); break;
        case 'ageMax': setAgeMax(val as number); break;
        case 'heightMin': setHeightMin(val as number); break;
        case 'heightMax': setHeightMax(val as number); break;
        case 'incomeMin': setIncomeMin(val as number); break;
        case 'minEducation': setMinEducation(val as EducationLevel | null); break;
        case 'occupationCats': setOccupationCats(val as OccupationCategory[]); break;
        case 'regionGroups': setRegionGroups(val as RegionGroup[]); break;
        case 'excludeMarried': setExcludeMarried(val as boolean); break;
        case 'excludeHighBMI': setExcludeHighBMI(val as boolean); break;
        case 'needCar': setNeedCar(val as boolean); break;
        case 'needHouse': setNeedHouse(val as boolean); break;
        case 'noSmoker': setNoSmoker(val as boolean); break;
        case 'parentsFriendly': setParentsFriendly(val as boolean); break;
        case 'bodyTypes': setBodyTypes(val as BodyType[]); break;
        case 'prMin': setPrMin(val as number | null); break;
        case 'ethnicities': setEthnicities(val as Ethnicity[]); break;
        case 'penisFilterOn': setPenisFilterOn(val as boolean); break;
        case 'penisLengthMin': setPenisLengthMin(val as number); break;
        case 'cupSizeMin': setCupSizeMin(val as CupSize | null); break;
      }
    }
  }, [splitMode, setActiveCond]);

  // ─── handlers ──────────────────────────────────────────────────────────────

  const toggleGender = useCallback((g: Gender) => {
    setGenders((prev) =>
      prev.includes(g) ? (prev.length > 1 ? prev.filter((x) => x !== g) : prev) : [...prev, g],
    );
  }, []);

  const toggleRegion = useCallback((r: RegionGroup) => {
    setSc('regionGroups', sc('regionGroups').includes(r)
      ? sc('regionGroups').filter((x) => x !== r)
      : [...sc('regionGroups'), r]);
  }, [sc, setSc]);

  const toggleOccupation = useCallback((cat: OccupationCategory) => {
    setSc('occupationCats', sc('occupationCats').includes(cat)
      ? sc('occupationCats').filter((x) => x !== cat)
      : [...sc('occupationCats'), cat]);
  }, [sc, setSc]);

  const toggleBodyType = useCallback((bt: BodyType) => {
    setSc('bodyTypes', sc('bodyTypes').includes(bt)
      ? sc('bodyTypes').filter((x) => x !== bt)
      : [...sc('bodyTypes'), bt]);
  }, [sc, setSc]);

  const toggleEthnicity = useCallback((e: Ethnicity) => {
    setSc('ethnicities', sc('ethnicities').includes(e)
      ? sc('ethnicities').filter((x) => x !== e)
      : [...sc('ethnicities'), e]);
  }, [sc, setSc]);

  // AI 外貌照片上傳＋分析
  const pickPhoto = useCallback(async () => {
    console.log('[FilterScreen] pickPhoto 開始');

    // 確認 API Key（無 Key 仍可上傳，但會警告）
    const apiKey = process.env.EXPO_PUBLIC_CLAUDE_API_KEY ?? '';
    if (!apiKey) {
      Alert.alert(
        '⚠️ AI 分析未啟用',
        '尚未設定 Claude API Key，照片可上傳但不會進行 AI 外貌分析。\n\n請在 .env 加入：\nEXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-xxx',
        [{ text: '知道了，繼續上傳' }, { text: '取消', style: 'cancel', onPress: () => undefined }],
      );
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    console.log('[FilterScreen] 相簿權限狀態:', status);
    if (status !== 'granted') {
      Alert.alert('需要相簿權限', '請在設定中允許存取相簿');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1] as [number, number],
      quality: 0.8,
    });

    console.log('[FilterScreen] ImagePicker 結果:', result.canceled ? '已取消' : '已選擇');

    if (result.canceled || !result.assets[0]) {
      console.log('[FilterScreen] 用戶取消選擇');
      return;
    }

    const uri = result.assets[0].uri;
    console.log('[FilterScreen] 選擇的 URI scheme:', uri.split('://')[0] + '://');
    console.log('[FilterScreen] URI 前80字:', uri.slice(0, 80));

    setPhotoUri(uri);
    setAnalyzedFeatures(null); // 清除舊的分析結果

    // 無 API Key 時跳過分析
    if (!apiKey) {
      console.log('[FilterScreen] 無 API Key，跳過 AI 分析');
      return;
    }

    // 呼叫 AI 分析
    console.log('[FilterScreen] 開始 AI 外貌分析…');
    setAnalyzing(true);
    try {
      const features = await analyzeAppearancePhoto(uri);
      if (features) {
        console.log('[FilterScreen] AI 分析完成:', features);
        setAnalyzedFeatures(features);
      } else {
        console.warn('[FilterScreen] AI 分析回傳 null（可能 API 未啟用或分析失敗）');
      }
    } catch (err) {
      console.error('[FilterScreen] AI 分析例外:', err);
      Alert.alert('AI 分析失敗', '照片已上傳，但 AI 特徵分析失敗，將以 PR 排名替代。');
    } finally {
      setAnalyzing(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setGenders(['female']);
    setAgeMin(22); setAgeMax(35);
    setHeightMin(155); setHeightMax(180);
    setRegionGroups([]);
    setIncomeMin(5);
    setMinEducation(null);
    setOccupationCats([]);
    setExcludeMarried(false);
    setExcludeHighBMI(false);
    setNeedCar(false); setNeedHouse(false); setNoSmoker(false);
    setParentsFriendly(false);
    setBodyTypes([]);
    setPrMin(null);
    setPenisFilterOn(false); setPenisLengthMin(12);
    setCupSizeMin(null);
    setEthnicities([]);
    setMaleCond(DEFAULT_MALE_COND);
    setFemaleCond(DEFAULT_FEMALE_COND);
    setGenderTab('male');
    setPhotoUri(null);
    setAnalyzedFeatures(null);
  }, []);

  const buildSubCriteria = useCallback((cond: GenderConditions, forMale: boolean): SubCriteria => ({
    ageMin: cond.ageMin,
    ageMax: cond.ageMax,
    heightMin: cond.heightMin,
    heightMax: cond.heightMax,
    regionGroups: cond.regionGroups.length ? cond.regionGroups : undefined,
    incomeMin: cond.incomeMin,
    educationLevels: cond.minEducation ? [cond.minEducation] : undefined,
    occupationCategories: cond.occupationCats.length ? cond.occupationCats : undefined,
    isMarried: cond.excludeMarried ? false : undefined,
    hasCar: cond.needCar ? true : undefined,
    hasHouse: cond.needHouse ? true : undefined,
    isSmoker: cond.noSmoker ? false : undefined,
    excludeHighBMI: cond.excludeHighBMI || undefined,
    parentsFriendly: cond.parentsFriendly || undefined,
    bodyTypes: cond.bodyTypes.length ? cond.bodyTypes : undefined,
    appearancePRMin: cond.prMin !== null ? (cond.prMin as any) : undefined,
    ethnicities: cond.ethnicities.length ? cond.ethnicities : undefined,
    penisLengthMin: forMale && cond.penisFilterOn ? cond.penisLengthMin : undefined,
    cupSizeMin: !forMale && cond.cupSizeMin ? cond.cupSizeMin : undefined,
  }), []);

  const handleStartMatching = useCallback(() => {
    let criteria: FilterCriteriaExtended;

    if (splitMode) {
      // 雙性別分條件模式
      criteria = {
        genders: ['male', 'female'],
        appearancePhotoUri:  photoUri ?? undefined,
        analyzedAppearance:  analyzedFeatures ?? undefined,
        genderSplit: {
          male:   buildSubCriteria(maleCond, true),
          female: buildSubCriteria(femaleCond, false),
        },
      };
    } else {
      criteria = {
        genders: genders.length ? genders : undefined,
        ageMin,
        ageMax,
        heightMin,
        heightMax,
        regionGroups: regionGroups.length ? regionGroups : undefined,
        incomeMin,
        educationLevels: minEducation ? [minEducation] : undefined,
        occupationCategories: occupationCats.length ? occupationCats : undefined,
        isMarried: excludeMarried ? false : undefined,
        hasCar: needCar ? true : undefined,
        hasHouse: needHouse ? true : undefined,
        isSmoker: noSmoker ? false : undefined,
        excludeHighBMI: excludeHighBMI || undefined,
        parentsFriendly: parentsFriendly || undefined,
        bodyTypes: bodyTypes.length ? bodyTypes : undefined,
        appearancePRMin: prMin !== null ? (prMin as any) : undefined,
        ethnicities: ethnicities.length ? ethnicities : undefined,
        penisLengthMin: penisFilterOn && seekingMale ? penisLengthMin : undefined,
        cupSizeMin: cupSizeMin && seekingFemale ? cupSizeMin : undefined,
        appearancePhotoUri:  photoUri ?? undefined,
        analyzedAppearance:  analyzedFeatures ?? undefined,
      };
    }

    applyFilter(criteria);
    onStartMatching(criteria);
  }, [
    splitMode, genders, ageMin, ageMax, heightMin, heightMax, regionGroups,
    incomeMin, minEducation, occupationCats,
    excludeMarried, excludeHighBMI, needCar, needHouse, noSmoker, parentsFriendly,
    bodyTypes, prMin, ethnicities, penisFilterOn, penisLengthMin, cupSizeMin,
    photoUri, analyzedFeatures, seekingMale, seekingFemale, maleCond, femaleCond, buildSubCriteria,
    applyFilter, onStartMatching,
  ]);

  // ─── render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>篩選條件</Text>
        <TouchableOpacity onPress={handleReset} delayPressIn={0}>
          <Text style={styles.resetBtn}>重置</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 基本條件 ─────────────────────────────────────── */}
        <SectionCard title="基本條件" emoji="🔍">
          {/* 性別 */}
          <Text style={styles.fieldLabel}>尋找性別</Text>
          <View style={styles.genderRow}>
            {(['female', 'male'] as Gender[]).map((g) => {
              const active = genders.includes(g);
              return (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderBtn, active && styles.genderBtnActive]}
                  onPress={() => toggleGender(g)}
                  activeOpacity={0.7}
                  delayPressIn={0}
                >
                  <Text style={styles.genderIcon}>{g === 'female' ? '♀' : '♂'}</Text>
                  <Text style={[styles.genderLabel, active && styles.genderLabelActive]}>
                    {g === 'female' ? '女性' : '男性'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Item #8：雙性別模式切換 Tab ── */}
          {splitMode && (
            <View style={styles.genderTabBar}>
              {(['male', 'female'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.genderTabBtn, genderTab === g && styles.genderTabBtnActive]}
                  onPress={() => setGenderTab(g)}
                  activeOpacity={0.7}
                  delayPressIn={0}
                >
                  <Text style={[styles.genderTabLabel, genderTab === g && styles.genderTabLabelActive]}>
                    {g === 'male' ? '♂ 男性條件' : '♀ 女性條件'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* 年齡範圍 */}
          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>年齡範圍</Text>
          <RangeSlider
            min={18} max={50}
            lowValue={sc('ageMin') as number} highValue={sc('ageMax') as number}
            onLowChange={(v) => setSc('ageMin', v)} onHighChange={(v) => setSc('ageMax', v)}
            formatLabel={(v) => `${v} 歲`}
          />

          {/* 身高範圍 */}
          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>身高範圍</Text>
          <RangeSlider
            min={150} max={195}
            lowValue={sc('heightMin') as number} highValue={sc('heightMax') as number}
            onLowChange={(v) => setSc('heightMin', v)} onHighChange={(v) => setSc('heightMax', v)}
            formatLabel={(v) => `${v} cm`}
          />

          {/* 地區 */}
          <Text style={[styles.fieldLabel, { marginTop: 10 }]}>居住地區</Text>
          <TagSelector<RegionGroup>
            options={REGION_GROUPS}
            selected={sc('regionGroups') as RegionGroup[]}
            onToggle={toggleRegion}
            nullLabel="全部"
          />
        </SectionCard>

        {/* ── 經濟條件 ─────────────────────────────────────── */}
        <SectionCard title="經濟條件" emoji="💼">
          <Text style={styles.fieldLabel}>月收入下限</Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.singleSlider}
              minimumValue={2}
              maximumValue={20}
              step={1}
              value={sc('incomeMin') as number}
              onValueChange={(v) => setSc('incomeMin', v)}
              minimumTrackTintColor="#FF6B6B"
              maximumTrackTintColor="#E0E0E0"
              thumbTintColor="#FF6B6B"
            />
            <Text style={styles.sliderValue}>{sc('incomeMin')} 萬以上</Text>
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>最低學歷</Text>
          <View style={styles.optionRow}>
            {EDUCATION_OPTIONS.map(({ label, value }) => {
              const active = value === sc('minEducation');
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.optionBtn, active && styles.optionBtnActive]}
                  onPress={() => setSc('minEducation', value)}
                  activeOpacity={0.7}
                  delayPressIn={0}
                >
                  <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>職業類別</Text>
          <TagSelector<OccupationCategory>
            options={OCCUPATION_CATEGORIES}
            selected={sc('occupationCats') as OccupationCategory[]}
            onToggle={toggleOccupation}
            nullLabel="全部"
          />
        </SectionCard>

        {/* ── 生活條件 ─────────────────────────────────────── */}
        <SectionCard title="生活條件" emoji="🏠">
          <FilterRow
            label="排除已婚"
            value={sc('excludeMarried') as boolean}
            onValueChange={(v) => setSc('excludeMarried', v)}
            description="只顯示未婚對象"
          />
          <FilterRow
            label="排除過重（BMI 30+）"
            value={sc('excludeHighBMI') as boolean}
            onValueChange={(v) => setSc('excludeHighBMI', v)}
            description="BMI 低於 30 的對象"
          />
          <FilterRow label="要有車" value={sc('needCar') as boolean} onValueChange={(v) => setSc('needCar', v)} />
          <FilterRow label="要有房" value={sc('needHouse') as boolean} onValueChange={(v) => setSc('needHouse', v)} />
          <FilterRow
            label="不抽菸"
            value={sc('noSmoker') as boolean}
            onValueChange={(v) => setSc('noSmoker', v)}
            description="只顯示非吸菸者"
          />
          <FilterRow
            label="父母好相處"
            value={sc('parentsFriendly') as boolean}
            onValueChange={(v) => setSc('parentsFriendly', v)}
            description="對方家長友善好溝通"
          />
        </SectionCard>

        {/* ── 外貌條件 ─────────────────────────────────────── */}
        <SectionCard title="外貌條件" emoji="✨">
          <Text style={styles.fieldLabel}>身材偏好</Text>
          <TagSelector<BodyType>
            options={BODY_TYPES}
            selected={sc('bodyTypes') as BodyType[]}
            onToggle={toggleBodyType}
            nullLabel="全部"
          />

          <Text style={[styles.fieldLabel, { marginTop: 14 }]}>外型吸引力（前幾%）</Text>
          <View style={styles.prRow}>
            {PR_OPTIONS.map(({ label, value }) => {
              const active = value === sc('prMin');
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.prBtn, active && styles.prBtnActive]}
                  onPress={() => setSc('prMin', value)}
                  activeOpacity={0.7}
                  delayPressIn={0}
                >
                  <Text style={[styles.prLabel, active && styles.prLabelActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        {/* ── Item #7：種族偏好 ────────────────────────────��── */}
        <SectionCard title="種族偏好" emoji="🌏">
          <Text style={styles.aiDesc}>不勾選代表不限；可多選</Text>
          <View style={styles.prRow}>
            {ETHNICITY_OPTIONS.map(({ label, value }) => {
              const active = (sc('ethnicities') as Ethnicity[]).includes(value);
              return (
                <TouchableOpacity
                  key={value}
                  style={[styles.prBtn, active && styles.prBtnActive]}
                  onPress={() => toggleEthnicity(value)}
                  activeOpacity={0.7}
                  delayPressIn={0}
                >
                  <Text style={[styles.prLabel, active && styles.prLabelActive]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SectionCard>

        {/* ── 性別特定條件（Issue #9）─────────────────────── */}
        {(seekingMale || seekingFemale) && (
          <SectionCard title="進階條件" emoji="🔬">
            {/* 在分條件模式下，依當前 tab 決定顯示哪個性別的進階條件 */}
            {(splitMode ? genderTab === 'male' : seekingMale) && (
              <>
                <FilterRow
                  label="設定男性尺寸下限"
                  value={sc('penisFilterOn') as boolean}
                  onValueChange={(v) => setSc('penisFilterOn', v)}
                  description="僅顯示超過下限的男性"
                />
                {(sc('penisFilterOn') as boolean) && (
                  <>
                    <Text style={[styles.fieldLabel, { marginTop: 10 }]}>
                      陰莖長度下限（勃起）
                    </Text>
                    <View style={styles.sliderRow}>
                      <Slider
                        style={styles.singleSlider}
                        minimumValue={5}
                        maximumValue={30}
                        step={1}
                        value={sc('penisLengthMin') as number}
                        onValueChange={(v) => setSc('penisLengthMin', v)}
                        minimumTrackTintColor="#FF6B6B"
                        maximumTrackTintColor="#E0E0E0"
                        thumbTintColor="#FF6B6B"
                      />
                      <Text style={styles.sliderValue}>{sc('penisLengthMin')} cm+</Text>
                    </View>
                  </>
                )}
              </>
            )}

            {(splitMode ? genderTab === 'female' : seekingFemale) && (
              <>
                <Text style={[styles.fieldLabel, (!splitMode && seekingMale) ? { marginTop: 14 } : {}]}>
                  罩杯下限（女性）
                </Text>
                <View style={styles.prRow}>
                  {CUP_OPTIONS.map(({ label, value }) => {
                    const active = value === sc('cupSizeMin');
                    return (
                      <TouchableOpacity
                        key={label}
                        style={[styles.prBtn, active && styles.prBtnActive]}
                        onPress={() => setSc('cupSizeMin', value)}
                        activeOpacity={0.7}
                        delayPressIn={0}
                      >
                        <Text style={[styles.prLabel, active && styles.prLabelActive]}>
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}
          </SectionCard>
        )}

        {/* ── AI 外貌比對 ───────────────────────────────── */}
        <SectionCard title="AI 外貌比對" emoji="🤖">
          <Text style={styles.aiDesc}>
            上傳你偏好的外貌照片，AI 將分析特徵並推薦外貌相似的對象
          </Text>

          <View style={styles.aiRow}>
            {photoUri ? (
              <View style={styles.photoThumbWrap}>
                <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => { setPhotoUri(null); setAnalyzedFeatures(null); }}
                  delayPressIn={0}
                >
                  <Text style={styles.photoRemoveText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <Text style={styles.photoPlaceholderIcon}>🖼</Text>
                <Text style={styles.photoPlaceholderText}>未上傳</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.uploadBtn, analyzing && styles.uploadBtnDisabled]}
              onPress={pickPhoto}
              activeOpacity={0.85}
              delayPressIn={0}
              disabled={analyzing}
            >
              {analyzing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.uploadBtnText}>
                  {photoUri ? '重新選擇' : '上傳偏好照片'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* 分析中提示 */}
          {analyzing && (
            <View style={styles.aiAnalyzingBadge}>
              <ActivityIndicator color="#FF6B6B" size="small" />
              <Text style={styles.aiAnalyzingText}>AI 分析中，請稍候…</Text>
            </View>
          )}

          {/* 分析完成結果 */}
          {!analyzing && analyzedFeatures && (
            <View style={styles.aiResultBox}>
              <Text style={styles.aiResultTitle}>✅ AI 分析完成</Text>
              <View style={styles.aiResultGrid}>
                {([
                  ['臉型', analyzedFeatures.faceShape],
                  ['膚色', analyzedFeatures.skinTone],
                  ['髮型', analyzedFeatures.hairStyle],
                  ['氣質', analyzedFeatures.vibe],
                  ['身材', analyzedFeatures.bodyStyle],
                ] as [string, string][]).map(([label, value]) => (
                  <View key={label} style={styles.aiResultChip}>
                    <Text style={styles.aiResultChipLabel}>{label}</Text>
                    <Text style={styles.aiResultChipValue}>{value}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 上傳但尚未分析（無 API Key） */}
          {!analyzing && photoUri && !analyzedFeatures && (
            <View style={styles.aiReadyBadge}>
              <Text style={styles.aiReadyText}>📷 照片已上傳（未啟用 AI 分析）</Text>
            </View>
          )}
        </SectionCard>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* 底部「開始配對」按鈕 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.startBtn}
          onPress={handleStartMatching}
          activeOpacity={0.88}
          delayPressIn={0}
        >
          <Text style={styles.startBtnText}>開始配對 💘</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8F8FA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 8,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', letterSpacing: 0.3 },
  resetBtn: { fontSize: 14, color: '#FF6B6B', fontWeight: '600' },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16 },

  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 8, letterSpacing: 0.2,
  },

  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA', gap: 6, flex: 1, justifyContent: 'center',
  },
  genderBtnActive: { borderColor: '#FF6B6B', backgroundColor: '#FFF0F0' },
  genderIcon: { fontSize: 18 },
  genderLabel: { fontSize: 14, color: '#777', fontWeight: '500' },
  genderLabelActive: { color: '#FF6B6B', fontWeight: '700' },

  sliderRow: { flexDirection: 'row', alignItems: 'center' },
  singleSlider: { flex: 1, height: 36 },
  sliderValue: { width: 76, textAlign: 'right', fontSize: 13, fontWeight: '600', color: '#FF6B6B' },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA',
  },
  optionBtnActive: { borderColor: '#FF6B6B', backgroundColor: '#FFF0F0' },
  optionLabel: { fontSize: 13, color: '#777', fontWeight: '500' },
  optionLabelActive: { color: '#FF6B6B', fontWeight: '700' },

  // Item #8 — 雙性別分條件 Tab
  genderTabBar: {
    flexDirection: 'row',
    marginTop: 12,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  genderTabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
  },
  genderTabBtnActive: { backgroundColor: '#FF6B6B' },
  genderTabLabel: { fontSize: 13, fontWeight: '600', color: '#888' },
  genderTabLabelActive: { color: '#fff', fontWeight: '700' },

  prRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA',
  },
  prBtnActive: { borderColor: '#FF6B6B', backgroundColor: '#FFF0F0' },
  prLabel: { fontSize: 13, color: '#777', fontWeight: '500' },
  prLabelActive: { color: '#FF6B6B', fontWeight: '700' },

  aiDesc: { fontSize: 13, color: '#888', lineHeight: 20, marginBottom: 12 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  photoThumbWrap: { position: 'relative' },
  photoThumb: { width: 72, height: 72, borderRadius: 12 },
  photoRemove: {
    position: 'absolute', top: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#FF6B6B', alignItems: 'center', justifyContent: 'center',
  },
  photoRemoveText: { fontSize: 10, color: '#fff', fontWeight: '800' },
  photoPlaceholder: {
    width: 72, height: 72, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#FAFAFA',
  },
  photoPlaceholderIcon: { fontSize: 22 },
  photoPlaceholderText: { fontSize: 10, color: '#aaa' },
  uploadBtn: {
    flex: 1, paddingVertical: 12,
    borderRadius: 12, backgroundColor: '#FFF0F0',
    alignItems: 'center',
    borderWidth: 1.5, borderColor: '#FFCACA',
  },
  uploadBtnText: { fontSize: 14, color: '#FF6B6B', fontWeight: '700' },
  uploadBtnDisabled: { opacity: 0.6 },
  aiReadyBadge: {
    marginTop: 10, backgroundColor: '#F0FFF0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  aiReadyText: { fontSize: 13, color: '#4ADE80', fontWeight: '600' },
  aiAnalyzingBadge: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFF8F0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  aiAnalyzingText: { fontSize: 13, color: '#FF8E53', fontWeight: '600' },
  aiResultBox: {
    marginTop: 10, backgroundColor: '#F9FFF5', borderRadius: 12,
    padding: 12, borderWidth: 1, borderColor: '#BBF7D0',
  },
  aiResultTitle: { fontSize: 13, fontWeight: '700', color: '#22C55E', marginBottom: 8 },
  aiResultGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  aiResultChip: {
    backgroundColor: '#fff', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#D1FAE5',
    alignItems: 'center',
  },
  aiResultChipLabel: { fontSize: 10, color: '#6B7280' },
  aiResultChipValue: { fontSize: 12, fontWeight: '700', color: '#1A1A1A' },

  footer: {
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 4,
  },
  startBtn: {
    paddingVertical: 15, borderRadius: 14,
    backgroundColor: '#FF6B6B', alignItems: 'center',
    shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  startBtnText: { fontSize: 16, color: '#fff', fontWeight: '800', letterSpacing: 0.5 },
});

export default FilterScreen;
