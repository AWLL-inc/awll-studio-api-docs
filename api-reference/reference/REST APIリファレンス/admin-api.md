# 管理者専用 API (Admin)

**権限**: すべて ADMIN ロール必須

---

## ロール管理 API

**ベースパス**: `/api/admin/roles`

### エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/admin/roles` | ロール一覧取得 |
| GET | `/api/admin/roles/{roleId}` | ロール詳細取得 |
| POST | `/api/admin/roles` | ロール作成 |
| PUT | `/api/admin/roles/{roleId}` | ロール更新 |
| DELETE | `/api/admin/roles/{roleId}` | ロール削除 |
| GET | `/api/admin/roles/{roleId}/permissions` | ロール権限取得 |
| PUT | `/api/admin/roles/{roleId}/permissions` | ロール権限更新 |
| GET | `/api/admin/roles/permissions` | 全権限一覧取得 |
| GET | `/api/admin/roles/permissions/grouped` | 権限グループ化取得 |

---

### POST /api/admin/roles

#### リクエスト

```json
{
  "roleCode": "DEVELOPER",
  "roleName": "開発者",
  "permissionIds": [1, 2, 3, 5]
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| roleCode | string | Yes | ロールコード（一意） |
| roleName | string | Yes | 表示名 |
| permissionIds | int64[] | No | 付与する権限IDリスト |

---

### PUT /api/admin/roles/{roleId}

#### リクエスト

```json
{
  "roleName": "更新後のロール名",
  "permissionIds": [1, 2, 3, 5, 8]
}
```

---

### RoleResponseDto

```json
{
  "roleId": 2,
  "roleCode": "DEVELOPER",
  "roleName": "開発者",
  "permissions": [
    {
      "permissionId": 1,
      "name": "FORM_DEFINITION:READ",
      "description": "データベース定義の参照",
      "resource": "FORM_DEFINITION",
      "action": "READ"
    }
  ],
  "isSystemRole": false,
  "createdAt": "2026-01-01T00:00:00Z",
  "updatedAt": "2026-03-16T10:00:00Z"
}
```

> **注意**: `isSystemRole: true` のロール（ADMIN等）は削除できません。

---

### GET /api/admin/roles/permissions/grouped

権限をリソース別にグループ化して取得します（権限設定UI用）。

#### レスポンス (200)

```json
[
  {
    "resource": "FORM_DEFINITION",
    "permissions": [
      { "permissionId": 1, "name": "FORM_DEFINITION:READ", "description": "参照", "resource": "FORM_DEFINITION", "action": "READ" },
      { "permissionId": 2, "name": "FORM_DEFINITION:WRITE", "description": "作成/編集/削除", "resource": "FORM_DEFINITION", "action": "WRITE" }
    ]
  },
  {
    "resource": "FORM_ANSWER",
    "permissions": [ ... ]
  }
]
```

---

## ユーザー管理 API

**ベースパス**: `/api/admin/users`

### エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/admin/users` | ユーザー一覧取得（検索・フィルタ対応） |
| GET | `/api/admin/users/{userId}` | ユーザー詳細取得 |
| POST | `/api/admin/users` | ユーザー作成 |
| PUT | `/api/admin/users/{userId}` | ユーザー更新 |
| POST | `/api/admin/users/{userId}/reset-password` | パスワードリセット |

### 招待管理

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/admin/users/invitations` | 招待一覧取得 |
| POST | `/api/admin/users/invite` | ユーザー招待 |
| POST | `/api/admin/users/bulk-invite` | ユーザー一括招待 |
| DELETE | `/api/admin/users/invitations/{invitationId}` | 招待キャンセル |
| POST | `/api/admin/users/invitations/{invitationId}/resend` | 招待再送 |

---

### GET /api/admin/users

#### クエリパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| page | integer | ページ番号 |
| size | integer | 取得件数 |
| search | string | 検索キーワード（名前/メール） |
| status | string | ステータスフィルタ: `ACTIVE` / `INACTIVE` / `DELETED` |
| roleId | integer | ロールIDフィルタ |

---

### POST /api/admin/users

#### リクエスト

```json
{
  "email": "new-user@example.com",
  "username": "新しいユーザー",
  "roleIds": [2, 3]
}
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|------|-------------|------|
| email | string | Yes | - | メールアドレス |
| username | string | No | 0-100文字 | 表示名 |
| roleIds | int64[] | Yes | - | ロールIDリスト |

