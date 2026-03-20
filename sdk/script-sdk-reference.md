# Script SDK API Reference

**対象**: AWLL Studioスクリプト開発者
**最終更新**: 2026-03-18

## スクリプト実行環境

スクリプトは以下のタイミングで実行されます：

- **ON_CREATE**: データベース回答が新規作成されたとき
- **ON_UPDATE**: データベース回答が更新されたとき
- **ON_BUTTON_CLICK**: カスタムボタンがクリックされたとき（#1137）

## グローバル変数

スクリプト内で使用できるグローバル変数：

### `record` (object)
現在の回答データ（fieldCode → value のマップ）

```javascript
console.log('顧客名:', record.customer_name);
console.log('メール:', record.email);

// レコードのフィールドを更新
record.status = 'active';
record.updated_at = new Date().toISOString();
```

### `oldRecord` (object, ON_UPDATEのみ)
更新前の回答データ

```javascript
// ステータス変更検出
if (record.status !== oldRecord.status) {
  console.log('ステータスが変更されました:',
    oldRecord.status, '→', record.status);
}

// 数値の増減を検出
const oldAmount = parseInt(oldRecord.amount) || 0;
const newAmount = parseInt(record.amount) || 0;
if (newAmount > oldAmount) {
  console.log('金額が増加しました:', oldAmount, '→', newAmount);
}
```

### `userId` (string)
実行ユーザーのユーザーID

```javascript
console.log('実行ユーザー:', userId);

// ユーザーIDを記録
record.last_modified_by = userId;
```

### `context` (object)
実行コンテキスト情報

```javascript
// イベントタイプ
console.log('イベント:', context.event); // "ON_CREATE" | "ON_UPDATE" | "ON_BUTTON_CLICK"

// データベースID
console.log('Form ID:', context.formId);
```

### `context.actionId` (string, ON_BUTTON_CLICKのみ)
クリックされたボタンのアクションID

```javascript
if (context.event === 'ON_BUTTON_CLICK') {
  console.log('アクションID:', context.actionId); // 例: "approve"
}
```

### `context.actionArgs` (object, ON_BUTTON_CLICKのみ)
ボタンクリック時に確認ダイアログで入力された値

```javascript
if (context.event === 'ON_BUTTON_CLICK') {
  const comment = context.actionArgs?.comment;
  console.log('コメント:', comment);
}
```

### サブテーブル（ARRAYフィールド）の操作

Script内でサブテーブルに行を追加できます:

```javascript
// 配列を取得（未初期化ならから配列）
var history = record.approval_history || [];

// 行を追加（承認者情報を含む）
history.push({
  action: '承認',
  approver: userId,
  comment: (context.actionArgs && context.actionArgs.comment) || '',
  executed_at: new Date().toISOString()
});

// レコードに書き戻す
record.approval_history = history;
```

> **注意**: `context.actionArgs?.comment` のオプショナルチェイニングは GraalVM で動作しない場合があります。`context.actionArgs && context.actionArgs.comment` の形式を使用してください。

### `api` (object)
API操作オブジェクト（詳細は後述）

---

## API リファレンス

### `api.getRecords(formId, options)`

指定データベースのレコード一覧を取得します。

#### パラメータ

- `formId` (string, 必須): データベースID
- `options` (object, オプション):
  - `limit` (number): 取得件数（デフォルト: 20、最大: 1000）
  - `nextToken` (string): ページネーショントークン

#### 戻り値

```javascript
Array<{
  id: string,           // レコードID
  formId: string,       // データベースID
  fields: object,       // フィールド値（fieldCode → value）
  createdAt: string,    // 作成日時 (ISO 8601)
  updatedAt: string,    // 更新日時 (ISO 8601)
}>
```

#### 使用例

```javascript
// 基本的な使用方法
const customers = api.getRecords('customer_form');
console.log('顧客数:', customers.length);

// 件数を指定
const recentCustomers = api.getRecords('customer_form', { limit: 100 });

// レコードをループ処理
customers.forEach(customer => {
  console.log('顧客名:', customer.fields.customer_name);
  console.log('メール:', customer.fields.email);
});

// フィルタリング
const activeCustomers = customers.filter(c =>
  c.fields.status === 'active'
);
```

---

### `api.createRecord(formId, recordData)`

新規レコードを作成します。

#### パラメータ

- `formId` (string, 必須): データベースID
- `recordData` (object, 必須): レコードデータ（fieldCode → value）

#### 戻り値

```javascript
{
  id: string,           // 作成されたレコードID
  formId: string,       // データベースID
  versionUlid: string,  // バージョンULID
  createdAt: string,    // 作成日時 (ISO 8601)
}
```

#### 使用例

