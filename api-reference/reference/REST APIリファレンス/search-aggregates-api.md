# 検索・集計 API (Search & Aggregates)

## 検索 API

**ベースパス**: `/api/search`
**権限**: FORM_ANSWER:READ

### エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/search/advanced` | 高度検索（複合フィルタ・ページネーション） |
| POST | `/api/search/fulltext` | 全文検索 |
| POST | `/api/search/faceted` | ファセット検索（カテゴリ別集計） |
| POST | `/api/search/range` | 範囲検索（数値・日付） |
| GET | `/api/search/statistics` | 検索統計情報 |

---

### POST /api/search/advanced

複合フィルタによる高度検索。

#### リクエスト

```json
{
  "formId": "customer-db",
  "filters": [
    {
      "field": "status",
      "operator": "EQ",
      "value": "取引中"
    },
    {
      "field": "amount",
      "operator": "GE",
      "value": 1000000,
      "logicalOperator": "AND"
    }
  ],
  "limit": 50,
  "lastEvaluatedKey": null
}
```

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| formId | string | No | - | 対象データベースID |
| filters | SearchFilterDto[] | No | - | フィルタ条件 |
| limit | integer | No | 100 | 取得件数 |
| lastEvaluatedKey | Map<string, string> | No | - | ページネーションキー |

#### SearchFilterDto

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| field | string | Yes | フィールドコード |
| operator | string | Yes | 演算子（下表参照） |
| value | any | Yes | 比較値 |
| maxValue | any | No | BETWEEN使用時の上限値 |
| values | any[] | No | IN使用時の値リスト |
| logicalOperator | string | No | `AND` / `OR`（デフォルト: AND） |

#### 演算子一覧

| 演算子 | 説明 | 例 |
|--------|------|-----|
| EQ | 等しい | `"value": "東京"` |
| NE | 等しくない | `"value": "大阪"` |
| LT | 未満 | `"value": 100` |
| LE | 以下 | `"value": 100` |
| GT | より大きい | `"value": 100` |
| GE | 以上 | `"value": 100` |
| BETWEEN | 範囲内 | `"value": 100, "maxValue": 200` |
| IN | リスト内 | `"values": ["東京", "大阪"]` |
| CONTAINS | 部分一致 | `"value": "ABC"` |

#### レスポンス (200)

```json
{
  "items": [ ... ],
  "totalCount": 150,
  "scannedCount": 200,
  "hasMore": true,
  "lastEvaluatedKey": { "key1": "...", "key2": "..." }
}
```

---

### POST /api/search/fulltext

全文検索。

#### リクエスト

```json
{
  "query": "株式会社ABC",
  "fields": ["name", "email", "description"],
  "limit": 50
}
```

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| query | string | Yes | - | 検索キーワード |
| fields | string[] | Yes | - | 検索対象フィールド |
| limit | integer | No | 100 | 取得件数 |

#### レスポンス (200)

```json
{
  "items": [ ... ],
  "totalCount": 25
}
```

---

### POST /api/search/faceted

ファセット検索（カテゴリ別集計付き）。

#### リクエスト

```json
{
  "facetFields": ["status", "category"],
  "filters": [
    { "field": "amount", "operator": "GE", "value": 100000 }
  ],
  "limit": 50
}
```

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| facetFields | string[] | Yes | - | ファセット集計対象フィールド |
| filters | SearchFilterDto[] | No | - | フィルタ条件 |
| limit | integer | No | 100 | 取得件数 |

#### レスポンス (200)

```json
{
  "items": [ ... ],
  "facets": {
    "status": {
      "取引中": 45,
      "休眠": 12,
      "新規": 30
    },
    "category": {
      "法人": 60,
      "個人": 27
    }
  },
  "totalCount": 87,
  "scannedCount": 100
}
```

---

### POST /api/search/range

範囲検索（数値・日付対応）。

#### リクエスト

