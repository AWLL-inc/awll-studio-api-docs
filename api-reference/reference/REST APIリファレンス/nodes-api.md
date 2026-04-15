# 階層データ API (Nodes)

**ベースパス**: `/api/answers/{answerId}/nodes`
**権限**: USER または ADMIN

> **重要**: このドキュメントはreference版から大幅に修正されています。

## reference版からの重要な修正点

### 1. ルートノードはAPIで作成できない

- **ルートノードはレコード作成時に自動生成されます**
- `POST /api/answers/{answerId}/nodes` は**子ノード作成専用**です
- ルートノード作成用のAPIは存在しません

### 2. parentRowId は既存ノードのrowIdを指定

- `parentRowId` は **必須かつ非null**
- `null`, `""`, `"ROOT"` はすべてエラーになります
- **既存の親ノードの `rowId` を正確に指定**してください

### 3. fieldCode は親ノードのARRAYフィールドコードを指定

- `fieldCode` は **必須かつ非null**
- 親ノードが持つ **ARRAY型フィールドのfieldCode** を指定します
- 例: 親ノードに `tasks` (ARRAY) フィールドがある場合、`fieldCode: "tasks"`

### 4. Nodes API の操作は answerData に自動同期される（Issue #1325）

- Issue #1325 で answerData 自動同期が実装済み。ノードの**作成・削除・移動**時に `FormAnswer.answerData` が自動同期される
- PUT（ノード更新）時も answerData に自動反映される
- したがって、Nodes API の操作結果はカスタム画面（Screen SDK の `useRecords` / `useRecord`）にも反映される
- `rebuild-index` は不要（自動同期済み）。手動で `rebuild-index` を呼ぶことも可能だが、通常は不要

### 5. PUT /nodes/{rowId} はシャローマージ（部分更新対応）

- Nodes API の PUT は**シャローマージ**。送信フィールドのみ上書きされ、未送信フィールドは既存値が保持される
- 例: `name` と `category` を持つノードで `monthly_sales` だけ送ると、`name` と `category` は保持される
- `{ "field": null }` で明示的にnullクリアも可能

```json
// OK: monthly_salesだけ送ってもnameとcategoryは保持される
{ "data": { "monthly_sales": [...] } }

// OK: 全フィールドを含めても問題なし
{ "data": { "name": "JFS", "category": "awll_studio", "monthly_sales": [...] } }
```

### 6. 大量ネストデータの更新で 504 Gateway Timeout が発生する場合がある

- 3階層以上のネスト × 100件以上のサブレコードを含むレコードのPUT更新で504が発生する
- POST（新規作成）は同じデータ量でも成功する
- 回避策: DELETE → POST で再作成、またはUI手動更新

| 操作 | 方法 | answerData反映 | 504リスク |
|------|------|---------------|----------|
| 新規作成 | POST /answers | ○ | 低 |
| 全体更新 | PUT /answers/{id} | ○ | **高**（ネスト多い場合） |
| 個別ノード更新 | PUT /nodes/{rowId} | ○（自動同期） | 中（504でも成功する場合あり） |
| 削除→再作成 | DELETE + POST | ○ | 低 |

---

## エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/answers/{answerId}/nodes` | ノードを取得（フィルタ・ページネーション対応） |
| GET | `/api/answers/{answerId}/nodes?parentRowId={rowId}` | 直接の子ノードのみ取得（1階層下） |
| GET | `/api/answers/{answerId}/nodes?ancestorRowId={rowId}` | 配下全子孫ノードを取得 |
| GET | `/api/answers/{answerId}/nodes/{rowId}` | ノードを取得（祖先情報含む） |
| GET | `/api/answers/{answerId}/nodes/{parentRowId}/children` | 直接の子ノード取得（ページネーション付き） |
| POST | `/api/answers/{answerId}/nodes` | **子ノードを作成**（ルートノード作成不可） |
| PUT | `/api/answers/{answerId}/nodes/{rowId}` | ノードを更新 |
| DELETE | `/api/answers/{answerId}/nodes/{rowId}` | ノードを削除（子孫も削除） |
| POST | `/api/answers/{answerId}/nodes/{rowId}/copy` | ノードを複製 |
| POST | `/api/answers/{answerId}/nodes/repair-orphans` | 参照切れノード検出・修復（ADMIN専用） |

