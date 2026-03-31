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

## Playbook（業務自動化テンプレート）

Claude Code + AWLL Studio で業務を自動化するための Playbook ドキュメントも利用可能です。

| ファイル | URL |
|---------|-----|
| Playbook 概要 | `https://docs.awll-studio.ai/raw/playbook/README.md` |
| API操作原則 | `https://docs.awll-studio.ai/raw/playbook/api-operation-guide.md` |
| データ更新のコツ | `https://docs.awll-studio.ai/raw/playbook/data-update-tips.md` |
| スキル作成テンプレート | `https://docs.awll-studio.ai/raw/playbook/skill-template.md` |
| 週次運用サイクル | `https://docs.awll-studio.ai/raw/playbook/weekly-workflow.md` |

### CLAUDE.md への Playbook 追記例

```markdown
## AWLL Studio データ操作ルール

### 必須ルール（参照: https://docs.awll-studio.ai/raw/playbook/api-operation-guide.md）
- PUT API は使用禁止 → PATCH で差分更新
- サブレコード操作は Nodes API を使用
- Nodes API の PUT は GET→マージ→PUT の手順
- 更新前に enrich=hierarchical でバックアップ取得

### 504回避（参照: https://docs.awll-studio.ai/raw/playbook/data-update-tips.md）
- 大量ネストデータの PUT は DELETE→POST で再作成
- Nodes API で個別ノードを更新
```

## 注意事項

- `/raw/` パス配下は `.md` ファイルのみアクセス可能です
- ブラウザでの閲覧は `https://docs.awll-studio.ai` をご利用ください（Basic認証が必要）
- ドキュメントは定期的に更新されます