```javascript
// 基本的な使用方法
const newCustomer = api.createRecord('customer_form', {
  customer_name: '山田太郎',
  email: 'yamada@example.com',
  phone: '03-1234-5678',
  status: 'active'
});

console.log('作成されたレコードID:', newCustomer.id);

// 複数レコードを作成
const defaultTasks = [
  { task_name: '要件定義', status: 'pending' },
  { task_name: '設計', status: 'pending' },
  { task_name: '実装', status: 'pending' },
];

defaultTasks.forEach(task => {
  const result = api.createRecord('task_form', {
    project_id: record.id, // 親プロジェクトのID
    ...task
  });
  console.log('タスク作成:', result.id);
});

// エラーハンドリング
try {
  const result = api.createRecord('form_id', recordData);
  console.log('作成成功:', result.id);
} catch (error) {
  console.error('作成失敗:', error.message);
  throw error; // 処理を中断
}
```

---

### `api.updateRecord(formId, recordId, updateData)`

既存レコードを更新します。

#### パラメータ

- `formId` (string, 必須): データベースID
- `recordId` (string, 必須): レコードID
- `updateData` (object, 必須): 更新データ（fieldCode → value）

#### 戻り値

```javascript
{
  id: string,           // レコードID
  formId: string,       // データベースID
  versionUlid: string,  // 新しいバージョンULID
  updatedAt: string,    // 更新日時 (ISO 8601)
}
```

#### 使用例

```javascript
// 基本的な使用方法
api.updateRecord('customer_form', 'RECORD_ID_HERE', {
  status: 'inactive',
  last_contacted: new Date().toISOString()
});

// 関連レコードを更新
const orders = api.getRecords('order_form');
const customerOrders = orders.filter(o =>
  o.fields.customer_id === record.id
);

customerOrders.forEach(order => {
  api.updateRecord('order_form', order.id, {
    customer_name: record.customer_name, // 顧客名を同期
    customer_status: record.status
  });
});

// 条件付き更新
if (record.status === 'completed' && oldRecord.status !== 'completed') {
  // 関連する顧客レコードを更新
  api.updateRecord('customer_form', record.customer_id, {
    last_order_date: new Date().toISOString(),
    total_orders: (parseInt(customer.fields.total_orders) || 0) + 1
  });
}
```

---

### `api.deleteRecord(formId, recordId)`

レコードを削除します（論理削除）。

#### パラメータ

- `formId` (string, 必須): データベースID
- `recordId` (string, 必須): レコードID

#### 戻り値

なし（void）

#### 使用例

```javascript
// 基本的な使用方法
api.deleteRecord('customer_form', 'RECORD_ID_HERE');

// 関連レコードを一括削除
const relatedTasks = api.getRecords('task_form').filter(t =>
  t.fields.project_id === record.id
);

relatedTasks.forEach(task => {
  api.deleteRecord('task_form', task.id);
  console.log('タスク削除:', task.id);
});

// 条件付き削除
if (record.status === 'cancelled') {
  // 関連する注文明細を削除
  const orderItems = api.getRecords('order_item_form').filter(item =>
    item.fields.order_id === record.id
  );

  orderItems.forEach(item => {
    api.deleteRecord('order_item_form', item.id);
  });
}
```

---

## 実装パターン集

### パターン1: 自動採番

```javascript
// ON_CREATE トリガー

const existingRecords = api.getRecords('customer_form', { limit: 1000 });

let maxNumber = 1000; // 初期値

existingRecords.forEach(rec => {
  const num = parseInt(rec.fields.customer_number);
  if (num > maxNumber) {
    maxNumber = num;
  }
});

record.customer_number = (maxNumber + 1).toString();
console.log('採番結果:', record.customer_number);
```

### パターン2: 重複チェック

```javascript
// ON_CREATE トリガー

const existingRecords = api.getRecords('customer_form');
const duplicate = existingRecords.find(rec =>
  rec.fields.email === record.email
);

if (duplicate) {
  console.error('エラー: メールアドレスが重複');
  throw new Error(`このメールアドレスは既に登録されています: ${record.email}`);
}
```

### パターン3: 変更検出と処理

```javascript
// ON_UPDATE トリガー

if (record.status !== oldRecord.status) {
  console.log('ステータス変更:', oldRecord.status, '→', record.status);

  if (record.status === 'completed') {
    // 完了時の処理
    record.completed_at = new Date().toISOString();
    record.completed_by = userId;

    // 関連レコードを更新
    api.updateRecord('project_form', record.project_id, {
      last_activity: new Date().toISOString()
    });
  }
}
```

### パターン4: 集計処理

```javascript
// ON_CREATE or ON_UPDATE トリガー

if (record.order_id) {
  // 同じ注文の明細を全て取得
  const orderItems = api.getRecords('order_item_form').filter(item =>
    item.fields.order_id === record.order_id
  );

  // 合計金額を計算
  let total = 0;
  orderItems.forEach(item => {
    const price = parseInt(item.fields.price) || 0;
    const quantity = parseInt(item.fields.quantity) || 0;
    total += price * quantity;
  });

  // 注文レコードを更新
  api.updateRecord('order_form', record.order_id, {
    total_amount: total.toString()
  });

  console.log('注文合計:', total);
}
```

### パターン5: 関連レコード自動作成