> **注意**: パスは `/api/answers/{answerId}/nodes` で、`/api/v1/` プレフィックスがありません。

---

## GET /api/answers/{answerId}/nodes

指定レコードのノードを取得します。クエリパラメータで取得範囲を制御できます。

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| parentRowId | string | No | - | 指定ノードの**直接の子ノードのみ**取得（1階層下、GSI1最適化） |
| ancestorRowId | string | No | - | 指定ノードの**配下全子孫ノード**を取得 |
| depth | integer | No | - | 階層深度フィルタ（0=ルート、1=サブテーブル、2=サブサブテーブル） |
| fieldCode | string | No | - | フィールドコードでフィルタ |
| limit | integer | No | 100 | 取得件数上限（1〜1000） |
| offset | integer | No | 0 | オフセット |

> **注意**: `parentRowId` と `ancestorRowId` は排他です。両方指定すると 400 Bad Request になります。どちらも未指定の場合は全ノードを取得します（従来互換）。
>
> **レスポンス形式**: フィルタパラメータ（parentRowId/ancestorRowId/depth/fieldCode）を指定した場合は `PaginatedNodeResponse` が返却されます。パラメータなしの場合は従来互換の `List<NodeResponse>` が返却されます。

### 使い分け

| パターン | ユースケース |
|---------|------------|
| パラメータなし | 全ノード一括取得（小規模データ向け、`List<NodeResponse>` 返却） |
| `?parentRowId={rowId}` | ツリーUI等で展開した階層の直下のノードだけ取得 |
| `?ancestorRowId={rowId}` | 特定サブツリーの全データを取得（他の兄弟ツリーは除外） |
| `?depth=1&limit=50` | 特定階層のノードをページネーション付きで取得 |
| `?fieldCode=tasks&limit=100` | 特定フィールドコードのノードのみ取得 |

### curl例

```bash
# 全ノード取得（従来互換）
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  "$API/api/answers/$ANSWER_ID/nodes"

# ルートノードの直接の子ノードのみ取得
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  "$API/api/answers/$ANSWER_ID/nodes?parentRowId=$ROOT_ROW_ID"

# 特定ノード配下の全子孫を取得
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  "$API/api/answers/$ANSWER_ID/nodes?ancestorRowId=$NODE_ROW_ID"
```

### レスポンス (200)

```json
[
  {
    "rowId": "01KKD2ZB8Q1D5JPFNJ30CMNKV9",
    "parentRowId": null,
    "answerRef": "01KKD2ZB6EPF5CR8XXS9C3EM5B",
    "fieldCode": null,
    "depth": 0,
    "ancestorPath": "",
    "data": {
      "name": "プロジェクトA",
      "project_manager": "田中太郎",
      "tasks": [
        { "__rowId": "01KKD3AB..." }
      ]
    }
  },
  {
    "rowId": "01KKD3AB...",
    "parentRowId": "01KKD2ZB8Q1D5JPFNJ30CMNKV9",
    "answerRef": "01KKD2ZB6EPF5CR8XXS9C3EM5B",
    "fieldCode": "tasks",
    "depth": 1,
    "ancestorPath": "01KKD2ZB8Q1D5JPFNJ30CMNKV9",
    "data": {
      "task_name": "設計",
      "assignee": "鈴木一郎",
      "sub_tasks": []
    }
  }
]
```

### ノードの階層構造

```
ルートノード (depth=0, parentRowId=null, fieldCode=null)
├── 子ノード1 (depth=1, parentRowId=ルートのrowId, fieldCode="tasks")
│   ├── 孫ノード1 (depth=2, parentRowId=子1のrowId, fieldCode="sub_tasks")
│   └── 孫ノード2 (depth=2)
└── 子ノード2 (depth=1, parentRowId=ルートのrowId, fieldCode="tasks")
```

---

## GET /api/answers/{answerId}/nodes/{rowId}

指定ノードを祖先情報とともに取得します。

### レスポンス (200)

