# Script Development - JavaScriptビジネスロジックの作成

**対象**: AWLL Studioプラットフォームでスクリプトを開発する開発者
**難易度**: 初級〜中級
**最終更新**: 2026-03-18

## 概要

AWLL Studioでは、管理画面（`/admin/scripts`）でJavaScriptスクリプトを作成することで、データベース回答の作成・更新時やカスタムボタンクリック時に実行されるビジネスロジックを実装できます。

## スクリプトトリガー

### ON_CREATE
データベース回答が**新規作成**されたときに自動実行

**使用例**:
- 顧客番号の自動採番
- 関連レコードの自動作成
- デフォルト値の設定

### ON_UPDATE
データベース回答が**更新**されたときに自動実行

**使用例**:
- ステータス変更時の処理
- 変更履歴の記録
- 関連レコードの更新

### ON_BUTTON_CLICK
カスタムボタンが**クリック**されたときに実行

**設定方法**:
1. 管理画面 > ルール管理 でイベントタイプ「ボタンクリック時」を選択
2. アクションID（例: `approve`）を入力
3. FormBuilder >「カスタムアクション」タブでボタンを定義

**Script内で使える変数（ON_BUTTON_CLICK固有）**:

| 変数 | 説明 | 例 |
|------|------|-----|
| `context.actionId` | クリックされたボタンのID | `"approve"` |
| `context.actionArgs` | 確認ダイアログの入力値 | `{ comment: "承認します" }` |
| `context.actionArgs.comment` | コメント入力欄の値 | `"内容確認しました"` |

**基本テンプレート**:

```javascript
// ON_BUTTON_CLICK スクリプトの基本形
// context.actionId でどのボタンが押されたか判定
// record のフィールドを変更するとDBに保存される

// フィールド値を変更
record.status = 'new_value';

// 日時を記録
record.updated_at = new Date().toISOString();

// ダイアログ入力値を取得（inputFieldが有効な場合）
var comment = '';
if (context.actionArgs && context.actionArgs.comment) {
  comment = context.actionArgs.comment;
}

// 実行ユーザーID（userId グローバル変数を使用）
var executedBy = userId || 'unknown';

// サブテーブル（ARRAYフィールド）に行を追加
var logs = record.action_logs || [];
logs.push({
  action: context.actionId,
  executed_by: executedBy,
  comment: comment,
  executed_at: new Date().toISOString()
});
record.action_logs = logs;

console.log('アクション実行:', context.actionId, 'by', executedBy);
```

> **注意**: GraalVM環境では `context.actionArgs?.comment` のオプショナルチェイニングが動作しない場合があります。`context.actionArgs && context.actionArgs.comment` の形式を使用してください。

---

## カスタムボタンの設定

### FormBuilderでの設定（推奨）

1. FormBuilder > **「カスタムアクション」タブ** を開く
2. **「アクション追加」** をクリック
3. 以下を設定:
   - **アクションID**: スクリプトルールのactionIdと一致させる（例: `approve`）
   - **ボタン表示名**: 画面に表示されるラベル（例: `承認する`）
   - **スタイル**: 塗りつぶし / 枠線 / 赤 / テキスト
   - **確認ダイアログ**: ON にするとボタン押下時に確認ダイアログを表示
   - **表示条件**: 特定のフィールド値のときのみボタンを表示

### 確認ダイアログ

ボタン押下時に確認ダイアログを表示し、ユーザーにコメント入力を求められます。

| 設定 | 説明 |
|------|------|
| 確認メッセージ | ダイアログに表示するテキスト |
| コメント入力欄 | ON にするとテキスト入力欄を表示 |
| 入力欄ラベル | 入力欄の上に表示するラベル（例: 「コメント」「理由」） |

入力値はScript内で `context.actionArgs.comment` として取得できます。

### 表示条件

フィールドの値に応じてボタンの表示/非表示を制御できます。

例: `status` フィールドが `review` のときだけ表示
- フィールドコード: `status`
- 値: `review`

---

## サブテーブル（ARRAYフィールド）の操作

Script内でサブテーブル（ARRAYフィールド）に行を追加できます。

### 行の追加

```javascript
// サブテーブルの配列を取得（未初期化なら空配列）
var items = record.my_array_field || [];

// 新しい行を追加
items.push({
  field_a: 'value1',
  field_b: 'value2',
  created_at: new Date().toISOString()
});

// レコードに書き戻す
record.my_array_field = items;
```

### 行の検索・更新

