# /create-bug

自動建立 Jira Bug 並發送 Slack 通知。

## 使用方式

```
/create-bug <title> [description]
```

## 執行步驟

1. 取得失敗的測試名稱、錯誤訊息、截圖路徑
2. 呼叫 `scripts/jira-bug.ts` 建立 Bug Issue：
   - Project: PM
   - Issue Type: Bug
   - Priority: 根據嚴重程度自動判斷（P1 若含 crash/崩潰，否則 P2）
   - Labels: `automated`, `ci-detected`
3. 發送 Slack 通知至 `#pairmaker-bugs`
4. 返回 Jira Issue URL
