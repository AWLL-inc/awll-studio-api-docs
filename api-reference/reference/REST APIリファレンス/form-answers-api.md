# レコード API (Form Answers)

**ベースパス**: `/api/v1/forms/{formId}/answers`
**権限**: FORM_ANSWER:READ / FORM_ANSWER:WRITE + BUSINESS_ACCESS

## エンドポイント一覧

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| GET | `/api/v1/forms/{formId}/answers` | レコード一覧取得 | READ + BUSINESS_ACCESS |
| POST | `/api/v1/forms/{formId}/answers` | レコード作成 | WRITE + BUSINESS_ACCESS |
| GET | `/api/v1/forms/{formId}/answers/{answerId}` | レコード詳細取得 | READ + BUSINESS_ACCESS |
| PUT | `/api/v1/forms/{formId}/answers/{answerId}` | レコード全体更新 | WRITE + BUSINESS_ACCESS |
| PATCH | `/api/v1/forms/{formId}/answers/{answerId}` | レコード部分更新（楽観ロック付き） | WRITE |
| DELETE | `/api/v1/forms/{formId}/answers/{answerId}` | レコード削除 | WRITE + BUSINESS_ACCESS |
| POST | `/api/v1/forms/{formId}/answers/{answerId}/copy` | レコード複製 | WRITE + BUSINESS_ACCESS |
| POST | `/api/v1/forms/{formId}/answers/bulk` | 一括作成 | WRITE + BUSINESS_ACCESS |
| PUT | `/api/v1/forms/{formId}/answers/bulk` | 一括更新 | WRITE + BUSINESS_ACCESS |
| POST | `/api/v1/forms/{formId}/answers/bulk-delete` | 一括削除 | WRITE + BUSINESS_ACCESS |
| POST | `/api/v1/forms/{formId}/answers/export` | CSV出力（ZIP形式） | READ + BUSINESS_ACCESS |
| POST | `/api/v1/forms/{formId}/answers/rebuild-index` | 検索インデックス再構築 | WRITE + BUSINESS_ACCESS |

> **注意**: 一括操作は `POST /bulk`（一括作成）と `PUT /bulk`（一括更新）で分離されています。

---

## GET /api/v1/forms/{formId}/answers

レコード一覧を取得します。

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `limit` | integer | 20 | 取得件数（最大100） |
| `nextToken` | string | - | ページネーショントークン |
| `search` | string | - | 検索キーワード（部分一致、最大200文字） |

### レスポンス (200)

```json
{
  "items": [
    {
      "tenantId": "demo",
      "formId": "customer-db",
      "answerId": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "answerData": {
        "name": "株式会社ABC",
        "email": "info@abc.co.jp"
      },
      "version": 3,
      "formVersion": "01ARZ3NDEKTSV4RRFFQ69G5FAW",
      "createdAt": "2026-03-16T09:00:00Z",
      "updatedAt": "2026-03-16T10:30:00Z",
      "createdBy": "user-uuid",
      "updatedBy": "user-uuid",
      "rootNodeId": "01ARZ3NDEKTSV4RRFFQ69G5FAX"
    }
  ],
  "nextToken": "eyJwayI6...",
  "searchScope": "ALL",
  "searchableFields": ["name", "email", "status"]
}
```


---

## GET /api/v1/forms/{formId}/answers/{answerId}

レコードの詳細を取得します。

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `recalculate` | boolean | false | true で最新スキーマに基づいて再計算 |
| `enrich` | string | "default" | `hierarchical` で階層的にデータを展開 |

### レスポンス (200)

```json
{
  "tenantId": "demo",
  "formId": "customer-db",
  "answerId": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "answerData": {
    "name": "株式会社ABC",
    "email": "info@abc.co.jp",
    "contracts": [
      { "__rowId": "01HQA123...", "contract_name": "契約A", "amount": 1500000 }
    ]
  },
  "recalculatedData": null,
  "recalculationError": null,
  "version": 3,
  "formVersion": "01ARZ3NDEKTSV4RRFFQ69G5FAW",
  "createdAt": "2026-03-16T09:00:00Z",
  "updatedAt": "2026-03-16T10:30:00Z",
  "createdBy": "user-uuid",
  "updatedBy": "user-uuid",
  "rootNodeId": "01ARZ3NDEKTSV4RRFFQ69G5FAX"
}
```


---

## POST /api/v1/forms/{formId}/answers

レコードを作成します。

### リクエスト