```javascript
var items = record.my_array_field || [];

// 条件に一致する行を検索
for (var i = 0; i < items.length; i++) {
  if (items[i].status === 'pending') {
    items[i].status = 'completed';
    items[i].completed_at = new Date().toISOString();
  }
}

record.my_array_field = items;
```

### 行数の取得

```javascript
var count = (record.my_array_field || []).length;
console.log('サブテーブル行数:', count);
```

---

## 実用例

### 例1: 承認ワークフロー

データベース定義:
- `status` [SELECT]: 起票 / レビュー中 / 承認済
- `approval_history` [ARRAY]: action, comment, executed_at

承認Script:
```javascript
record.status = 'approved';
record.approved_at = new Date().toISOString();

var history = record.approval_history || [];
history.push({
  action: '承認',
  approver: userId,
  comment: (context.actionArgs && context.actionArgs.comment) || '',
  executed_at: new Date().toISOString()
});
record.approval_history = history;
```

差し戻しScript:
```javascript
record.status = 'draft';

var history = record.approval_history || [];
history.push({
  action: '差し戻し',
  approver: userId,
  comment: (context.actionArgs && context.actionArgs.comment) || '',
  executed_at: new Date().toISOString()
});
record.approval_history = history;
```

### 例2: レコードの複製（改訂版作成）

```javascript
var newRecord = api.createRecord(context.formId, {
  name: record.name,
  amount: record.amount,
  revision_number: (parseInt(record.revision_number) || 0) + 1,
  status: 'draft'
});

record.status = 'revised';
console.log('改訂版作成:', newRecord.id);
```

### 例3: フィールド値の一括変更

```javascript
// 「完了」ボタン: 関連フィールドをまとめて更新
record.status = 'completed';
record.completed_at = new Date().toISOString();
record.completed_by = userId;

// サブテーブルの全行のステータスも変更
var tasks = record.tasks || [];
for (var i = 0; i < tasks.length; i++) {
  if (tasks[i].status !== 'completed') {
    tasks[i].status = 'cancelled';
  }
}
record.tasks = tasks;
```

### 例4: 条件付き処理

```javascript
// 金額が100万以上なら上長承認が必要
var amount = parseInt(record.amount) || 0;

if (amount >= 1000000) {
  record.status = 'pending_manager_approval';
  console.log('上長承認が必要（金額:', amount, '）');
} else {
  record.status = 'approved';
  console.log('自動承認（金額:', amount, '）');
}
```

---

## Script API リファレンス

スクリプト内で使用できるAPI：

### `api.getRecords(formId, options)`
指定データベースのレコード一覧を取得

**パラメータ**:
- `formId` (string): データベースID
- `options` (object, optional):
  - `limit` (number): 取得件数（デフォルト: 20）
  - `nextToken` (string): ページネーショントークン

**戻り値**: `Array<Record>` レコード配列

```javascript
const customers = api.getRecords('customer_form', { limit: 100 });
console.log('顧客数:', customers.length);
```

### `api.createRecord(formId, recordData)`
新規レコードを作成

**パラメータ**:
- `formId` (string): データベースID
- `recordData` (object): レコードデータ（fieldCode → value）

**戻り値**: `{ id, formId, versionUlid, createdAt }`

```javascript
const newCustomer = api.createRecord('customer_form', {
  customer_name: '山田太郎',
  email: 'yamada@example.com',
  phone: '03-1234-5678'
});

console.log('作成されたレコードID:', newCustomer.id);
```

### `api.updateRecord(formId, recordId, updateData)`
既存レコードを更新

**パラメータ**:
- `formId` (string): データベースID
- `recordId` (string): レコードID
- `updateData` (object): 更新データ

**戻り値**: `{ id, formId, versionUlid, updatedAt }`

```javascript
api.updateRecord('customer_form', 'RECORD_ID_HERE', {
  status: 'active',
  last_contacted: new Date().toISOString()
});
```

### `api.deleteRecord(formId, recordId)`
レコードを削除（論理削除）

**パラメータ**:
- `formId` (string): データベースID
- `recordId` (string): レコードID

**戻り値**: なし

```javascript
api.deleteRecord('customer_form', 'RECORD_ID_HERE');
```

## 実装パターン

### パターン1: 顧客番号の自動採番（ON_CREATE）

