import { useCallback } from "react";
import { Clipboard, confirmAlert, Alert } from "@raycast/api";
import { Prompt } from "../types/prompt";
import { fillPromptBody, fillPromptForPaste } from "../lib/placeholder";
import { moveCursorLeft } from "../lib/cursorControl";
import { showSuccessToast, showErrorToast } from "../lib/toastUtils";

/**
 * プロンプトアクション用のカスタムフック
 * コピー、ペースト、削除などの操作を提供
 */
export function usePromptActions() {
  /**
   * プロンプト本文をクリップボードにコピー（Raw）
   */
  const copyToClipboard = useCallback(async (prompt: Prompt) => {
    try {
      await Clipboard.copy(prompt.body);
      await showSuccessToast("Copied to Clipboard", `"${prompt.title}" copied`);
    } catch (error) {
      await showErrorToast("Failed to Copy", error);
    }
  }, []);

  /**
   * プロンプト本文をアクティブなアプリにペースト（Raw）
   */
  const pasteToActiveApp = useCallback(async (prompt: Prompt) => {
    try {
      await Clipboard.paste(prompt.body);
      await showSuccessToast("Pasted to Active App", `"${prompt.title}" pasted`);
    } catch (error) {
      await showErrorToast("Failed to Paste", error);
    }
  }, []);

  /**
   * プレースホルダを処理してクリップボードにコピー
   */
  const copyFilledPrompt = useCallback(async (prompt: Prompt) => {
    try {
      const filledText = await fillPromptBody(prompt.body);
      await Clipboard.copy(filledText);
      await showSuccessToast("Copied Filled Prompt", `"${prompt.title}" copied to clipboard`);
    } catch (error) {
      await showErrorToast("Failed to Copy Filled Prompt", error);
    }
  }, []);

  /**
   * プレースホルダを処理してアクティブなアプリにペースト
   * {cursor} がある場合は、カーソルを自動的にその位置に移動
   */
  const pasteFilledPrompt = useCallback(async (prompt: Prompt) => {
    try {
      const { text, cursorOffset } = await fillPromptForPaste(prompt.body);
      await Clipboard.paste(text);

      if (cursorOffset !== null && cursorOffset > 0) {
        const result = await moveCursorLeft(cursorOffset);

        if (result.success) {
          await showSuccessToast("Pasted with Cursor", "Cursor positioned at {cursor} location");
        } else {
          // カーソル移動失敗は警告のみ（ペースト自体は成功）
          await showSuccessToast("Pasted Successfully", "Note: Cursor could not be moved automatically");
        }
      } else {
        await showSuccessToast("Pasted Filled Prompt", `"${prompt.title}" pasted successfully`);
      }
    } catch (error) {
      await showErrorToast("Failed to Paste Filled Prompt", error);
    }
  }, []);

  /**
   * 確認ダイアログ付きで削除
   */
  const deleteWithConfirmation = useCallback(
    async (prompt: Prompt, onSuccess: () => Promise<void>): Promise<boolean> => {
      const confirmed = await confirmAlert({
        title: "Delete Prompt",
        message: `Are you sure you want to delete "${prompt.title}"?`,
        primaryAction: {
          title: "Delete",
          style: Alert.ActionStyle.Destructive,
        },
      });

      if (!confirmed) {
        return false;
      }

      try {
        await onSuccess();
        await showSuccessToast("Prompt Deleted", `"${prompt.title}" has been deleted`);
        return true;
      } catch (error) {
        await showErrorToast("Failed to Delete Prompt", error);
        return false;
      }
    },
    []
  );

  return {
    copyToClipboard,
    pasteToActiveApp,
    copyFilledPrompt,
    pasteFilledPrompt,
    deleteWithConfirmation,
  };
}

