# データベーススキーマ定義ガイド

AWLL Studio のデータベース定義（Form Definition）のスキーマ仕様です。API でデータベースを作成・更新する際や、AI によるデータベース自動生成の入力仕様として参照してください。

---

## スキーマ構造

```json
{
  "name": "データベース名",
  "description": "説明（省略可）",
  "fields": [
    {
      "fieldId": "customer_name",
      "fieldName": "顧客名",
      "fieldType": "TEXT",
      "required": true
    }
  ]
}
```

### 共通プロパティ

| プロパティ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| `fieldId` | string | 必須 | フィールド識別子（英数字 + アンダースコア、snake_case） |
| `fieldName` | string | 必須 | 表示名（日本語可） |
| `fieldType` | string | 必須 | フィールド型（大文字） |
| `required` | boolean | - | 必須フィールドか（デフォルト: false） |
| `helpText` | string | - | 入力ヒント |

### fieldId 命名ルール

- **snake_case** で意味のある英単語を使用
- 全フィールドで**一意**（重複禁止）
- 配列内のフィールドも含め、すべて異なる ID にする

```
✅ GOOD: customer_name, total_amount, contract_date, dm_manager
❌ BAD:  field_01, field_abc123, f1（無意味な文字列は禁止）
```

---

## フィールドタイプ一覧

### 基本型

#### TEXT: テキスト

```json
{
  "fieldId": "customer_name",
  "fieldName": "顧客名",
  "fieldType": "TEXT",
  "required": true,
  "multiline": false,
  "helpText": "顧客名を入力してください"
}
```

| プロパティ | 説明 |
|-----------|------|
| `multiline` | `true` で複数行入力（textarea） |

#### NUMBER: 数値

```json
{
  "fieldId": "unit_price",
  "fieldName": "単価",
  "fieldType": "NUMBER",
  "required": true,
  "unit": "円",
  "decimalPlaces": 0
}
```

| プロパティ | 説明 |
|-----------|------|
| `unit` | 単位表示（円、個、kg など） |
| `decimalPlaces` | 小数点以下桁数 |

#### DATE: 日付

```json
{
  "fieldId": "contract_date",
  "fieldName": "契約日",
  "fieldType": "DATE",
  "required": true,
  "defaultValue": "TODAY"
}
```

| プロパティ | 説明 |
|-----------|------|
| `includeTime` | `true` で日時入力に変更 |
| `defaultValue` | `"TODAY"`, `"TOMORROW"`, `"NEXT_WEEK"` |

> **注意**: fieldName に「時刻」「時間」「日時」が含まれる場合は `includeTime: true` を設定してください。

#### SELECT: 単一選択

```json
{
  "fieldId": "industry",
  "fieldName": "業種",
  "fieldType": "SELECT",
  "options": [
    {"value": "manufacturing", "label": "製造業"},
    {"value": "it", "label": "IT・通信"},
    {"value": "retail", "label": "小売・卸売"}
  ]
}
```

| プロパティ | 説明 |
|-----------|------|
| `options` | 選択肢リスト（**必須**）。`value` は英数字、`label` は表示名 |

#### CHECKBOX: チェックボックス

```json
{
  "fieldId": "agree_to_terms",
  "fieldName": "利用規約に同意する",
  "fieldType": "CHECKBOX",
  "required": true
}
```

単一の ON/OFF 値。チェック ON = true、OFF = false。

#### MARKDOWN: リッチテキスト

```json
{
  "fieldId": "terms_description",
  "fieldName": "利用規約",
  "fieldType": "MARKDOWN"
}
```

マークダウン形式のテキスト入力・表示。

#### FILE: ファイル添付

```json
{
  "fieldId": "attachments",
  "fieldName": "添付ファイル",
  "fieldType": "FILE",
  "fileConfig": {
    "allowMultiple": true,
    "allowedMimeTypes": ["application/pdf", "image/*"],
    "maxSizeMB": 20,
    "generateThumbnail": true
  }
}
```

| プロパティ | 説明 |
|-----------|------|
| `fileConfig.allowMultiple` | 複数ファイルの添付を許可 |
| `fileConfig.allowedMimeTypes` | 許可する MIME タイプ |
| `fileConfig.maxSizeMB` | 最大ファイルサイズ（MB） |
| `fileConfig.generateThumbnail` | サムネイル自動生成 |

---

### 特殊型

#### ARRAY: サブデータベース（繰り返しフィールド）

明細行、タスクリストなど、繰り返し可能な子フィールド群を定義します。最大 **5 階層** までネスト可能です。

