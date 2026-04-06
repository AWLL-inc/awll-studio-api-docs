# ユーザー・権限・招待 API

## ユーザー API

**ベースパス**: `/api/v1/users`

### エンドポイント一覧

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| GET | `/api/v1/users` | ユーザー一覧取得 | ADMIN |
| GET | `/api/v1/users/summary` | ユーザーサマリー（USERフィールド用） | FORM_ANSWER:READ |
| POST | `/api/v1/users/me/password` | パスワード変更 | 認証済みユーザー |

---

### GET /api/v1/users

ユーザー一覧を取得します（ページネーション対応）。

#### クエリパラメータ

| パラメータ | 型 | デフォルト | 最大 | 説明 |
|-----------|-----|-----------|------|------|
| page | integer | 0 | - | ページ番号 |
| size | integer | 20 | 1000 | 取得件数 |

#### レスポンス (200)

```json
{
  "users": [
    {
      "userId": "123",
      "email": "demo-admin@example.com",
      "username": "Demo Admin",
      "status": "ACTIVE",
      "roles": [
        { "roleCode": "ADMIN", "roleName": "管理者" }
      ],
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-03-16T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "totalElements": 50,
  "totalPages": 3,
  "isFirst": true,
  "isLast": false
}
```

---

### GET /api/v1/users/summary

USERフィールドのドロップダウン用にユーザーサマリーを取得します。

#### レスポンス (200)

```json
[
  {
    "userId": "123",
    "username": "田中太郎",
    "displayName": "田中太郎",
    "email": "tanaka@example.com"
  }
]
```

---

### POST /api/v1/users/me/password

現在のユーザーのパスワードを変更します。

#### リクエスト

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

#### レスポンス (200)

```json
{
  "success": true,
  "message": "パスワードを変更しました"
}
```

---

## データベース権限 API

**ベースパス**: `/api/v1/permissions`
**権限**: 各エンドポイントごとに異なる

### エンドポイント一覧

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| GET | `/api/v1/permissions/databases/{databaseId}/check` | 現在のユーザーの権限確認 | 認証済み |
| GET | `/api/v1/permissions/databases/{databaseId}/users` | データベースの権限付きユーザー一覧 | EDIT権限 |
| GET | `/api/v1/permissions/users/{userId}/databases` | ユーザーのデータベース権限一覧 | 認証済み |
| GET | `/api/v1/permissions/users/search` | ユーザー検索（権限付与UI用） | ADMIN |
| POST | `/api/v1/permissions/grant` | 権限付与 | EDIT権限 |
| DELETE | `/api/v1/permissions/revoke` | 権限取り消し | EDIT権限 |

---

### GET /api/v1/permissions/databases/{databaseId}/check

現在のユーザーの特定データベースに対する権限を確認します。

#### レスポンス (200)

```json
{
  "databaseId": "customer-db",
  "userId": "123",
  "canView": true,
  "canEdit": true,
  "canBusinessAccess": true
}
```

---

### POST /api/v1/permissions/grant

権限を付与します。

#### リクエスト

