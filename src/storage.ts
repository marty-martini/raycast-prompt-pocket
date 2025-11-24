import { LocalStorage } from "@raycast/api";
import { Prompt } from "./types";

const STORAGE_KEY = "prompts";

/**
 * すべてのプロンプトを取得
 */
export async function getPrompts(): Promise<Prompt[]> {
  const stored = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Failed to parse prompts:", error);
    return [];
  }
}

/**
 * プロンプトを保存（新規作成または更新）
 */
export async function savePrompt(prompt: Prompt): Promise<void> {
  const prompts = await getPrompts();
  const index = prompts.findIndex((p) => p.id === prompt.id);

  if (index >= 0) {
    // 既存のプロンプトを更新
    prompts[index] = prompt;
  } else {
    // 新規プロンプトを追加
    prompts.push(prompt);
  }

  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

/**
 * プロンプトを削除
 */
export async function deletePrompt(id: string): Promise<void> {
  const prompts = await getPrompts();
  const filtered = prompts.filter((p) => p.id !== id);
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

/**
 * すべてのプロンプトをクリア（開発/テスト用）
 */
export async function clearAllPrompts(): Promise<void> {
  await LocalStorage.removeItem(STORAGE_KEY);
}