```json
{
  "fieldId": "line_items",
  "fieldName": "明細行",
  "fieldType": "ARRAY",
  "arrayConfig": {
    "minItems": 1,
    "maxItems": 100,
    "defaultRows": 3,
    "fields": [
      {
        "fieldId": "item_name",
        "fieldName": "品目名",
        "fieldType": "TEXT",
        "required": true
      },
      {
        "fieldId": "quantity",
        "fieldName": "数量",
        "fieldType": "NUMBER",
        "required": true
      }
    ]
  }
}
```

| プロパティ | 説明 |
|-----------|------|
| `arrayConfig.fields` | 子フィールド定義（**必須**） |
| `arrayConfig.minItems` | 最小行数 |
| `arrayConfig.maxItems` | 最大行数 |
| `arrayConfig.defaultRows` | 初期表示行数 |

#### CALCULATED: 自動計算フィールド

他のフィールドの値を基に自動計算されるフィールドです。

**数式計算（FORMULA）**:

```json
{
  "fieldId": "subtotal",
  "fieldName": "小計",
  "fieldType": "CALCULATED",
  "calculationConfig": {
    "calculationType": "FORMULA",
    "formula": "unit_price * quantity",
    "unit": "円",
    "decimalPlaces": 0
  }
}
```

**集計計算（AGGREGATION）**:

```json
{
  "fieldId": "total_amount",
  "fieldName": "合計金額",
  "fieldType": "CALCULATED",
  "calculationConfig": {
    "calculationType": "AGGREGATION",
    "aggregation": {
      "sourceArrayField": "line_items",
      "sourceChildField": "subtotal",
      "function": "SUM"
    },
    "unit": "円",
    "decimalPlaces": 0
  }
}
```

| 集計関数 | 説明 |
|---------|------|
| `SUM` | 合計 |
| `AVG` | 平均 |
| `COUNT` | 件数 |
| `MIN` | 最小値 |
| `MAX` | 最大値 |

#### USER: ユーザー選択

```json
{
  "fieldId": "assigned_to",
  "fieldName": "担当者",
  "fieldType": "USER",
  "userConfig": {
    "selectionMode": "SINGLE",
    "displayField": "USERNAME"
  }
}
```

| プロパティ | 説明 |
|-----------|------|
| `userConfig.selectionMode` | `"SINGLE"` または `"MULTIPLE"` |
| `userConfig.displayField` | `"USERNAME"`, `"DISPLAY_NAME"`, `"EMAIL"` |

#### REFERENCE: 他データベース参照

```json
{
  "fieldId": "customer_ref",
  "fieldName": "顧客",
  "fieldType": "REFERENCE",
  "referenceConfig": {
    "referenceFormId": "<参照先データベースID>",
    "displayField": "name",
    "maxDepth": 3
  }
}
```

| プロパティ | 説明 |
|-----------|------|
| `referenceConfig.referenceFormId` | 参照先データベースの ID |
| `referenceConfig.displayField` | 表示するフィールドの fieldId |
| `referenceConfig.maxDepth` | 循環参照防止の深度制限（デフォルト: 3） |

---

## 実用例

### 見積書データベース

```json
{
  "name": "見積書データベース",
  "description": "見積書を作成し、明細行の小計と総額を自動計算します",
  "fields": [
    {
      "fieldId": "name",
      "fieldName": "見積書名",
      "fieldType": "TEXT",
      "required": true
    },
    {
      "fieldId": "quotation_date",
      "fieldName": "見積日",
      "fieldType": "DATE",
      "required": true
    },
    {
      "fieldId": "customer_name",
      "fieldName": "顧客名",
      "fieldType": "TEXT",
      "required": true
    },
    {
      "fieldId": "line_items",
      "fieldName": "明細行",
      "fieldType": "ARRAY",
      "arrayConfig": {
        "fields": [
          {
            "fieldId": "item_name",
            "fieldName": "品目名",
            "fieldType": "TEXT",
            "required": true
          },
          {
            "fieldId": "unit_price",
            "fieldName": "単価",
            "fieldType": "NUMBER",
            "unit": "円"
          },
          {
            "fieldId": "quantity",
            "fieldName": "数量",
            "fieldType": "NUMBER"
          },
          {
            "fieldId": "subtotal",
            "fieldName": "小計",
            "fieldType": "CALCULATED",
            "calculationConfig": {
              "calculationType": "FORMULA",
              "formula": "unit_price * quantity",
              "unit": "円"
            }
          }
        ]
      }
    },
    {
      "fieldId": "total_amount",
      "fieldName": "合計金額",
      "fieldType": "CALCULATED",
      "calculationConfig": {
        "calculationType": "AGGREGATION",
        "aggregation": {
          "sourceArrayField": "line_items",
          "sourceChildField": "subtotal",
          "function": "SUM"
        },
        "unit": "円",
        "decimalPlaces": 0
      }
    },
    {
      "fieldId": "tax_amount",
      "fieldName": "消費税額",
      "fieldType": "CALCULATED",
      "calculationConfig": {
        "calculationType": "FORMULA",
        "formula": "total_amount * 0.1",
        "unit": "円",
        "decimalPlaces": 0
      }
    },
    {
      "fieldId": "grand_total",
      "fieldName": "税込合計",
      "fieldType": "CALCULATED",
      "calculationConfig": {
        "calculationType": "FORMULA",
        "formula": "total_amount + tax_amount",
        "unit": "円",
        "decimalPlaces": 0
      }
    },
    {
      "fieldId": "assigned_to",
      "fieldName": "担当者",
      "fieldType": "USER",
      "userConfig": {
        "selectionMode": "SINGLE",
        "displayField": "USERNAME"
      }
    },
    {
      "fieldId": "remarks",
      "fieldName": "備考",
      "fieldType": "TEXT",
      "multiline": true
    }
  ]
}
```

