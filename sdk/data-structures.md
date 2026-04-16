# Data Structures - データ構造仕様

**対象**: AWLL Studio開発者
**最終更新**: 2026-03-18

## 概要

AWLL Studioプラットフォームで使用されるデータ構造の完全なリファレンスです。

---

## レコードID形式

レコードIDは一意な識別子として使用され、システムが自動的に生成します。

**例**: `01KEXPZ52AFCPGMA7Q8A6HVTS9`

**特徴**:
- 自動生成される一意なID
- タイムスタンプ順にソート可能
- 26文字の英数字（大文字）

---

## FormRecord（レコード）

### Screen SDKでの形式

```typescript
interface FormRecord {
  recordId: string;         // レコードID
  formRecordId: string;     // 内部識別子（システム管理用）
  values: Record<string, unknown>;  // フィールド値
  metadata: {
    createdAt: string;      // 作成日時 (ISO 8601)
    updatedAt: string;      // 更新日時 (ISO 8601)
    createdBy: string;      // 作成者ID
  };
}
```

**例**:
```json
{
  "recordId": "01KEXPZ52AFCPGMA7Q8A6HVTS9",
  "formRecordId": "01KEXPZ52AFCPGMA7Q8A6HVTS9",
  "values": {
    "customer_name": "山田太郎",
    "email": "yamada@example.com",
    "phone": "03-1234-5678",
    "status": "active"
  },
  "metadata": {
    "createdAt": "2026-02-04T10:30:00.000Z",
    "updatedAt": "2026-02-04T10:30:00.000Z",
    "createdBy": "user-123"
  }
}
```

### Script APIでの形式

```javascript
{
  id: "01KEXPZ52AFCPGMA7Q8A6HVTS9",
  formId: "customer_form",
  fields: {
    customer_name: "山田太郎",
    email: "yamada@example.com",
    phone: "03-1234-5678",
    status: "active"
  },
  createdAt: "2026-02-04T10:30:00.000Z",
  updatedAt: "2026-02-04T10:30:00.000Z"
}
```

---

## FormDefinition（データベース定義）

```typescript
interface FormDefinition {
  tenantId: string;         // テナントID
  formId: string;           // データベースID
  version: string;          // バージョンID
  state: 'DRAFT' | 'PUBLISHED'; // 状態
  title: string;            // データベースタイトル
  schema: FormSchema;       // データベーススキーマ
  createdAt: string;        // 作成日時 (ISO 8601)
  updatedAt: string;        // 更新日時 (ISO 8601)
  createdBy: string;        // 作成者ID
}
```

---

## FormSchema（データベーススキーマ）

```typescript
interface FormSchema {
  fields: FormField[];      // フィールド定義配列
  actions?: FormAction[];   // カスタムアクション定義（#1137）
}

// カスタムアクション定義（#1137）
interface FormAction {
  actionId: string;         // アクションID（スクリプトの actionId と対応）
  label: string;            // ボタン表示名
  icon?: string;            // MUI アイコン名（例: "CheckCircle"）
  style?: 'primary' | 'outlined' | 'danger' | 'text'; // ボタンスタイル
  ruleId?: string;          // 紐づくスクリプトルールID
  confirm?: {               // 確認ダイアログ設定
    title?: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    inputField?: boolean;   // コメント入力欄を表示
    inputLabel?: string;
    inputRequired?: boolean;
  };
  visibility?: {            // 表示条件
    roles?: string[];       // 表示対象ロール
    conditions?: Array<{    // フィールド値による条件
      field: string;
      operator: 'eq' | 'ne' | 'in' | 'notIn' | 'isEmpty' | 'isNotEmpty';
      value?: any;
    }>;
  };
  order?: number;           // 表示順序
}

interface FormField {
  fieldCode: string;        // フィールドコード（一意、snake_case）
  fieldName: string;        // フィールド名
  fieldType: FieldType;     // フィールドタイプ
  required: boolean;        // 必須フラグ
  order: number;            // 表示順序
  options?: FieldOption[];  // フィールドオプション（SELECT/CHECKBOX用）
  validation?: ValidationRule; // バリデーションルール
}

type FieldType =
  | 'TEXT'          // テキスト
  | 'NUMBER'        // 数値
  | 'DATE'          // 日付
  | 'SELECT'        // プルダウン
  | 'CHECKBOX'      // チェックボックス（複数選択可能）
  | 'ARRAY'         // 配列フィールド（サブフィールド対応）
  | 'REFERENCE'     // 参照フィールド（他データベースへの参照）
  | 'MARKDOWN'      // マークダウン（読み取り専用テキスト）
  | 'CALCULATED'    // 計算フィールド（自動計算）
  | 'USER';         // ユーザー選択フィールド

interface FieldOption {
  value: string;            // 選択肢の値
  label: string;            // 選択肢のラベル
}

interface ValidationRule {
  minLength?: number;       // 最小文字数（TEXT用）
  maxLength?: number;       // 最大文字数（TEXT用）
  pattern?: string;         // 正規表現パターン（TEXT用）
  minValue?: number;        // 最小値（NUMBER用）
  maxValue?: number;        // 最大値（NUMBER用）
}
```

