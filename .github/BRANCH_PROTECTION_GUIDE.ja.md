# ブランチ保護ルールガイド

このガイドでは、Prompt Pocketリポジトリのコード品質とセキュリティを維持するための推奨ブランチ保護ルールについて説明します。

## 目次

- [概要](#概要)
- [保護対象ブランチ](#保護対象ブランチ)
- [推奨ルール](#推奨ルール)
- [セットアップ手順](#セットアップ手順)
- [ワークフロー](#ワークフロー)

## 概要

ブランチ保護ルールは、重要なブランチへのすべての変更が適切なレビューとテストプロセスを経ることを保証します。これにより、誤ったプッシュを防ぎ、コードレビューを強制し、コードベースの整合性を維持します。

## 保護対象ブランチ

### `main` ブランチ
- **目的**: プロダクション対応のコード
- **保護レベル**: 最高
- **デプロイ**: 安定版リリースのみ
- **マージ戦略**: すべての変更はfeatureブランチからのPull Requestを通して行う必要があります

## 推奨ルール

### `main` ブランチの設定:

#### 必須ステータスチェック
- ✅ **マージ前にステータスチェックの合格を必須にする**
  - `lint` - コードリントが合格する必要があります
  - `test` - すべてのテストが合格する必要があります
  - `validation` - 総合的な検証チェック
- ✅ **マージ前にブランチを最新の状態にすることを必須にする**

#### Pull Requestレビュー
- ✅ **マージ前にPull Requestを必須にする**
- ✅ **承認を必須にする**: 1名以上（チームが大きい場合はそれ以上）
- ✅ **新しいコミットがプッシュされたときに古いPull Request承認を却下する**
- ✅ **コードオーナーからのレビューを必須にする**（チームが成長した場合）

#### 追加の保護設定
- ✅ **マージ前に会話の解決を必須にする**
- ✅ **署名付きコミットを必須にする**（セキュリティのため推奨）
- ✅ **線形履歴を必須にする**（オプション、履歴をクリーンに保ちます）
- ✅ **上記の設定のバイパスを許可しない**
- ❌ **Force pushを許可する**: 無効化
- ❌ **削除を許可する**: 無効化

#### 制限事項
- 🔒 **マッチするブランチへのプッシュを制限する**
  - メンテナーとリポジトリ管理者のみ

## セットアップ手順

### ステップ1: ブランチ保護設定へ移動

1. GitHubのリポジトリに移動
2. 右上の **Settings** をクリック
3. 左サイドバーの **Branches** をクリック
4. "Branch protection rules" の下の **Add rule** をクリック

### ステップ2: `main` ブランチ保護を設定

1. **Branch name pattern**: `main`

2. **Protect matching branches** - 以下を有効化:

   ```
   ☑️ Require a pull request before merging
      ☑️ Require approvals (1)
      ☑️ Dismiss stale pull request approvals when new commits are pushed
      ☑️ Require review from Code Owners
      ☑️ Require approval of the most recent reviewable push
   
   ☑️ Require status checks to pass before merging
      ☑️ Require branches to be up to date before merging
      Status checks that are required:
        - lint
        - test
        - validation
   
   ☑️ Require conversation resolution before merging
   
   ☑️ Require signed commits (recommended)
   
   ☑️ Require linear history (optional)
   
   ☑️ Require deployments to succeed before merging (if applicable)
   
   ☐ Lock branch (only if you want to make it read-only)
   
   ☐ Do not allow bypassing the above settings
   
   ☐ Restrict who can push to matching branches
      - Add: marty-martini
   
   ☐ Allow force pushes (KEEP DISABLED)
   
   ☐ Allow deletions (KEEP DISABLED)
   ```

3. **Create** または **Save changes** をクリック

### ステップ3: 保護ルールを確認

1. **Settings** → **Branches** に移動
2. 保護ルールがリストされていることを確認
3. `main` に直接プッシュしようとしてテスト（ブロックされるはずです）

## ワークフロー

### ブランチ保護ルールを使用した標準開発ワークフロー

```
┌─────────────────┐
│  feature/xyz    │  ← 開発者がmainからfeatureブランチを作成
└────────┬────────┘
         │ 開発とコミット
         ↓
┌─────────────────┐
│  Push to remote │  ← featureブランチをプッシュ
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Create PR      │  ← mainへのPRを作成
└────────┬────────┘
         │
         ├─→ ✓ CI/CD実行（lint, test）
         ├─→ ✓ コードレビュー必須
         ├─→ ✓ 会話の解決
         ├─→ ✓ ブランチが最新
         │
         ↓
┌─────────────────┐
│  Merge          │  ← すべてのチェック合格 → マージ可能
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│      main       │  ← 新しい変更で更新
└─────────────────┘
```

### CIチェックが失敗した場合

1. PRで失敗したチェックを確認
2. featureブランチで必要な修正を行う
3. 修正をプッシュ
4. CIが自動的に再実行される
5. すべてのチェックが合格したら、再度レビューをリクエスト

### 緊急ホットフィックス

本番環境の重大な問題の場合:

1. `main` からhotfixブランチを作成
2. 最小限の必要な変更を行う
3. `[HOTFIX]` プレフィックスを付けてPRを作成
4. 迅速なレビューを受ける
5. すべてのチェックは依然として必須（バイパスなし）
6. `main` にマージ

## 追加のセキュリティ対策

### 1. コードオーナーからの必須レビューを有効化

- CODEOWNERSファイルが適切に設定されていることを確認
- コードオーナーは自動的にレビューをリクエストされます

### 2. 署名付きコミットを有効化

```bash
# GPG署名を設定
git config --global commit.gpgsign true
git config --global user.signingkey YOUR_GPG_KEY_ID
```

### 3. ブランチ命名規則の設定

featureブランチには一貫した命名規則を使用:
- `feature/*` - 新機能
- `feature/bugfix-*` - バグ修正
- `feature/hotfix-*` - 緊急修正
- `feature/refactor-*` - コードリファクタリング
- `feature/docs-*` - ドキュメント更新
- `feature/test-*` - テストの追加/更新

### 4. 定期的なセキュリティ監査

- 四半期ごとにアクセス権限を確認
- チームの成長に応じて保護ルールを更新
- Dependabotアラートを監視
- セキュリティ更新を速やかにレビュー・マージ

## トラブルシューティング

### "Required status check is missing"

**問題**: ステータスチェックが見つからないため、PRをマージできない

**解決策**: 
1. ブランチでCIワークフローが少なくとも一度実行されていることを確認
2. `.github/workflows/ci.yml` のジョブ名が必須チェックと一致していることを確認
3. ステータスチェック要件を削除して再追加する必要がある場合があります

### "Branch is not up to date"

**問題**: ベースブランチに新しいコミットがあるためマージできない

**解決策**:
```bash
# ブランチを更新
git checkout your-feature-branch
git fetch origin
git rebase origin/main
git push --force-with-lease
```

### "Review required but no reviewers available"

**問題**: PRを承認できる人がいない

**解決策**:
1. 少なくとも1人の他のチームメンバーに書き込みアクセス権があることを確認
2. 個人プロジェクトの場合は承認要件を一時的に調整
3. チェックが合格したら、PR自動マージの使用を検討（慎重にテストした後）

## メンテナンス

### 定期的なレビュー

- **月次**: 必須ステータスチェックをレビュー・更新
- **四半期**: アクセス権限と保護ルールを監査
- **大きな変更後**: このガイドと保護ルールを更新

### ドキュメント更新

このガイドを以下と同期させてください:
- CI/CDワークフローの変更
- チーム構造の変更
- リポジトリ権限の変更

## 参考資料

- [GitHubブランチ保護ドキュメント](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub必須ステータスチェック](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)
- [GitHubコードオーナー](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

---

**最終更新**: 2025-11-29  
**管理者**: @marty-martini

