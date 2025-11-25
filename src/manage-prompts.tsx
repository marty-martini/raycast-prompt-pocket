import {
  Action,
  ActionPanel,
  Alert,
  Clipboard,
  Color,
  confirmAlert,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { createPrompt, deletePrompt, listPrompts, updatePrompt } from "./lib/promptStorage";
import { fillPromptBody, fillPromptForPaste, hasPlaceholders } from "./lib/placeholder";
import { Prompt, PromptFormValues } from "./types/prompt";

/**
 * メインコマンド: Manage Prompts
 * プロンプトの一覧表示・検索・管理を行うメインビュー
 */
export default function ManagePromptsCommand() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // コンポーネントマウント時にプロンプトを読み込む
  useEffect(() => {
    loadPrompts();
  }, []);

  /**
   * プロンプト一覧を読み込む
   */
  async function loadPrompts() {
    setIsLoading(true);
    try {
      const data = await listPrompts();
      setPrompts(data);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Load Prompts",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * プロンプトを削除する
   */
  async function handleDeletePrompt(prompt: Prompt) {
    const confirmed = await confirmAlert({
      title: "Delete Prompt",
      message: `Are you sure you want to delete "${prompt.title}"?`,
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!confirmed) {
      return;
    }

    try {
      await deletePrompt(prompt.id);
      await loadPrompts();
      await showToast({
        style: Toast.Style.Success,
        title: "Prompt Deleted",
        message: `"${prompt.title}" has been deleted`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Delete Prompt",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }

  /**
   * プロンプト本文をクリップボードにコピー（プレースホルダ処理なし）
   */
  async function handleCopyToClipboard(prompt: Prompt) {
    try {
      await Clipboard.copy(prompt.body);
      await showToast({
        style: Toast.Style.Success,
        title: "Copied to Clipboard",
        message: `"${prompt.title}" copied`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Copy",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }

  /**
   * プロンプト本文をアクティブなアプリにペースト（プレースホルダ処理なし）
   */
  async function handlePasteToActiveApp(prompt: Prompt) {
    try {
      await Clipboard.paste(prompt.body);
      await showToast({
        style: Toast.Style.Success,
        title: "Pasted to Active App",
        message: `"${prompt.title}" pasted`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Paste",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }

  /**
   * プレースホルダを処理してクリップボードにコピー
   * {clipboard} を展開し、{cursor} を削除する
   */
  async function handleCopyFilledPrompt(prompt: Prompt) {
    try {
      // プレースホルダを処理
      const filledText = await fillPromptBody(prompt.body);
      
      await Clipboard.copy(filledText);
      await showToast({
        style: Toast.Style.Success,
        title: "Copied Filled Prompt",
        message: `"${prompt.title}" copied to clipboard`,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Copy Filled Prompt",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }

  /**
   * プレースホルダを処理してアクティブなアプリにペースト
   * {cursor} がある場合は、全文をペーストしてからカーソルを自動的にその位置に移動
   */
  async function handlePasteFilledPrompt(prompt: Prompt) {
    try {
      // プレースホルダを処理
      const { text, cursorOffset } = await fillPromptForPaste(prompt.body);
      
      // 全文をペースト
      await Clipboard.paste(text);

      // {cursor} がある場合は、カーソルを左に移動
      if (cursorOffset !== null && cursorOffset > 0) {
        // AppleScript を使ってカーソルを移動
        await moveCursorLeft(cursorOffset);
        
        await showToast({
          style: Toast.Style.Success,
          title: "Pasted with Cursor",
          message: "Cursor positioned at {cursor} location",
        });
      } else {
        await showToast({
          style: Toast.Style.Success,
          title: "Pasted Filled Prompt",
          message: `"${prompt.title}" pasted successfully`,
        });
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Paste Filled Prompt",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      });
    }
  }

  /**
   * AppleScript を使ってカーソルを左に移動
   */
  async function moveCursorLeft(count: number) {
    const script = `
      tell application "System Events"
        repeat ${count} times
          key code 123
        end repeat
      end tell
    `;
    
    try {
      const { exec } = await import("child_process");
      await new Promise<void>((resolve, reject) => {
        exec(`osascript -e '${script.replace(/'/g, "'\"'\"'")}'`, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error("Failed to move cursor:", error);
      // カーソル移動に失敗してもエラーにしない（ペースト自体は成功しているため）
    }
  }

  /**
   * 検索テキストに基づいてプロンプトをフィルタリング
   */
  const filteredPrompts = prompts.filter((prompt) => {
    if (!searchText) return true;

    const query = searchText.toLowerCase();
    return (
      prompt.title.toLowerCase().includes(query) ||
      prompt.body.toLowerCase().includes(query) ||
      (prompt.tags && prompt.tags.some((tag) => tag.toLowerCase().includes(query)))
    );
  });

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search prompts by title, body, or tags..."
      filtering={false}
    >
      {/* 空の状態の表示 */}
      <List.EmptyView
        icon={Icon.Document}
        title="No Prompts Found"
        description={
          searchText
            ? "No prompts match your search. Try different keywords."
            : "Create your first prompt to get started"
        }
        actions={
          <ActionPanel>
            <Action.Push
              title="Create New Prompt"
              icon={Icon.Plus}
              target={<PromptForm onSave={loadPrompts} />}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
            />
          </ActionPanel>
        }
      />

      {/* プロンプト一覧 */}
      {filteredPrompts.map((prompt) => (
        <List.Item
          key={prompt.id}
          icon={Icon.Document}
          title={prompt.title}
          subtitle={truncateText(prompt.body, 60)}
          accessories={[
            // タグを表示
            ...(prompt.tags
              ? prompt.tags.map((tag) => ({
                  tag: { value: tag, color: Color.Blue },
                }))
              : []),
            // 更新日時を表示
            {
              date: new Date(prompt.updatedAt),
              tooltip: `Updated: ${new Date(prompt.updatedAt).toLocaleString()}`,
            },
          ]}
          actions={<PromptActions prompt={prompt} onRefresh={loadPrompts} handlers={{
            onCopy: handleCopyToClipboard,
            onPaste: handlePasteToActiveApp,
            onCopyFilled: handleCopyFilledPrompt,
            onPasteFilled: handlePasteFilledPrompt,
            onDelete: handleDeletePrompt,
          }} />}
        />
      ))}
    </List>
  );
}

/**
 * プロンプトアイテムのアクションパネル
 * 拡張しやすいように分離したコンポーネント
 */
interface PromptActionsProps {
  prompt: Prompt;
  onRefresh: () => void;
  handlers: {
    onCopy: (prompt: Prompt) => void;
    onPaste: (prompt: Prompt) => void;
    onCopyFilled: (prompt: Prompt) => void;
    onPasteFilled: (prompt: Prompt) => void;
    onDelete: (prompt: Prompt) => void;
  };
}

function PromptActions({ prompt, onRefresh, handlers }: PromptActionsProps) {
  // プレースホルダが含まれているかチェック
  const hasPH = hasPlaceholders(prompt.body);

  return (
    <ActionPanel>
      {/* 主要アクション: コピー・ペースト */}
      <ActionPanel.Section title="Quick Actions">
        {hasPH ? (
          // プレースホルダがある場合は "Filled" アクションを優先表示
          <>
            <Action
              title="Paste Filled Prompt to Active App"
              icon={Icon.ArrowRight}
              onAction={() => handlers.onPasteFilled(prompt)}
            />
            <Action
              title="Copy Filled Prompt to Clipboard"
              icon={Icon.Clipboard}
              shortcut={{ modifiers: ["cmd"], key: "return" }}
              onAction={() => handlers.onCopyFilled(prompt)}
            />
            <Action
              title="Copy Raw Prompt"
              icon={Icon.Document}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              onAction={() => handlers.onCopy(prompt)}
            />
          </>
        ) : (
          // プレースホルダがない場合は通常のアクション
          <>
            <Action
              title="Paste to Active App"
              icon={Icon.ArrowRight}
              onAction={() => handlers.onPaste(prompt)}
            />
            <Action
              title="Copy to Clipboard"
              icon={Icon.Clipboard}
              shortcut={{ modifiers: ["cmd"], key: "return" }}
              onAction={() => handlers.onCopy(prompt)}
            />
          </>
        )}
      </ActionPanel.Section>

      {/* 管理アクション: 作成・編集・削除 */}
      <ActionPanel.Section title="Manage">
        <Action.Push
          title="Edit Prompt"
          icon={Icon.Pencil}
          target={<PromptForm prompt={prompt} onSave={onRefresh} />}
          shortcut={{ modifiers: ["cmd"], key: "e" }}
        />
        <Action.Push
          title="Create New Prompt"
          icon={Icon.Plus}
          target={<PromptForm onSave={onRefresh} />}
          shortcut={{ modifiers: ["cmd"], key: "n" }}
        />
        <Action
          title="Delete Prompt"
          icon={Icon.Trash}
          style={Action.Style.Destructive}
          shortcut={{ modifiers: ["cmd"], key: "backspace" }}
          onAction={() => handlers.onDelete(prompt)}
        />
      </ActionPanel.Section>

      {/* 詳細表示 */}
      <ActionPanel.Section title="Details">
        <Action.Push
          title="View Details"
          icon={Icon.Eye}
          target={<PromptDetail prompt={prompt} />}
          shortcut={{ modifiers: ["cmd"], key: "d" }}
        />
        <Action.CopyToClipboard
          title="Copy Prompt ID"
          content={prompt.id}
          shortcut={{ modifiers: ["cmd", "shift"], key: "i" }}
        />
      </ActionPanel.Section>
    </ActionPanel>
  );
}

/**
 * プロンプト作成・編集フォーム
 * 新規作成と編集の両方に対応
 */
interface PromptFormProps {
  prompt?: Prompt;
  onSave: () => void;
}

function PromptForm({ prompt, onSave }: PromptFormProps) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  // バリデーションエラーの状態管理
  const [titleError, setTitleError] = useState<string | undefined>();
  const [bodyError, setBodyError] = useState<string | undefined>();

  /**
   * フォーム送信時のバリデーションと保存処理
   */
  async function handleSubmit(values: PromptFormValues) {
    // バリデーション
    setTitleError(undefined);
    setBodyError(undefined);

    if (!values.title.trim()) {
      setTitleError("Title is required");
      await showToast({
        style: Toast.Style.Failure,
        title: "Validation Error",
        message: "Title is required",
      });
      return;
    }

    if (!values.body.trim()) {
      setBodyError("Body is required");
      await showToast({
        style: Toast.Style.Failure,
        title: "Validation Error",
        message: "Body is required",
      });
      return;
    }

    setIsLoading(true);

    try {
      // タグをパース（カンマ区切り文字列を配列に変換）
      const tags = parseTagsFromString(values.tags);

      if (prompt) {
        // 既存プロンプトを更新
        await updatePrompt(prompt.id, {
          title: values.title.trim(),
          body: values.body.trim(),
          tags,
        });
        await showToast({
          style: Toast.Style.Success,
          title: "Prompt Updated",
          message: `"${values.title}" has been updated`,
        });
      } else {
        // 新規プロンプトを作成
        await createPrompt({
          title: values.title.trim(),
          body: values.body.trim(),
          tags,
        });
        await showToast({
          style: Toast.Style.Success,
          title: "Prompt Created",
          message: `"${values.title}" has been created`,
        });
      }

      // 成功したら親コンポーネントを更新してフォームを閉じる
      onSave();
      pop();
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to Save Prompt",
        message: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      navigationTitle={prompt ? "Edit Prompt" : "Create New Prompt"}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={prompt ? "Update Prompt" : "Create Prompt"}
            icon={prompt ? Icon.Check : Icon.Plus}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Title"
        placeholder="e.g., Code Review Template"
        defaultValue={prompt?.title || ""}
        error={titleError}
        onChange={() => setTitleError(undefined)}
      />

      <Form.TextArea
        id="body"
        title="Body"
        placeholder="Enter your prompt text here...&#10;&#10;You can use multiple lines."
        defaultValue={prompt?.body || ""}
        error={bodyError}
        onChange={() => setBodyError(undefined)}
        enableMarkdown
      />

      <Form.TextField
        id="tags"
        title="Tags"
        placeholder="work, ai, coding"
        defaultValue={prompt?.tags?.join(", ") || ""}
        info="Use comma-separated tags to organize your prompts (e.g., work, ai, coding)"
      />

      {prompt && (
        <Form.Description
          title="Info"
          text={`Created: ${new Date(prompt.createdAt).toLocaleString()}\nLast Updated: ${new Date(prompt.updatedAt).toLocaleString()}`}
        />
      )}
    </Form>
  );
}

/**
 * プロンプト詳細表示
 * 各フィールドの詳細情報を一覧形式で表示
 */
interface PromptDetailProps {
  prompt: Prompt;
}

function PromptDetail({ prompt }: PromptDetailProps) {
  return (
    <List navigationTitle={`Details: ${prompt.title}`}>
      <List.Item
        icon={Icon.Document}
        title="Title"
        subtitle={prompt.title}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="Copy Title" content={prompt.title} />
          </ActionPanel>
        }
      />

      <List.Item
        icon={Icon.Text}
        title="Body"
        subtitle={prompt.body.length > 100 ? prompt.body.slice(0, 100) + "..." : prompt.body}
        accessories={[{ text: `${prompt.body.length} chars` }]}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="Copy Body" content={prompt.body} />
          </ActionPanel>
        }
      />

      {prompt.tags && prompt.tags.length > 0 && (
        <List.Item
          icon={Icon.Tag}
          title="Tags"
          subtitle={prompt.tags.join(", ")}
          accessories={[{ text: `${prompt.tags.length} tags` }]}
          actions={
            <ActionPanel>
              <Action.CopyToClipboard title="Copy Tags" content={prompt.tags.join(", ")} />
            </ActionPanel>
          }
        />
      )}

      <List.Item
        icon={Icon.Fingerprint}
        title="ID"
        subtitle={prompt.id}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="Copy ID" content={prompt.id} />
          </ActionPanel>
        }
      />

      <List.Item
        icon={Icon.Calendar}
        title="Created At"
        subtitle={new Date(prompt.createdAt).toLocaleString()}
        accessories={[{ text: formatRelativeTime(new Date(prompt.createdAt)) }]}
      />

      <List.Item
        icon={Icon.Clock}
        title="Last Updated"
        subtitle={new Date(prompt.updatedAt).toLocaleString()}
        accessories={[{ text: formatRelativeTime(new Date(prompt.updatedAt)) }]}
      />
    </List>
  );
}

// ========================================
// ユーティリティ関数
// ========================================

/**
 * テキストを指定した長さで切り詰める
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + "...";
}

/**
 * カンマ区切りの文字列をタグ配列にパース
 */
function parseTagsFromString(tagsString: string): string[] | undefined {
  if (!tagsString.trim()) {
    return undefined;
  }

  const tags = tagsString
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  return tags.length > 0 ? tags : undefined;
}

/**
 * 相対時間を人間が読める形式にフォーマット
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffDays < 30) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

