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
import { v4 as uuidv4 } from "uuid";
import { deletePrompt, getPrompts, savePrompt } from "./storage";
import { Prompt, PromptFormValues } from "./types";

/**
 * メインコマンド: Manage Prompts
 */
export default function Command() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // 初期ロード
  useEffect(() => {
    loadPrompts();
  }, []);

  async function loadPrompts() {
    setIsLoading(true);
    try {
      const data = await getPrompts();
      setPrompts(data);
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to load prompts",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  // 検索フィルタリング
  const filteredPrompts = prompts.filter((prompt) => {
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
    >
      <List.EmptyView
        icon={Icon.Document}
        title="No Prompts Found"
        description="Create your first prompt to get started"
        actions={
          <ActionPanel>
            <Action.Push
              title="Create Prompt"
              icon={Icon.Plus}
              target={<PromptForm onSave={loadPrompts} />}
              shortcut={{ modifiers: ["cmd"], key: "n" }}
            />
          </ActionPanel>
        }
      />
      {filteredPrompts.map((prompt) => (
        <List.Item
          key={prompt.id}
          icon={Icon.Document}
          title={prompt.title}
          subtitle={prompt.body.slice(0, 60) + (prompt.body.length > 60 ? "..." : "")}
          accessories={[
            ...(prompt.tags
              ? prompt.tags.map((tag) => ({
                  tag: { value: tag, color: Color.Blue },
                }))
              : []),
            {
              date: new Date(prompt.updatedAt),
              tooltip: `Updated: ${new Date(prompt.updatedAt).toLocaleString()}`,
            },
          ]}
          actions={
            <ActionPanel>
              <ActionPanel.Section title="Actions">
                <Action
                  title="Copy to Clipboard"
                  icon={Icon.Clipboard}
                  onAction={async () => {
                    await Clipboard.copy(prompt.body);
                    showToast({
                      style: Toast.Style.Success,
                      title: "Copied to Clipboard",
                    });
                  }}
                />
                <Action
                  title="Paste to Active App"
                  icon={Icon.Terminal}
                  shortcut={{ modifiers: ["cmd"], key: "p" }}
                  onAction={async () => {
                    await Clipboard.paste(prompt.body);
                    showToast({
                      style: Toast.Style.Success,
                      title: "Pasted to Active App",
                    });
                  }}
                />
              </ActionPanel.Section>
              <ActionPanel.Section title="Management">
                <Action.Push
                  title="Create Prompt"
                  icon={Icon.Plus}
                  target={<PromptForm onSave={loadPrompts} />}
                  shortcut={{ modifiers: ["cmd"], key: "n" }}
                />
                <Action.Push
                  title="Edit Prompt"
                  icon={Icon.Pencil}
                  target={<PromptForm prompt={prompt} onSave={loadPrompts} />}
                  shortcut={{ modifiers: ["cmd"], key: "e" }}
                />
                <Action
                  title="Delete Prompt"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                  onAction={async () => {
                    const confirmed = await confirmAlert({
                      title: "Delete Prompt",
                      message: `Are you sure you want to delete "${prompt.title}"?`,
                      primaryAction: {
                        title: "Delete",
                        style: Alert.ActionStyle.Destructive,
                      },
                    });
                    if (confirmed) {
                      await deletePrompt(prompt.id);
                      await loadPrompts();
                      showToast({
                        style: Toast.Style.Success,
                        title: "Prompt Deleted",
                      });
                    }
                  }}
                />
              </ActionPanel.Section>
              <ActionPanel.Section title="View">
                <Action.Push
                  title="View Details"
                  icon={Icon.Eye}
                  target={<PromptDetail prompt={prompt} />}
                  shortcut={{ modifiers: ["cmd"], key: "d" }}
                />
              </ActionPanel.Section>
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

/**
 * プロンプト作成・編集フォーム
 */
function PromptForm({ prompt, onSave }: { prompt?: Prompt; onSave: () => void }) {
  const { pop } = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(values: PromptFormValues) {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const tags = values.tags
        ? values.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        : undefined;

      const newPrompt: Prompt = {
        id: prompt?.id || uuidv4(),
        title: values.title,
        body: values.body,
        tags,
        createdAt: prompt?.createdAt || now,
        updatedAt: now,
      };

      await savePrompt(newPrompt);
      showToast({
        style: Toast.Style.Success,
        title: prompt ? "Prompt Updated" : "Prompt Created",
      });
      onSave();
      pop();
    } catch (error) {
      showToast({
        style: Toast.Style.Failure,
        title: "Failed to Save Prompt",
        message: String(error),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm title={prompt ? "Update Prompt" : "Create Prompt"} onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField
        id="title"
        title="Title"
        placeholder="Enter prompt title"
        defaultValue={prompt?.title || ""}
      />
      <Form.TextArea
        id="body"
        title="Body"
        placeholder="Enter your prompt text here..."
        defaultValue={prompt?.body || ""}
      />
      <Form.TextField
        id="tags"
        title="Tags"
        placeholder="tag1, tag2, tag3"
        defaultValue={prompt?.tags?.join(", ") || ""}
        info="Comma-separated tags for organizing prompts"
      />
    </Form>
  );
}

/**
 * プロンプト詳細表示
 */
function PromptDetail({ prompt }: { prompt: Prompt }) {
  return (
    <List>
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
        subtitle={prompt.body}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard title="Copy Body" content={prompt.body} />
          </ActionPanel>
        }
      />
      {prompt.tags && prompt.tags.length > 0 && (
        <List.Item icon={Icon.Tag} title="Tags" subtitle={prompt.tags.join(", ")} />
      )}
      <List.Item
        icon={Icon.Calendar}
        title="Created"
        subtitle={new Date(prompt.createdAt).toLocaleString()}
      />
      <List.Item
        icon={Icon.Clock}
        title="Updated"
        subtitle={new Date(prompt.updatedAt).toLocaleString()}
      />
    </List>
  );
}

