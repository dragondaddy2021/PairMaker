# /eas-update

推送 EAS OTA 熱更新。

## 使用方式

```
/eas-update [channel] [message]
```

- `channel`: `preview` | `production` | `hotfix`（預設：`preview`）
- `message`: 更新說明（預設：自動生成 git log 摘要）

## 執行步驟

1. 執行 `npx tsc --noEmit` 確認無 TypeScript 錯誤
2. 確認 `EXPO_TOKEN` 環境變數已設定
3. 執行 `eas update --channel <channel> --message "<message>" --non-interactive`
4. 發送 Slack 通知至 `#pairmaker-ci`

## 注意

- `hotfix` channel 僅供緊急修復使用
- `production` channel 推送前需確認已通過 Regression Tests