```javascript
// ON_CREATE トリガー

console.log('プロジェクト作成:', record.project_name);

// デフォルトタスクを自動作成
const defaultTasks = [
  { task_name: '要件定義', status: 'pending', order: 1 },
  { task_name: '設計', status: 'pending', order: 2 },
  { task_name: '実装', status: 'pending', order: 3 },
  { task_name: 'テスト', status: 'pending', order: 4 },
];

defaultTasks.forEach(task => {
  api.createRecord('task_form', {
    project_id: record.id,
    project_name: record.project_name,
    assigned_to: userId,
    ...task
  });
});

console.log('デフォルトタスク作成完了');
```

---

## ベストプラクティス

### ✅ DO（推奨）

1. **ログ出力でデバッグ**
```javascript
console.log('スクリプト開始:', new Date().toISOString());
console.log('処理対象:', record);
console.log('ユーザー:', userId);
```

2. **エラーハンドリング**
```javascript
try {
  const result = api.createRecord('form_id', data);
  console.log('成功:', result.id);
} catch (error) {
  console.error('失敗:', error.message);
  throw error; // 処理を中断
}
```

3. **冪等性を考慮**
```javascript
// 既存チェックしてから作成
const existing = api.getRecords('task_form').find(t =>
  t.fields.project_id === record.id &&
  t.fields.task_name === '要件定義'
);

if (!existing) {
  api.createRecord('task_form', { /* ... */ });
}
```

### ❌ DON'T（非推奨）

1. **無限ループを作らない**
```javascript
// ❌ ON_UPDATE で自分自身を更新すると無限ループ
api.updateRecord('customer_form', record.id, {
  updated_at: new Date().toISOString()
});
```

2. **大量データを一度に処理しない**
```javascript
// ❌ 10000件を一度に取得
const all = api.getRecords('form_id', { limit: 10000 });

// ✅ 適切な件数で処理
const records = api.getRecords('form_id', { limit: 100 });
```

3. **機密情報をログ出力しない**
```javascript
// ❌ パスワードやAPIキーを出力
console.log('全データ:', record);

// ✅ 必要な情報のみ出力
console.log('顧客名:', record.customer_name);
```

4. **IIFE（即時関数）を使用しない**
```javascript
// ❌ IIFEを使用すると二重ラップになり、returnが正しく取得できない
(function() {
  record.startDate = new Date().toISOString().split('T')[0];
  return { record: record };  // ← この返り値は取得されない！
})();

// ✅ IIFEなしで直接コードを記述する
record.startDate = new Date().toISOString().split('T')[0];
return { record: record };  // ← 正しく取得される
```

**理由**: スクリプト実行エンジン（SecureJavaScriptExecutor）が自動的にコードをIIFEでラップするため、スクリプト側でIIFEを使用すると**二重IIFE**になり、内側の`return`が外側に伝わりません。

---

## エラーハンドリング

### エラーの種類

| エラー | 説明 |
|--------|------|
| `ValidationError` | バリデーションエラー |
| `NotFoundError` | レコードが見つからない |
| `PermissionDeniedError` | 権限不足 |
| `NetworkError` | ネットワークエラー |

### エラーハンドリング例

```javascript
try {
  api.createRecord('customer_form', record);
} catch (error) {
  if (error.message.includes('already exists')) {
    console.error('重複エラー:', error.message);
    throw new Error('このメールアドレスは既に使用されています');
  } else if (error.message.includes('permission')) {
    console.error('権限エラー:', error.message);
    throw new Error('レコード作成権限がありません');
  } else {
    console.error('予期しないエラー:', error);
    throw error;
  }
}
```

---

## パフォーマンス最適化

### 1. 必要最小限のデータ取得

```javascript
// ❌ 全件取得
const all = api.getRecords('customer_form', { limit: 10000 });
const active = all.filter(c => c.fields.status === 'active');

// ✅ 必要な件数のみ取得
const customers = api.getRecords('customer_form', { limit: 100 });
```

### 2. ループ内のAPI呼び出しを最小化

```javascript
// ❌ ループ内で毎回API呼び出し
customers.forEach(customer => {
  api.updateRecord('customer_form', customer.id, { status: 'active' });
});

// ✅ 必要な場合のみ呼び出し
const inactiveCustomers = customers.filter(c => c.fields.status === 'inactive');
inactiveCustomers.forEach(customer => {
  api.updateRecord('customer_form', customer.id, { status: 'active' });
});
```

---

## デバッグ方法

### 1. コンソールログ確認

```bash
# バックエンドログを確認
docker compose logs -f backend | grep "ScriptExecution"
```

### 2. スクリプト内でデバッグ出力

```javascript
console.log('=== スクリプト開始 ===');
console.log('record:', JSON.stringify(record, null, 2));
console.log('userId:', userId);

// 処理実行
const result = api.createRecord('form_id', data);

console.log('result:', JSON.stringify(result, null, 2));
console.log('=== スクリプト終了 ===');
```

---

## 参考資料

- [Script Development](./script-development.md)
- [Data Structures](./data-structures.md)
- [Security Best Practices](./security-best-practices.md)