```javascript
// トリガー: ON_CREATE
// データベース: customer_form

// 既存顧客の最大番号を取得
const existingCustomers = api.getRecords('customer_form', { limit: 1000 });

let maxNumber = 1000; // 初期値

existingCustomers.forEach(customer => {
  const customerNumber = parseInt(customer.fields.customer_number);
  if (customerNumber > maxNumber) {
    maxNumber = customerNumber;
  }
});

// 新しい顧客番号を設定
const newCustomerNumber = maxNumber + 1;

console.log('新規顧客番号:', newCustomerNumber);

// record.customer_number に設定
record.customer_number = newCustomerNumber.toString();

// 重要: 変更後のrecordを返す
return { record: record };
```

### パターン2: ステータス変更時の関連レコード更新（ON_UPDATE）

```javascript
// トリガー: ON_UPDATE
// データベース: order_form

// ステータスが「完了」に変更された場合
if (record.status === 'completed' && oldRecord.status !== 'completed') {
  console.log('注文が完了しました。関連レコードを更新します。');

  // 関連する顧客レコードを取得
  const customers = api.getRecords('customer_form');
  const customer = customers.find(c => c.id === record.customer_id);

  if (customer) {
    // 顧客の「最終注文日」を更新
    api.updateRecord('customer_form', customer.id, {
      last_order_date: new Date().toISOString(),
      total_orders: (parseInt(customer.fields.total_orders) || 0) + 1
    });

    console.log('顧客レコードを更新しました:', customer.id);
  }
}

// 重要: recordを返す（変更がない場合でも必須）
return { record: record };
```

### パターン3: 関連レコードの自動作成（ON_CREATE）

```javascript
// トリガー: ON_CREATE
// データベース: project_form

console.log('新規プロジェクト作成:', record.project_name);

// デフォルトタスクを自動作成
const defaultTasks = [
  { task_name: '要件定義', status: 'pending' },
  { task_name: '設計', status: 'pending' },
  { task_name: '実装', status: 'pending' },
  { task_name: 'テスト', status: 'pending' },
];

defaultTasks.forEach(task => {
  api.createRecord('task_form', {
    project_id: record.id, // 親プロジェクトのID
    task_name: task.task_name,
    status: task.status,
    assigned_to: record.created_by // プロジェクト作成者に割り当て
  });

  console.log('タスク作成:', task.task_name);
});

// 重要: recordを返す
return { record: record };
```

### パターン4: バリデーション（ON_CREATE）

```javascript
// トリガー: ON_CREATE
// データベース: customer_form

// メールアドレスの重複チェック
const existingCustomers = api.getRecords('customer_form');
const duplicate = existingCustomers.find(c =>
  c.fields.email === record.email
);

if (duplicate) {
  console.error('エラー: メールアドレスが重複しています');
  throw new Error(`このメールアドレスは既に登録されています: ${record.email}`);
}

// 電話番号のフォーマットチェック
if (record.phone && !/^[0-9-]+$/.test(record.phone)) {
  throw new Error('電話番号は数字とハイフンのみ使用できます');
}

console.log('バリデーションOK');

// 重要: recordを返す
return { record: record };
```

### パターン5: 集計処理（ON_UPDATE）

```javascript
// トリガー: ON_UPDATE
// データベース: order_item_form

// 注文明細が更新された場合、注文の合計金額を再計算
if (record.order_id) {
  console.log('注文合計を再計算します:', record.order_id);

  // 同じ注文IDの明細を全て取得
  const orderItems = api.getRecords('order_item_form');
  const relatedItems = orderItems.filter(item =>
    item.fields.order_id === record.order_id
  );

  // 合計金額を計算
  let total = 0;
  relatedItems.forEach(item => {
    const price = parseInt(item.fields.price) || 0;
    const quantity = parseInt(item.fields.quantity) || 0;
    total += price * quantity;
  });

  console.log('注文合計金額:', total);

  // 注文レコードを更新
  api.updateRecord('order_form', record.order_id, {
    total_amount: total.toString()
  });
}

// 重要: recordを返す
return { record: record };
```

### パターン6: 日付の自動計算（ON_CREATE / ON_UPDATE）

