# AWLL Studio REST API リファレンス

## 概要

AWLL Studio Platform の REST API 仕様ドキュメントです。

- **OpenAPI Version**: 3.1.0
- **API Version**: 1.0.0
- **認証方式**: Bearer Token (JWT)

## エンドポイント

| 環境 | URL |
|------|-----|
| Production | `https://api.awll-studio.ai` |

## ファイル構成

### トップレベル

| ファイル | 内容 |
|----------|------|
| [openapi-v1-public.json](./openapi-v1-public.json) | OpenAPI 3.1.0 仕様（JSON） |
| [authentication.md](./authentication.md) | 認証ガイド（トークン取得〜リクエスト〜エラー） |
| [quick-start.md](./quick-start.md) | クイックスタート（curl 実行例） |
| [api-overview.md](./api-overview.md) | API 概要（エンドポイント一覧・データ構造） |
| [database-schema.md](./database-schema.md) | データベーススキーマ定義ガイド（フィールド型・実用例） |
| [screen-builder-sdk.md](./screen-builder-sdk.md) | スクリーンビルダー SDK リファレンス |

### Claude Code / AIエージェント向け

| ファイル | 内容 |
|----------|------|
| [CLAUDE.md](./CLAUDE.md) | Claude Code 向けAPI操作ガイダンス（必須ルール・既知の制約） |
| [settings.yaml](./settings.yaml) | 接続設定ファイル（認証情報テンプレート） |
| [README-distribution.md](./README-distribution.md) | API構築キット頒布用の説明書 |

### reference/ — 詳細リファレンス

#### [REST APIリファレンス](./reference/REST%20APIリファレンス/)

| ファイル | 内容 |
|----------|------|
| [README.md](./reference/REST%20APIリファレンス/README.md) | REST API リファレンス目次 |
| [authentication.md](./reference/REST%20APIリファレンス/authentication.md) | 認証・テナント・権限の詳細仕様 |
| [forms-api.md](./reference/REST%20APIリファレンス/forms-api.md) | データベース定義 CRUD |
| [form-answers-api.md](./reference/REST%20APIリファレンス/form-answers-api.md) | レコード CRUD・Bulk・CSV出力 |
| [nodes-api.md](./reference/REST%20APIリファレンス/nodes-api.md) | 階層データ（ノード）CRUD |
| [screens-api.md](./reference/REST%20APIリファレンス/screens-api.md) | 画面定義 CRUD・公開・デプロイ |
| [search-aggregates-api.md](./reference/REST%20APIリファレンス/search-aggregates-api.md) | 検索・集計 API |
| [users-permissions-api.md](./reference/REST%20APIリファレンス/users-permissions-api.md) | ユーザー・権限管理 |
| [webhooks-menus-api.md](./reference/REST%20APIリファレンス/webhooks-menus-api.md) | Webhook・メニュー管理 |
| [admin-api.md](./reference/REST%20APIリファレンス/admin-api.md) | 管理者 API（ユーザー管理・ロール・招待等） |
| [corrections.md](./reference/REST%20APIリファレンス/corrections.md) | OpenAPI仕様の修正・補足事項 |

#### [データベーススキーマ定義](./reference/form-generator/)

| ファイル | 内容 |
|----------|------|
| [README.md](./reference/form-generator/README.md) | データベーススキーマ定義ガイド（11フィールド型・制約・命名規則・見積管理の実用例） |

#### [画面SDK](./reference/画面SDK/)

| ファイル | 内容 |
|----------|------|
| [README.md](./reference/画面SDK/README.md) | 画面SDK 目次・概要 |
| [screen-sdk-reference.md](./reference/画面SDK/screen-sdk-reference.md) | Screen SDK リファレンス（useRecords / useMutation 等） |
| [script-sdk-reference.md](./reference/画面SDK/script-sdk-reference.md) | Script SDK リファレンス（ON_CREATE / ON_UPDATE トリガー） |
| [data-structures.md](./reference/画面SDK/data-structures.md) | データ構造定義 |
| [screen-development.md](./reference/画面SDK/screen-development.md) | 画面開発ガイド |
| [script-development.md](./reference/画面SDK/script-development.md) | スクリプト開発ガイド |
| [security-best-practices.md](./reference/画面SDK/security-best-practices.md) | セキュリティベストプラクティス |

## 認証

```
1. POST /api/auth/token でトークンを取得（email + password）
2. Authorization: Bearer <TOKEN> ヘッダーを付与
3. X-Tenant-Code ヘッダーでテナントを指定（マルチテナント時）
```

詳細は [authentication.md](./authentication.md) を参照。

## Rate Limiting

| 項目 | 値 |
|------|---|
| 制限 | 60 requests / minute（ユーザー単位） |
| 超過時 | HTTP 429 Too Many Requests |
| ヘッダー | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |

## API カテゴリ

| カテゴリ | 説明 | 主なエンドポイント |
|---------|------|------------------|
| **Forms** | データベース定義の管理 | `GET/POST/PUT/DELETE /api/v1/forms` |
| **Form Answers** | レコードの CRUD・一括操作・CSV出力 | `GET/POST/PUT/DELETE /api/v1/forms/{formId}/answers` |
| **Nodes** | 階層データの操作 | `GET/POST/PUT/DELETE /api/answers/{answerId}/nodes` |
| **Screens** | 画面定義の管理・公開・デプロイ | `GET/POST/PUT/DELETE /api/v1/screens` |
| **Search** | 高度検索・全文検索・ファセット検索 | `POST /api/search/*` |
| **Aggregates** | 集計（COUNT/SUM/AVG/MAX/MIN/GROUP BY） | `POST /api/aggregates/*` |
| **Users** | ユーザー情報 | `GET /api/v1/users` |
| **Auth** | 認証情報 | `GET /api/auth/me` |
| **Menus** | サイドバーメニュー | `GET/PUT /api/v1/menu` |
| **Webhooks** | Webhook管理 | `GET/POST/PUT/DELETE /api/v1/webhooks` |
| **Permissions** | データベース権限管理 | `GET/POST/DELETE /api/v1/permissions/*` |

## ページネーション

一覧系エンドポイントは以下のパラメータをサポートします。

| パラメータ | 説明 |
|-----------|------|
| `limit` | 取得件数上限（デフォルト20、最大1000） |
| `nextToken` | 次ページ取得用トークン（レスポンスに含まれる） |

```json
// レスポンス例
{
  "items": [...],
  "nextToken": "eyJwayI6...",
  "count": 20
}
```

## エラーレスポンス

全てのエラーは統一フォーマットで返却されます。

```json
{
  "timestamp": "2026-03-16T12:34:56.789Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/forms"
}
```

| HTTP Status | 意味 |
|------------|------|
| 400 | リクエスト不正（バリデーションエラー） |
| 401 | 認証エラー（トークンなし/無効/期限切れ） |
| 403 | 権限不足 |
| 404 | リソースが見つからない |
| 409 | 競合（楽観ロック衝突） |
| 412 | 前提条件エラー（ETag不一致） |
| 429 | Rate Limit 超過 |
| 500 | サーバーエラー |

## Swagger UI

ブラウザで直接 API ドキュメントを参照できます。

```
https://your-server/swagger-ui/index.html
```
