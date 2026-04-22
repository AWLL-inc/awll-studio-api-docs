# データ更新API ベストプラクティス

**作成日**: 2026-04-03
**対象**: AWLL Studio API v1 / MCP Server / 画面SDK

---

## 背景

2026-04-03にPUT APIの誤用によるデータ消失インシデントが発生。`getAnswer` → 編集 → `updateAnswer` のラウンドトリップにより、ARRAYフィールド15件・USERフィールドが全消失した。本ドキュメントはこの教訓をもとに、安全なデータ更新パターンを定義する。

---

## 致命的アンチパターン

### GET → 編集 → PUT ラウンドトリップ

```
❌ 絶対にやってはいけない

1. GET /api/v1/forms/{formId}/answers/{answerId}
   → answerData全体を取得

2. JavaScriptでanswerDataを編集

3. PUT /api/v1/forms/{formId}/answers/{answerId}
   body: { answerData: (編集後の全データ) }
```

#### なぜ壊れるか

| データ型 | GETが返す形式 | PUTが期待する形式 | 結果 |
|---------|-------------|-----------------|------|
| ARRAY（サブテーブル） | `__rowId`のみの参照。中身はNodes API管理 | 全フィールドデータ | **全行のフィールドが空に上書き** |
| USER | `{userId, username, email}` オブジェクト | 保存用正規化形式 | **空オブジェクト `{}` に上書き** |
| TEXT, NUMBER等 | そのまま | そのまま | 正常 |

`getAnswer` は**表示用の展開済みデータ**を返す。`updateAnswer` は**保存用の正規化データ**を期待する。この形式の不一致がデータ消失の原因。

---

## やりたいこと別: 正しいAPI選択

### 判断フローチャート

```
やりたいことは？
│
├─ ルートフィールドの更新（TEXT, SELECT, NUMBER等）
│  └─ ✅ patchAnswer（部分更新）
│
├─ サブテーブル（ARRAY）の操作
│  ├─ 行の追加        → ✅ createNode
│  ├─ 行の更新        → ✅ updateNode（自動マージ）
│  ├─ 行の削除        → ✅ deleteNode
│  └─ 全行の一括置換  → ✅ replaceSubtableRows
│
├─ 特定フィールドの部分更新（ネスト含む）
│  └─ ✅ patchAnswer（operations配列で複数操作可能）
│
└─ answerData全体の置換
   └─ ❌ updateAnswer は原則使用禁止
      └─ ARRAYフィールド・USERフィールドがないことを確認した場合のみ使用可
```

### API対応表

| やりたいこと | API | メソッド | 安全性 |
|---|---|---|---|
| ルートフィールドの更新 | `patchAnswer` | PATCH | ✅ 安全 |
| サブテーブル行の追加 | `createNode` | POST | ✅ 安全 |
| サブテーブル行の更新 | `updateNode` | PUT | ✅ 安全（自動マージ） |
| サブテーブル行の削除 | `deleteNode` | DELETE | ⚠️ カスケード削除あり |
| サブテーブル一括置換 | `replaceSubtableRows` | PUT | ✅ 安全（全削除→再作成） |
| レコード全体の置換 | `updateAnswer` | PUT | 🚨 危険（非推奨） |

---

## 具体例

### 例1: 週報にコメントを追加したい

```json
// ✅ patchAnswer で部分更新
PATCH /api/v1/forms/{formId}/answers/{answerId}
{
  "operations": [
    {
      "op": "update",
      "path": "/weekly_reports[__rowId='01KN43XPPNNRY85HZGENYJE93S']",
      "value": {
        "comments": [
          { "name": "コメント内容" }
        ]
      }
    }
  ]
}
```

```json
// ✅ createNode でサブテーブル行として追加
POST /api/v1/answers/{answerId}/nodes
{
  "parentRowId": "(週報行の__rowId)",
  "fieldCode": "comments",
  "data": {
    "name": "コメント内容"
  }
}
```

### 例2: レコードのステータスを変更したい

```json
// ✅ patchAnswer（ルートフィールドの部分更新）
PATCH /api/v1/forms/{formId}/answers/{answerId}
{
  "operations": [
    {
      "op": "replace",
      "path": "/status",
      "value": "completed"
    }
  ]
}
```

### 例3: サブテーブルの特定行を更新したい

```json
// ✅ updateNode（自動マージで安全）
PUT /api/v1/answers/{answerId}/nodes/{rowId}
{
  "data": {
    "amount": 1500000,
    "status": "confirmed"
  }
}
```

### 例4: サブテーブルの行を並び替え含めて一括更新したい

```json
// ✅ replaceSubtableRows（全行削除→再作成、順序保持）
PUT /api/v1/answers/{answerId}/nodes
{
  "parentRowId": "(親ノードのrowId)",
  "fieldCode": "monthly_sales",
  "rows": [
    { "year_month": "2026/04", "amount": 1500000 },
    { "year_month": "2026/05", "amount": 2000000 },
    { "year_month": "2026/06", "amount": 1800000 }
  ]
}
```

---

## HTTPメソッド対応表

REST APIを直接呼び出す場合、正しいHTTPメソッドを使用してください。

| API | HTTPメソッド | 用途 |
|-----|------------|------|
| レコード作成 | **POST** `/api/v1/forms/{formId}/answers` | レコード作成 |
| レコード更新（全体置換） | **PUT** `/api/v1/forms/{formId}/answers/{id}` | ルートフィールド全体置換 |
| レコード部分更新 | **PATCH** `/api/v1/forms/{formId}/answers/{id}` | 差分更新（`operations` + `If-Match` 必須） |
| レコード削除 | **DELETE** `/api/v1/forms/{formId}/answers/{id}` | レコード削除 |
| ノード作成 | **POST** `/api/answers/{id}/nodes` | サブテーブル行追加 |
| ノード更新 | **PUT** `/api/answers/{id}/nodes/{rowId}` | サブテーブル行更新（シャローマージ） |
| ノード削除 | **DELETE** `/api/answers/{id}/nodes/{rowId}` | サブテーブル行削除 |

> **Node API に PATCH メソッドはありません。** ノード更新は PUT のみです。PATCH を送信すると 405 / 500 エラーになります。PUT で `data` に変更フィールドのみ指定すれば、サーバー側で自動マージされます。

---

## updateAnswer を使う場合の注意事項

`updateAnswer` の使用が避けられない場合（ARRAYフィールド・USERフィールドが一切ないシンプルなレコードの全フィールド更新）:

1. **事前にgetFormでスキーマを確認** — ARRAY型・USER型フィールドが存在しないことを確認
2. **全フィールドを含める** — 省略したフィールドは消失する
3. **SELECTフィールドはvalue値を使用** — 表示ラベルではなく内部値
4. **バックアップを取る** — 更新前に `getAnswer` + `listNodes` の結果を保存

---

## 関連ドキュメント

- [データ構造リファレンス](./data-structures.md) — フィールド型とデータ構造の詳細
- [画面SDK開発ガイド](./screen-development.md) — フロントエンドSDKでの正しいデータ操作パターン

---

**作成日**: 2026-04-03
**更新日**: 2026-04-04
**更新者**: AWLL Studio Team
