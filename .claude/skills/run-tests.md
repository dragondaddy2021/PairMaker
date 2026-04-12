# /run-tests

執行 PairMaker 測試套件。

## 使用方式

```
/run-tests [suite]
```

- `suite`: `api` | `smoke` | `regression` | `hotfix`（預設：`api`）

## 執行步驟

1. 確認環境變數 `.env` 已設定
2. 根據 suite 執行對應指令：
   - `api`: `npx vitest run --config tests/api/vitest.config.ts`
   - `smoke`: `npx wdio run tests/appium/wdio.conf.ts --spec "tests/appium/smoke/*.test.ts"`
   - `regression`: `npx wdio run tests/appium/wdio.conf.ts --spec "tests/appium/regression/*.test.ts"`
   - `hotfix`: `npx wdio run tests/appium/wdio.conf.ts --spec "tests/appium/hotfix/*.test.ts"`
3. 顯示測試結果摘要
4. 若有失敗，顯示失敗原因並建議修復方向