```javascript
// トリガー: ON_CREATE, ON_UPDATE
// データベース: task_form
// 目的: 開始日が入力されたら、期限日を自動設定（10日後）

console.log('=== 期限日自動設定スクリプト実行開始 ===');
console.log('イベント:', context.event);
console.log('record:', JSON.stringify(record, null, 2));

// 期限日が既に設定されている場合はスキップ
if (record.dueDate && record.dueDate !== '') {
  console.log('期限日が既に設定されているため、スクリプトを終了します');
  return { record: record };
}

// 開始日が入力されているかチェック
if (!record.startDate || record.startDate === '') {
  console.log('開始日が空のため、スクリプトを終了します');
  return { record: record };
}

// 開始日をDateオブジェクトに変換
const startDate = new Date(record.startDate);

// 開始日が有効な日付かチェック
if (isNaN(startDate.getTime())) {
  console.error('開始日が無効な日付形式です:', record.startDate);
  return { record: record };
}

// 10日後の日付を計算
const dueDate = new Date(startDate);
dueDate.setDate(dueDate.getDate() + 10);

// ISO 8601形式 (YYYY-MM-DD) に変換
const dueDateString = dueDate.toISOString().split('T')[0];

// recordオブジェクトを直接変更
record.dueDate = dueDateString;

console.log('開始日:', record.startDate, '→ 期限日:', dueDateString, 'を自動設定しました');
console.log('変更後のrecord:', JSON.stringify(record, null, 2));
console.log('=== 期限日自動設定スクリプト実行完了 ===');

// 重要: 変更後のrecordを返す
return { record: record };
```

## 実行コンテキスト

スクリプト内で使用できる変数：

### `context` (object)
スクリプト実行コンテキスト

**プロパティ**:
- `context.event` (string): イベントタイプ (`"ON_CREATE"`, `"ON_UPDATE"`, `"ON_BUTTON_CLICK"`)
- `context.formId` (string): データベースID
- `context.actionId` (string): アクションID（ON_BUTTON_CLICKのみ）
- `context.actionArgs` (object): 確認ダイアログの入力値（ON_BUTTON_CLICKのみ）

> **注意**: `context.user` はJavaオブジェクトのため、プロパティアクセスが動作しない場合があります。ユーザーIDの取得には **`userId` グローバル変数** を使用してください。

```javascript
console.log('イベント:', context.event);
console.log('データベースID:', context.formId);
console.log('実行ユーザー:', userId);
```

### `record` (object)
現在の回答データ（fieldCode → value）

```javascript
console.log('顧客名:', record.customer_name);
console.log('メール:', record.email);
```

### `oldRecord` (object, ON_UPDATEのみ)
更新前の回答データ

```javascript
if (record.status !== oldRecord.status) {
  console.log('ステータスが変更されました:',
    oldRecord.status, '→', record.status);
}
```

### `userId` (string) - 非推奨
実行ユーザーのID（`context.user.id` の使用を推奨）

```javascript
// ❌ 非推奨
console.log('実行ユーザー:', userId);

// ✅ 推奨
console.log('実行ユーザー:', context.user.id);
```

### `console` (object)
ログ出力用のコンソールオブジェクト

**メソッド**:
- `console.log(...messages)`: 情報ログを出力
- `console.info(...messages)`: 情報ログを出力（logと同じ）
- `console.warn(...messages)`: 警告ログを出力
- `console.error(...messages)`: エラーログを出力

**特徴**:
- 複数引数に対応（スペース区切りで連結）
- 最大100件まで記録
- 実行ログに保存され、管理画面で確認可能

```javascript
// 単一引数
console.log('スクリプト開始');

// 複数引数（スペース区切りで連結）
console.log('開始日:', record.startDate, '→ 期限日:', record.dueDate);
console.warn('警告:', '期限日が過去の日付です');
console.error('エラー:', 'メールアドレスが無効です');

// オブジェクトのログ出力
console.log('record:', JSON.stringify(record, null, 2));
```

## ベストプラクティス

### ✅ DO（推奨）

1. **必ず `return { record: record };` を記述する**
```javascript
// ON_CREATE または ON_UPDATE スクリプトでは必須
// recordを変更した場合も、変更しない場合も必ず返す

// recordを変更する例
record.dueDate = calculateDueDate(record.startDate);
return { record: record };

// recordを変更しない例（バリデーションのみ）
if (record.email && !isValidEmail(record.email)) {
  throw new Error('無効なメールアドレスです');
}
return { record: record }; // 変更なしでも必須
```

**重要**: `return { record: record };` を忘れると、スクリプトで変更した内容が保存されません。

2. **`context` オブジェクトを活用する**
```javascript
// イベントタイプによって処理を分岐
console.log('イベントタイプ:', context.event);
console.log('データベースID:', context.formId);
console.log('実行ユーザー:', context.user.id);
```

