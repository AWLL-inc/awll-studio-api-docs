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

## 6. 画面定義（Screen）の作成・デプロイ・メニュー追加

画面定義の作成から業務ユーザーに公開するまでの一連のフローです。

### Step 1: 画面作成

```bash
SCREEN_ID=$(curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  -H "Content-Type: application/json; charset=utf-8" \
  "$API/api/v1/screens" \
  -d '{
    "screenName": "顧客ダッシュボード",
    "screenCode": "customer_dashboard",
    "sourceCode": "import { useRecords, useExecutionContext } from \"@awll/sdk\";\nexport default function CustomerDashboard() {\n  const { records } = useRecords();\n  return <div>{records.length}件</div>;\n}",
    "folderPath": "/顧客管理"
  }' | jq -r '.screenId')

echo "screenId: $SCREEN_ID"
```

### Step 2: コンパイル

ソースコード（TSX）をesbuildでバンドルします。

```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  -H "Content-Type: application/json; charset=utf-8" \
  "$API/api/v1/screens/$SCREEN_ID/compile" \
  -d '{}' | jq '{success, compiledCodeSize, errors}'
```

### Step 3: デプロイ（CDN配信）

コンパイル済みコードをCDNにアップロードし、キャッシュを無効化します。
未コンパイルの場合は自動でコンパイルも実行されます。

```bash
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  -H "Content-Type: application/json; charset=utf-8" \
  "$API/api/v1/screens/$SCREEN_ID/deploy" \
  -d '{"message": "初回デプロイ"}' | jq '{success, version, cdnUrl}'
```

### Step 4: サイドバーメニューに追加

デプロイした画面をサイドバーメニューに登録して、業務ユーザーがアクセスできるようにします。

```bash
# 現在のメニューを取得
CURRENT_MENU=$(curl -s -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  "$API/api/v1/menu")

# 既存メニュー + 新しい画面を追加して更新
# ※ PUT は全件置換のため、既存項目も含めて送信すること
curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  -H "Content-Type: application/json; charset=utf-8" \
  "$API/api/v1/menu" \
  -d '{
    "items": [
      {
        "label": "顧客ダッシュボード",
        "icon": "Dashboard",
        "type": "SCREEN",
        "targetId": "'"$SCREEN_ID"'",
        "order": 1,
        "visible": true
      }
    ]
  }' | jq '.items | length'
```

> **注意**: `PUT /api/v1/menu` は全件置換です。既存メニュー項目を維持する場合は、GETで取得した既存アイテムも含めて送信してください。

### 画面更新時のフロー

既存画面のソースコードを更新した場合も、同じ手順でデプロイが必要です。

```bash
# 1. ソースコード更新
curl -s -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  -H "Content-Type: application/json; charset=utf-8" \
  "$API/api/v1/screens/$SCREEN_ID" \
  -d '{"sourceCode": "...更新後のコード..."}'

# 2. コンパイル → デプロイ（deployは未コンパイル時に自動コンパイルするため、直接deployでもOK）
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  -H "Content-Type: application/json; charset=utf-8" \
  "$API/api/v1/screens/$SCREEN_ID/deploy" \
  -d '{"message": "v1.1: テーブル表示改善"}'
```

> **Tip**: `deploy` は未コンパイル時に自動コンパイルを実行するため、更新→デプロイの2ステップでも公開可能です。明示的にコンパイルエラーを事前確認したい場合は `compile` → `deploy` の3ステップを推奨します。

---

## 7. Swagger UI

ブラウザで全エンドポイントを確認できます:

```
https://api.awll-studio.ai/swagger-ui/index.html
```

---

## 8. エラーレスポンス

| HTTP Status | 意味 |
|------------|------|
| 200 | 成功 |
| 400 | リクエスト不正（バリデーションエラー） |
| 401 | 認証エラー（トークン無効/期限切れ） |
| 403 | 権限不足 |
| 404 | リソースが見つからない |
| 429 | リクエスト制限超過（60回/分） |

## 9. Rate Limiting

- **制限**: 60リクエスト / 分（ユーザー単位）
- **ヘッダー**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

**更新日**: 2026-04-26
