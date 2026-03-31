# AWLL Studio API & SDK Documentation

AWLL Studio の REST API リファレンスと SDK ドキュメントです。

## ドキュメント構成

### [api-reference/](./api-reference/)

REST API の仕様書・認証ガイド・クイックスタート。

| ドキュメント | 内容 |
|-------------|------|
| [README.md](./api-reference/README.md) | API リファレンス トップページ |
| [authentication.md](./api-reference/authentication.md) | 認証ガイド（トークン取得〜リクエスト） |
| [quick-start.md](./api-reference/quick-start.md) | クイックスタート（curl 実行例） |
| [api-overview.md](./api-reference/api-overview.md) | エンドポイント一覧・データ構造 |
| [database-schema.md](./api-reference/database-schema.md) | データベーススキーマ定義ガイド |
| [openapi-v1-public.json](./api-reference/openapi-v1-public.json) | OpenAPI 3.1.0 仕様（JSON） |

#### 詳細リファレンス

| ディレクトリ | 内容 |
|-------------|------|
| [reference/REST APIリファレンス/](./api-reference/reference/REST%20APIリファレンス/) | REST API 全エンドポイントの詳細仕様（11ファイル） |
| [reference/form-generator/](./api-reference/reference/form-generator/) | データベーススキーマ定義ガイド（フィールド型・実用例） |
| [reference/画面SDK/](./api-reference/reference/画面SDK/) | Screen Builder / Script SDK リファレンス |

#### Claude Code / AIエージェント向け

| ファイル | 内容 |
|----------|------|
| [CLAUDE.md](./api-reference/CLAUDE.md) | Claude Code 向け API 操作ガイダンス |
| [settings.yaml](./api-reference/settings.yaml) | 接続設定テンプレート |

### [sdk/](./sdk/)

Screen Builder と Script SDK の開発者向けドキュメント。

| ドキュメント | 内容 |
|-------------|------|
| [README.md](./sdk/README.md) | SDK 概要 |
| [screen-sdk-reference.md](./sdk/screen-sdk-reference.md) | Screen SDK API リファレンス |
| [script-sdk-reference.md](./sdk/script-sdk-reference.md) | Script SDK API リファレンス |
| [screen-development.md](./sdk/screen-development.md) | 画面開発ガイド |
| [script-development.md](./sdk/script-development.md) | スクリプト開発ガイド |
| [data-structures.md](./sdk/data-structures.md) | データ構造仕様 |
| [security-best-practices.md](./sdk/security-best-practices.md) | セキュリティベストプラクティス |
| [record-grid-reference.md](./sdk/record-grid-reference.md) | RecordGrid コンポーネント |

## クイックスタート

```bash
# 1. トークン取得
TOKEN=$(curl -s -X POST "https://api.awll-studio.ai/api/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}' \
  | jq -r '.idToken')

# 2. データベース一覧取得
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: your-tenant" \
  "https://api.awll-studio.ai/api/v1/forms" | jq .
```

詳細は [quick-start.md](./api-reference/quick-start.md) を参照。

## Swagger UI

```
https://your-server/swagger-ui/index.html
```

## ライセンス

Copyright (c) 2026 AWLL Inc. All rights reserved.
