# データベーススキーマ定義ガイド

**対象**: AWLL Studio でデータベースを設計・構築する開発者
**最終更新**: 2026-03-18

## 概要

AWLL Studio のデータベース（Form）は JSON 形式のスキーマ定義で構築します。本ガイドでは、REST API で直接 Form を作成する際のスキーマ仕様を説明します。

> **FormBuilder（GUI）を使う場合**: 本ガイドの知識は不要です。ドラッグ&ドロップでデータベースを設計できます。本ガイドは API 経由でプログラム的に構築する場合に参照してください。

---

## スキーマの基本構造

```json
{
  "name": "データベース名",
  "description": "説明（省略可）",
  "fields": [
    {
      "fieldCode": "customer_name",
      "fieldName": "顧客名",
      "fieldType": "TEXT",
      "required": true,
      "order": 0
    }
  ]
}
```

### フィールド定義の必須プロパティ

| プロパティ | 型 | 必須 | 説明 |
|-----------|---|------|------|
| `fieldCode` | string | 必須 | フィールド識別子。**snake_case** で命名（例: `customer_name`） |
| `fieldName` | string | 必須 | 表示名（日本語） |
| `fieldType` | string | 必須 | フィールド型（**大文字**で指定） |
| `required` | boolean | 任意 | 必須フィールドかどうか（デフォルト: false） |
| `order` | number | 必須 | 表示順序（0始まりの連番） |
| `fieldRecordId` | string | 必須 | ULID形式の一意識別子（26文字英数大文字） |
| `helpText` | string | 任意 | 入力ヘルプテキスト |

### fieldCode の命名規則

- **必ず snake_case**（例: `customer_name`, `total_amount`, `contract_date`）
- 意味のある英単語を使用
- 全フィールドで一意にする（ARRAY 内の子フィールドも含む）
- **最初のフィールドは `fieldCode: "name"` を推奨**（一覧表示時の代表フィールドになる）

---

## フィールド型一覧（11型）

### 基本型

#### TEXT — テキスト

```json
{
  "fieldCode": "customer_name",
  "fieldName": "顧客名",
  "fieldType": "TEXT",
  "required": true
}
```

| オプション | 型 | 説明 |
|-----------|---|------|
| `multiline` | boolean | true で複数行入力 |
| `minLength` | number | 最小文字数 |
| `maxLength` | number | 最大文字数 |
| `pattern` | string | 正規表現バリデーション |

#### NUMBER — 数値

```json
{
  "fieldCode": "total_amount",
  "fieldName": "合計金額",
  "fieldType": "NUMBER",
  "unit": "円"
}
```

| オプション | 型 | 説明 |
|-----------|---|------|
| `unit` | string | 単位（例: "円", "kg", "個"） |
| `minValue` | number | 最小値 |
| `maxValue` | number | 最大値 |

#### DATE — 日付

```json
{
  "fieldCode": "contract_date",
  "fieldName": "契約日",
  "fieldType": "DATE"
}
```

| オプション | 型 | 説明 |
|-----------|---|------|
| `includeTime` | boolean | true で日時（時刻を含む）。fieldName に「時刻」「時間」「日時」が含まれる場合は true を推奨 |

#### SELECT — 単一選択

```json
{
  "fieldCode": "status",
  "fieldName": "ステータス",
  "fieldType": "SELECT",
  "options": [
    {"value": "not_started", "label": "未着手"},
    {"value": "in_progress", "label": "進行中"},
    {"value": "completed", "label": "完了"}
  ]
}
```

- `value`: **英数字（snake_case）**
- `label`: **日本語**
- `options` は必須

#### CHECKBOX — チェックボックス

```json
{
  "fieldCode": "is_urgent",
  "fieldName": "緊急",
  "fieldType": "CHECKBOX"
}
```

- 単一 Boolean 値。options は不要
- 複数選択が必要な場合は SELECT を使用

#### MARKDOWN — リッチテキスト

```json
{
  "fieldCode": "description",
  "fieldName": "詳細説明",
  "fieldType": "MARKDOWN"
}
```

---

### 構造型

#### ARRAY — サブテーブル（最大5階層ネスト）

```json
{
  "fieldCode": "line_items",
  "fieldName": "明細行",
  "fieldType": "ARRAY",
  "arrayConfig": {
    "minItems": 0,
    "maxItems": 100,
    "defaultRows": 0,
    "fields": [
      {
        "fieldCode": "item_name",
        "fieldName": "品目名",
        "fieldType": "TEXT",
        "required": true
      },
      {
        "fieldCode": "quantity",
        "fieldName": "数量",
        "fieldType": "NUMBER"
      },
      {
        "fieldCode": "unit_price",
        "fieldName": "単価",
        "fieldType": "NUMBER",
        "unit": "円"
      }
    ]
  }
}
```

- `arrayConfig.fields` は必須（空配列は不可）
- 子フィールドにも `fieldCode` / `fieldRecordId` / `order` が必要
- **ARRAY の中に ARRAY をネスト可能（最大5階層）** — 見積の工種→内訳のような構造を表現