**例**:
```json
{
  "fields": [
    {
      "fieldCode": "customer_name",
      "fieldName": "顧客名",
      "fieldType": "TEXT",
      "required": true,
      "order": 1
    },
    {
      "fieldCode": "email",
      "fieldName": "メールアドレス",
      "fieldType": "TEXT",
      "required": true,
      "order": 2,
      "validation": {
        "pattern": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
      }
    },
    {
      "fieldCode": "status",
      "fieldName": "ステータス",
      "fieldType": "SELECT",
      "required": false,
      "order": 3,
      "options": [
        { "value": "active", "label": "有効" },
        { "value": "inactive", "label": "無効" }
      ]
    }
  ]
}
```

---

## ScreenDefinition（画面定義）

```typescript
interface ScreenDefinition {
  tenantId: string;         // テナントID
  screenId: string;         // 画面ID
  version: string;          // バージョンID
  status: 'DRAFT' | 'PUBLISHED' | 'DELETED'; // ステータス
  screenName: string;       // 画面名
  screenCode: string;       // 画面コード（一意、snake_case）
  sourceCode: string;       // TSX/JSXソースコード
  createdAt: string;        // 作成日時
  updatedAt: string;        // 更新日時
  createdBy: string;        // 作成者ID
}
```

---

## ExecutionContext（実行コンテキスト）

```typescript
interface ExecutionContext {
  executionType: 'screen';  // 実行タイプ
  tenant: {
    id: string;             // テナントID
    name: string;           // テナント名
  };
  currentUser: {
    id: string;             // ユーザーID
    name: string;           // ユーザー名
    email: string;          // メールアドレス
    roles: string[];        // ロール一覧
  };
  params: Record<string, unknown>;  // URLパラメータ
  query: Record<string, unknown>;   // クエリパラメータ
  screenId: string;         // 画面ID
  sdkVersion: string;       // SDKバージョン
  protocolVersion: string;  // プロトコルバージョン
}
```

---

## ScriptRule（スクリプトルール）

スクリプトルールは、データベース回答の作成・更新時に自動実行されるビジネスロジックを定義します。

```typescript
interface ScriptRule {
  ruleId: string;           // ルールID
  tenantId: string;         // テナントID
  formId: string;           // 対象データベースID
  ruleName: string;         // ルール名
  trigger: 'ON_CREATE' | 'ON_UPDATE'; // トリガー
  scriptCode: string;       // スクリプトコード
  enabled: boolean;         // 有効フラグ
  executionOrder: number;   // 実行順序
  createdAt: string;        // 作成日時
  updatedAt: string;        // 更新日時
  createdBy: string;        // 作成者ID
}
```

### トリガータイプ

- **ON_CREATE**: データベース回答が新規作成されたときに実行
- **ON_UPDATE**: データベース回答が更新されたときに実行

### スクリプト作成方法

管理画面（`/admin/scripts`）からスクリプトルールを作成できます。詳細は [Script Development](./script-development.md) を参照してください。

---

## Permission（権限）

```typescript
interface Permission {
  permissionId: number;     // 権限ID
  name: string;             // 権限名
  description: string;      // 説明
  resource: string;         // リソース
  action: string;           // アクション (READ, CREATE, EDIT, DELETE)
  createdAt: string;        // 作成日時
}
```

---

## Role（ロール）

```typescript
interface Role {
  roleId: number;           // ロールID
  tenantId: number;         // テナントID
  roleCode: string;         // ロールコード（一意）
  roleName: string;         // ロール名
  permissions: Permission[]; // 権限一覧
  isSystemRole: boolean;    // システムロールフラグ
  createdAt: string;        // 作成日時
  updatedAt: string;        // 更新日時
}
```

---

## API エラーレスポンス

