# AWLL Studio REST API リファレンス（最新版）

## 概要

AWLL Studio Platform の REST API 仕様ドキュメント。

- **OpenAPI Version**: 3.1.0
- **API Version**: 1.0.0
- **認証方式**: Bearer Token (JWT)
- **Production URL**: `https://api.awll-studio.ai`

## ドキュメント構成

| ファイル | 内容 |
|----------|------|
| [authentication.md](./authentication.md) | 認証ガイド（トークン取得・更新・権限） |
| [forms-api.md](./forms-api.md) | データベース定義 API |
| [form-answers-api.md](./form-answers-api.md) | レコード CRUD・一括操作・PATCH・CSV出力 |
| [nodes-api.md](./nodes-api.md) | 階層データ API（**reference版からの重要修正あり**） |
| [screens-api.md](./screens-api.md) | 画面定義・公開・デプロイ API |
| [search-aggregates-api.md](./search-aggregates-api.md) | 検索・集計 API |
| [webhooks-menus-api.md](./webhooks-menus-api.md) | Webhook・メニュー API |
| [users-permissions-api.md](./users-permissions-api.md) | ユーザー・権限・招待 API |
| [admin-api.md](./admin-api.md) | 管理者専用 API（ロール・ユーザー管理・スクリプトルール） |
| [mail-api.md](./mail-api.md) | メール送信 API（SES経由送信・使用量管理） |
| [corrections.md](./corrections.md) | reference版からの修正点一覧 |

## 共通仕様

### 認証

```
Authorization: Bearer <ID_TOKEN>
X-Tenant-Code: <テナントコード>   （複数テナント所属時）
Content-Type: application/json; charset=utf-8
```

### ページネーション

| パラメータ | 説明 |
|-----------|------|
| `limit` | 取得件数上限（デフォルト20、最大100） |
| `nextToken` | 次ページ取得用トークン（Base64エンコード） |

### エラーレスポンス

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
| 401 | 認証エラー |
| 403 | 権限不足 |
| 404 | リソースが見つからない |
| 409 | 競合（楽観ロック衝突 / 権限重複） |
| 410 | エンドポイント廃止 |
| 412 | 前提条件エラー（ETag不一致） |
| 429 | Rate Limit 超過 |
| 500 | サーバーエラー |

### Rate Limiting

- **制限**: 60 requests / minute（ユーザー単位）
- **超過時**: HTTP 429 Too Many Requests
- **ヘッダー**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

**作成日**: 2026-03-16
