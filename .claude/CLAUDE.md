# PairMaker — Claude Code 工作指引

## 專案簡介

PairMaker 是一款 React Native + Expo (TypeScript) 交友 App，支援 iOS / Android。

## 技術棧

- **Frontend**: React Native + Expo SDK 54
- **狀態管理**: Zustand
- **後端服務**: AWS Cognito / DynamoDB / S3 / Lambda / API Gateway
- **測試**: Vitest (API) + Appium/WDIO (E2E)
- **CI/CD**: GitHub Actions + EAS

## 目錄結構

```
src/
  screens/        # 各頁面元件
    auth/         # 登入/註冊
    dating/       # 交友篩選、結果
    couple/       # 情侶模式
    MapScreen.tsx # 地圖頁
  services/
    aws/          # Cognito, DynamoDB, S3
    marketing/    # Deep Links, 活動積分
  store/          # Zustand stores
  types/          # TypeScript 型別定義
  data/           # Mock 資料

tests/
  api/            # Vitest API 測試
  appium/         # Appium E2E 測試

scripts/          # CI 工具腳本
docs/             # 文件
cms/              # 後台管理系統
```

## 開發規則

1. 所有新檔案使用 TypeScript，嚴格型別
2. 修改 `src/types/index.ts` 後執行 `npx tsc --noEmit` 確認無錯誤
3. 新功能需在 `tests/api/` 或 `tests/appium/` 加入對應測試
4. 不可 hardcode API Key，一律使用 `process.env.EXPO_PUBLIC_*`
5. 使用 `accessibilityLabel`（`~`前綴）作為 Appium 選擇器

## 常用指令

```bash
# 開發
npx expo start

# TypeScript 檢查
npx tsc --noEmit

# API 測試
npx vitest run --config tests/api/vitest.config.ts

# Appium Smoke 測試
npx wdio run tests/appium/wdio.conf.ts --spec "tests/appium/smoke/*.test.ts"

# EAS 熱更新（Preview 頻道）
eas update --channel preview --message "描述"

# 生成 App Icon
node generate-icon.js
```

## 環境變數

參考 `.env.example`，複製為 `.env` 並填入真實值。

## 注意事項

- `EAS Channel preview` 已綁定 `branch preview`（2024 修復）
- 情侶模式入口需確認 `TouchableOpacity` 已 import（曾出現崩潰）
- `FilterCriteriaExtended.genderSplit` 支援雙性別分條件篩選
- 地圖拖曳使用 `PanResponder`，常數 `LAT_PER_PX=0.000081`
