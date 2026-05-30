# 通知センター API

## 概要

アプリ内通知センターの取得・既読管理・通知設定 API です。

**ベースパス**: `/api/v1/notifications`  
**権限**: USER / ADMIN / DEVELOPER / VIEWER（SUPER_ADMIN は通知受信者にならないため対象外）

---

## エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/v1/notifications` | 自分宛の通知一覧を取得 |
| GET | `/api/v1/notifications/unread-count` | 未読通知件数を取得 |
| PATCH | `/api/v1/notifications/{id}/read` | 個別通知を既読化 |
| POST | `/api/v1/notifications/read-all` | 全通知を既読化 |
| GET | `/api/v1/notifications/preferences` | 自分の通知設定を取得 |
| PUT | `/api/v1/notifications/preferences` | 自分の通知設定を更新 |

---

## GET /api/v1/notifications

自分宛の通知一覧を keyset ページネーションで取得します。

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|----------|------|
| limit | integer | 20 | 1ページの件数（1〜100） |
| cursor | string | — | 前ページ末尾の cursor（省略時は先頭から） |
| unreadOnly | boolean | false | true にすると未読のみ取得 |

### レスポンス (200)

```json
{
  "items": [
    {
      "id": 123,
      "type": "COMMENT",
      "sourceType": "record",
      "sourceId": "01ABC...",
      "actor": {
        "userId": "uuid",
        "displayName": "山田 太郎"
      },
      "title": "コメントが追加されました",
      "body": "「顧客一覧」にコメントしました",
      "link": "/forms/01ABC.../answers/01DEF...",
      "formId": "01ABC...",
      "recordId": "01DEF...",
      "isRead": false,
      "createdAt": "2026-05-30T09:00:00Z"
    }
  ],
  "nextCursor": "eyJpZCI6MTIzfQ==",
  "hasMore": true
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| items | array | 通知一覧 |
| items[].id | integer | 通知ID |
| items[].type | string | 通知種別（`COMMENT` / `MENTION` 等） |
| items[].sourceType | string | 発生元リソース種別 |
| items[].sourceId | string | 発生元リソースID |
| items[].actor.userId | string | 通知を発生させたユーザーID |
| items[].actor.displayName | string | 通知を発生させたユーザー名 |
| items[].title | string | 通知タイトル |
| items[].body | string | 通知本文 |
| items[].link | string | 遷移先リンク |
| items[].isRead | boolean | 既読フラグ |
| items[].createdAt | string | 作成日時（ISO 8601） |
| nextCursor | string / null | 次ページ取得用 cursor |
| hasMore | boolean | 次ページが存在するか |

### エラーレスポンス

| HTTPコード | 説明 |
|------------|------|
| 400 | limit が範囲外（< 1）、または cursor が不正 |
| 401 | 認証エラー |
| 403 | ロール不足 |
| 429 | レート制限 |

---

## GET /api/v1/notifications/unread-count

未読通知件数を返します。通知ベルのバッジ表示などの高頻度ポーリングに対応しています。

### レスポンス (200)

```json
{ "count": 5 }
```

---

## PATCH /api/v1/notifications/{id}/read

指定した通知を既読化します。自分宛の通知のみ操作可能です。

### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| id | integer | 通知ID |

### レスポンス

| HTTPコード | 説明 |
|------------|------|
| 204 | 既読化成功（ボディなし） |
| 404 | 通知が存在しないか、他ユーザーの通知 |

---

## POST /api/v1/notifications/read-all

自分宛のすべての未読通知を一括既読化します。

### レスポンス (200)

```json
{ "updated": 12 }
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| updated | integer | 既読化された通知件数 |

---

## GET /api/v1/notifications/preferences

自分の通知設定（種別ごとの ON/OFF）を取得します。プロファイル未作成の場合はデフォルト（全 ON）が返ります。

### レスポンス (200)

```json
{
  "comment": true,
  "mention": true
}
```

---

## PUT /api/v1/notifications/preferences

自分の通知設定を更新します。OFF にした種別の通知は以降生成されません。

### リクエスト

```json
{
  "comment": true,
  "mention": false
}
```

### レスポンス (200)

更新後の通知設定を返します（GET と同じ形式）。

### エラーレスポンス

| HTTPコード | 説明 |
|------------|------|
| 400 | バリデーションエラー |

---

**追加日**: 2026-05-30（PR #2037 — アプリ内通知センター + コメント・メンション機能）