```json
{
  "field": "amount",
  "min": 100000,
  "max": 5000000,
  "limit": 50
}
```

| フィールド | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| field | string | Yes | - | 対象フィールド |
| min | any | Yes | - | 下限値 |
| max | any | Yes | - | 上限値 |
| limit | integer | No | 100 | 取得件数 |

#### レスポンス (200)

```json
{
  "items": [ ... ],
  "totalCount": 42
}
```

---

### GET /api/search/statistics

検索統計情報を取得します。

---

## 集計 API

**ベースパス**: `/api/aggregates`
**権限**: FORM_ANSWER:READ

### エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/aggregates/count` | COUNT集計 |
| POST | `/api/aggregates/sum` | SUM集計 |
| POST | `/api/aggregates/average` | AVERAGE集計 |
| POST | `/api/aggregates/max` | MAX集計 |
| POST | `/api/aggregates/min` | MIN集計 |
| POST | `/api/aggregates/group-by` | GROUP BY集計 |

---

### POST /api/aggregates/count

#### リクエスト

```json
{
  "formId": "customer-db",
  "filters": [
    { "field": "status", "operator": "EQ", "value": "取引中" }
  ]
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| formId | string | No | 対象データベースID |
| filters | FilterDto[] | No | フィルタ条件 |

#### レスポンス (200)

```json
{
  "count": 150
}
```

---

### POST /api/aggregates/sum

#### リクエスト

```json
{
  "field": "amount",
  "formId": "customer-db",
  "filters": []
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| field | string | Yes | 集計対象フィールド |
| formId | string | No | 対象データベースID |
| filters | FilterDto[] | No | フィルタ条件 |

#### レスポンス (200)

```json
{
  "field": "amount",
  "sum": 15000000.00
}
```

---

### POST /api/aggregates/average

リクエスト・レスポンスは `sum` と同構造（`sum` → `average`）。

```json
{ "field": "amount", "average": 300000.00 }
```

---

### POST /api/aggregates/max / min

リクエストは `sum` と同構造。

```json
{ "field": "amount", "max": 5000000 }
{ "field": "amount", "min": 10000 }
```

---

### POST /api/aggregates/group-by

#### リクエスト

```json
{
  "groupFields": ["status", "category"],
  "aggregations": [
    { "function": "COUNT", "alias": "total" },
    { "function": "SUM", "field": "amount", "alias": "total_amount" },
    { "function": "AVG", "field": "amount", "alias": "avg_amount" }
  ],
  "formId": "customer-db",
  "filters": [],
  "havingConditions": [
    { "aggregateAlias": "total", "operator": "GE", "value": 5 }
  ]
}
```

#### AggregationDto

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| function | string | Yes | `COUNT` / `SUM` / `AVG` / `MIN` / `MAX` |
| field | string | No | 対象フィールド（COUNT以外は必須） |
| alias | string | Yes | 結果のキー名 |

#### HavingConditionDto

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| aggregateAlias | string | Yes | 集計結果のalias |
| operator | string | Yes | `EQ` / `NE` / `LT` / `LE` / `GT` / `GE` |
| value | any | Yes | 比較値 |

#### レスポンス (200)

```json
{
  "groups": [
    {
      "groupKeys": { "status": "取引中", "category": "法人" },
      "aggregates": {
        "total": 45,
        "total_amount": 75000000,
        "avg_amount": 1666666.67
      },
      "count": 45
    },
    {
      "groupKeys": { "status": "取引中", "category": "個人" },
      "aggregates": {
        "total": 20,
        "total_amount": 10000000,
        "avg_amount": 500000.00
      },
      "count": 20
    }
  ]
}
```

---

## FilterDto（集計API共通）

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| field | string | Yes | フィールドコード |
| operator | string | Yes | 演算子（SearchFilterDtoと同じ） |
| value | any | Yes | 比較値 |

---

**更新日**: 2026-03-16