```json
{
  "userId": "456",
  "databaseId": "customer-db",
  "permissionType": "BUSINESS_ACCESS",
  "expiresAt": "2027-03-16T23:59:59Z",
  "metadata": {
    "reason": "プロジェクトA参画"
  }
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| userId | string | Yes | ユーザーID |
| databaseId | string | Yes | データベースID |
| permissionType | string | Yes | `VIEW` / `EDIT` / `BUSINESS_ACCESS` |
| expiresAt | datetime | No | 有効期限 |
| metadata | Map<string, string> | No | メタデータ |

#### エラー

| Status | 意味 |
|--------|------|
| 400 | 無効な権限タイプ |
| 403 | 付与権限なし（EDIT権限が必要） |
| 409 | 権限が既に存在 |

---

### DELETE /api/v1/permissions/revoke

権限を取り消します。

#### リクエスト

```json
{
  "userId": "456",
  "databaseId": "customer-db",
  "permissionType": "BUSINESS_ACCESS"
}
```

---

### GET /api/v1/permissions/databases/{databaseId}/users

#### レスポンス (200)

```json
[
  {
    "userId": "123",
    "userName": "田中太郎",
    "databaseId": "customer-db",
    "permissionType": "EDIT",
    "grantedBy": "admin-user-id",
    "grantedByName": "管理者",
    "grantedAt": "2026-03-01T00:00:00Z",
    "expiresAt": null,
    "metadata": {}
  }
]
```

---

### GET /api/v1/permissions/users/search

権限付与UI用のユーザー検索（ADMINのみ）。

#### クエリパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| query | string | 検索キーワード（名前/メール） |

#### レスポンス (200)

```json
[
  {
    "userId": "456",
    "userName": "鈴木一郎",
    "email": "suzuki@example.com"
  }
]
```

---

## 画面権限 API

**ベースパス**: `/api/v1/permissions/screens`
**権限**: 各エンドポイントごとに異なる

> **重要**: 画面権限とデータベース権限は**別のAPIエンドポイント・別のDynamoDBテーブル**で管理されています。画面にBUSINESS_ACCESSを付与する場合は、必ずこちらのAPIを使用してください。`POST /api/v1/permissions/grant`（データベース権限用）にscreenIdを指定しても画面権限は付与されません。

### エンドポイント一覧

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| GET | `/api/v1/permissions/screens/{screenId}/check` | 現在のユーザーの画面権限確認 | 認証済み |
| GET | `/api/v1/permissions/screens/{screenId}/users` | 画面の権限付きユーザー一覧 | EDIT権限 |
| POST | `/api/v1/permissions/screens/grant` | 画面権限付与 | EDIT権限 |
| DELETE | `/api/v1/permissions/screens/revoke` | 画面権限取り消し | EDIT権限 |
| POST | `/api/v1/permissions/screens/folders/grant` | フォルダレベル権限付与 | ADMIN |
| DELETE | `/api/v1/permissions/screens/folders/revoke` | フォルダレベル権限取り消し | ADMIN |
| GET | `/api/v1/permissions/screens/folders/users` | フォルダ権限者一覧取得 | ADMIN |

---

### GET /api/v1/permissions/screens/{screenId}/check

現在のユーザーの特定画面に対する権限を確認します。

#### レスポンス (200)

```json
{
  "screenId": "01KN77M5MWMNP07AERWJ1DVA1W",
  "userId": "123",
  "canEdit": true,
  "canBusinessAccess": true
}
```

---

### POST /api/v1/permissions/screens/grant

画面権限を付与します。

#### リクエスト

```json
{
  "userId": "456",
  "screenId": "01KN77M5MWMNP07AERWJ1DVA1W",
  "permissionType": "BUSINESS_ACCESS",
  "expiresAt": "2027-03-16T23:59:59Z",
  "metadata": {
    "reason": "プロジェクトA参画"
  }
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| userId | string | Yes | ユーザーID（UUID） |
| screenId | string | Yes | 画面ID（ULID） |
| permissionType | string | Yes | `EDIT` / `BUSINESS_ACCESS` |
| expiresAt | datetime | No | 有効期限 |
| metadata | Map<string, string> | No | メタデータ |

#### レスポンス (201)

```json
{
  "userId": "456",
  "userName": "鈴木一郎",
  "screenId": "01KN77M5MWMNP07AERWJ1DVA1W",
  "permissionType": "BUSINESS_ACCESS",
  "grantedBy": "admin-user-id",
  "grantedByName": "管理者",
  "grantedAt": "2026-04-02T10:00:00Z",
  "expiresAt": "2027-03-16T23:59:59Z",
  "metadata": { "reason": "プロジェクトA参画" }
}
```

#### エラー

| Status | 意味 |
|--------|------|
| 400 | 無効な権限タイプ |
| 403 | 付与権限なし（EDIT権限が必要） |
| 409 | 権限が既に存在 |

---

### DELETE /api/v1/permissions/screens/revoke

画面権限を取り消します。

#### リクエスト

```json
{
  "userId": "456",
  "screenId": "01KN77M5MWMNP07AERWJ1DVA1W",
  "permissionType": "BUSINESS_ACCESS"
}
```

---

### GET /api/v1/permissions/screens/{screenId}/users

画面の権限付きユーザー一覧を取得します。

#### レスポンス (200)

```json
[
  {
    "userId": "123",
    "userName": "田中太郎",
    "screenId": "01KN77M5MWMNP07AERWJ1DVA1W",
    "permissionType": "BUSINESS_ACCESS",
    "grantedBy": "admin-user-id",
    "grantedByName": "管理者",
    "grantedAt": "2026-03-01T00:00:00Z",
    "expiresAt": null,
    "metadata": {}
  }
]
```

---

### POST /api/v1/permissions/screens/folders/grant

フォルダレベルで権限を付与します。指定フォルダ配下の全画面に自動的にアクセス可能になります。

#### リクエスト

```json
{
  "userId": "456",
  "folderPath": "/社員育成管理",
  "permissionType": "BUSINESS_ACCESS"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| userId | string | Yes | ユーザーID（UUID） |
| folderPath | string | Yes | フォルダパス |
| permissionType | string | Yes | `EDIT` / `BUSINESS_ACCESS` |
| expiresAt | datetime | No | 有効期限 |
| metadata | Map<string, string> | No | メタデータ |

> **フォルダ階層チェック**: `/社員育成管理/ダッシュボード` 配下の画面にアクセスする場合、`/社員育成管理` のフォルダ権限があればアクセス可能です（階層を遡って権限チェック）。

---

## 招待 API

**ベースパス**: `/api/invitations`
**権限**: 認証済みユーザー

### エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/invitations/accept/{token}` | 招待承認（パスパラメータ） |
| POST | `/api/invitations/accept` | 招待承認（リクエストボディ） |

> **注意**: 招待の作成・一覧・キャンセル・再送は管理者API（`/api/admin/users/*`）で行います。

---

### POST /api/invitations/accept/{token}

招待を承認します。POST必須（メールクライアントの自動フェッチ防止）。

#### リクエスト

パスパラメータ `token` に招待トークンを指定。リクエストボディは不要。

#### レスポンス (200)

```json
{
  "invitationId": "inv-001",
  "email": "invited@example.com",
  "status": "ACCEPTED",
  "roleId": 2,
  "roleName": "ユーザー",
  "invitedByEmail": "admin@example.com",
  "expiresAt": "2026-04-16T00:00:00Z",
  "createdAt": "2026-03-16T00:00:00Z"
}
```

### POST /api/invitations/accept

リクエストボディでトークンを指定する代替エンドポイント。

#### リクエスト

```json
{
  "token": "abc123..."
}
```

---

**更新日**: 2026-04-02
