# AWLL Studio API Docs - Claude Code 連携ガイド

## 概要

Claude Code から AWLL Studio の API ドキュメントを参照できます。
Raw Markdown が認証なしで取得可能なエンドポイントを提供しています。

## ベースURL

```
https://docs.awll-studio.ai/raw/
```

## CLAUDE.md への追記例

プロジェクトの `CLAUDE.md` に以下を追記することで、Claude Code が AWLL Studio API を理解した上でコーディングを支援します。

```markdown
## AWLL Studio API Reference

AWLL Studio の API ドキュメントは以下から取得可能:

### REST API
- クイックスタート: https://docs.awll-studio.ai/raw/api-reference/quick-start.md
- API概要: https://docs.awll-studio.ai/raw/api-reference/api-overview.md
- 認証ガイド: https://docs.awll-studio.ai/raw/api-reference/authentication.md
- データベース定義 API: https://docs.awll-studio.ai/raw/api-reference/database-schema.md

### SDK
- 画面開発ガイド: https://docs.awll-studio.ai/raw/sdk/screen-development.md
- Screen SDK Reference: https://docs.awll-studio.ai/raw/sdk/screen-sdk-reference.md
- スクリプト開発ガイド: https://docs.awll-studio.ai/raw/sdk/script-development.md
- Script SDK Reference: https://docs.awll-studio.ai/raw/sdk/script-sdk-reference.md
- データ構造仕様: https://docs.awll-studio.ai/raw/sdk/data-structures.md

APIドキュメントの内容を確認する場合は、上記URLを WebFetch で取得してください。
```

## 利用可能なドキュメント一覧

### API Reference（REST API）

| ファイル | URL |
|---------|-----|
| 概要 | `https://docs.awll-studio.ai/raw/api-reference/README.md` |
| クイックスタート | `https://docs.awll-studio.ai/raw/api-reference/quick-start.md` |
| API概要 | `https://docs.awll-studio.ai/raw/api-reference/api-overview.md` |
| 認証ガイド | `https://docs.awll-studio.ai/raw/api-reference/authentication.md` |
| データベーススキーマ定義 | `https://docs.awll-studio.ai/raw/api-reference/database-schema.md` |
| スクリーンビルダー SDK | `https://docs.awll-studio.ai/raw/api-reference/screen-builder-sdk.md` |
| OpenAPI仕様 (JSON) | `https://docs.awll-studio.ai/raw/api-reference/openapi-v1-public.json` |

### SDK

| ファイル | URL |
|---------|-----|
| 概要 | `https://docs.awll-studio.ai/raw/sdk/README.md` |
| 画面開発ガイド | `https://docs.awll-studio.ai/raw/sdk/screen-development.md` |
| Screen SDK Reference | `https://docs.awll-studio.ai/raw/sdk/screen-sdk-reference.md` |
| スクリプト開発ガイド | `https://docs.awll-studio.ai/raw/sdk/script-development.md` |
| Script SDK Reference | `https://docs.awll-studio.ai/raw/sdk/script-sdk-reference.md` |
| データ構造仕様 | `https://docs.awll-studio.ai/raw/sdk/data-structures.md` |
| RecordGrid コンポーネント | `https://docs.awll-studio.ai/raw/sdk/record-grid-reference.md` |
| セキュリティベストプラクティス | `https://docs.awll-studio.ai/raw/sdk/security-best-practices.md` |

## 使い方

### Claude Code で直接参照

```
AWLL Studio の Screen SDK Reference を読んで、useRecords の使い方を教えてください。
参照先: https://docs.awll-studio.ai/raw/sdk/screen-sdk-reference.md
```

### WebFetch での取得例

Claude Code は `WebFetch` ツールで上記URLからドキュメントを取得できます。
認証は不要です（`/raw/` パスは認証スキップ設定済み）。

## 注意事項

- `/raw/` パス配下は `.md` ファイルのみアクセス可能です
- ブラウザでの閲覧は `https://docs.awll-studio.ai` をご利用ください（Basic認証が必要）
- ドキュメントは定期的に更新されます