---

### PUT /api/admin/users/{userId}

#### リクエスト

```json
{
  "username": "更新後のユーザー名",
  "status": "ACTIVE",
  "roleIds": [2]
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| username | string | No | 表示名（0-100文字） |
| status | enum | No | `ACTIVE` / `INACTIVE` / `DELETED` |
| roleIds | int64[] | No | ロールIDリスト |

---

### POST /api/admin/users/{userId}/reset-password

#### リクエスト

```json
{
  "sendEmail": true
}
```

#### レスポンス (200)

```json
{
  "success": true,
  "message": "パスワードをリセットしました",
  "temporaryPassword": "TempPass123!"
}
```

> `sendEmail: true` の場合、`temporaryPassword` は null。メールで通知されます。

---

### POST /api/admin/users/invite

#### リクエスト

```json
{
  "email": "invited@example.com",
  "roleId": 2
}
```

---

### POST /api/admin/users/bulk-invite

#### リクエスト

```json
{
  "invitations": [
    { "email": "user1@example.com", "roleId": 2 },
    { "email": "user2@example.com", "roleId": 3 }
  ]
}
```

#### レスポンス (200)

```json
{
  "success": true,
  "message": "2件中2件の招待に成功しました",
  "successCount": 2,
  "failureCount": 0,
  "results": [
    { "email": "user1@example.com", "success": true },
    { "email": "user2@example.com", "success": true }
  ]
}
```

---

### GET /api/admin/users/invitations

#### クエリパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| status | string | `PENDING` / `ACCEPTED` / `EXPIRED` / `CANCELLED` |
| page | integer | ページ番号 |
| size | integer | 取得件数 |

---

## スクリプトルール API

**ベースパス**: `/api/admin/script-rules`
**権限**: ADMIN ロール必須

### エンドポイント一覧

#### CRUD

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/admin/script-rules` | ルール作成 |
| GET | `/api/admin/script-rules` | ルール一覧取得（フィルタ対応） |
| GET | `/api/admin/script-rules/{ruleId}` | ルール取得 |
| PUT | `/api/admin/script-rules/{ruleId}` | ルール更新（楽観ロック対応） |
| DELETE | `/api/admin/script-rules/{ruleId}` | ルール削除 |

#### 実行・テスト

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/admin/script-rules/{ruleId}/execute` | ルールテスト実行 |
| POST | `/api/admin/script-rules/execute` | データベースルール一括実行 |
| POST | `/api/admin/script-rules/test` | テストスクリプト実行（保存前検証） |

#### バージョン管理（Epic #1299）

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/admin/script-rules/{ruleId}/versions` | バージョン一覧取得 |
| GET | `/api/admin/script-rules/{ruleId}/versions/{versionNumber}` | 特定バージョン取得 |
| POST | `/api/admin/script-rules/{ruleId}/versions/{versionNumber}/publish` | バージョン公開（ルール有効化） |
| POST | `/api/admin/script-rules/{ruleId}/unpublish` | ルール非公開化（実行停止） |

#### スケジュール管理（Epic #1299）

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/admin/script-rules/{ruleId}/schedule/enable` | スケジュール有効化 |
| POST | `/api/admin/script-rules/{ruleId}/schedule/disable` | スケジュール無効化 |
| POST | `/api/admin/script-rules/{ruleId}/schedule/trigger` | 即時実行（次回実行時刻は変更しない） |
| GET | `/api/admin/script-rules/{ruleId}/schedule/state` | スケジュール実行状態取得 |

#### 実行履歴（Epic #1299）

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/admin/script-rules/{ruleId}/executions` | 実行履歴一覧（ページネーション対応） |
| GET | `/api/admin/script-rules/{ruleId}/executions/{logId}` | 実行履歴詳細取得 |

