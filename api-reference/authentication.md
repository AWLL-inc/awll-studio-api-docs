# 認証ガイド

## 概要

AWLL Studio REST API は **Bearer Token 認証**（JWT）を使用します。`POST /api/auth/token` で取得した ID トークンを、API リクエストの `Authorization` ヘッダーに付与してください。

## 認証フロー

```
┌──────────┐  ① email + password    ┌──────────────────────┐
│  Client  │ ─────────────────────→ │  AWLL Studio API     │
│          │ ←───────────────────── │  POST /api/auth/token │
│          │    IDトークン (JWT)     └──────────────────────┘
└──────────┘
     │
     │ ② Authorization: Bearer <TOKEN>
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

**`idToken` を使用してください。**

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
| `X-Tenant-Code` | 条件付き | 複数テナントに所属する場合に指定。未指定時は自動選択 |
| `Content-Type` | POST/PUT時 | `application/json; charset=utf-8` |

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

## 権限（ロール）

| ロール | データベース定義 | レコード操作 | Webhook |
|--------|----------------|------------|---------|
| **ADMIN** | 作成/編集/削除 | 全操作 | 全操作 |
| **USER** | 参照のみ | 作成/編集/削除* | — |
| **VIEWER** | 参照のみ | 参照のみ | — |

*BUSINESS_ACCESS 権限が付与されたデータベースのみ

## エラーレスポンス

| HTTP Status | 原因 | 対処 |
|------------|------|------|
| 401 | トークンなし、無効、期限切れ | トークンを再取得してください |
| 403 | 所属外テナント、権限不足 | テナントコードとロールを確認してください |
| 429 | Rate Limit 超過（60 req/min） | 時間を置いて再試行してください |

---

**更新日**: 2026-03-16
