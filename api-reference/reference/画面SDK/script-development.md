# Script Development - JavaScriptビジネスロジックの作成

**対象**: AWLL Studioプラットフォームでスクリプトを開発する開発者
**難易度**: 初級〜中級
**最終更新**: 2026-02-04

## 概要

AWLL Studioでは、管理画面（`/admin/scripts`）でJavaScriptスクリプトを作成することで、フォーム回答の作成・更新時に自動実行されるビジネスロジックを実装できます。

## スクリプトトリガー

スクリプトは以下のタイミングで自動実行されます：

### ON_CREATE
フォーム回答が**新規作成**されたときに実行

**使用例**:
- 顧客番号の自動採番
- 関連レコードの自動作成
- 外部APIへの通知
- デフォルト値の設定

### ON_UPDATE
フォーム回答が**更新**されたときに実行

**使用例**:
- ステータス変更時の処理
- 変更履歴の記録
- 関連レコードの更新
- 外部システムへの同期

### ON_CHANGE
フォーム回答の**フィールドが変更**されたときにリアルタイム実行

**使用例**:
- 自動計算（単価 x 数量 → 金額）
- フィールド連動（ステータス変更時に関連フィールドを更新）
- リアルタイムバリデーション

**追加変数**: `field`（変更されたフィールドコード）、`value`（新しい値）

## Script API リファレンス

スクリプト内で使用できるAPI：

### `api.getRecords(formId, options)`
指定フォームのレコード一覧を取得

**パラメータ**:
- `formId` (string): フォームID
- `options` (object, optional):
  - `limit` (number): 取得件数（デフォルト: 100、1回最大: 100、累計最大: 1000）
  - `nextToken` (string): ページネーショントークン

**戻り値**: `Array<Record>` レコード配列

```javascript
const customers = api.getRecords('customer_form', { limit: 100 });
console.log('顧客数:', customers.length);
```

### `api.createRecord(formId, recordData)`
新規レコードを作成

**パラメータ**:
- `formId` (string): フォームID
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
- `formId` (string): フォームID
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
- `formId` (string): フォームID
- `recordId` (string): レコードID

**戻り値**: なし

```javascript
api.deleteRecord('customer_form', 'RECORD_ID_HERE');
```

## 実装パターン

### パターン1: 顧客番号の自動採番（ON_CREATE）

```javascript
// トリガー: ON_CREATE
// フォーム: customer_form

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
// フォーム: order_form

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
// フォーム: project_form

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
// フォーム: customer_form

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
// フォーム: order_item_form

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
// フォーム: task_form
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
- `context.event` (string): イベントタイプ (`"ON_CREATE"` または `"ON_UPDATE"`)
- `context.formId` (string): フォームID
- `context.user` (object): 実行ユーザー情報
  - `context.user.id` (string): ユーザーID
  - `context.user.email` (string): メールアドレス
  - `context.user.name` (string): ユーザー名

```javascript
console.log('イベント:', context.event);
console.log('フォームID:', context.formId);
console.log('実行ユーザー:', context.user.id);
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
console.log('フォームID:', context.formId);
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

// ✅ ページネーションで分割処理
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

**理由**: スクリプト実行エンジンが自動的にコードをIIFEでラップするため、スクリプト側でIIFEを使用すると**二重IIFE**になり、内側の`return`が外側に伝わりません。

## トラブルシューティング

### スクリプトが実行されない

**原因**:
1. トリガー設定が間違っている
2. 対象フォームIDが間違っている
3. スクリプトに構文エラーがある

**解決方法**:
1. 管理画面でスクリプト設定を確認
2. サーバーログでエラーを確認
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