---

### POST /api/admin/script-rules

ルールを作成します。

#### リクエスト

```json
{
  "name": "金額自動計算",
  "description": "単価×数量で金額を自動計算",
  "targetFormId": "order-db",
  "eventType": "ON_CHANGE",
  "scriptCode": "if (field === 'quantity' || field === 'unit_price') { record.amount = record.quantity * record.unit_price; } return record;",
  "priority": 10,
  "errorHandling": "LOG_AND_CONTINUE",
  "maxExecutionTimeMs": 5000
}
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|------|--------------|------|
| name | string | Yes | 最大255文字 | ルール名 |
| description | string | No | 最大1000文字 | 説明 |
| targetFormId | string | Yes | ULID(26文字) | 対象データベースID（SCHEDULEDで対象なしの場合 `_SCHEDULED_NO_TARGET_FORM_`） |
| eventType | enum | Yes | - | `ON_CREATE` / `ON_UPDATE` / `ON_CHANGE` / `ON_BUTTON_CLICK` / `SCHEDULED` |
| actionId | string | No※ | - | ボタンのアクションID（`ON_BUTTON_CLICK` の場合に指定） |
| scheduleType | enum | No※ | - | `CRON` / `FIXED_RATE`（`SCHEDULED` の場合に指定） |
| scheduleExpression | string | No※ | 最大255文字 | CRON式またはレート式（`SCHEDULED` の場合に指定） |
| scheduleTimezone | string | No | 最大50文字 | タイムゾーン（例: `Asia/Tokyo`、デフォルト: UTC） |
| scriptCode | string | Yes | 最大100,000文字 | JavaScriptコード |
| priority | integer | No | 1-999 | 実行優先度（小さいほど先に実行、デフォルト: 10） |
| errorHandling | enum | No | - | `LOG_AND_CONTINUE`(デフォルト) / `STOP_ON_ERROR` / `RETRY` / `IGNORE_ERROR` |
| maxExecutionTimeMs | long | No | 100-300,000 | 最大実行時間（ミリ秒、デフォルト: 5000） |

※ `eventType` に応じて必要なフィールドが異なる

#### eventType別の必須フィールド

| eventType | 必須フィールド |
|-----------|--------------|
| `ON_CREATE` | targetFormId |
| `ON_UPDATE` | targetFormId |
| `ON_CHANGE` | targetFormId |
| `ON_BUTTON_CLICK` | targetFormId, actionId |
| `SCHEDULED` | scheduleType, scheduleExpression |

---

### PUT /api/admin/script-rules/{ruleId}

ルールを更新します。楽観ロック対応（`version` フィールドで競合検出、409 Conflict）。

#### リクエスト

```json
{
  "name": "更新後のルール名",
  "scriptCode": "record.amount = record.quantity * record.unit_price;",
  "isActive": true,
  "version": 1,
  "editingVersionNumber": 2
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | No | ルール名（最大255文字） |
| description | string | No | 説明（最大1000文字） |
| scheduleType | enum | No | `CRON` / `FIXED_RATE` |
| scheduleExpression | string | No | CRON式またはレート式 |
| scheduleTimezone | string | No | タイムゾーン |
| scriptCode | string | No | JavaScriptコード（最大100,000文字） |
| priority | integer | No | 実行優先度（1-999） |
| isActive | boolean | No | 有効/無効 |
| errorHandling | enum | No | エラーハンドリング方式 |
| maxExecutionTimeMs | long | No | 最大実行時間（100-300,000ms） |
| version | integer | No | 楽観ロック用バージョン番号 |
| editingVersionNumber | integer | No | 編集中のバージョン番号 |

---

### GET /api/admin/script-rules

ルール一覧を取得します。

#### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| formId | string | - | データベースIDでフィルタ |
| activeOnly | boolean | false | アクティブなルールのみ取得 |
| limit | integer | 100 | 取得件数上限（1-1000） |
| offset | integer | 0 | オフセット |

---

### POST /api/admin/script-rules/{ruleId}/execute

ルールをテスト実行します。

#### リクエスト

```json
{
  "record": {
    "quantity": 5,
    "unit_price": 10000
  },
  "oldRecord": null,
  "field": "quantity",
  "value": 5
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| record | object | Yes | レコードデータ（fieldCode → value） |
| oldRecord | object | No | 更新前のレコード（ON_UPDATE時） |
| field | string | No | 変更フィールド名（ON_CHANGE時に必須） |
| value | any | No | 変更後の値 |

#### レスポンス (200)

```json
{
  "ruleId": "550e8400-e29b-41d4-a716-446655440000",
  "ruleName": "金額自動計算",
  "success": true,
  "record": {
    "quantity": 5,
    "unit_price": 10000,
    "amount": 50000
  },
  "error": null,
  "consoleLogs": [
    { "level": "info", "message": "計算完了", "timestamp": "2026-03-16T11:00:00.000Z" }
  ],
  "executionTimeMs": 15,
  "executionLogId": "log-001"
}
```

---

### POST /api/admin/script-rules/test

任意のスクリプトをテスト実行します（ルール保存前の検証用）。

#### リクエスト

```json
{
  "scriptCode": "record.total = record.price * record.qty; return record;",
  "eventType": "ON_CHANGE",
  "record": { "price": 1000, "qty": 3 },
  "field": "qty",
  "value": 3,
  "formId": "01ABC123DEF456GH789JKLMNOP",
  "timeoutSeconds": 10
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| scriptCode | string | Yes | JavaScriptコード（最大100,000文字） |
| eventType | string | No | イベントタイプ（デフォルト: ON_CREATE） |
| context | object | No | コンテキスト情報 |
| record | object | No | テスト用レコードデータ |
| oldRecord | object | No | テスト用更新前レコード |
| field | string | No | 変更フィールド名 |
| value | any | No | 変更後の値 |
| formId | string | No | データベースID（ULID） |
| timeoutSeconds | integer | No | タイムアウト秒数（1-300、デフォルト: 30） |

#### レスポンス (200)

```json
{
  "success": true,
  "record": { "price": 1000, "qty": 3, "total": 3000 },
  "error": null,
  "consoleLogs": [],
  "executionTimeMs": 8,
  "warnings": [],
  "validationErrors": [],
  "output": { "price": 1000, "qty": 3, "total": 3000 }
}
```

---

### ScriptRuleResponse

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "tenantId": "demo",
  "name": "金額自動計算",
  "description": "単価×数量で金額を自動計算",
  "targetFormId": "order-db",
  "eventType": "ON_CHANGE",
  "actionId": null,
  "scheduleType": null,
  "scheduleExpression": null,
  "scheduleTimezone": null,
  "scriptCode": "...",
  "isActive": true,
  "priority": 10,
  "errorHandling": "LOG_AND_CONTINUE",
  "maxExecutionTimeMs": 5000,
  "createdBy": "user-uuid",
  "createdAt": "2026-03-16T09:00:00.000Z",
  "updatedAt": "2026-03-16T10:00:00.000Z",
  "version": 1,
  "scheduleState": null
}
```

---

### ScheduleStateResponse

スケジュール管理エンドポイントのレスポンス。

```json
{
  "status": "ACTIVE",
  "lastExecutedAt": "2026-03-28T03:00:00.000Z",
  "nextExecutionAt": "2026-03-29T03:00:00.000Z",
  "lastExecutionDurationMs": 1250,
  "consecutiveFailureCount": 0,
  "lastErrorMessage": null
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| status | string | `ACTIVE` / `PAUSED` / `ERROR` |
| lastExecutedAt | string? | 前回実行日時 |
| nextExecutionAt | string | 次回実行予定日時 |
| lastExecutionDurationMs | long? | 前回実行所要時間（ms） |
| consecutiveFailureCount | integer | 連続失敗回数 |
| lastErrorMessage | string? | 最後のエラーメッセージ |

---

### ScriptRuleVersionResponse

バージョン管理エンドポイントのレスポンス。

```json
{
  "id": "version-uuid",
  "ruleId": "rule-uuid",
  "versionNumber": 2,
  "scriptCode": "record.amount = record.quantity * record.unit_price;",
  "scheduleType": null,
  "scheduleExpression": null,
  "scheduleTimezone": null,
  "name": "金額自動計算",
  "description": "単価×数量で金額を自動計算",
  "targetFormId": "order-db",
  "priority": 10,
  "errorHandling": "LOG_AND_CONTINUE",
  "maxExecutionTimeMs": 5000,
  "status": "PUBLISHED",
  "changeSummary": "計算ロジックを修正",
  "createdBy": "user-uuid",
  "createdAt": "2026-03-28T09:00:00.000Z",
  "publishedAt": "2026-03-28T09:30:00.000Z"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| versionNumber | integer | バージョン番号 |
| status | string | `DRAFT` / `PUBLISHED` / `ARCHIVED` |
| changeSummary | string? | 変更概要 |
| publishedAt | string? | 公開日時 |

---

### ScriptExecutionLogResponse

実行履歴エンドポイントのレスポンス。

```json
{
  "id": "log-uuid",
  "tenantId": "demo",
  "ruleId": "rule-uuid",
  "formId": "order-db",
  "recordId": "record-uuid",
  "status": "SUCCESS",
  "severity": "INFO",
  "executionTimeMs": 15,
  "errorMessage": null,
  "consoleLogs": [
    { "level": "info", "message": "計算完了", "timestamp": "2026-03-28T10:00:00.000Z" }
  ],
  "scriptOutput": { "amount": 50000 },
  "apiCallsCount": 1,
  "recordsFetchedCount": 5,
  "executedBy": "user-uuid",
  "createdAt": "2026-03-28T10:00:00.000Z",
  "expiresAt": "2026-04-28T10:00:00.000Z"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| status | string | `SUCCESS` / `FAILURE` / `TIMEOUT` |
| severity | string | `INFO` / `WARNING` / `ERROR` |
| apiCallsCount | integer | API呼び出し回数 |
| recordsFetchedCount | integer | 取得レコード数 |
| expiresAt | string? | ログ有効期限 |

#### 実行履歴一覧のクエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| limit | integer | 20 | 取得件数（1-100） |
| offset | integer | 0 | オフセット |
| status | string | - | ステータスフィルタ: `SUCCESS` / `FAILURE` / `TIMEOUT` |

---

### ボタンクリックアクション実行

スクリプトルールの `ON_BUTTON_CLICK` イベントは、以下の専用エンドポイントから実行されます。

```
POST /api/v1/forms/{formId}/answers/{answerId}/actions/{actionId}
```

管理者APIではなく、通常のレコード操作APIの一部です。詳細は [form-answers-api.md](./form-answers-api.md) を参照してください。

---

## テナント設定 API

**ベースパス**: `/api/admin/tenant-settings`
**権限**: ADMIN ロール必須

### エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/admin/tenant-settings/script-fetch-allowed-domains` | api.fetch 許可ドメイン取得 |
| PUT | `/api/admin/tenant-settings/script-fetch-allowed-domains` | api.fetch 許可ドメイン更新 |

---

### GET /api/admin/tenant-settings/script-fetch-allowed-domains

テナントの `api.fetch` 許可ドメインを取得します。

#### レスポンス (200)

```json
{
  "domains": ["api.example.com", "data.example.com"],
  "globalDomains": ["api.openai.com", "api.anthropic.com"]
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| domains | string[] | テナント固有の許可ドメインリスト |
| globalDomains | string[] | グローバル設定の許可ドメインリスト（全テナント共通） |

---

### PUT /api/admin/tenant-settings/script-fetch-allowed-domains

テナントの `api.fetch` 許可ドメインを更新します。

#### リクエスト

```json
{
  "domains": ["api.example.com", "data.example.com"]
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| domains | string[] | No | 許可ドメインリスト（空配列で全削除） |

#### レスポンス (200)

GET と同じ `ScriptFetchAllowedDomainsResponseDto` を返却。

---

**更新日**: 2026-04-15
