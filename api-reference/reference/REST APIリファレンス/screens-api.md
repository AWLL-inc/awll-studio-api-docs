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
| POST | `/api/v1/screens/{screenId}/compile` | 画面コンパイル | WRITE |
| GET | `/api/v1/screens/folders` | フォルダ一覧取得 | READ |
| POST | `/api/v1/screens/{screenId}/move` | 画面フォルダ移動 | WRITE |


---

## GET /api/v1/screens

画面一覧を取得します。

### クエリパラメータ

| パラメータ | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `limit` | integer | 20 | 取得件数（最大100） |
| `nextToken` | string | - | ページネーショントークン |
| `status` | string | - | フィルタ: `DRAFT` / `PUBLISHED` / `DELETED` |
| `folder` | string | - | フォルダパスフィルタ（例: `/顧客管理`） |

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
      "publishedVersion": "01ARZ3...",
      "folderPath": "/顧客管理"
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
  "sourceCode": "export default function CustomerList() { ... }",
  "folderPath": "/顧客管理"
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|-------------|
| screenName | string | Yes | 1-100文字 |
| screenCode | string | Yes | 1-50文字、`^[a-z0-9_]+$` パターン |
| sourceCode | string | Yes | 0-1,000,000文字 |
| folderPath | string | No | 最大255文字、デフォルト `/`、`..` 禁止 |

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
  isMultiFile: boolean;           // マルチファイルモード
  entryPoint: string;             // エントリーポイント（デフォルト: "App.tsx"）
  folderPath: string;             // フォルダパス（デフォルト: "/"）
}
```

### ScreenSummaryDTO（一覧取得時）

`ScreenDTO` から `sourceCode` / `compiledCode` を除外した軽量版。`folderPath` を含む。

---

## POST /api/v1/screens/{screenId}/compile

画面ソースコードをesbuildでコンパイルし、コンパイル済みコードを画面定義に保存します。デプロイ前に必ず実行してください。

### リクエスト

```json
{
  "sourceCode": "export default function App() { ... }",
  "files": { "App.tsx": "...", "utils.ts": "..." },
  "entryPoint": "App.tsx"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| sourceCode | string | No | 単一ファイルモード時のソースコード |
| files | object | No | マルチファイルモード時のファイルマップ |
| entryPoint | string | No | エントリーポイント（デフォルト: `App.tsx`） |

> いずれも未指定の場合、DynamoDBに保存済みのソースコードを使用します。

### レスポンス (200)

```json
{
  "success": true,
  "compiledCodePreview": "!function(){...",
  "compiledCodeSize": 12345,
  "errors": null,
  "warnings": []
}
```

---

## GET /api/v1/screens/folders

テナント内のフォルダ一覧を取得します。画面の `folderPath` 属性からユニークなフォルダパスを動的生成します。

### レスポンス (200)

```json
["/", "/顧客管理", "/顧客管理/ダッシュボード", "/売上管理"]
```

---

## POST /api/v1/screens/{screenId}/move

画面を指定フォルダに移動します。

### リクエスト

```json
{
  "folderPath": "/顧客管理/ダッシュボード"
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|-------------|
| folderPath | string | Yes | 最大255文字、`..` 禁止（パストラバーサル防止） |

### レスポンス (200)

更新された `ScreenDTO` が返却されます。

---

## Screen Files API（マルチファイル画面定義）

マルチファイルモードの画面定義に対して、個別ファイルのCRUD操作を行うAPIです。

**前提条件**: 対象の画面がマルチファイルモード（`isMultiFile: true`）であること。単一ファイルモードの画面に対してこれらのAPIを呼び出すと `400 Bad Request` が返されます。

### エンドポイント一覧

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| GET | `/api/v1/screens/{screenId}/files` | ファイル一覧取得 | READ |
| GET | `/api/v1/screens/{screenId}/files/{filePath}` | ファイル取得 | READ |
| PUT | `/api/v1/screens/{screenId}/files/{filePath}` | ファイル作成/更新 | WRITE |
| DELETE | `/api/v1/screens/{screenId}/files/{filePath}` | ファイル削除 | WRITE |
| POST | `/api/v1/screens/{screenId}/files/rename` | ファイルリネーム/移動 | WRITE |
| POST | `/api/v1/screens/{screenId}/convert-to-multifile` | 単一→マルチファイル変換 | WRITE |

---

### GET /api/v1/screens/{screenId}/files

マルチファイル画面のファイル一覧を取得します。

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `screenId` | string | 画面ID |

#### レスポンス (200)

```json
[
  {
    "filePath": "App.tsx",
    "contentType": "text/typescript",
    "size": 1024,
    "updatedAt": "2026-03-25T09:00:00Z"
  },
  {
    "filePath": "components/Header.tsx",
    "contentType": "text/typescript",
    "size": 512,
    "updatedAt": "2026-03-25T09:05:00Z"
  },
  {
    "filePath": "styles/main.css",
    "contentType": "text/css",
    "size": 256,
    "updatedAt": "2026-03-25T09:10:00Z"
  }
]
```

#### エラーレスポンス

| ステータス | 説明 |
|-----------|------|
| 400 | 画面がマルチファイルモードでない |
| 403 | SCREEN_DEFINITION:READ 権限不足 |
| 404 | 画面が存在しない |

---

### GET /api/v1/screens/{screenId}/files/{filePath}

指定パスのファイル内容を取得します。`filePath` はネストしたパスを含むことができます（例: `components/Header.tsx`）。

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `screenId` | string | 画面ID |
| `filePath` | string | ファイルパス（例: `App.tsx`, `components/Header.tsx`） |

#### レスポンス (200)

```json
{
  "filePath": "components/Header.tsx",
  "content": "import React from 'react';\n\nexport default function Header() {\n  return <header>ヘッダー</header>;\n}\n",
  "contentType": "text/typescript",
  "size": 512,
  "updatedAt": "2026-03-25T09:05:00Z"
}
```

#### エラーレスポンス

| ステータス | 説明 |
|-----------|------|
| 400 | 画面がマルチファイルモードでない、またはファイルパスが空 |
| 403 | SCREEN_DEFINITION:READ 権限不足 |
| 404 | 画面またはファイルが存在しない |

---

### PUT /api/v1/screens/{screenId}/files/{filePath}

ファイルを作成または更新します。ファイルが既に存在する場合は上書きされます。

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `screenId` | string | 画面ID |
| `filePath` | string | ファイルパス |

#### リクエスト

```json
{
  "content": "import React from 'react';\n\nexport default function Header() {\n  return <header>ヘッダー</header>;\n}\n"
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|-------------|
| content | string | Yes | 最大1,000,000文字（1MB） |

#### レスポンス (200)

```json
{
  "filePath": "components/Header.tsx",
  "content": "import React from 'react';\n\nexport default function Header() {\n  return <header>ヘッダー</header>;\n}\n",
  "contentType": "text/typescript",
  "size": 512,
  "updatedAt": "2026-03-25T10:00:00Z"
}
```

#### エラーレスポンス

| ステータス | 説明 |
|-----------|------|
| 400 | 画面がマルチファイルモードでない、ファイルパスが空、またはcontentが1MBを超過 |
| 403 | SCREEN_DEFINITION:WRITE 権限不足 |
| 404 | 画面が存在しない |

#### 注意事項

- ファイル保存後、マニフェスト（ファイル一覧メタデータ）が自動的に再生成されます
- `contentType` はファイル拡張子から自動判定されます

---

### DELETE /api/v1/screens/{screenId}/files/{filePath}

指定パスのファイルを削除します。

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `screenId` | string | 画面ID |
| `filePath` | string | ファイルパス |

#### レスポンス (200)

レスポンスボディなし。

#### エラーレスポンス

| ステータス | 説明 |
|-----------|------|
| 400 | 画面がマルチファイルモードでない、ファイルパスが空、またはエントリーポイントを削除しようとした |
| 403 | SCREEN_DEFINITION:WRITE 権限不足 |
| 404 | 画面が存在しない |

#### 注意事項

- **エントリーポイント（デフォルト: `App.tsx`）は削除できません**。エントリーポイントを変更するには、先にリネームAPIで別のファイルに移動してください。
- 削除後、マニフェストが自動的に再生成されます。

---

### POST /api/v1/screens/{screenId}/files/rename

ファイルをリネームまたは移動します。

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `screenId` | string | 画面ID |

#### リクエスト

```json
{
  "oldPath": "components/Header.tsx",
  "newPath": "components/AppHeader.tsx"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| oldPath | string | Yes | 現在のファイルパス |
| newPath | string | Yes | 新しいファイルパス |

#### レスポンス (200)

```json
{
  "filePath": "components/AppHeader.tsx",
  "contentType": "text/typescript",
  "size": 512,
  "updatedAt": "2026-03-25T10:30:00Z"
}
```

#### エラーレスポンス

| ステータス | 説明 |
|-----------|------|
| 400 | 画面がマルチファイルモードでない、パスが空、または移動先に既にファイルが存在する |
| 403 | SCREEN_DEFINITION:WRITE 権限不足 |
| 404 | 画面が存在しない |

#### 注意事項

- エントリーポイントファイルをリネームした場合、画面定義のエントリーポイント設定も自動的に更新されます。
- リネーム後、マニフェストが自動的に再生成されます。

---

### POST /api/v1/screens/{screenId}/convert-to-multifile

単一ファイルモードの画面をマルチファイルモードに変換します。既存の `sourceCode` が `App.tsx` として保存されます。

#### パスパラメータ

| パラメータ | 型 | 説明 |
|-----------|-----|------|
| `screenId` | string | 画面ID |

#### リクエスト

リクエストボディなし。

#### レスポンス (200)

```json
{
  "success": true,
  "screenId": "scr-001",
  "version": "01ARZ3...",
  "entryPoint": "App.tsx",
  "fileCount": 1
}
```

#### エラーレスポンス

| ステータス | 説明 |
|-----------|------|
| 400 | 既にマルチファイルモードである |
| 403 | SCREEN_DEFINITION:WRITE 権限不足 |
| 404 | 画面が存在しない |

#### 注意事項

- 変換は不可逆です。マルチファイルモードから単一ファイルモードへは戻せません。
- 既存の `sourceCode` フィールドの内容がエントリーポイント（`App.tsx`）として自動的に保存されます。
- 変換後は Screen Files API を使ってファイルを追加・編集できます。

---

### Screen Files データモデル

#### ScreenFileDTO（ファイル詳細）

```typescript
{
  filePath: string;       // ファイルパス（例: "App.tsx", "components/Header.tsx"）
  content: string;        // ファイル内容
  contentType: string;    // コンテンツタイプ（例: "text/typescript", "text/css"）
  size: number;           // ファイルサイズ（バイト）
  updatedAt: datetime;    // 最終更新日時
}
```

#### ScreenFileSummaryDTO（ファイル一覧用）

`ScreenFileDTO` から `content` を除外した軽量版。

```typescript
{
  filePath: string;       // ファイルパス
  contentType: string;    // コンテンツタイプ
  size: number;           // ファイルサイズ（バイト）
  updatedAt: datetime;    // 最終更新日時
}
```

#### SaveFileRequest

```typescript
{
  content: string;        // ファイル内容（最大1MB）
}
```

#### RenameFileRequest

```typescript
{
  oldPath: string;        // 現在のファイルパス
  newPath: string;        // 新しいファイルパス
}
```

#### ConvertToMultiFileResponse

```typescript
{
  success: boolean;       // 変換成功
  screenId: string;       // 画面ID
  version: string;        // バージョンID
  entryPoint: string;     // エントリーポイントファイルパス
  fileCount: number;      // 変換後のファイル数
}
```

---

**更新日**: 2026-03-30