### 法人顧客管理（3 階層）

```json
{
  "name": "法人顧客管理",
  "description": "法人顧客の管理と案件・商談を階層的に管理します",
  "fields": [
    {
      "fieldId": "name",
      "fieldName": "法人名",
      "fieldType": "TEXT",
      "required": true
    },
    {
      "fieldId": "industry",
      "fieldName": "業種",
      "fieldType": "SELECT",
      "options": [
        {"value": "manufacturing", "label": "製造業"},
        {"value": "it", "label": "IT・通信"},
        {"value": "finance", "label": "金融・保険"},
        {"value": "retail", "label": "小売・卸売"}
      ]
    },
    {
      "fieldId": "projects",
      "fieldName": "案件一覧",
      "fieldType": "ARRAY",
      "arrayConfig": {
        "fields": [
          {
            "fieldId": "project_name",
            "fieldName": "案件名",
            "fieldType": "TEXT",
            "required": true
          },
          {
            "fieldId": "project_status",
            "fieldName": "ステータス",
            "fieldType": "SELECT",
            "options": [
              {"value": "prospect", "label": "見込み"},
              {"value": "proposal", "label": "提案中"},
              {"value": "negotiation", "label": "交渉中"},
              {"value": "won", "label": "受注"},
              {"value": "lost", "label": "失注"}
            ]
          },
          {
            "fieldId": "negotiations",
            "fieldName": "商談履歴",
            "fieldType": "ARRAY",
            "arrayConfig": {
              "fields": [
                {
                  "fieldId": "negotiation_date",
                  "fieldName": "商談日",
                  "fieldType": "DATE"
                },
                {
                  "fieldId": "negotiation_content",
                  "fieldName": "内容",
                  "fieldType": "TEXT",
                  "multiline": true
                },
                {
                  "fieldId": "negotiation_amount",
                  "fieldName": "金額",
                  "fieldType": "NUMBER",
                  "unit": "円"
                }
              ]
            }
          }
        ]
      }
    },
    {
      "fieldId": "contracts",
      "fieldName": "契約一覧",
      "fieldType": "ARRAY",
      "arrayConfig": {
        "fields": [
          {
            "fieldId": "contract_name",
            "fieldName": "契約名",
            "fieldType": "TEXT",
            "required": true
          },
          {
            "fieldId": "contract_amount",
            "fieldName": "契約金額",
            "fieldType": "NUMBER",
            "unit": "円"
          },
          {
            "fieldId": "contract_date",
            "fieldName": "契約日",
            "fieldType": "DATE"
          }
        ]
      }
    },
    {
      "fieldId": "total_contract_amount",
      "fieldName": "契約総額",
      "fieldType": "CALCULATED",
      "calculationConfig": {
        "calculationType": "AGGREGATION",
        "aggregation": {
          "sourceArrayField": "contracts",
          "sourceChildField": "contract_amount",
          "function": "SUM"
        },
        "unit": "円"
      }
    }
  ]
}
```

---

## AI データベース生成

AWLL Studio のデータベースビルダーでは、自然言語やスクリーンショットからデータベースを AI で自動生成できます。

### 入力方法

1. **テキスト入力**: 「顧客管理データベースを作ってください」
2. **画像入力**: 既存の帳票・フォームのスクリーンショットをアップロード
3. **既存データベースの編集**: 「住所フィールドを追加してください」

AI は上記の入力からフィールド構造を推測し、本ページのスキーマ仕様に準拠した定義を自動生成します。

---

**更新日**: 2026-03-17
