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
| `limit` | integer | 20 | 取得件数（最大1000） |
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
    "description": "顧客情報を管理するデータベース。社員の単価はロール×役職で算出。",
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
| description | string | No | データベースの説明（最大1000文字） |
| schema | object | Yes | JSONスキーマ定義 |
| schema.description | string | No | データベースの説明文。FormBuilder UIの説明欄に表示される |

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

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| displayField | string | Yes | 表示値として使用するフィールドコード |
| limit | integer | No | 取得件数上限（デフォルト100、最大1000） |
| search | string | No | 検索キーワード（部分一致、サーバーサイドインクリメンタルサーチ対応） |

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

## fieldCode の制約事項

### ⚠️ 予約語（使用禁止）

`fieldCode` には以下の JavaScript Object プロトタイププロパティ名を**使用してはならない**:

`constructor`, `prototype`, `__proto__`, `toString`, `hasOwnProperty`, `valueOf`, `isPrototypeOf`, `propertyIsEnumerable`, `toLocaleString`

**理由**:
`answerData[fieldCode]` でアクセスした際にプロトタイプチェーン経由で組み込みプロパティが取得され、`undefined` チェックをすり抜けて画面描画時に実行時エラー（例: `TypeError: value?.startsWith is not a function`）が発生します。

**推奨**:
業務ドメインに即した snake_case の命名に置き換える。
- ❌ `constructor` → ✅ `construction_company` / `builder_name`
- ❌ `toString` → ✅ `display_text` / `label`
- ❌ `valueOf` → ✅ `value` / `numeric_value`

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

## レコードレベル権限制御（Record Rules）

データベース定義の `schema` に権限ルールを埋め込むことで、レコード単位・フィールド単位の細粒度アクセス制御を行えます。**専用のエンドポイントはなく、`POST` / `PUT /api/v1/forms/{formId}` の `schema` に含めて保存します。**

管理画面では「データベースビルダー → 情報タブ → レコードルール」で同等の設定が可能です。

### スキーマ構造

```json
{
  "title": "顧客マスタ",
  "schema": {
    "fields": [
      {
        "fieldCode": "salary",
        "label": "給与",
        "type": "NUMBER",
        "readRule":  { "expression": "#user.roles.contains('HR')" },
        "writeRule": { "expression": "#user.roles.contains('HR')" }
      }
    ],
    "recordReadRule":   { "expression": "#meta.createdBy == #user.id", "description": "作成者本人のみ閲覧可" },
    "recordWriteRule":  { "expression": "#meta.createdBy == #user.id" },
    "recordDeleteRule": { "expression": "#user.roles.contains('MANAGER')" }
  }
}
```

| 配置場所 | フィールド | 制御対象 |
|---------|-----------|---------|
| `schema.recordReadRule` | レコード READ | 一覧・取得時の可視性 |
| `schema.recordWriteRule` | レコード WRITE | 更新の可否 |
| `schema.recordDeleteRule` | レコード DELETE | 削除の可否 |
| `schema.fields[].readRule` | フィールド READ | 個別フィールドの可視性 |
| `schema.fields[].writeRule` | フィールド WRITE | 個別フィールドの更新可否 |

すべて任意です。**未設定（null / 省略）の場合は全許可**（後方互換）。

### PermissionRule オブジェクト

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| expression | string | Yes | 評価式（boolean を返す条件式）。空文字は「未設定 = 全許可」扱い |
| description | string | No | 管理UI 表示用の説明文 |
| denyMode | string | No | フィールド READ 拒否時の挙動。`HIDE`（除外） / `MASK`（null 化） / `REDACT`（`"***"` 化）。`fields[].readRule` でのみ意味を持つ |

### 評価式（DSL）

boolean を返す **読み取り専用の条件式**です。

**演算子**

| 種別 | 記法 |
|------|------|
| 比較 | `==` `!=` `>` `<` `>=` `<=` |
| 論理 | `and` `or` `not`（`&&` `\|\|` `!` も可） |
| 集合包含 | `#user.roles.contains('ADMIN')` |

**参照可能な変数**

