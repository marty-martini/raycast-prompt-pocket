# Prompt Manager

Raycast Extension for managing and reusing text prompts.

## Features

- 💾 Save and organize text prompts
- 🔍 Search through your prompts
- 📋 Quick copy to clipboard
- 🏷️ Tag-based organization
- ✏️ Easy editing and management

## Usage

1. Use `Manage Prompts` command to view and manage your prompts
2. Press `Enter` to copy a prompt to clipboard
3. Use `⌘ + N` to create a new prompt
4. Use `⌘ + E` to edit an existing prompt
5. Use `⌘ + ⌫` to delete a prompt

## Testing

### Create Sample Prompts

テスト用のサンプルプロンプトを作成できます：

1. Raycast を開く
2. `Create Sample Prompts` コマンドを実行
3. 10個のサンプルプロンプトが自動的に追加されます

サンプルには以下が含まれます：
- `{clipboard}` のみ使用するパターン
- `{cursor}` のみ使用するパターン
- 両方のプレースホルダーを使用するパターン
- カーソル位置のテスト（前半、中盤、末尾）
- 実用的なテンプレート（バグレポート、PR説明、メール返信など）

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Testing

This project includes comprehensive unit and integration tests:

-   **109 tests** across 4 test files
-   Unit tests for utility functions
-   Type validation tests
-   Placeholder processing tests
-   Integration tests for storage layer

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# View coverage report
npm run test:coverage
```

## Installation

Install via Raycast Store or build locally:

```bash
npm run build
```

