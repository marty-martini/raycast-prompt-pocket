import { useEffect, useState, useCallback } from "react";
import { Prompt, CreatePromptInput, UpdatePromptInput } from "../types/prompt";
import { listPrompts, createPrompt, updatePrompt, deletePrompt } from "../lib/promptStorage";

/**
 * プロンプト管理用のカスタムフック
 * CRUD 操作とローカル状態管理を提供
 */
export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * プロンプト一覧を読み込む
   */
  const loadPrompts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await listPrompts();
      setPrompts(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初回マウント時に読み込み
  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  /**
   * 新しいプロンプトを作成
   */
  const create = useCallback(async (input: CreatePromptInput): Promise<Prompt> => {
    const newPrompt = await createPrompt(input);
    setPrompts((prev) => [newPrompt, ...prev]);
    return newPrompt;
  }, []);

  /**
   * プロンプトを更新
   */
  const update = useCallback(async (id: string, patch: UpdatePromptInput): Promise<Prompt> => {
    const updated = await updatePrompt(id, patch);
    setPrompts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  /**
   * プロンプトを削除
   */
  const remove = useCallback(async (id: string): Promise<void> => {
    await deletePrompt(id);
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return {
    prompts,
    isLoading,
    error,
    reload: loadPrompts,
    create,
    update,
    remove,
  };
}

