# PairMaker 安全性指引

## 敏感資訊管理

### 禁止 Commit 的內容

以下類型的資訊**絕對不可** commit 到 Git：

- API Key（Claude、Google Maps 等）
- AWS 憑證（Access Key ID、Secret Access Key）
- JWT Secret
- 私鑰 (.pem, .key)
- Google Service Account JSON
- Slack Webhook URL
- Jira API Token

### 安全存放方式

| 環境 | 存放位置 |
|------|----------|
| 本地開發 | `.env`（已加入 `.gitignore`）|
| CI/CD | GitHub Secrets |
| EAS Build | EAS Secrets (`eas secret:create`) |
| 伺服器 | AWS Parameter Store / Secrets Manager |

---

## OWASP Mobile Top 10 檢查清單

### M1: Improper Credential Usage
- [x] API Key 僅透過 `EXPO_PUBLIC_*` 環境變數注入
- [x] JWT Token 存於記憶體，不持久化到 AsyncStorage（明文）
- [ ] TODO: 實作 Token 加密存儲（使用 `expo-secure-store`）

### M2: Inadequate Supply Chain Security
- [x] `npm ci`（鎖定版本）
- [x] Dependabot 自動掃描（建議啟用）
- [ ] TODO: 定期執行 `npm audit`

### M3: Insecure Authentication/Authorization
- [x] 使用 AWS Cognito（業界標準 OAuth2/OpenID）
- [x] JWT 有效期限 8 小時
- [x] 密碼複雜度要求（Cognito Policy）

### M4: Insufficient Input/Output Validation
- [x] API 層在 Lambda 進行參數驗證
- [ ] TODO: 前端輸入長度限制
- [ ] TODO: XSS 防護（Pure RN 無 HTML，相對安全）

### M5: Insecure Communication
- [x] 所有 API 呼叫使用 HTTPS
- [x] API Gateway 強制 TLS 1.2+
- [x] S3 Pre-signed URL 有效期限 15 分鐘

### M6: Inadequate Privacy Controls
- [x] 位置資訊僅在 MapScreen 使用（不上傳）
- [ ] TODO: 隱私政策頁面
- [ ] TODO: GDPR 刪帳功能

### M7: Insufficient Binary Protections
- [x] Release Build 關閉 JS Source Map 上傳（EAS 預設）
- [ ] TODO: 程式碼混淆（ProGuard for Android）

### M8: Security Misconfiguration
- [x] `helmet()` 套用在 CMS Backend
- [x] CORS 限制來源
- [x] AWS IAM 最小權限原則

### M9: Insecure Data Storage
- [ ] TODO: 使用 `expo-secure-store` 存放敏感 Token
- [x] 不在 AsyncStorage 存放明文密碼

### M10: Insufficient Cryptography
- [x] bcrypt (rounds=12) 用於 CMS 密碼 hash
- [x] AWS Cognito 負責 App 用戶密碼

---

## .gitignore 安全檢查

確認以下項目在 `.gitignore` 中：

```
.env
.env.local
secrets/
*.pem
*.key
google-play-sa.json
gcp-sa.json
```

---

## 安全事件處理

1. 若懷疑 API Key 外洩：立即到對應平台 Revoke，重新生成
2. 若 AWS 憑證外洩：立即停用 IAM Key，聯繫 AWS Support
3. 回報方式：建立 Jira Issue（標籤：`security`, `P1`），同時 DM 專案負責人
