# PairMaker Build Guide

## 前置需求

| 工具 | 版本 | 說明 |
|------|------|------|
| Node.js | >= 20 | - |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI | >= 16 | `npm install -g eas-cli` |
| Xcode | >= 15 | iOS 建置 (macOS only) |
| Android Studio | latest | Android 建置 |

## 登入 EAS

```bash
eas login
# 帳號：dragon9487
```

## Build Profiles

| Profile | 說明 | 用途 |
|---------|------|------|
| `development` | Dev Client (debug) | 本地開發測試 |
| `preview` | 內部發布 (APK/Ad hoc) | QA 測試 |
| `hotfix` | 緊急修復通道 | Hotfix 驗證 |
| `production` | 正式版 (AAB/IPA) | App Store / Google Play |

---

## Android Build

### Preview APK（QA 測試用）

```bash
eas build --platform android --profile preview
```

下載後安裝：
```bash
adb install app-release.apk
```

### Production AAB（Google Play 用）

```bash
eas build --platform android --profile production
```

### 提交到 Google Play

```bash
eas submit --platform android --profile production
```

> 需要先設定 Google Play Service Account 金鑰
> 路徑：`./secrets/google-play-sa.json`

---

## iOS Build

### Preview IPA（Ad hoc 發布）

```bash
eas build --platform ios --profile preview
```

### Production IPA（App Store 用）

```bash
eas build --platform ios --profile production
```

### 提交到 App Store Connect

```bash
eas submit --platform ios --profile production
```

> 需要先在 `eas.json` 填入 `appleId`, `ascAppId`, `appleTeamId`

---

## OTA 熱更新

### 推送到 Preview Channel

```bash
eas update --channel preview --message "功能說明"
```

### 推送到 Production Channel

```bash
eas update --channel production --message "v1.x.x 更新說明"
```

### 推送緊急修復

```bash
eas update --channel hotfix --message "fix: 緊急修復說明"
```

> **注意**：`preview` channel 已綁定 `preview` branch
> `production` channel 已綁定 `main` branch

---

## 版本號管理

版本號由 EAS Remote 管理（`appVersionSource: "remote"`）：

```bash
# 查詢目前版本
eas build:version:get

# 手動設定版本（通常不需要，CI 自動遞增）
eas build:version:set --platform android --version-code 10
```

`app.json` 中的 `version` 為語意版本（如 `1.2.3`），手動維護。

---

## 環境變數 (Secrets)

機密設定透過 EAS Secrets 管理（不儲存在 Git）：

```bash
# 設定 secret
eas secret:create --scope project --name EXPO_PUBLIC_CLAUDE_API_KEY --value "sk-ant-..."

# 列出所有 secrets
eas secret:list
```

---

## Troubleshooting

### Android Gradle Build 失敗

```bash
cd android && ./gradlew clean && cd ..
eas build --platform android --profile preview --clear-cache
```

### iOS Provisioning Profile 問題

```bash
eas credentials
# 選擇 iOS → 重新產生 Provisioning Profile
```

### TypeScript 編譯錯誤

```bash
npx tsc --noEmit
# 修復所有錯誤後再建置
```

### App Icon 重新生成

```bash
node generate-icon.js
```
