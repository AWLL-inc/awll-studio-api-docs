# AWLL Studio API操作 - AIエージェント向け指示書

## 概要

AWLL Studio(https://api.awll-studio.ai)のREST APIを操作し、データベース・レコード・ノード・画面を構築するための指示書です。

## 認証

`settings.yaml` からemail/password/tenant_codeを読み取り、`POST /api/auth/token` でトークンを取得してください。トークンは1時間で有効期限切れになります。

全てのAPIリクエストに以下のヘッダーを付与:
- `Authorization: Bearer <idToken>`
- `X-Tenant-Code: <tenant_code>`
- `Content-Type: application/json; charset=utf-8`

## リファレンスの読み方

`reference/REST APIリファレンス/` にAPI仕様があります。**必ず `corrections.md` を最初に読んでください。** 公式OpenAPI仕様には誤りや不足があり、corrections.mdに修正点がまとまっています。

## データベース(Form)作成時の必須ルール

### 1. フィールド定義に `fieldRecordId` と `order` が必須

FormBuilder UIで編集可能にするため、全フィールドに以下を付与すること:

- `fieldRecordId`: ULID形式の一意識別子(26文字英数字大文字)をクライアント側で生成
- `order`: 表示順序(0始まり、連番)

これらが欠如するとUIでフィールドの選択・ドラッグ&ドロップが動作しません。

### 2. ULID生成方法(Python)

```python
import time, random

ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

def generate_ulid():
    t = int(time.time() * 1000)
    ts = []
    for _ in range(10):
        ts.append(ENCODING[t & 0x1F])
        t >>= 5
    ts.reverse()
    rand = [random.choice(ENCODING) for _ in range(16)]
    return "".join(ts) + "".join(rand)
```

### 3. フィールド定義の完全な例

```json
{
  "fieldRecordId": "01ABC123DEF456GH",
  "fieldCode": "customer_name",
  "fieldName": "顧客名",
  "fieldType": "TEXT",
  "required": true,
  "order": 0
}
```

### 4. ARRAYフィールドの追加プロパティ

```json
{
  "fieldRecordId": "01ABC123DEF456GJ",
  "fieldCode": "tasks",
  "fieldName": "タスク",
  "fieldType": "ARRAY",
  "required": false,
  "order": 1,
  "arrayConfig": {
    "minItems": 0,
    "maxItems": 100,
    "defaultRows": 0,
    "fields": [...]
  }
}
```

`arrayConfig` 内の子フィールドにも `fieldRecordId` と `order` が必要です。

### 5. プロパティ名の対応関係

| 用途 | プロパティ名 |
|------|-------------|
| AI生成プロンプト(form-generator) | `fieldId` |
| REST API直接呼び出し | **`fieldCode`** |
| FormBuilder UI内部 | `fieldRecordId` |

AI生成プロンプトの `fieldId` はサーバー内部で `fieldCode` に変換されますが、REST API直接呼び出しでは最初から `fieldCode` を使用してください。

## ARRAYフィールド（サブレコード）のデータ投入方法

### ⚠️ 最重要: answerData に直接配列として書き込む

ARRAYフィールドのデータは、レコード作成（POST）または更新（PUT）時に **answerData の中に配列として直接含める**こと。

```json
POST /api/v1/forms/{formId}/answers
{
  "answerData": {
    "name": "顧客名",
    "career_history": [
      {
        "name": "総務省",
        "position": "局長",
        "career_memos": [
          {"name": "人脈が広い", "memo_type": "network"}
        ]
      },
      {
        "name": "ネットフリックス",
        "position": "執行役員",
        "is_current": true
      }
    ],
    "properties": [
      {"address": "東京都港区", "purchase_price": 3000, "handling": "own_company"}
    ]
  }
}
```

**ネストされたARRAY（3階層）も answerData の中にそのままネストして書く。** 上記の `career_memos` が `career_history` の中にネストされている例を参照。

### ❌ Nodes API だけではサブレコードが一覧画面に表示されない

Nodes API（`POST /api/answers/{answerId}/nodes`）でサブレコードを作成すると、ノードツリーには追加されるが、**answerData（検索インデックス）に反映されない**。そのため一覧画面のテーブル表示で「0件」と表示される。

```
❌ 間違った方法:
  1. POST /api/v1/forms/{formId}/answers で空のレコード作成
  2. POST /api/answers/{answerId}/nodes で子ノードを個別追加
  → ノードは作成されるが、一覧画面では「0件」と表示される

✅ 正しい方法:
  1. POST /api/v1/forms/{formId}/answers で answerData に ARRAY データを含めて作成
  → answerData にデータが入り、一覧画面でも正しく表示される

✅ 既存レコードにサブレコードを追加する場合:
  1. PUT /api/v1/forms/{formId}/answers/{answerId} で answerData ごと上書き
  → ARRAY データを含めた完全な answerData を送信
```

### Nodes API の用途

Nodes API（`POST /api/answers/{answerId}/nodes`）は以下の場合に使用:
- 個別のノードの取得・更新・削除
- ノードツリーの構造確認
- **answerData と併用して、既に作成済みのレコードのノード操作を行う場合**

ただし、レコード作成時の初期データ投入は answerData に直接書き込む方式を推奨。

## ノード(Nodes)操作の補足

### ルートノードはAPIで作成できない

- `POST /api/v1/forms/{formId}/answers` でレコード作成すると**ルートノードが自動生成される**
- `POST /api/answers/{answerId}/nodes` は**子ノード作成専用**

### ⚠️ レコード更新は Node API を使用すること（必須）

**`PUT /api/v1/forms/{formId}/answers/{answerId}` および `PATCH` は非推奨です。**

- PUT は全フィールド置換のため、未送信フィールドが消失するリスクがある
- レコードのフィールド更新は **Node API（`PUT /api/answers/{answerId}/nodes/{rowId}`）** で行うこと
- ルートレベルのフィールド更新: `listNodes` でルートノード(depth=0)の rowId を取得 → `updateNode`
- サブテーブル行の更新: `updateNode` で対象ノードを直接更新

### 🚨 PUT /nodes/{rowId} で ARRAY型フィールドを data に含めてはいけない

`PUT /api/answers/{answerId}/nodes/{rowId}` はフラットフィールド（TEXT, NUMBER, SELECT等）の更新専用。
**data 内に ARRAY型フィールドの配列を書き込むと、画面から見えない「幽霊データ」になる。**

```
❌ PUT /nodes/{rowId} に ARRAY を含める
{ "data": { "status": "drafting", "comments": [{"name": "..."}] } }
→ data にJSON配列が埋め込まれるだけ。depth=2 の子ノードは生成されず、画面は「0件」表示

✅ サブレコードの行追加は POST /nodes を使用
POST /api/answers/{answerId}/nodes
{ "parentRowId": "{親rowId}", "fieldCode": "comments", "data": {"name": "..."} }
→ depth=2 の独立した子ノードが作成され、画面で正しく表示される
```

### Nodes API を使う場合の手順

```
1. レコード作成 → answerId取得
2. GET /api/answers/{answerId}/nodes → ルートノードのrowId取得
3. POST /api/answers/{answerId}/nodes で子ノード作成
   - parentRowId: ルートノードのrowId (nullや空文字は不可)
   - fieldCode: 親ノードのARRAYフィールドコード (例: "tasks")
   - data: ARRAYのサブフィールドに準拠したJSON
```

### 階層指定取得（パフォーマンス最適化）

大量ノードがあるレコードでは全ノード取得が遅いため、クエリパラメータで取得範囲を絞れる:

```
# 直接の子ノードのみ取得（1階層下）
GET /api/answers/{answerId}/nodes?parentRowId={rowId}

# 配下全子孫ノード取得（他の兄弟ツリーは除外）
GET /api/answers/{answerId}/nodes?ancestorRowId={rowId}

# parentRowId と ancestorRowId は排他（両方指定すると400エラー）
```

## 画面(Screen)作成時の注意

- `POST /api/v1/screens` でソースコードをアップロード可能
- コンパイル: `POST /api/v1/screens/{screenId}/compile` でソースコードをコンパイル
- デプロイ: `POST /api/v1/screens/{screenId}/deploy` でCDNにデプロイ
- ロールバック: `POST /api/v1/screens/{screenId}/rollback` で指定バージョンに戻す
- ソースコードは `export default function ScreenName() { ... }` 形式
- SDK import: `import { useRecords, useRecord, useMutation, useExecutionContext } from '@awll/sdk';`
- iframe内で実行されるため `fetch()` での直接API呼び出しは認証トークンが付与されず401になる（画面コードからCognito JWTにはアクセス不可）

## Screen SDK の既知の制約

| 機能 | 状態 |
|------|------|
| `useRecords` | 動作するが、一覧取得時のvaluesにはARRAYフィールドのデータが含まれない場合がある |
| `useRecord` | 動作するが、valuesにARRAYフィールドが含まれないバグあり(修正中) |
| `useNodes` | 未実装 |
| `useMutation` | 動作する(`create`, `update`, `remove`) |
| `useNavigation` | 実装中 |

## Script SDK(スクリプトルール)

- トリガー: ON_CREATE, ON_UPDATE, ON_CHANGE
- グローバル変数: `record`, `oldRecord`, `userId`, `api`
- `api.getRecords()`, `api.createRecord()`, `api.updateRecord()`, `api.deleteRecord()` が使用可能
- `api.sendEmail({ to, subject, body, templateVariables })` でメール送信可能（Issue #948）
- ノード操作用のAPIメソッドは存在しない

## フィールド型一覧

| 型 | 説明 |
|----|------|
| TEXT | テキスト(multiline:trueで複数行) |
| NUMBER | 数値(unit指定可) |
| DATE | 日付(includeTime:trueで時刻付き) |
| SELECT | 単一選択(options必須) |
| CHECKBOX | チェックボックス |
| MARKDOWN | マークダウンテキスト |
| ARRAY | 配列・サブテーブル(arrayConfig.fields必須、最大5階層ネスト) |
| CALCULATED | 自動計算(FORMULA: 数式 / AGGREGATION: 集計) |
| USER | ユーザー選択(userConfig必須) |
| REFERENCE | 他データベース参照 |
| FILE | ファイル添付 |
