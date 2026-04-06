# Webhook・メニュー API

## Webhook API

**ベースパス**: `/api/v1/webhooks`
**権限**: ADMIN ロール必須

### エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/v1/webhooks` | Webhook一覧取得 |
| POST | `/api/v1/webhooks` | Webhook作成 |
| GET | `/api/v1/webhooks/{webhookId}` | Webhook取得 |
| PUT | `/api/v1/webhooks/{webhookId}` | Webhook更新 |
| DELETE | `/api/v1/webhooks/{webhookId}` | Webhook削除（冪等） |
| POST | `/api/v1/webhooks/{webhookId}/test` | Webhookテスト送信 |

> **注意**: `webhookId` は `integer (int64)` 型です。

---

### POST /api/v1/webhooks

Webhookを作成します。

#### リクエスト

```json
{
  "url": "https://example.com/webhook",
  "events": ["answer.created", "answer.updated", "answer.deleted"],
  "secret": "your-hmac-secret"
}
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|------|-------------|------|
| url | string | Yes | `^https?://.*` | Webhook送信先URL |
| events | string[] | Yes | - | 購読イベント一覧 |
| secret | string | No | - | HMAC署名用シークレット |

---

### PUT /api/v1/webhooks/{webhookId}

Webhookを更新します。

#### リクエスト

```json
{
  "url": "https://example.com/new-webhook",
  "events": ["answer.created"],
  "secret": "new-secret",
  "isActive": true
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| url | string | No | 送信先URL |
| events | string[] | No | 購読イベント |
| secret | string | No | HMAC署名用シークレット |
| isActive | boolean | No | 有効/無効 |

---

### DELETE /api/v1/webhooks/{webhookId}

冪等削除（存在しなくても200を返却）。

---

### WebhookResponse

```typescript
{
  webhookId: number;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## メニュー API

**ベースパス**: `/api/v1/menu`
**権限**: 取得は全ユーザー / 更新はMENU:WRITE

### エンドポイント一覧

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| GET | `/api/v1/menu` | メニュー取得 | 認証済みユーザー |
| PUT | `/api/v1/menu` | メニュー更新 | MENU:WRITE |

> **注意**: GET は権限に応じてフィルタリングされます。DEVELOPER/USER権限の場合、BUSINESS_ACCESS権限がないフォームのメニュー項目は非表示になります。

---

### GET /api/v1/menu

サイドバーメニューを取得します。

#### レスポンス (200)

```json
{
  "items": [
    {
      "id": "menu-001",
      "label": "顧客管理",
      "icon": "People",
      "type": "FORM",
      "targetId": "customer-db",
      "url": null,
      "order": 1,
      "visible": true
    },
    {
      "id": "menu-002",
      "label": "ダッシュボード",
      "icon": "Dashboard",
      "type": "SCREEN",
      "targetId": "scr-dashboard",
      "url": null,
      "order": 2,
      "visible": true
    },
    {
      "id": "menu-003",
      "label": "外部リンク",
      "icon": "OpenInNew",
      "type": "EXTERNAL_LINK",
      "targetId": null,
      "url": "https://docs.example.com",
      "order": 3,
      "visible": true
    }
  ],
  "updatedAt": "2026-03-16T10:00:00Z"
}
```

---

### PUT /api/v1/menu

メニューを更新します。

#### リクエスト

```json
{
  "items": [
    {
      "id": "menu-001",
      "label": "顧客管理",
      "icon": "People",
      "type": "FORM",
      "targetId": "customer-db",
      "order": 1,
      "visible": true
    }
  ]
}
```

#### MenuItemRequest

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | No | メニュー項目ID（更新時） |
| label | string | Yes | 表示名 |
| icon | string | Yes | アイコン名（MUI Icons） |
| type | enum | Yes | `SCREEN` / `FORM` / `EXTERNAL_LINK` |
| targetId | string | 条件付き | SCREEN/FORM時: 画面ID/データベースID |
| url | string | 条件付き | EXTERNAL_LINK時: URL |
| order | integer | Yes | 表示順 |
| visible | boolean | Yes | 表示/非表示 |

---

**更新日**: 2026-03-16
