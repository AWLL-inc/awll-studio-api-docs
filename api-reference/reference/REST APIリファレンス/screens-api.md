# 画面定義 API (Screens)

**ベースパス**: `/api/v1/screens`
**権限**: SCREEN_DEFINITION:READ / SCREEN_DEFINITION:WRITE

## エンドポイント一覧

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| GET | `/api/v1/screens` | 画面一覧取得 | READ |
| POST | `/api/v1/screens` | 画面作成 | WRITE |
| GET | `/api/v1/screens/{screenId}` | 画面取得（DRAFT優先で最新版） | READ |
| PUT | `/api/v1/screens/{screenId}` | 画面更新（部分更新対応） | WRITE |
| DELETE | `/api/v1/screens/{screenId}` | 画面削除（論理削除） | WRITE |
| GET | `/api/v1/screens/{screenId}/published` | 公開済み画面取得 | READ |
| POST | `/api/v1/screens/{screenId}/publish` | 画面公開（バージョン指定） | WRITE |
| POST | `/api/v1/screens/{screenId}/deploy` | 画面デプロイ（CDN配信） | WRITE |
| POST | `/api/v1/screens/{screenId}/rollback` | ロールバック | WRITE |
| GET | `/api/v1/screens/{screenId}/versions` | バージョン履歴取得 | READ |
| GET | `/api/v1/screens/{screenId}/deployments` | デプロイ履歴取得 | READ |
| DELETE | `/api/v1/screens/{screenId}/versions/{version}` | バージョン物理削除 | WRITE |


---

## GET /api/v1/screens

画面一覧を取得します。

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `limit` | integer | 20 | 取得件数（最大100） |
| `nextToken` | string | - | ページネーショントークン |
| `status` | string | - | フィルタ: `DRAFT` / `PUBLISHED` / `DELETED` |

### レスポンス (200)

一覧時は `ScreenSummaryDTO`（sourceCode除外の軽量版）が返却されます。

```json
{
  "items": [
    {
      "tenantId": "demo",
      "screenId": "scr-001",
      "version": "01ARZ3...",
      "status": "PUBLISHED",
      "screenName": "顧客一覧画面",
      "screenCode": "customer_list",
      "dependencies": ["react", "mui"],
      "createdAt": "2026-03-16T09:00:00Z",
      "updatedAt": "2026-03-16T10:30:00Z",
      "createdBy": "user-uuid",
      "updatedBy": "user-uuid",
      "publishedAt": "2026-03-16T10:00:00Z",
      "publishedVersion": "01ARZ3..."
    }
  ],
  "nextToken": "eyJwayI6..."
}
```

---

## POST /api/v1/screens

画面を新規作成します。

### リクエスト

```json
{
  "screenName": "顧客一覧画面",
  "screenCode": "customer_list",
  "sourceCode": "export default function CustomerList() { ... }"
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|-------------|
| screenName | string | Yes | 1-100文字 |
| screenCode | string | Yes | 1-50文字、`^[a-z0-9_]+$` パターン |
| sourceCode | string | Yes | 0-1,000,000文字 |

---

## PUT /api/v1/screens/{screenId}

画面を更新します（部分更新対応）。

### リクエスト

```json
{
  "screenName": "更新後の画面名",
  "sourceCode": "export default function Updated() { ... }",
  "compiledCode": "...",
  "dependencies": ["react", "mui", "chart.js"]
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| screenName | string | No | 画面名 |
| sourceCode | string | No | ソースコード |
| compiledCode | string | No | コンパイル済みコード |
| dependencies | string[] | No | 依存関係リスト |

---

## POST /api/v1/screens/{screenId}/publish

画面を公開します。

### リクエスト

```json
{
  "version": "01ARZ3..."
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| version | string | Yes | 公開するバージョンID |

---

## POST /api/v1/screens/{screenId}/deploy

画面をCDNにデプロイします。最新DRAFTを公開。

### リクエスト

```json
{
  "message": "v1.2リリース: テーブル表示修正"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| message | string | No | デプロイメッセージ |

### レスポンス (200)

```json
{
  "success": true,
  "version": "01ARZ3...",
  "cdnUrl": "https://cdn.example.com/screens/customer_list/v1.js",
  "deployedAt": "2026-03-16T11:00:00Z",
  "cacheInvalidated": true
}
```

---

## POST /api/v1/screens/{screenId}/rollback

指定バージョンにロールバックします。

### リクエスト

```json
{
  "version": "01ARZ2..."
}
```

### レスポンス (200)

```json
{
  "success": true,
  "currentVersion": "01ARZ2...",
  "rollbackFrom": "01ARZ3...",
  "cacheInvalidated": true
}
```

---

## GET /api/v1/screens/{screenId}/deployments

デプロイ履歴を取得します。

### レスポンス (200)

```json
[
  {
    "version": "01ARZ3...",
    "deployedAt": "2026-03-16T11:00:00Z",
    "message": "v1.2リリース",
    "deployedBy": "user-uuid",
    "isCurrent": true,
    "cdnUrl": "https://cdn.example.com/..."
  }
]
```

---

## データモデル

### ScreenDTO（詳細取得時）

```typescript
{
  tenantId: string;
  screenId: string;
  version: string;              // バージョンID
  status: string;               // DRAFT / PUBLISHED / DELETED
  screenName: string;
  screenCode: string;           // URL-safe識別子
  sourceCode: string;           // ソースコード
  compiledCode: string | null;  // コンパイル済みコード
  dependencies: string[];       // 依存ライブラリ
  fileUrl: string | null;       // ファイルURL
  createdAt: datetime;
  updatedAt: datetime;
  createdBy: string;
  updatedBy: string;
  publishedAt: datetime | null;
  publishedVersion: string | null;
}
```

### ScreenSummaryDTO（一覧取得時）

`ScreenDTO` から `sourceCode` を除外した軽量版。

---

**更新日**: 2026-03-16