### ErrorResponse

```typescript
interface ErrorResponse {
  status: number;           // HTTPステータスコード
  error: string;            // エラー種別
  message: string;          // エラーメッセージ
  details?: ErrorDetail[];  // エラー詳細（バリデーションエラー時）
  path: string;             // リクエストパス
  timestamp: string;        // タイムスタンプ (ISO 8601)
}

interface ErrorDetail {
  field: string;            // フィールド名
  message: string;          // エラーメッセージ
  code: string;             // エラーコード
}
```

**例（バリデーションエラー）**:
```json
{
  "status": 400,
  "error": "Validation Failed",
  "message": "入力データに2件のエラーがあります",
  "details": [
    {
      "field": "customer_name",
      "message": "顧客名は必須です",
      "code": "REQUIRED"
    },
    {
      "field": "email",
      "message": "正しいメールアドレスを入力してください",
      "code": "PATTERN"
    }
  ],
  "path": "/api/v1/forms/customer_form/answers",
  "timestamp": "2026-02-04T10:30:00.000Z"
}
```

**例（権限エラー）**:
```json
{
  "status": 403,
  "error": "Permission Denied",
  "message": "この操作を実行する権限がありません",
  "details": [
    {
      "field": "requiredPermission",
      "message": "EDIT",
      "code": "PERMISSION_REQUIRED"
    }
  ],
  "path": "/api/v1/forms/customer_form/answers/01KEXPZ52AFCPGMA7Q8A6HVTS9",
  "timestamp": "2026-02-04T10:30:00.000Z"
}
```

---

## 日時フォーマット

AWLL Studioでは、全ての日時データに**ISO 8601形式**を使用します。

### ISO 8601形式

```
YYYY-MM-DDTHH:mm:ss.sssZ
```

**例**:
```
2026-02-04T10:30:00.000Z
```

### JavaScriptでの生成

```javascript
// 現在日時
const now = new Date().toISOString();
console.log(now); // "2026-02-04T10:30:00.000Z"

// 特定の日時
const specificDate = new Date('2026-02-04T10:30:00Z').toISOString();
```

### JavaScriptでのパース

```javascript
const dateString = "2026-02-04T10:30:00.000Z";
const date = new Date(dateString);

console.log(date.toLocaleString('ja-JP')); // "2026/2/4 19:30:00"
```

---

## フィールド命名規則

### fieldCode（フィールドコード）

- **形式**: `snake_case`（小文字、数字、アンダースコアのみ）
- **長さ**: 1〜50文字
- **一意性**: データベース内で一意

**例**:
- ✅ `customer_name`
- ✅ `email_address`
- ✅ `phone_number_1`
- ❌ `customerName` (camelCase)
- ❌ `customer-name` (kebab-case)
- ❌ `Customer_Name` (大文字)

#### ⚠️ 予約語（使用禁止）

以下の JavaScript Object プロトタイププロパティ名は `fieldCode` として**使用してはならない**:

| 予約語 | 回避例 |
|--------|--------|
| `constructor` | `construction_company` / `builder_name` |
| `prototype` | `template` / `blueprint` |
| `__proto__` | — |
| `toString` | `display_text` / `label` |
| `hasOwnProperty` | `has_property` / `owns` |
| `valueOf` | `value` / `numeric_value` |
| `isPrototypeOf` | — |
| `propertyIsEnumerable` | — |
| `toLocaleString` | `localized_text` |

**理由**:
JavaScript のオブジェクトは `Object.prototype` を継承するため、`answerData[fieldCode]` でアクセスした際に**プロトタイプチェーン経由で組み込みプロパティが取得される**。
結果、`undefined` チェックをすり抜けて予期せぬ関数オブジェクトが値として扱われ、画面描画時に実行時エラー（例: `TypeError: value?.startsWith is not a function`）が発生する。

**具体例（NG）**:
```json
{
  "fieldCode": "constructor",
  "fieldName": "施工会社",
  "fieldType": "REFERENCE"
}
```
→ 新規作成画面を開くと `TypeError` で画面が落ちる。

**対応**:
既に `constructor` 等を使用しているフォームは、**別名の fieldCode で再作成**するか、バックエンドのスキーマ編集で `fieldCode` を変更する（レコードデータの移行が必要）。

### screenCode（画面コード）

- **形式**: `snake_case`
- **長さ**: 1〜50文字
- **一意性**: テナント内で一意

**例**:
- ✅ `customer_list`
- ✅ `order_detail`
- ❌ `customerList`