#### REFERENCE — 他データベース参照

```json
{
  "fieldCode": "customer",
  "fieldName": "顧客",
  "fieldType": "REFERENCE",
  "referenceConfig": {
    "referenceFormId": "顧客マスタのformId",
    "displayField": "name"
  }
}
```

- `referenceFormId`: 参照先データベースの ID
- `displayField`: 参照先のどのフィールドを表示するか

---

### 計算型

#### CALCULATED — 自動計算

2種類の計算タイプがあります。

**FORMULA（数式）:**

```json
{
  "fieldCode": "subtotal",
  "fieldName": "小計",
  "fieldType": "CALCULATED",
  "calculationConfig": {
    "calculationType": "FORMULA",
    "formula": "unit_price * quantity",
    "decimalPlaces": 0,
    "unit": "円"
  }
}
```

- `formula`: 数式文字列。他フィールドの `fieldCode` で参照
- 四則演算（`+`, `-`, `*`, `/`）、括弧が使用可能

**AGGREGATION（集計）:**

```json
{
  "fieldCode": "total_amount",
  "fieldName": "合計金額",
  "fieldType": "CALCULATED",
  "calculationConfig": {
    "calculationType": "AGGREGATION",
    "aggregation": {
      "sourceArrayField": "line_items",
      "sourceChildField": "subtotal",
      "function": "SUM"
    },
    "decimalPlaces": 0,
    "unit": "円"
  }
}
```

- `function`: `SUM`, `AVG`, `COUNT`, `MIN`, `MAX`
- ARRAY 内のフィールドを集計

---

### ユーザー型

#### USER — ユーザー選択

```json
{
  "fieldCode": "assigned_to",
  "fieldName": "担当者",
  "fieldType": "USER",
  "userConfig": {
    "selectionMode": "SINGLE"
  }
}
```

- `selectionMode`: `SINGLE`（1名） or `MULTIPLE`（複数名）

---

## 実用例

### 見積管理（3階層ネスト）

```json
{
  "name": "工事見積管理",
  "fields": [
    {"fieldCode": "name", "fieldName": "件名", "fieldType": "TEXT", "required": true, "order": 0},
    {"fieldCode": "customer", "fieldName": "顧客", "fieldType": "REFERENCE", "referenceConfig": {"referenceFormId": "CUSTOMER_MASTER", "displayField": "name"}, "order": 1},
    {"fieldCode": "estimate_date", "fieldName": "見積日", "fieldType": "DATE", "order": 2},
    {"fieldCode": "status", "fieldName": "ステータス", "fieldType": "SELECT", "options": [{"value": "draft", "label": "起票"}, {"value": "review", "label": "レビュー中"}, {"value": "approved", "label": "承認済"}], "order": 3},
    {
      "fieldCode": "work_types", "fieldName": "工種", "fieldType": "ARRAY", "order": 4,
      "arrayConfig": {
        "fields": [
          {"fieldCode": "name", "fieldName": "工種名", "fieldType": "TEXT", "required": true, "order": 0},
          {
            "fieldCode": "details", "fieldName": "内訳", "fieldType": "ARRAY", "order": 1,
            "arrayConfig": {
              "fields": [
                {"fieldCode": "name", "fieldName": "品目名", "fieldType": "TEXT", "order": 0},
                {"fieldCode": "quantity", "fieldName": "数量", "fieldType": "NUMBER", "order": 1},
                {"fieldCode": "unit_price", "fieldName": "単価", "fieldType": "NUMBER", "unit": "円", "order": 2},
                {"fieldCode": "subtotal", "fieldName": "小計", "fieldType": "CALCULATED", "calculationConfig": {"calculationType": "FORMULA", "formula": "unit_price * quantity"}, "order": 3}
              ]
            }
          },
          {"fieldCode": "work_type_total", "fieldName": "工種小計", "fieldType": "CALCULATED", "calculationConfig": {"calculationType": "AGGREGATION", "aggregation": {"sourceArrayField": "details", "sourceChildField": "subtotal", "function": "SUM"}}, "order": 2}
        ]
      }
    },
    {"fieldCode": "total_amount", "fieldName": "合計", "fieldType": "CALCULATED", "calculationConfig": {"calculationType": "AGGREGATION", "aggregation": {"sourceArrayField": "work_types", "sourceChildField": "work_type_total", "function": "SUM"}, "unit": "円"}, "order": 5},
    {"fieldCode": "tax_rate", "fieldName": "消費税率", "fieldType": "NUMBER", "unit": "%", "order": 6},
    {"fieldCode": "tax_amount", "fieldName": "消費税額", "fieldType": "CALCULATED", "calculationConfig": {"calculationType": "FORMULA", "formula": "total_amount * tax_rate / 100", "unit": "円"}, "order": 7},
    {"fieldCode": "grand_total", "fieldName": "総合計", "fieldType": "CALCULATED", "calculationConfig": {"calculationType": "FORMULA", "formula": "total_amount + tax_amount", "unit": "円"}, "order": 8}
  ]
}
```

---

**更新日**: 2026-03-18
