# データベース定義 API (Forms)

**ベースパス**: `/api/v1/forms`
**権限**: FORM_DEFINITION:READ / FORM_DEFINITION:WRITE

## エンドポイント一覧

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| GET | `/api/v1/forms` | データベース一覧取得 | FORM_DEFINITION:READ |
| POST | `/api/v1/forms` | データベース作成 | FORM_DEFINITION:WRITE |
| GET | `/api/v1/forms/{formId}` | データベース取得（DRAFT優先で最新版） | FORM_DEFINITION:READ + VIEW |
| PUT | `/api/v1/forms/{formId}` | データベース更新 | FORM_DEFINITION:WRITE + EDIT |
| DELETE | `/api/v1/forms/{formId}` | データベース削除 | FORM_DEFINITION:WRITE + EDIT |
| GET | `/api/v1/forms/{formId}/published` | 公開済みバージョン取得 | FORM_DEFINITION:READ + BUSINESS_ACCESS |
| GET | `/api/v1/forms/{formId}/versions` | バージョン履歴取得 | FORM_DEFINITION:READ |
| GET | `/api/v1/forms/{formId}/versions/{version}` | 特定バージョン取得 | FORM_DEFINITION:READ |
| GET | `/api/v1/forms/{formId}/answer-summaries` | REFERENCE用サマリー取得 | FORM_ANSWER:READ |
| PATCH | `/api/v1/forms/{formId}/public-settings` | 公開フォーム設定更新 | FORM_DEFINITION:WRITE |
| GET | `/api/v1/forms/{formId}/public-settings` | 公開フォーム設定取得 | FORM_DEFINITION:READ |
| ~~POST~~ | ~~`/api/v1/forms/{formId}/publish`~~ | **廃止（410 Gone）** | - |

> **注意**: `POST /api/v1/forms/{formId}/publish` は廃止されました（410 Gone）。更新APIが常にPUBLISHED状態で保存するため不要です。

---

## GET /api/v1/forms

データベース一覧を取得します。

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `limit` | integer | 20 | 取得件数（最大100） |
| `nextToken` | string | - | ページネーショントークン |
| `state` | string | - | フィルタ: `DRAFT` / `PUBLISHED` |

### レスポンス (200)

```json
{
  "items": [
    {
      "tenantId": "demo",
      "formId": "customer-db",
      "version": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      "state": "PUBLISHED",
      "title": "顧客マスタ",
      "schema": { ... },
      "createdAt": "2026-03-16T09:00:00Z",
      "updatedAt": "2026-03-16T10:30:00Z",
      "createdBy": "user-uuid",
      "updatedBy": "user-uuid"
    }
  ],
  "nextToken": "eyJwayI6...",
  "count": 20
}
```

---

## POST /api/v1/forms

データベースを新規作成します。

### リクエスト

```json
{
  "title": "顧客マスタ",
  "schema": {
    "fields": [
      {
        "fieldCode": "name",
        "label": "顧客名",
        "type": "TEXT",
        "required": true
      },
      {
        "fieldCode": "email",
        "label": "メールアドレス",
        "type": "TEXT"
      },
      {
        "fieldCode": "contracts",
        "label": "契約一覧",
        "type": "ARRAY",
        "subFields": [
          { "fieldCode": "contract_name", "label": "契約名", "type": "TEXT" },
          { "fieldCode": "amount", "label": "金額", "type": "NUMBER" }
        ]
      }
    ]
  }
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| title | string | Yes | データベースタイトル（空文字不可） |
| schema | object | Yes | JSONスキーマ定義 |

### レスポンス (200)

`FormDefinitionDTO` を返却。

---

## PUT /api/v1/forms/{formId}

データベースを更新します。**常にPUBLISHED状態で保存されます。**

### リクエスト

`POST` と同じ形式。

### レスポンス (200)

`FormDefinitionDTO` を返却。

---

## GET /api/v1/forms/{formId}

最新バージョンを取得します（DRAFT優先）。

### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| formId | string | データベースID |

### レスポンス (200)

```json
{
  "tenantId": "demo",
  "formId": "customer-db",
  "version": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "state": "PUBLISHED",
  "title": "顧客マスタ",
  "schema": { ... },
  "createdAt": "2026-03-16T09:00:00Z",
  "updatedAt": "2026-03-16T10:30:00Z",
  "createdBy": "user-uuid",
  "updatedBy": "user-uuid"
}
```

---

## GET /api/v1/forms/{formId}/answer-summaries

REFERENCE フィールド用のレコードサマリーを取得します。

### クエリパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| displayField | string | 表示値として使用するフィールドコード |

---

## PATCH /api/v1/forms/{formId}/public-settings

公開フォーム設定を更新します。

### リクエスト

```json
{
  "isPublic": true,
  "expiresAt": "2026-12-31T23:59:59Z",
  "confirmationMessage": "ご回答ありがとうございました"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| isPublic | boolean | Yes | 公開状態 |
| expiresAt | datetime | No | 公開期限 |
| confirmationMessage | string | No | 回答完了メッセージ |

### レスポンス (200)

```json
{
  "formId": "customer-db",
  "isPublic": true,
  "publicToken": "abc123...",
  "publicUrl": "https://app.awll-studio.ai/public/forms/abc123...",
  "expiresAt": "2026-12-31T23:59:59Z",
  "confirmationMessage": "ご回答ありがとうございました"
}
```

---

## フィールド型一覧

| 型 | 説明 | 値の例 |
|----|------|--------|
| TEXT | テキスト | `"株式会社ABC"` |
| NUMBER | 数値 | `1500000` |
| DATE | 日付（日時） | `"2026-03-16"` or `"2026-03-16T09:00:00Z"` |
| SELECT | 単一選択 | `"取引中"` |
| CHECKBOX | 複数選択 | `["オプションA", "オプションB"]` |
| MARKDOWN | リッチテキスト | `"# 見出し\n本文..."` |
| ARRAY | 配列（サブテーブル） | `[{"name": "行1"}, {"name": "行2"}]` |
| REFERENCE | 他データベースへの参照 | `"ANSWER#01ARZ3..."` |
| CALCULATED | 自動計算 | （自動算出。入力不要） |
| USER | ユーザー選択 | `"user-uuid"` |
| FILE | ファイル添付 | （ファイルメタデータ） |

---

## AI自動生成エンドポイント


| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| POST | `/api/v1/forms/ai-create` | AI自動生成（SSE、10分タイムアウト） | FORM_DEFINITION:WRITE |
| POST | `/api/v1/forms/ai-create-job` | AI自動生成（非同期ジョブ） | FORM_DEFINITION:WRITE |
| GET | `/api/v1/forms/ai-jobs/{jobId}` | ジョブステータス取得 | 認証必須 |
| GET | `/api/v1/forms/ai-jobs` | ユーザーのジョブ一覧 | 認証必須 |
| DELETE | `/api/v1/forms/ai-jobs/{jobId}` | ジョブキャンセル | 認証必須 |

---

**更新日**: 2026-03-16
