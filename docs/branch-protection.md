# Branch Protection 設定指引

## 需要保護的分支

### `main`（生產環境）

設定路徑：GitHub Repo → Settings → Branches → Add branch protection rule

| 設定 | 值 |
|------|----|
| Branch name pattern | `main` |
| Require a pull request before merging | ✅ |
| Required approvals | **2** |
| Dismiss stale PR approvals when new commits are pushed | ✅ |
| Require review from code owners | ✅ |
| Require status checks to pass | ✅ |
| Required status checks | `Lint & TypeScript`, `API Tests` |
| Require branches to be up to date | ✅ |
| Restrict who can push | ✅ (僅限 admin) |
| Allow force pushes | ❌ |
| Allow deletions | ❌ |

### `develop`（開發環境）

| 設定 | 值 |
|------|----|
| Branch name pattern | `develop` |
| Require a pull request before merging | ✅ |
| Required approvals | **1** |
| Require status checks to pass | ✅ |
| Required status checks | `Lint & TypeScript`, `API Tests` |
| Allow force pushes | ❌ |
| Allow deletions | ❌ |

## CODEOWNERS 設定

建立 `.github/CODEOWNERS` 檔案：

```
# 所有檔案預設需要 @dragon9487 審核
*                     @dragon9487

# CI/CD 需要額外審核
.github/workflows/    @dragon9487
eas.json              @dragon9487

# 安全性相關檔案
.env.example          @dragon9487
src/services/aws/     @dragon9487
```

## 建議的 Squash Merge 設定

- Default merge strategy: **Squash and merge**
- Default commit message: **Pull request title and description**
- Automatically delete head branches: ✅