```json
{
  "node": {
    "rowId": "01KKD3AB...",
    "parentRowId": "01KKD2ZB8Q1D5JPFNJ30CMNKV9",
    "answerRef": "01KKD2ZB6EPF5CR8XXS9C3EM5B",
    "fieldCode": "tasks",
    "depth": 1,
    "ancestorPath": "01KKD2ZB8Q1D5JPFNJ30CMNKV9",
    "data": {
      "task_name": "設計",
      "assignee": "鈴木一郎"
    }
  },
  "ancestors": [
    {
      "rowId": "01KKD2ZB8Q1D5JPFNJ30CMNKV9",
      "fieldCode": null,
      "depth": 0,
      "data": {
        "name": "プロジェクトA",
        "project_manager": "田中太郎"
      }
    }
  ]
}
```

---

## POST /api/answers/{answerId}/nodes

**子ノードを作成します。** ルートノードの作成はこのAPIでは行えません。

### リクエスト

```json
{
  "parentRowId": "01KKD2ZB8Q1D5JPFNJ30CMNKV9",
  "fieldCode": "tasks",
  "data": {
    "task_name": "テストタスク",
    "assignee": "山田花子",
    "status": "未着手"
  }
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| parentRowId | string | **Yes** | 親ノードの `rowId`。既存ノードのrowIdを正確に指定すること |
| fieldCode | string | **Yes** | 親ノードが持つARRAY型フィールドの `fieldCode` |
| data | object | **Yes** | ノードデータ（ARRAYフィールドのサブフィールド定義に準拠） |

### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| formId | string | No（推奨） | データベースID。指定すると内部のanswer_index逆引きを回避し、パフォーマンスが向上します |

### curl例

```bash
# 1. まず全ノードを取得してルートノードのrowIdを確認
ROOT_ROW_ID=$(curl -s -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  "$API/api/answers/$ANSWER_ID/nodes" \
  | jq -r '.[0].rowId')

# 2. ルートノード配下に子ノードを作成
curl -s -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: $TENANT" \
  -H "Content-Type: application/json; charset=utf-8" \
  "$API/api/answers/$ANSWER_ID/nodes" \
  -d "{
    \"parentRowId\": \"$ROOT_ROW_ID\",
    \"fieldCode\": \"tasks\",
    \"data\": {
      \"task_name\": \"新しいタスク\",
      \"assignee\": \"山田花子\"
    }
  }" | jq .
```

### レスポンス (201 Created)

```json
{
  "rowId": "01KKD4CD...",
  "parentRowId": "01KKD2ZB8Q1D5JPFNJ30CMNKV9",
  "answerRef": "01KKD2ZB6EPF5CR8XXS9C3EM5B",
  "fieldCode": "tasks",
  "depth": 1,
  "ancestorPath": "01KKD2ZB8Q1D5JPFNJ30CMNKV9",
  "data": {
    "task_name": "新しいタスク",
    "assignee": "山田花子"
  }
}
```

### エラー

| Status | 原因 |
|--------|------|
| 400 | parentRowId/fieldCode/dataが不正（null, 空文字等）、または階層の深さが上限を超過 |
| 404 | 指定した parentRowId のノードが存在しない |

### 作成後の処理

子ノード作成後、関連する集計フィールドがあれば自動的に再計算されます。

> **✅ answerData自動同期（Issue #1325）**: 作成後、`FormAnswer.answerData` は自動同期されます。
> `rebuild-index` の手動呼び出しは通常不要です。

---

## PUT /api/answers/{answerId}/nodes/{rowId} — シャローマージ（部分更新対応）

ノード（サブテーブル行）のデータを更新します。親ノード変更（移動）もサポート。

> **✅ シャローマージ**: `data` に含まれるフィールドのみ上書きされ、未送信フィールドは既存値が保持されます。
> - `{ "field": null }` → 明示的にnullクリア
> - `{}` → 既存データ全保持（何も変更しない）
>
> **✅ answerData自動同期（Issue #1325）**: ノード更新後、`FormAnswer.answerData` は自動同期されます。
> `rebuild-index` の手動呼び出しは通常不要です。

### 🚨 CRITICAL: PUT で ARRAY型フィールドのデータを data 内に直接書き込まないこと

PUT はノードの**フラットフィールド**（TEXT, NUMBER, SELECT等）を更新するためのAPIです。**ARRAY型フィールドの配列を `data` 内に直接含めてはいけません。**

```
❌ 間違い: ARRAY型フィールドの配列を data に埋め込む
PUT /api/answers/{answerId}/nodes/{rowId}
{ "data": { "status": "drafting", "comments": [{"name": "コメント"}] } }

