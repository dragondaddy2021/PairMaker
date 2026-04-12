# Contributing to PairMaker

## 開發流程

### 分支命名規則

| 類型 | 格式 | 範例 |
|------|------|------|
| 新功能 | `feature/PM-<ticket>-<desc>` | `feature/PM-123-add-video-call` |
| Bug 修復 | `fix/PM-<ticket>-<desc>` | `fix/PM-456-couple-crash` |
| 緊急修復 | `hotfix/<version>-<desc>` | `hotfix/1.2.1-login-error` |
| 重構 | `refactor/<desc>` | `refactor/zustand-store` |

### Commit 訊息規範

遵循 [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>

[optional body]
[optional footer]
```

**type**: `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore`

**範例**:
```
feat(filter): add ethnicity multi-select chips

Adds ethnicity filter options to FilterScreen with 6 categories.
Integrates with matchesSub() helper in applyFilter store action.

Closes PM-234
```

### Pull Request 流程

1. 從 `develop` 建立分支
2. 確認 `npx tsc --noEmit` 無錯誤
3. 撰寫/更新測試
4. 開啟 PR，填寫 PR Template
5. 等待 CI (pr.yml) 通過
6. 至少 1 位 Reviewer 核准
7. Squash and Merge 到 `develop`

### 發布流程

```
develop → staging (PR) → main (PR) → git tag v1.x.x → EAS Build
```

## 程式碼規範

- 所有新檔案使用 TypeScript (strict mode)
- React Native 元件使用 `StyleSheet.create()`
- Zustand store actions 不可直接修改 state（使用 `set()`）
- `accessibilityLabel` 為必填（Appium 測試需要）
- 不可 hardcode API Key 或敏感資訊

## 測試要求

- 新 API endpoint 需在 `tests/api/` 加入測試
- 新畫面功能需在 `tests/appium/smoke/` 或 `regression/` 加入測試
- Bug Fix 需在 `tests/appium/hotfix/` 加入驗證測試

## 問題回報

請使用 GitHub Issue Template 或直接在 Jira 建立 Issue。
