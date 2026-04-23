# 認証ガイド

## 概要

AWLL Studio REST API は **Bearer Token 認証**（JWT）を使用します。`POST /api/auth/token` で取得した ID トークンを、API リクエストの `Authorization` ヘッダーに付与してください。

## 認証フロー

```
┌──────────┐  (1) email + password    ┌──────────────────────┐
│  Client  │ ─────────────────────→ │  AWLL Studio API     │
│          │ ←───────────────────── │  POST /api/auth/token │
│          │    IDトークン (JWT)     └──────────────────────┘
└──────────┘
     │
     │ (2) Authorization: Bearer <TOKEN>
     │    X-Tenant-Code: <テナントコード>
     ▼
┌──────────────────────────┐
│   AWLL Studio API        │
│                          │
│   → トークン署名検証      │
│   → テナント・権限確認    │
│   → レスポンス返却       │
└──────────────────────────┘
```

## Step 1: トークン取得

```bash
API="https://api.awll-studio.ai"

TOKEN=$(curl -s -X POST "$API/api/auth/token" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }' | jq -r '.idToken')
```

### レスポンス

```json
{
  "idToken": "eyJraWQiOi...",
  "accessToken": "eyJraWQiOi...",
  "refreshToken": "eyJjdHkiOi...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

**`idToken` を使用してください。** accessToken には一部のユーザー情報が含まれないため、IDトークンが推奨です。

### エラーレスポンス

| HTTP Status | error | 説明 |
|-------------|-------|------|
| 401 | AUTHENTICATION_FAILED | メールアドレスまたはパスワードが不正 |
| 401 | CHALLENGE_REQUIRED | 追加認証（MFA等）が必要 |
| 400 | Validation Failed | 入力値エラー（空のemail等） |

## Step 2: API リクエスト

### 必須ヘッダー

| ヘッダー | 必須 | 説明 |
|---------|------|------|
| `Authorization` | 必須 | `Bearer <ID_TOKEN>` |
| `X-Tenant-Code` | 条件付き | 複数テナントに所属する場合に指定。未指定時はJWTから自動抽出 |
| `Content-Type` | POST/PUT/PATCH時 | `application/json; charset=utf-8` |
| `If-Match` | PATCH時 | 楽観ロック用バージョン |

### リクエスト例

```bash
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-Code: your-tenant" \
     https://api.awll-studio.ai/api/v1/forms
```

## Step 3: トークン更新

トークンの有効期限は **1時間** です。期限切れ前に refreshToken で更新してください。

```bash
NEW_TOKEN=$(curl -s -X POST "$API/api/auth/token/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" \
  | jq -r '.idToken')
```

| トークン | 有効期限 | 用途 |
|---------|---------|------|
| idToken | 1時間 | API認証 |
| refreshToken | 30日 | トークン更新 |

## 認証情報取得

### GET /api/auth/me

現在のユーザー情報・ロール・テナントを取得。

```json
{
  "sub": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "userId": "123",
  "username": "Demo Admin",
  "email": "demo-admin@example.com",
  "tenantId": 1,
  "tenantCode": "demo",
  "tenantDisplayName": "デモテナント",
  "roles": [
    { "roleCode": "ADMIN", "roleName": "管理者" }
  ]
}
```

### GET /api/auth/available-tenants

所属テナント一覧を取得（有効なロールを持つテナントのみ返却）。

```json
[
  { "tenantCode": "demo", "displayName": "デモテナント" },
  { "tenantCode": "test", "displayName": "テストテナント" }
]
```

## 権限（ロール）

| ロール | データベース定義 | レコード操作 | Webhook | 管理画面 |
|--------|----------------|------------|---------|---------|
| **ADMIN** | 作成/編集/削除 | 全操作 | 全操作 | アクセス可 |
| **DEVELOPER** | 作成/編集/削除 | 全操作 | - | アクセス可 |
| **USER** | 参照のみ | 作成/編集/削除* | - | - |
| **VIEWER** | 参照のみ | 参照のみ | - | - |

*BUSINESS_ACCESS 権限が付与されたデータベースのみ

### 権限一覧

| 権限 | 説明 |
|------|------|
| FORM_DEFINITION:READ | データベース定義の参照 |
| FORM_DEFINITION:WRITE | データベース定義の作成・編集・削除 |
| FORM_ANSWER:READ | レコードの参照 |
| FORM_ANSWER:WRITE | レコードの作成・編集・削除 |
| SCREEN_DEFINITION:READ | 画面定義の参照 |
| SCREEN_DEFINITION:WRITE | 画面定義の作成・編集・削除 |
| MENU:WRITE | メニューの編集 |
| VIEW | 個別データベースの参照権限 |
| EDIT | 個別データベースの編集権限 |
| BUSINESS_ACCESS | 業務画面からのアクセス権限 |

## エラーレスポンス

| HTTP Status | 原因 | 対処 |
|------------|------|------|
| 401 | トークンなし、無効、期限切れ | トークンを再取得してください |
| 403 | 所属外テナント、権限不足 | テナントコードとロールを確認してください |
| 429 | Rate Limit 超過（60 req/min） | 時間を置いて再試行してください |

---

**更新日**: 2026-03-16