→ comments は JSON配列として data に埋め込まれるだけ
→ 子ノード（depth=2）は生成されない
→ 画面は子ノードを参照するため「コメント (0件)」と表示される（幽霊データ）
→ v1 API の GET では見えるが、画面には表示されない

✅ 正しい方法: ARRAY型フィールドの子要素は POST で子ノードとして追加
POST /api/answers/{answerId}/nodes
{ "parentRowId": "{親rowId}", "fieldCode": "comments", "data": {"name": "コメント"} }

→ 独立した子ノード（depth=2）が作成され、画面で正しく表示される
```

**PUTとPOSTの使い分け:**

| 操作 | API | 用途 |
|------|-----|------|
| 既存ノードのフラットフィールド更新 | `PUT /nodes/{rowId}` | status変更、テキスト更新など |
| サブレコードに新しい行を追加 | `POST /nodes` | コメント追加、タスク追加など |
| ノードの削除 | `DELETE /nodes/{rowId}` | 不要な行の削除 |

**注意:**
- PUT時にARRAYフィールド名（`comments`, `tasks`等）をdataに含めると、既存の子ノードへの参照（`__rowId`）が消失する可能性がある
- PUTは変更対象のフラットフィールドのみに限定すること

### リクエスト

```json
// ✅ 部分フィールド送信（statusのみ変更、他フィールドは保持）
{
  "data": {
    "status": "完了"
  }
}

// ✅ 全フィールド送信も可能（フラットフィールドのみ）
{
  "data": {
    "task_name": "更新後のタスク名",
    "assignee": "鈴木一郎",
    "status": "完了"
  }
}

