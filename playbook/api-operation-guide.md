# AWLL Studio API 操作ガイド

AWLL Studio API を安全に操作するための必須ルールです。
Claude Code の CLAUDE.md に記載することで、AIが自動的にこれらのルールに従います。

## 認証

```
POST /api/auth/token
Body: { "email": "...", "password": "..." }
→ { "idToken": "eyJ..." }
```

- 全リクエストに `Authorization: Bearer <idToken>` ヘッダーが必要
- `X-Tenant-Code: your-tenant` ヘッダーも必須
- トークンは **1時間で失効**（再ログインが必要）
- Rate limit: **60 req/min**

## データ操作の4原則

### 原則1: PUT API は原則使用禁止 — PATCH で差分更新する

PUT はレコード全体を上書きするため、一部のフィールドしか指定しなかった場合に**他のデータが消失**します。

```
# ❌ PUT（全体上書き → 未指定フィールドが消える）
PUT /api/v1/forms/{formId}/answers/{answerId}

# ✅ PATCH（指定フィールドのみ更新）
PATCH /api/v1/forms/{formId}/answers/{answerId}
```

**唯一の例外**: Nodes API の `PUT /api/answers/{answerId}/nodes/{rowId}` は GET → マージ → PUT の手順で使用可能。

### 原則2: サブレコードの追加・更新は Nodes API を使う

サブテーブル（ARRAY型フィールド）のデータ操作には Nodes API を使用します。

```json
// サブレコード追加
POST /api/answers/{answerId}/nodes
{
  "parentRowId": "親ノードのrowId",
  "fieldCode": "tasks",
  "data": { "name": "タスク名", "status": "not_started" }
}

// サブレコード更新（GET→マージ→PUT）
// 1. GET で現在のデータを取得
GET /api/answers/{answerId}/nodes/{rowId}
// 2. 変更箇所をマージ
// 3. 全フィールドを含めて PUT
PUT /api/answers/{answerId}/nodes/{rowId}
{ "data": { "name": "更新後", "status": "done", "hours": 8 } }
```

**重要**: Nodes API の PUT は**全フィールドを送る**こと。送らなかったフィールドは消えます。

### 原則3: answerData の PUT に ARRAY フィールドを含めない

`PUT /answers/{answerId}` の `answerData` にサブテーブル（ARRAY型）データを含めると、Nodes API で管理しているデータとの不整合が発生します。

### 原則4: 操作前に必ずバックアップ取得

```
GET /api/v1/forms/{formId}/answers/{answerId}?enrich=hierarchical
```

取得したデータを保存してから操作に着手してください。

## フィールド定義の注意点

データベース定義のフィールドには以下が必須です:

- `fieldRecordId`: クライアント生成のULID
- `order`: 表示順序（整数）

これらが欠如すると FormBuilder UI が正しく動作しません。

## CLAUDE.md への追記例

```markdown
## AWLL Studio API ルール

### 必須ルール
- PUT API は使用禁止。レコード更新は PATCH API を使用
- サブレコード操作は Nodes API（POST/PUT）を使用
- Nodes API の PUT は GET→マージ→PUT の手順を必ず踏む
- answerData の PUT に ARRAY フィールドを含めない
- データ更新前に enrich=hierarchical でバックアップ取得

### 認証
- トークン有効期限: 1時間
- Rate limit: 60 req/min
- ヘッダー: Authorization + X-Tenant-Code
```
