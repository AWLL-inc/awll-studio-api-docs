# Data Structures - データ構造仕様

**対象**: AWLL Studio開発者
**最終更新**: 2026-02-04

## 概要

AWLL Studioプラットフォームで使用されるデータ構造の完全なリファレンスです。

---

## レコードID形式

レコードIDは一意な識別子です。

- タイムスタンプ順にソート可能
- 26文字の英数字（大文字）

**例**: `01KEXPZ52AFCPGMA7Q8A6HVTS9`

---

## FormRecord（レコード）

### Screen SDKでの形式

```typescript
interface FormRecord {
  recordId: string;         // レコードID
  formRecordId: string;     // フォームレコードID
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
  "formRecordId": "customer_form",
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

## FormDefinition（フォーム定義）

```typescript
interface FormDefinition {
  tenantId: string;         // テナントID
  formId: string;           // フォームID
  version: string;          // バージョンID
  state: 'DRAFT' | 'PUBLISHED'; // 状態
  title: string;            // フォームタイトル
  schema: FormSchema;       // フォームスキーマ
  createdAt: string;        // 作成日時 (ISO 8601)
  updatedAt: string;        // 更新日時 (ISO 8601)
  createdBy: string;        // 作成者ID
}
```

---

## FormSchema（フォームスキーマ）

```typescript
interface FormSchema {
  fields: FormField[];      // フィールド定義配列
}

interface FormField {
  fieldCode: string;        // フィールドコード（一意、snake_case）
  fieldLabel: string;       // フィールドラベル
  fieldType: FieldType;     // フィールドタイプ
  required: boolean;        // 必須フラグ
  defaultValue?: unknown;   // デフォルト値
  options?: FieldOptions;   // フィールドオプション
}

type FieldType =
  | 'TEXT'          // テキスト
  | 'TEXTAREA'      // 複数行テキスト
  | 'NUMBER'        // 数値
  | 'EMAIL'         // メールアドレス
  | 'PHONE'         // 電話番号
  | 'DATE'          // 日付
  | 'DATETIME'      // 日時
  | 'CHECKBOX'      // チェックボックス
  | 'SELECT'        // プルダウン
  | 'RADIO'         // ラジオボタン
  | 'REFERENCE'     // 参照フィールド
  | 'ARRAY';        // 配列フィールド
```

**例**:
```json
{
  "fields": [
    {
      "fieldCode": "customer_name",
      "fieldLabel": "顧客名",
      "fieldType": "TEXT",
      "required": true
    },
    {
      "fieldCode": "email",
      "fieldLabel": "メールアドレス",
      "fieldType": "EMAIL",
      "required": true
    },
    {
      "fieldCode": "status",
      "fieldLabel": "ステータス",
      "fieldType": "SELECT",
      "required": false,
      "options": {
        "choices": [
          { "value": "active", "label": "有効" },
          { "value": "inactive", "label": "無効" }
        ]
      }
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
  compiledCode?: string;    // コンパイル済みコード
  dependencies: string[];   // 依存パッケージ
  fileUrl?: string;          // デプロイ先URL
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

```typescript
interface ScriptRule {
  ruleId: string;           // ルールID
  tenantId: string;         // テナントID
  formId: string;           // 対象フォームID
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
  tenantId: string;         // テナントコード
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
    },
    {
      "field": "resourceType",
      "message": "form_answer",
      "code": "RESOURCE_TYPE"
    },
    {
      "field": "resourceId",
      "message": "01KEXPZ52AFCPGMA7Q8A6HVTS9",
      "code": "RESOURCE_ID"
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
- **一意性**: フォーム内で一意

**例**:
- ✅ `customer_name`
- ✅ `email_address`
- ✅ `phone_number_1`
- ❌ `customerName` (camelCase)
- ❌ `customer-name` (kebab-case)
- ❌ `Customer_Name` (大文字)

### screenCode（画面コード）

- **形式**: `snake_case`
- **長さ**: 1〜50文字
- **一意性**: テナント内で一意

**例**:
- ✅ `customer_list`
- ✅ `order_detail`
- ❌ `customerList`

---

## 参考資料

- [Screen Development](./screen-development.md)
- [Script Development](./script-development.md)
- [Screen SDK Reference](./screen-sdk-reference.md)
- [Script SDK Reference](./script-sdk-reference.md)
