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

### エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/admin/script-rules` | ルール作成 |
| PUT | `/api/admin/script-rules/{ruleId}` | ルール更新（楽観ロック対応） |
| GET | `/api/admin/script-rules/{ruleId}` | ルール取得 |
| GET | `/api/admin/script-rules` | ルール一覧取得 |
| DELETE | `/api/admin/script-rules/{ruleId}` | ルール削除 |
| POST | `/api/admin/script-rules/{ruleId}/execute` | ルールテスト実行 |
| POST | `/api/admin/script-rules/execute` | データベースルール一括実行 |
| POST | `/api/admin/script-rules/test` | テストスクリプト実行 |

---

### POST /api/admin/script-rules

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

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| name | string | Yes | ルール名 |
| description | string | No | 説明 |
| targetFormId | string | Yes | 対象データベースID |
| eventType | enum | Yes | `ON_CREATE` / `ON_UPDATE` / `ON_CHANGE` |
| scriptCode | string | Yes | JavaScriptコード |
| priority | integer | No | 実行優先度（小さいほど先に実行） |
| errorHandling | enum | No | `LOG_AND_CONTINUE` / `STOP_ON_ERROR` / `RETRY` / `IGNORE_ERROR` |
| maxExecutionTimeMs | integer | No | 最大実行時間（ミリ秒） |

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

#### レスポンス (200)

```json
{
  "ruleId": 1,
  "ruleName": "金額自動計算",
  "success": true,
  "record": {
    "quantity": 5,
    "unit_price": 10000,
    "amount": 50000
  },
  "error": null,
  "consoleLogs": [
    { "level": "info", "message": "計算完了", "timestamp": "2026-03-16T11:00:00Z" }
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
  "timeoutSeconds": 10
}
```

---

### ScriptRuleResponse

```json
{
  "id": 1,
  "name": "金額自動計算",
  "description": "単価×数量で金額を自動計算",
  "targetFormId": "order-db",
  "eventType": "ON_CHANGE",
  "scriptCode": "...",
  "isActive": true,
  "priority": 10,
  "errorHandling": "LOG_AND_CONTINUE",
  "maxExecutionTimeMs": 5000,
  "createdBy": "user-uuid",
  "createdAt": "2026-03-16T09:00:00Z",
  "updatedAt": "2026-03-16T10:00:00Z",
  "version": 1
}
```

---

**更新日**: 2026-03-16
