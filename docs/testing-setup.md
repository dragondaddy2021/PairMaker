# PairMaker 測試環境設定指南

## 目錄

1. [環境需求](#環境需求)
2. [Python API 測試（pytest）](#python-api-測試pytest)
3. [Mobile E2E 測試（pytest + Appium）](#mobile-e2e-測試pytest--appium)
4. [CI/CD 整合](#cicd-整合)
5. [報告系統](#報告系統)
6. [故障排除](#故障排除)

---

## 環境需求

| 工具 | 版本 | 說明 |
|------|------|------|
| Node.js | >= 20 | JavaScript 執行環境 |
| npm | >= 10 | 套件管理 |
| Python | >= 3.11 | pytest / Appium 測試執行 |
| Java JDK | >= 17 | Appium 執行需要 |
| Android Studio | latest | Android 模擬器 |
| Xcode | >= 15 | iOS 模擬器 (macOS only) |
| Appium | >= 2.x | E2E 測試框架 |

---

## Python API 測試（pytest）

### 設定

```bash
# 1. 安裝 Python 依賴
pip install -r requirements.txt

# 2. 複製環境變數
cp .env.example .env

# 填寫 API_BASE_URL（Staging 環境）
EXPO_PUBLIC_API_BASE_URL=https://your-api.execute-api.ap-northeast-1.amazonaws.com
TEST_USER_EMAIL=test@pairmaker.app
TEST_USER_PASSWORD=Test1234!
```

### 執行

```bash
# 執行所有 API 測試
pytest tests/api/ -v

# 執行特定模組
pytest tests/api/test_auth.py -v
pytest tests/api/test_matching.py -v

# 產生 HTML 報告
pytest tests/api/ --html=reports/api-report.html
```

### 測試涵蓋範圍

| 模組 | 檔案 | 測試案例 |
|------|------|----------|
| 認證 | `tests/api/test_auth.py` | 4 個 |
| 配對/積分 | `tests/api/test_matching.py` | 5 個 |

---

## Mobile E2E 測試（pytest + Appium）

### Android 設定

```bash
# 1. 安裝 Appium
npm install -g appium
appium driver install uiautomator2

# 2. 啟動 Android 模擬器（Android Studio AVD Manager）
#    或使用實機 (開啟 USB 偵錯)

# 3. 確認裝置連線
adb devices

# 4. 設定環境變數
export TEST_PLATFORM=android
export ANDROID_DEVICE_NAME=emulator-5554
export ANDROID_APP_PATH=./android/app/build/outputs/apk/release/app-release.apk
```

### iOS 設定 (macOS)

```bash
appium driver install xcuitest

export TEST_PLATFORM=ios
export IOS_DEVICE_NAME="iPhone 15 Pro"
export IOS_VERSION="17.4"
export IOS_APP_PATH=./ios/build/PairMaker.app
```

### 啟動 Appium Server

```bash
appium --port 4723
```

### 執行測試

```bash
# Smoke Tests（全部）
pytest tests/mobile/smoke/ -v

# 單一測試檔案
pytest tests/mobile/smoke/test_login.py -v

# 平行執行（需 pytest-xdist）
pytest tests/mobile/smoke/ -n 2

# 產生 HTML 報告
pytest tests/mobile/ --html=reports/mobile-report.html
```

### 測試套件說明

| 檔案 | 說明 |
|------|------|
| `test_launch.py` | App 啟動與登入畫面可見性 |
| `test_login.py` | 登入流程（成功/錯誤密碼）|
| `test_filter.py` | 交友篩選與開始配對 |
| `test_map.py` | 地圖頁載入與地點卡片 |

### 測試套件說明

#### Smoke Tests (APP_001 ~ APP_010)
| ID | 說明 |
|----|------|
| APP_001 | App 啟動與 Splash Screen |
| APP_002 | 登入流程 |
| APP_003 | 交友篩選功能 |
| APP_004 | 地圖功能（拖曳/重置）|
| APP_005 | 情侶模式 |
| APP_006 | 個人資料頁 |
| APP_007 | 積分系統 |
| APP_008 | 優惠券兌換 |
| APP_009 | Android BackHandler |
| APP_010 | OTA 更新不阻塞啟動 |

#### Regression Tests (REG_001 ~ REG_015)
| ID | 說明 |
|----|------|
| REG_001 | 雙性別分條件篩選 |
| REG_002 | 種族篩選 |
| REG_003 | 地圖拖曳精度 |
| REG_004 | 性別正確頭像 |
| REG_005 | 情侶任務完整流程 |
| REG_006 | OTA 不阻塞啟動 |
| REG_007 | 活動積分 |
| REG_008 | Deep Link 處理 |
| REG_009 | AI 顏值分析 |
| REG_010 | App Icon 色調 |
| REG_011 | 地點類型全選/單選 |
| REG_012 | 登入/註冊切換 |
| REG_013 | Tab Bar 導航 |
| REG_014 | 效能基準 |
| REG_015 | 無障礙標籤 |

#### Hotfix Tests (HOT_001 ~ HOT_003)
| ID | 說明 |
|----|------|
| HOT_001 | 情侶模式崩潰修復驗證 |
| HOT_002 | EAS Channel 熱更新驗證 |
| HOT_003 | App Icon 背景色修復驗證 |

---

## CI/CD 整合

### GitHub Secrets 設定

在 GitHub 倉庫 Settings → Secrets 中設定：

| Secret | 說明 |
|--------|------|
| `API_BASE_URL_STAGING` | Staging API 端點 |
| `API_BASE_URL_PROD` | Production API 端點 |
| `EXPO_TOKEN` | EAS 部署 Token |
| `SLACK_WEBHOOK_URL` | Slack Webhook URL |
| `GOOGLE_SHEETS_ID` | 測試報告試算表 ID |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | GCP Service Account JSON |

### Workflows

| 檔案 | 觸發條件 | 說明 |
|------|----------|------|
| `pr.yml` | PR 開啟/更新 | Lint + TypeScript + API 測試 |
| `daily.yml` | 每天 09:00 (UTC+8) | Regression + Appium Smoke + Sheets 同步 |
| `hotfix.yml` | push to `hotfix/**` | 快速驗證 + EAS Hotfix 推送 |
| `build.yml` | push tag `v*` | EAS Build + Release Notes |

---

## 報告系統

### Allure 報告（本地）

```bash
# 生成報告
npx allure generate allure-results --clean -o allure-report

# 開啟報告
npx allure open allure-report
```

### Google Sheets 同步

```bash
# 設定 GCP Service Account
export GOOGLE_SHEETS_ID=your_sheet_id
export GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./secrets/gcp-sa.json

# 手動同步
npx ts-node scripts/sheet-sync.ts
```

試算表結構：
- **TestResults** 分頁：每次執行的詳細結果（日期、Suite、案例名、Pass/Fail、時間、錯誤訊息）
- **Summary** 分頁：每次執行的摘要（總數、通過、失敗、通過率）

---

## 故障排除

### Appium 無法連接裝置

```bash
# 確認 adb 裝置列表
adb devices

# 重新啟動 adb
adb kill-server && adb start-server

# 確認 Appium 版本
appium --version
appium driver list --installed
```

### API 測試 401 錯誤

- 確認 `.env` 中的 `TEST_USER_EMAIL` 和 `TEST_USER_PASSWORD` 是有效的測試帳號
- 確認 Cognito User Pool 的測試帳號已完成 email 驗證

### TypeScript 編譯錯誤

```bash
# 確認 tsconfig 設定
npx tsc --noEmit --project tsconfig.json

# 安裝缺少的型別定義
npm install --save-dev @types/node @wdio/globals
```