```json
{
  "answerData": {
    "name": "サンプル顧客",
    "email": "sample@example.com"
  }
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| answerData | object | Yes | レコードデータ（フォームスキーマに準拠） |

### レスポンス (200)

`FormAnswerResponse` を返却。

---

## PUT /api/v1/forms/{formId}/answers/{answerId}

レコードを全体更新（完全置換）します。

### リクエスト

```json
{
  "answerData": {
    "name": "更新後の顧客名",
    "email": "updated@example.com"
  }
}
```

---

## PATCH /api/v1/forms/{formId}/answers/{answerId}

レコードを部分更新します（楽観ロック付き）。

### ヘッダー

| ヘッダー | 必須 | 説明 |
|---------|------|------|
| `If-Match` | Yes | 現在のバージョン番号 |

### リクエスト

```json
{
  "patches": [
    {
      "op": "replace",
      "path": "/name",
      "value": "新しい名前"
    },
    {
      "op": "append",
      "path": "/contracts",
      "value": { "contract_name": "新規契約", "amount": 500000 }
    },
    {
      "op": "update",
      "path": "/contracts[__rowId='01HQA123']",
      "value": { "amount": 2000000 }
    },
    {
      "op": "delete",
      "path": "/contracts[__rowId='01HQA456']"
    }
  ]
}
```

### PatchOperation

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| op | string | Yes | `replace` / `append` / `update` / `delete` |
| path | string | Yes | JSONPath（例: `contracts[__rowId='01HQA123'].amount`） |
| value | any | 条件付き | `delete` 以外では必須 |

> **注意**: `op` は独自形式（`replace`, `append`, `update`, `delete`）です。標準JSON Patch（RFC 6902）ではありません。

### レスポンス (200)

```json
{
  "answerId": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "version": 4,
  "updatedAt": "2026-03-16T11:00:00Z",
  "updatedFields": ["name", "contracts"],
  "calculatedFields": { "total_amount": 2500000 },
  "answerData": { ... }
}
```

### エラー

| Status | 意味 |
|--------|------|
| 409 | 楽観ロック競合（バージョン不一致） |
| 412 | If-Match ヘッダー不一致 |

---

## POST /api/v1/forms/{formId}/answers/{answerId}/copy

レコードを複製します。

### リクエスト

```json
{
  "copyMode": "FULL",
  "fieldSettings": {
    "contracts": { "include": true, "deepCopy": true }
  },
  "dataOverrides": {
    "name": "コピー: 株式会社ABC"
  }
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| copyMode | enum | Yes | `FULL` / `SHALLOW` / `CUSTOM` |
| fieldSettings | object | No | CUSTOM時のフィールド別設定 |
| dataOverrides | object | No | コピー先で上書きするデータ |

### レスポンス (200)

```json
{
  "copiedAnswer": { ... },
  "summary": {
    "sourceAnswerId": "01ARZ3...",
    "newAnswerId": "01BCD4...",
    "copiedFieldCount": 5,
    "skippedFieldCount": 1,
    "copiedSubformCount": 3,
    "copiedArrayItemCount": 10,
    "executionTimeMs": 450
  }
}
```

---

## 一括操作

### POST /api/v1/forms/{formId}/answers/bulk（一括作成）

```json
{
  "items": [
    { "answerData": { "name": "顧客1" } },
    { "answerData": { "name": "顧客2" } }
  ]
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|-------------|
| items | array | Yes | 最大100件 |

### PUT /api/v1/forms/{formId}/answers/bulk（一括更新）

```json
{
  "items": [
    { "answerId": "01ARZ3...", "answerData": { "name": "更新後1" } },
    { "answerId": "01BCD4...", "answerData": { "name": "更新後2" } }
  ]
}
```

### POST /api/v1/forms/{formId}/answers/bulk-delete（一括削除）

```json
{
  "answerIds": ["01ARZ3...", "01BCD4..."]
}
```

### 一括操作レスポンス (200)

```json
{
  "totalRequested": 2,
  "succeeded": 2,
  "failed": 0,
  "results": [
    { "index": 0, "status": "SUCCESS", "answerId": "01NEW1..." },
    { "index": 1, "status": "SUCCESS", "answerId": "01NEW2..." }
  ]
}
```

部分失敗時:

```json
{
  "totalRequested": 2,
  "succeeded": 1,
  "failed": 1,
  "results": [
    { "index": 0, "status": "SUCCESS", "answerId": "01NEW1..." },
    { "index": 1, "status": "FAILED", "error": "Validation failed: name is required" }
  ]
}
```

---

## POST /api/v1/forms/{formId}/answers/export

CSV一括出力します（UTF-8 BOM付きZIP形式）。

### クエリパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| includeArrayFields | string | 出力対象のARRAYフィールドパス |

### レスポンス

Content-Type: `application/zip`

---

## POST /api/v1/forms/{formId}/answers/rebuild-index

検索インデックスを再構築します。表示値の更新時に使用。

---

**更新日**: 2026-03-16
