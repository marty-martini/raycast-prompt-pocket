import { showToast, Toast, closeMainWindow } from "@raycast/api";
import { createPrompt } from "./lib/promptStorage";

/**
 * テスト用サンプルプロンプトを作成するコマンド
 */
export default async function Command() {
  try {
    await closeMainWindow();
    
    // サンプルプロンプトのデータ
    const samples = [
      // 1. {clipboard} のみ使用
      {
        title: "コードレビュー依頼",
        body: `以下のコードをレビューしてください：

\`\`\`
{clipboard}
\`\`\`

レビューポイント：
- コードの品質
- パフォーマンス
- セキュリティ
- ベストプラクティス`,
        tags: ["clipboard", "code-review"],
      },

      // 2. {cursor} のみ使用
      {
        title: "議事録テンプレート",
        body: `# 会議議事録

## 日時
{cursor}

## 参加者


## 議題


## 決定事項


## アクションアイテム


## 次回予定
`,
        tags: ["cursor", "meeting"],
      },

      // 3. 両方を使用 - バグレポート
      {
        title: "バグレポート",
        body: `## バグレポート

### 概要
{cursor}

### エラーメッセージ
\`\`\`
{clipboard}
\`\`\`

### 再現手順
1. 
2. 
3. 

### 期待される動作


### 実際の動作


### 環境
- OS: 
- ブラウザ/アプリ: 
- バージョン: `,
        tags: ["clipboard", "cursor", "bug"],
      },

      // 4. 両方を使用 - 翻訳依頼
      {
        title: "日本語翻訳依頼",
        body: `以下の英文を日本語に翻訳してください：

---
{clipboard}
---

翻訳：
{cursor}

補足説明：
`,
        tags: ["clipboard", "cursor", "translation"],
      },

      // 5. {cursor} 位置テスト - 前半
      {
        title: "カーソル位置テスト（前半）",
        body: `タイトル：{cursor}

## 本文

ここに詳細な内容が入ります。
改行も含めて複数行のテキストがあります。

## まとめ

以上です。`,
        tags: ["cursor", "test"],
      },

      // 6. {cursor} 位置テスト - 中盤
      {
        title: "カーソル位置テスト（中盤）",
        body: `## はじめに

これは導入部分です。

## 本文

{cursor}

## まとめ

これは終わりの部分です。`,
        tags: ["cursor", "test"],
      },

      // 7. {cursor} 位置テスト - 末尾
      {
        title: "カーソル位置テスト（末尾）",
        body: `## ドキュメント

これは本文です。
複数行のテキストがあります。

最後に署名を追加：
{cursor}`,
        tags: ["cursor", "test"],
      },

      // 8. 複雑なパターン - PR説明
      {
        title: "プルリクエスト説明",
        body: `## 変更内容

{cursor}

## 変更理由


## 変更ファイル
{clipboard}

## テスト
- [ ] ユニットテスト追加・更新
- [ ] 統合テスト実施
- [ ] 手動テスト完了

## スクリーンショット
（該当する場合）

## 関連Issue
Closes #`,
        tags: ["clipboard", "cursor", "pull-request"],
      },

      // 9. メール返信テンプレート
      {
        title: "問い合わせ返信",
        body: `お世話になっております。

お問い合わせいただきありがとうございます。

> {clipboard}

{cursor}

ご不明な点がございましたら、お気軽にお問い合わせください。

よろしくお願いいたします。`,
        tags: ["clipboard", "cursor", "email"],
      },

      // 10. {clipboard} 複数回使用
      {
        title: "比較分析",
        body: `## 比較分析

### 元のコード
\`\`\`
{clipboard}
\`\`\`

### 分析
{cursor}

### 改善案
\`\`\`
{clipboard}
\`\`\`

### 結論
`,
        tags: ["clipboard", "cursor", "analysis"],
      },
    ];

    // 各サンプルを作成
    for (const sample of samples) {
      await createPrompt({
        title: sample.title,
        body: sample.body,
        tags: sample.tags,
      });
    }

    await showToast({
      style: Toast.Style.Success,
      title: "Sample Prompts Created",
      message: `${samples.length} sample prompts have been added`,
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to Create Sample Prompts",
      message: error instanceof Error ? error.message : "An unknown error occurred",
    });
  }
}