| 変数 | 値 | 例 |
|------|-----|-----|
| `#user.id` | ログインユーザーの一意ID（レコード作成者IDと同じ値ドメイン） | `#meta.createdBy == #user.id` |
| `#user.email` | メールアドレス | `#user.email == 'admin@example.com'` |
| `#user.roles` | ロール集合 | `#user.roles.contains('APPROVER')` |
| `#user.groups` | 所属グループ集合 | `#user.groups.contains('hr')` |
| `#meta.createdBy` | レコード作成者のユーザーID | `#meta.createdBy == #user.id` |
| `#meta.updatedBy` | レコード更新者のユーザーID | |
| `#meta.createdAt` / `#meta.updatedAt` | 作成・更新日時 | |
| bare `fieldCode` | 業務フィールド値（回答データ内の値） | `status == 'DRAFT'` |

> **名前空間の使い分け**: システムメタ（作成者等）は必ず `#meta.X` で参照します。`fieldCode = "createdBy"` のような業務フィールドを定義しても、`#meta.createdBy` は常にシステム値を、bare `createdBy` は業務フィールド値を参照します（完全に別名前空間）。

**式の例**

```text
#meta.createdBy == #user.id                                  // 作成者本人のみ
#user.roles.contains('ADMIN') or owner.userId == #user.id    // ADMIN または owner フィールド一致
status == 'DRAFT' or #user.roles.contains('APPROVER')        // 業務フィールド status を参照
#meta.createdBy == #user.id or #user.groups.contains('hr')   // 作成者本人または hr グループ
```

### 評価ルール（重要）

1. **ADMIN ロール所持者は全ルールをスキップして全許可**（短絡評価）
2. **ルール未設定（null / 空 expression）は全許可**（後方互換）
3. **構文エラー・実行時エラーは fail-closed（拒否）** にフォールバック

### 一覧（READ）時の制約

レコード一覧は投影テーブル（Projection / Summary）に対して後段フィルタとして評価されます。Summary には `searchable: true` を指定したフィールドのみが含まれるため、**一覧の `recordReadRule` で参照する業務フィールドは必ず `searchable: true` に設定してください**。未指定のフィールドを参照するルールは一覧では fail-closed（拒否）となります（単一取得 API とは挙動が一部異なります）。

### セキュリティ

評価器は読み取り専用モードで実行され、型参照・コンストラクタ呼び出し・変数代入・任意コード実行はすべて遮断されます。ルール式で利用できるのは上記の変数と、それらのインスタンスメソッド（`roles.contains(...)`, `String.startsWith(...)` 等）のみです。

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

## 公開フォーム (Public Forms)

**ベースパス**: `/api/public/forms`
**権限**: なし（公開エンドポイント・認証不要）

公開トークンを発行したフォームに対して、外部ユーザー（未ログイン）が定義の取得・回答送信を行うためのエンドポイントです。トークンは `PATCH /api/v1/forms/{formId}/public-settings` で公開設定を行うと発行されます。

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| GET | `/api/public/forms/{token}` | 公開フォーム定義取得 | なし |
| POST | `/api/public/forms/{token}/answers` | 公開フォーム回答送信 | なし |

### GET /api/public/forms/{token}

公開トークンからフォーム定義（タイトル・説明・スキーマ・公開設定）を取得します。

**パスパラメータ**

| 名前 | 説明 |
|------|------|
| `token` | 公開フォームトークン |

**レスポンス (200)**

```json
{
  "formId": "01J...",
  "title": "お問い合わせフォーム",
  "description": "...",
  "schema": { "fields": [] },
  "isPublic": true,
  "publicSettings": {
    "confirmationMessage": "送信ありがとうございました",
    "expiresAt": "2026-12-31T23:59:59Z"
  }
}
```

**エラー**

| ステータス | 説明 |
|-----------|------|
| 403 | 無効または期限切れトークン |
| 410 | フォームの受付が終了している（期限切れ） |

### POST /api/public/forms/{token}/answers

公開トークンを指定してフォーム回答を送信します。送信元 IP / User-Agent / Referer はサーバ側で記録されます。

**パスパラメータ**

| 名前 | 説明 |
|------|------|
| `token` | 公開フォームトークン |

**リクエスト**

```json
{
  "answers": { "name": "山田太郎", "email": "taro@example.com" },
  "metadata": {}
}
```

**レスポンス (201)**

```json
{
  "success": true,
  "answerId": "01J...",
  "confirmationMessage": "送信ありがとうございました"
}
```

**エラー**

| ステータス | 説明 |
|-----------|------|
| 400 | バリデーションエラー（`errors` 配列にフィールド単位の詳細） |
| 403 | 無効または期限切れトークン |
| 410 | フォームの受付が終了している（期限切れ） |

---

**更新日**: 2026-06-17
