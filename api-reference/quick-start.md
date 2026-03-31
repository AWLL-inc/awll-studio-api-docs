# AWLL Studio API クイックスタート

**API Base URL**: `https://api.awll-studio.ai`

---

## 1. トークン取得

```bash
API="https://api.awll-studio.ai"
EMAIL="your-email@example.com"
PASSWORD="your-password"

# IDトークン取得
TOKEN=$(curl -s -X POST "$API/api/auth/token" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  | jq -r '.idToken')

echo "Token取得完了（有効期限: 1時間）"
```

### トークン更新（1時間後）

```bash
REFRESH_TOKEN="<取得時の refreshToken>"

NEW_TOKEN=$(curl -s -X POST "$API/api/auth/token/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" \
  | jq -r '.idToken')
```

## 2. テナント確認

```bash
# 所属テナント一覧
curl -s -H "Authorization: Bearer $TOKEN" \
  "$API/api/auth/available-tenants" | jq .

# テナントコードを設定（以降のリクエストで使用）
TENANT="your-tenant-code"
```

## 3. データベース（Form）の操作

### 一覧取得

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  "$API/api/v1/forms" | jq '.items[] | {formId, title, state}'
```

### 特定のデータベースを取得

```bash
FORM_ID="<form_id>"

curl -s -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  "$API/api/v1/forms/$FORM_ID" | jq '{formId, title, state}'
```

## 4. レコード（Answer）の操作

### 一覧取得

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  "$API/api/v1/forms/$FORM_ID/answers" | jq '.items | length'
```

### 検索

```bash
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  "$API/api/v1/forms/$FORM_ID/answers?search=キーワード" | jq '.items | length'
```

### 作成

```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  -H "Content-Type: application/json; charset=utf-8" \
  "$API/api/v1/forms/$FORM_ID/answers" \
  -d '{
    "answerData": {
      "name": "サンプル顧客",
      "email": "sample@example.com"
    }
  }' | jq '{answerId, version}'
```

### 更新

```bash
ANSWER_ID="<answer_id>"

curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  -H "Content-Type: application/json; charset=utf-8" \
  "$API/api/v1/forms/$FORM_ID/answers/$ANSWER_ID" \
  -d '{
    "answerData": {
      "name": "更新後の顧客名",
      "email": "updated@example.com"
    }
  }' | jq '{version}'
```

### 削除

```bash
curl -s -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  "$API/api/v1/forms/$FORM_ID/answers/$ANSWER_ID"
```

## 5. 一括操作（Bulk）

### 一括作成（最大100件）

```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  -H "Content-Type: application/json; charset=utf-8" \
  "$API/api/v1/forms/$FORM_ID/answers/bulk" \
  -d '{
    "items": [
      {"answerData": {"name": "顧客1"}},
      {"answerData": {"name": "顧客2"}}
    ]
  }' | jq '{succeeded, failed}'
```

### 一括削除

```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  -H "Content-Type: application/json; charset=utf-8" \
  "$API/api/v1/forms/$FORM_ID/answers/bulk-delete" \
  -d '{"answerIds": ["<id1>", "<id2>"]}' | jq '{succeeded, failed}'
```

## 6. Swagger UI

ブラウザで全エンドポイントを確認できます:

```
https://your-server/swagger-ui/index.html
```

---

## エラーレスポンス

| HTTP Status | 意味 |
|------------|------|
| 200 | 成功 |
| 400 | リクエスト不正（バリデーションエラー） |
| 401 | 認証エラー（トークン無効/期限切れ） |
| 403 | 権限不足 |
| 404 | リソースが見つからない |
| 429 | リクエスト制限超過（60回/分） |

## Rate Limiting

- **制限**: 60リクエスト / 分（ユーザー単位）
- **ヘッダー**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

**更新日**: 2026-03-16
