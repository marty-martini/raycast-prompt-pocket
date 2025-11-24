/**
 * プロンプトのデータ構造
 */
export interface Prompt {
  /** 一意識別子 (UUID) */
  id: string;
  /** プロンプトのタイトル */
  title: string;
  /** プロンプト本体 */
  body: string;
  /** タグ（カテゴリ分類用） */
  tags?: string[];
  /** 作成日時 (ISO形式) */
  createdAt: string;
  /** 更新日時 (ISO形式) */
  updatedAt: string;
}

/**
 * プロンプト作成用のフォーム値
 */
export interface PromptFormValues {
  title: string;
  body: string;
  tags: string;
}