3. **ログ出力を活用してデバッグ**
```javascript
// console.log/warn/error/info は複数引数に対応
console.log('スクリプト開始:', new Date().toISOString());
console.log('イベント:', context.event);
console.log('処理対象レコード:', record);

// 複数の値を並べて出力可能（スペース区切りで連結されます）
console.log('開始日:', record.startDate, '→ 期限日:', record.dueDate);
console.log('顧客名:', record.customer_name, 'メール:', record.email);
```

4. **エラーハンドリングを実装**
```javascript
try {
  const result = api.createRecord('form_id', data);
  console.log('作成成功:', result.id);
} catch (error) {
  console.error('作成失敗:', error.message);
  throw error; // 再スロー で処理を中断
}
```

5. **idempotent（冪等性）な処理にする**
```javascript
// 既存レコードをチェックしてから作成
const existing = api.getRecords('task_form').find(t =>
  t.fields.project_id === record.id &&
  t.fields.task_name === '要件定義'
);

if (!existing) {
  api.createRecord('task_form', { /* ... */ });
}
```

6. **パフォーマンスを考慮**
```javascript
// ❌ 悪い例: ループ内でAPI呼び出し
customers.forEach(customer => {
  api.updateRecord('customer_form', customer.id, { /* ... */ });
});

// ✅ 良い例: 必要最小限のAPI呼び出し
const targetCustomers = customers.filter(c => c.fields.status === 'inactive');
targetCustomers.forEach(customer => {
  api.updateRecord('customer_form', customer.id, { status: 'active' });
});
```

### ❌ DON'T（非推奨）

1. **無限ループを作らない**
```javascript
// ❌ ON_UPDATE スクリプトで自分自身を更新すると無限ループ
api.updateRecord('customer_form', record.id, {
  updated_at: new Date().toISOString() // 無限ループ！
});
```

2. **大量のレコードを一度に処理しない**
```javascript
// ❌ 10000件のレコードを一度に取得
const allRecords = api.getRecords('form_id', { limit: 10000 });

// ✅ 適切な件数で取得（最大1000）
const records = api.getRecords('form_id', { limit: 100 });
```

3. **機密情報をログ出力しない**
```javascript
// ❌ パスワードやAPIキーをログ出力
console.log('ユーザー情報:', record);

// ✅ 機密情報を除外
console.log('ユーザー名:', record.customer_name);
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

## トラブルシューティング

### スクリプトが実行されない

**原因**:
1. トリガー設定が間違っている
2. 対象データベースIDが間違っている
3. スクリプトに構文エラーがある

**解決方法**:
1. 管理画面でスクリプト設定を確認
2. `docker compose logs -f backend` でエラーログ確認
3. JavaScriptの構文エラーを修正

### エラー: "event is not defined"

**原因**: スクリプト内で `event` 変数を直接参照している

**解決方法**:
```javascript
// ❌ 間違い
console.log('イベント:', event);

// ✅ 正しい
console.log('イベント:', context.event);
```

### エラー: "api is not defined"

**原因**: スクリプト内で`api`が使用できない環境

**解決方法**:
- スクリプトは必ず管理画面（`/admin/scripts`）から登録
- ローカル開発環境で実行する場合は、正しいテスト環境を使用

### スクリプトで変更した内容が保存されない

**原因**: `return { record: record };` が記述されていない

**解決方法**:
```javascript
// recordを変更
record.dueDate = '2026-02-13';

// ❌ 間違い: returnがない
// スクリプトはエラーなく完了するが、変更が保存されない

// ✅ 正しい: recordを返す
return { record: record };
```

### レコード作成が失敗する

**原因**:
1. 必須フィールドが不足している
2. バリデーションエラー
3. 権限不足

**解決方法**:
```javascript
try {
  api.createRecord('form_id', data);
} catch (error) {
  console.error('作成失敗:', error);
  console.error('データ:', data);
  // エラー詳細を確認
}
```

## セキュリティ注意事項

1. **SQLインジェクション対策不要**: AWLL StudioのAPIは自動的にエスケープされます
2. **XSS対策**: ユーザー入力をそのままHTMLに出力しない（画面側で対策）
3. **権限チェック**: API呼び出し時に自動的に権限チェックが実行されます

## 参考資料

- [Script SDK API Reference](./script-sdk-reference.md)
- [Data Structures](./data-structures.md)
- [Security Best Practices](./security-best-practices.md)

---

**次のステップ**: [Data Structures](./data-structures.md)でデータ構造を理解しましょう。