---

## フィールドタイプ詳細

### TEXT（テキスト）

**用途**: 単行テキストの入力

**バリデーション**:
- `minLength`: 最小文字数
- `maxLength`: 最大文字数
- `pattern`: 正規表現パターン

**例**:
```json
{
  "fieldCode": "customer_name",
  "fieldName": "顧客名",
  "fieldType": "TEXT",
  "required": true,
  "validation": {
    "minLength": 1,
    "maxLength": 100
  }
}
```

### NUMBER（数値）

**用途**: 数値の入力

**バリデーション**:
- `minValue`: 最小値
- `maxValue`: 最大値

**例**:
```json
{
  "fieldCode": "age",
  "fieldName": "年齢",
  "fieldType": "NUMBER",
  "required": false,
  "validation": {
    "minValue": 0,
    "maxValue": 150
  }
}
```

### DATE（日付）

**用途**: 日付の入力

**形式**: `YYYY-MM-DD`

**例**:
```json
{
  "fieldCode": "birth_date",
  "fieldName": "生年月日",
  "fieldType": "DATE",
  "required": false
}
```

### SELECT（プルダウン）

**用途**: 単一選択

**必須プロパティ**: `options`

**例**:
```json
{
  "fieldCode": "status",
  "fieldName": "ステータス",
  "fieldType": "SELECT",
  "required": true,
  "options": [
    { "value": "active", "label": "有効" },
    { "value": "inactive", "label": "無効" }
  ]
}
```

### CHECKBOX（チェックボックス）

**用途**: 複数選択

**必須プロパティ**: `options`

**値の形式**: 配列（例: `["value1", "value2"]`）

**例**:
```json
{
  "fieldCode": "interests",
  "fieldName": "興味のある分野",
  "fieldType": "CHECKBOX",
  "required": false,
  "options": [
    { "value": "sports", "label": "スポーツ" },
    { "value": "music", "label": "音楽" },
    { "value": "travel", "label": "旅行" }
  ]
}
```

### ARRAY（配列フィールド）

**用途**: 繰り返しデータの管理

**設定**: `arrayConfig`で子フィールドを定義

**例**:
```json
{
  "fieldCode": "order_items",
  "fieldName": "注文明細",
  "fieldType": "ARRAY",
  "required": false,
  "arrayConfig": {
    "minItems": 1,
    "maxItems": 10,
    "fields": [
      {
        "fieldCode": "product_name",
        "fieldName": "商品名",
        "fieldType": "TEXT",
        "required": true
      },
      {
        "fieldCode": "quantity",
        "fieldName": "数量",
        "fieldType": "NUMBER",
        "required": true
      }
    ]
  }
}
```

### REFERENCE（参照フィールド）

**用途**: 他データベースのレコードを参照

**設定**: `referenceConfig`で参照先を指定

**例**:
```json
{
  "fieldCode": "customer",
  "fieldName": "顧客",
  "fieldType": "REFERENCE",
  "required": true,
  "referenceConfig": {
    "referenceFormId": "customer_form",
    "displayField": "customer_name"
  }
}
```

### MARKDOWN（マークダウン）

**用途**: 読み取り専用の説明文やヘルプテキスト

**表示**: Markdown形式でレンダリング

**例**:
```json
{
  "fieldCode": "help_text",
  "fieldName": "ヘルプ",
  "fieldType": "MARKDOWN",
  "required": false
}
```

### CALCULATED（計算フィールド）

**用途**: 他フィールドの値を使った自動計算

**設定**: `calculationConfig`で計算式を指定

**例**:
```json
{
  "fieldCode": "total_amount",
  "fieldName": "合計金額",
  "fieldType": "CALCULATED",
  "required": false,
  "calculationConfig": {
    "calculationType": "FORMULA",
    "formula": "price * quantity"
  }
}
```

### USER（ユーザー選択フィールド）

**用途**: システムユーザーの選択

**設定**: `userConfig`で選択モードを指定

**例**:
```json
{
  "fieldCode": "assigned_to",
  "fieldName": "担当者",
  "fieldType": "USER",
  "required": false,
  "userConfig": {
    "selectionMode": "SINGLE",
    "displayField": "USERNAME"
  }
}
```

---

## 参考資料

- [Screen Development](./screen-development.md)
- [Script Development](./script-development.md)
- [Screen SDK Reference](./screen-sdk-reference.md)
- [Script SDK Reference](./script-sdk-reference.md)