// ❌ ARRAY型フィールドを含めてはいけない
{
  "data": {
    "status": "drafting",
    "comments": [{"name": "コメント"}]
  }
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| data | object | Yes | 更新データ（変更フィールドのみ指定可能、シャローマージ） |
| newParentRowId | string | No | 移動先の親ノードrowId（指定時にノード移動） |

### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| formId | string | No（推奨） | データベースID。指定するとパフォーマンスが向上します |

### 更新が失敗する場合の代替手段

1. `DELETE /api/answers/{answerId}/nodes/{rowId}` で既存ノードを削除
2. `POST /api/answers/{answerId}/nodes` で変更後のデータで再作成

> answerData は自動同期されるため、`rebuild-index` の手動呼び出しは通常不要です。

### レスポンス (200)

`NodeResponse` を返却。

### エラー

| Status | 原因 |
|--------|------|
| 400 | 循環参照が検出された（自分自身の子孫への移動等） |
| 404 | 指定rowIdのノード、または移動先の親ノードが存在しない |
| 504 | Gateway Timeout（子ノードが大量の場合。個別ノード更新に分割を推奨） |

---

## DELETE /api/answers/{answerId}/nodes/{rowId}

ノードを削除します。**子孫ノードも連鎖削除されます。**

### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| formId | string | No（推奨） | データベースID。指定するとパフォーマンスが向上します |

### レスポンス (204 No Content)

---

## POST /api/answers/{answerId}/nodes/{rowId}/copy

ノードを複製します。

### リクエスト

```json
{}
```

空オブジェクトで可。

### レスポンス (200)

```json
{
  "rowId": "01KKD6GH..."
}
```

---

## GET /api/answers/{answerId}/nodes/{parentRowId}/children

指定ノードの直接の子ノードをページネーション付きで取得します（GSI1最適化）。

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| fieldCode | string | No | - | フィールドコードでフィルタ |
| limit | integer | No | 100 | 取得件数上限（1〜1000） |
| offset | integer | No | 0 | オフセット |

### レスポンス (200)

```json
{
  "items": [
    {
      "rowId": "01KKD3AB...",
      "parentRowId": "01KKD2ZB8Q1D5JPFNJ30CMNKV9",
      "answerRef": "01KKD2ZB6EPF5CR8XXS9C3EM5B",
      "fieldCode": "tasks",
      "depth": 1,
      "ancestorPath": "01KKD2ZB8Q1D5JPFNJ30CMNKV9",
      "data": { ... }
    }
  ],
  "totalCount": 25,
  "limit": 100,
  "offset": 0
}
```

---

## POST /api/answers/{answerId}/nodes/repair-orphans

参照切れ（orphan）ノードを検出・修復します。**ADMIN権限が必要です。**

`FormAnswer.answerData` 内の `__rowId` 参照に対応する Node レコードが存在しない場合に、Node レコードを再構築します。

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| formId | string | Yes | - | データベースID |
| dryRun | boolean | No | true | `true`: 検出のみ（修復しない）、`false`: 検出＋修復 |

### レスポンス (200)

修復結果（検出されたorphanノード数、修復されたノード数等）が返却されます。

### エラー

| Status | 原因 |
|--------|------|
| 400 | パラメータ不正 |
| 403 | ADMIN権限がない |
| 404 | 指定したレコードが存在しない |

---

## データモデル

### NodeResponse

```typescript
{
  rowId: string;           // ノードID
  parentRowId: string | null;  // 親ノードID（ルートはnull）
  answerRef: string;       // 所属レコードID
  fieldCode: string | null;    // ARRAYフィールドコード（ルートはnull）
  depth: number;           // 階層深度（ルート=0）
  ancestorPath: string;    // 祖先パス
  data: object;            // ノードデータ
}
```

### NodeWithAncestorsResponse

```typescript
{
  node: NodeResponse;
  ancestors: AncestorNodeResponse[];  // ルートから順に祖先ノード
}
```

### AncestorNodeResponse

```typescript
{
  rowId: string;
  fieldCode: string | null;
  depth: number;
  data: object;
}
```

### PaginatedNodeResponse

フィルタパラメータ指定時に返却されるページネーション付きレスポンス。

```typescript
{
  items: NodeResponse[];
  totalCount: number;
  limit: number;
  offset: number;
}
```

---

## FAQ（feedbackから）

### Q: ルートノードはどうやって作成するのか？

**A**: ルートノードはレコード作成（`POST /api/v1/forms/{formId}/answers`）時に自動生成されます。明示的に作成するAPIはありません。ルートノードの特徴：
- `depth`: 0
- `parentRowId`: null
- `fieldCode`: null
- `ancestorPath`: ""（空文字）

### Q: 大量ノードがあるレコードで画面が遅い場合は？

**A**: 全ノード取得の代わりに階層指定パラメータを使ってください。
- `?parentRowId={rowId}` で必要な階層の子ノードだけ取得（ツリーUIの遅延読み込みに最適）
- `?ancestorRowId={rowId}` で特定サブツリーだけ取得（他の兄弟ツリーの大量データを除外）

### Q: parentRowId に何を指定すればよいか？

**A**: `GET /api/answers/{answerId}/nodes` で全ノードを取得し、親にしたいノードの `rowId` を指定してください。ルートノード直下に子を作成する場合は、`depth: 0` のノードの `rowId` を使用します。

### Q: fieldCode に何を指定すればよいか？

**A**: 親ノードが持つ ARRAY 型フィールドの `fieldCode` を指定します。例えば、フォーム定義で `tasks` という ARRAY フィールドがある場合、`fieldCode: "tasks"` を指定します。フォーム定義（`GET /api/v1/forms/{formId}`）の `schema` から確認できます。

### Q: data にはどのような構造を渡すべきか？

**A**: ARRAY フィールドの `subFields` で定義されたフィールドに準拠したJSONを渡します。例えばARRAYフィールド `tasks` の subFields が `task_name` (TEXT), `status` (SELECT) の場合：

```json
{
  "data": {
    "task_name": "新しいタスク",
    "status": "未着手"
  }
}
```

---

### Q: PUT で comments 配列を data に書き込んだが画面に表示されない

**A**: PUT はフラットフィールドの更新用です。ARRAY型フィールドの子要素は `POST /api/answers/{answerId}/nodes` で子ノードとして追加してください。PUT で data 内に配列を書き込むと、JSON埋め込みデータとしてノードに保存されますが、画面は depth=2 の独立した子ノードを参照するため「0件」と表示されます。修復するには、PUT で埋め込みデータをクリアし、POST で子ノードとして再投入してください。

---

**更新日**: 2026-04-15
