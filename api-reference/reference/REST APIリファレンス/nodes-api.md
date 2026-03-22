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

### 4. Nodes API で更新しても answerData には反映されない

- Nodes API（PUT `/api/answers/{answerId}/nodes/{rowId}`）でノードを更新しても、**answerData（検索インデックス）には自動反映されない**
- カスタム画面（Screen SDK の `useRecords` / `useRecord`）は answerData を読むため、**Nodes API だけでは画面に反映されない**
- answerData との整合性を保つには、PUT `/api/v1/forms/{formId}/answers/{answerId}` でanswerData全体を更新する必要がある

### 5. PUT /nodes/{rowId} は全フィールドを送ること

- Nodes API の PUT は**全フィールド置換**。送らなかったフィールドは消える
- 例: `name` と `category` を持つノードで `monthly_sales` だけ送ると、`name` と `category` が消失する

```json
// NG: monthly_salesだけ送ると、nameとcategoryが消える
{ "data": { "monthly_sales": [...] } }

// OK: 全フィールドを含める
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
| 個別ノード更新 | PUT /nodes/{rowId} | × | 中（504でも成功する場合あり） |
| 削除→再作成 | DELETE + POST | ○ | 低 |

---

## エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/answers/{answerId}/nodes` | 全ノードを取得 |
| GET | `/api/answers/{answerId}/nodes/{rowId}` | ノードを取得（祖先情報含む） |
| POST | `/api/answers/{answerId}/nodes` | **子ノードを作成**（ルートノード作成不可） |
| PUT | `/api/answers/{answerId}/nodes/{rowId}` | ノードを更新 |
| DELETE | `/api/answers/{answerId}/nodes/{rowId}` | ノードを削除（子孫も削除） |
| POST | `/api/answers/{answerId}/nodes/{rowId}/copy` | ノードを複製 |

> **注意**: パスは `/api/answers/{answerId}/nodes` で、`/api/v1/` プレフィックスがありません。

---

## GET /api/answers/{answerId}/nodes

指定レコードの全ノードを取得します。

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

> **⚠️ answerData非同期**: 作成後、`FormAnswer.answerData` は自動更新されません。
> 検索やカスタム画面に反映するには `POST /api/v1/forms/{formId}/answers/rebuild-index` が必要です。

---

## PUT /api/answers/{answerId}/nodes/{rowId} — 全フィールド置換

ノード（サブテーブル行）のデータを更新します。親ノード変更（移動）もサポート。

> **⚠️ 全フィールド置換**: `data` に含まれないフィールドは消失します。
> 変更するフィールドだけでなく、既存フィールドも全て含めて送信してください。
>
> **⚠️ answerData非同期**: ノード更新後、`FormAnswer.answerData` は自動更新されません。
> カスタム画面に反映するには `POST /api/v1/forms/{formId}/answers/rebuild-index` が必要です。

### リクエスト

```json
// ✅ 正しい（全フィールド送信）
{
  "data": {
    "task_name": "更新後のタスク名",
    "assignee": "鈴木一郎",
    "status": "完了"
  }
}

// ❌ 誤り（statusだけ送ると他フィールドが消失）
{
  "data": {
    "status": "完了"
  }
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| data | object | Yes | **全フィールド**を含む更新データ（部分更新不可） |
| newParentRowId | string | No | 移動先の親ノードrowId（指定時にノード移動） |

### 更新が失敗する場合の代替手段

1. `DELETE /api/answers/{answerId}/nodes/{rowId}` で既存ノードを削除
2. `POST /api/answers/{answerId}/nodes` で変更後のデータで再作成
3. `POST /api/v1/forms/{formId}/answers/rebuild-index` でインデックス再構築

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
  "newRowId": "01KKD6GH..."
}
```

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

---

## FAQ（feedbackから）

### Q: ルートノードはどうやって作成するのか？

**A**: ルートノードはレコード作成（`POST /api/v1/forms/{formId}/answers`）時に自動生成されます。明示的に作成するAPIはありません。ルートノードの特徴：
- `depth`: 0
- `parentRowId`: null
- `fieldCode`: null
- `ancestorPath`: ""（空文字）

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

**更新日**: 2026-03-16
