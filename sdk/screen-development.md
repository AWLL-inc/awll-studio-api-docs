# Screen Development - React画面定義の作成

**対象**: AWLL Studioプラットフォームで画面を開発する開発者
**難易度**: 初級〜中級
**最終更新**: 2026-02-04

## 概要

AWLL Studioでは、管理画面（`/admin/screens`）でReact画面定義を作成することで、カスタム画面を自由に開発できます。本ドキュメントでは、画面開発のベストプラクティスと実装パターンを説明します。

## 基本構成

### 最小限の画面定義

```tsx
import React from 'react';
import { useExecutionContext } from '@awll/sdk';

export default function MyScreen() {
  const context = useExecutionContext();

  return (
    <div>
      <h1>ようこそ、{context.currentUser.name}さん</h1>
      <p>テナント: {context.tenant.name}</p>
    </div>
  );
}
```

### 重要なポイント

1. **必ずdefault exportを使用**: `export default function` が必須
2. **SDK importは`@awll/sdk`から**: `window.AWLLSDK`は使用しない
3. **Reactフックは通常通り使用可能**: `useState`, `useEffect`など

## データ取得パターン

### パターン1: レコード一覧表示（基本）

```tsx
import React from 'react';
import { useRecords } from '@awll/sdk';

export default function CustomerList() {
  const { data, total, isLoading, error } = useRecords('customer_form');

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;

  return (
    <div>
      <h1>顧客一覧 ({total}件)</h1>
      <table>
        <thead>
          <tr>
            <th>顧客名</th>
            <th>メールアドレス</th>
            <th>電話番号</th>
          </tr>
        </thead>
        <tbody>
          {data.map((record) => (
            <tr key={record.recordId}>
              <td>{record.values.customer_name}</td>
              <td>{record.values.email}</td>
              <td>{record.values.phone}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### パターン2: ページネーション付き一覧

```tsx
import React from 'react';
import { useRecords } from '@awll/sdk';

export default function PaginatedCustomerList() {
  const {
    data,
    total,
    page,
    pageSize,
    totalPages,
    setPage,
    isLoading,
  } = useRecords({
    formId: 'customer_form',
    pagination: { page: 1, pageSize: 20 },
  });

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <div>
      <h1>顧客一覧 ({total}件)</h1>

      <table>
        {/* テーブル内容は省略 */}
      </table>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          前へ
        </button>
        <span style={{ margin: '0 20px' }}>
          ページ {page} / {totalPages}
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
        >
          次へ
        </button>
      </div>
    </div>
  );
}
```

### パターン3: 単一レコード詳細表示

```tsx
import React from 'react';
import { useRecord, useExecutionContext } from '@awll/sdk';

export default function CustomerDetail() {
  const context = useExecutionContext();
  const customerId = context.params.customerId; // URLパラメータから取得

  const { data: customer, isLoading } = useRecord('customer_form', customerId);

  if (isLoading) return <div>読み込み中...</div>;
  if (!customer) return <div>顧客が見つかりません</div>;

  return (
    <div>
      <h1>顧客詳細</h1>
      <dl>
        <dt>顧客名</dt>
        <dd>{customer.values.customer_name}</dd>

        <dt>メールアドレス</dt>
        <dd>{customer.values.email}</dd>

        <dt>電話番号</dt>
        <dd>{customer.values.phone}</dd>

        <dt>作成日時</dt>
        <dd>{new Date(customer.metadata.createdAt).toLocaleString('ja-JP')}</dd>
      </dl>
    </div>
  );
}
```

## 画面間ナビゲーション

### URL体系

カスタム画面（Screen）は以下のURL構造で動作します:

```
/business/screens/:screenId?key1=value1&key2=value2
```

一覧画面→詳細画面の遷移は、**クエリパラメータ** で answerId や nodeId を受け渡します。

### パターン: 一覧画面→詳細画面の遷移

#### 一覧画面（customer_list）

```tsx
import React from 'react';
import { useRecords, useNavigation } from '@awll/sdk';

export default function CustomerList() {
  const { data: records, total, isLoading } = useRecords('customer_form');
  const { navigateToScreen } = useNavigation();

  if (isLoading) return <div>読み込み中...</div>;

  const handleRowClick = (record) => {
    // 詳細画面へ遷移（answerId と nodeId をクエリパラメータで渡す）
    navigateToScreen('customer_detail', {
      answerId: record.answerId,
      nodeId: record.rootNodeId,
    });
    // → /business/screens/scr-xxx?answerId=ans-001&nodeId=node-001
  };

  return (
    <div>
      <h1>顧客一覧 ({total}件)</h1>
      <table>
        <thead>
          <tr><th>顧客名</th><th>メール</th></tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.answerId} onClick={() => handleRowClick(record)}
                style={{ cursor: 'pointer' }}>
              <td>{record.values.customer_name}</td>
              <td>{record.values.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

#### 詳細画面（customer_detail）

```tsx
import React from 'react';
import { useRecord, useNavigation, useExecutionContext } from '@awll/sdk';

export default function CustomerDetail() {
  const { params } = useExecutionContext();
  const { answerId, nodeId } = params; // クエリパラメータから取得
  const { goBack } = useNavigation();

  const { data: customer, isLoading } = useRecord('customer_form', answerId);

  if (isLoading) return <div>読み込み中...</div>;
  if (!customer) return <div>顧客が見つかりません</div>;

  return (
    <div>
      <button onClick={goBack}>← 一覧に戻る</button>
      <h1>顧客詳細</h1>
      <dl>
        <dt>顧客名</dt>
        <dd>{customer.values.customer_name}</dd>
        <dt>メールアドレス</dt>
        <dd>{customer.values.email}</dd>
      </dl>
      {/* nodeId が必要な場合はサブテーブル操作に使用 */}
    </div>
  );
}
```

### navigateToScreen API

```typescript
navigateToScreen(screenCode: string, params?: Record<string, string>): void
```

| 引数 | 型 | 説明 |
|------|-----|------|
| `screenCode` | string | 遷移先の画面コード（`^[a-z0-9_]+$`） |
| `params` | Record<string, string> | クエリパラメータ（URLエンコードされる） |

- `screenCode` から screenId を自動解決（`GET /api/v1/screens/code/{screenCode}/published`）
- `params` は `?key=value&...` としてURLに付与される
- ブラウザバック・リロード・URL共有いずれも動作する

### navigateToForm API

データベースの組み込み画面（一覧・新規作成・編集）へ直接遷移する場合:

```typescript
navigateToForm(formId: string, options?: { mode?: 'list' | 'create' | 'edit'; recordId?: string }): void
```

| mode | 遷移先URL | 説明 |
|------|-----------|------|
| `list` | `/forms/:formId/answers` | 一覧画面 |
| `create` | `/forms/:formId/answers/new` | 新規作成画面 |
| `edit` | `/forms/:formId/answers/:recordId/edit` | 編集画面 |

### パターン: 複数画面をまたぐ業務フロー

顧客一覧→顧客詳細→商談→TODOのように複数画面を遷移する場合、画面ごとに `screenCode` を分け、クエリパラメータで文脈（どの顧客か、どの商談か）を引き継ぎます。

#### URL遷移イメージ

```
/business/screens/scr-001                                ← 顧客一覧
/business/screens/scr-002?customerId=ans-001             ← 顧客詳細
/business/screens/scr-003?customerId=ans-001&dealId=d-01 ← 商談詳細
/business/screens/scr-004?customerId=ans-001&todoId=t-01 ← TODO詳細
```

各URLはブラウザバック・リロード・URL共有いずれも動作します。

#### 顧客一覧（customer_list）

```tsx
import React from 'react';
import { useRecords, useNavigation } from '@awll/sdk';

export default function CustomerList() {
  const { data: records, isLoading } = useRecords('customer_form');
  const { navigateToScreen } = useNavigation();

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <table>
      <thead><tr><th>顧客名</th><th>メール</th></tr></thead>
      <tbody>
        {records.map((r) => (
          <tr key={r.answerId}
              onClick={() => navigateToScreen('customer_detail', {
                customerId: r.answerId,
              })}
              style={{ cursor: 'pointer' }}>
            <td>{r.values.customer_name}</td>
            <td>{r.values.email}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

#### 顧客詳細（customer_detail）

```tsx
import React from 'react';
import { useRecord, useRecords, useNavigation, useExecutionContext } from '@awll/sdk';

export default function CustomerDetail() {
  const { params } = useExecutionContext();
  const { customerId } = params;
  const { navigateToScreen, goBack } = useNavigation();

  const { data: customer, isLoading } = useRecord('customer_form', customerId);
  const { data: deals } = useRecords('deal_form', {
    filter: { customer_id: customerId },
  });

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <div>
      <button onClick={goBack}>← 一覧に戻る</button>
      <h1>{customer.values.customer_name}</h1>

      <h2>商談一覧</h2>
      <ul>
        {deals?.map((deal) => (
          <li key={deal.answerId}
              onClick={() => navigateToScreen('deal_detail', {
                customerId,
                dealId: deal.answerId,
              })}
              style={{ cursor: 'pointer' }}>
            {deal.values.deal_name} - {deal.values.amount}円
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### 商談詳細（deal_detail）

```tsx
import React from 'react';
import { useRecord, useRecords, useNavigation, useExecutionContext } from '@awll/sdk';

export default function DealDetail() {
  const { params } = useExecutionContext();
  const { customerId, dealId } = params;
  const { navigateToScreen, goBack } = useNavigation();

  const { data: deal, isLoading } = useRecord('deal_form', dealId);
  const { data: todos } = useRecords('todo_form', {
    filter: { deal_id: dealId },
  });

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <div>
      <button onClick={goBack}>← 顧客詳細に戻る</button>
      <h1>商談: {deal.values.deal_name}</h1>
      <p>金額: {deal.values.amount}円</p>

      <h2>TODO</h2>
      <ul>
        {todos?.map((todo) => (
          <li key={todo.answerId}
              onClick={() => navigateToScreen('todo_detail', {
                customerId,
                todoId: todo.answerId,
              })}
              style={{ cursor: 'pointer' }}>
            {todo.values.title} - {todo.values.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### ポイント

- **文脈の引き継ぎ**: 遷移先に `customerId` を常に渡すことで、どの画面からでも「どの顧客の情報か」が明確
- **ブラウザバック対応**: `navigateToScreen` は通常のページ遷移なので、ブラウザの戻るボタンで前画面に戻れる
- **URL共有**: クエリパラメータに全ての文脈が含まれるため、URLをコピーして他の人に共有可能
- **コンポーネント共有**: マルチファイルモードを使えば、共通コンポーネント（ヘッダー、ローディング等）を各画面間で再利用可能

### その他のナビゲーション

```typescript
// 外部URLへ遷移（http/httpsのみ）
navigateToExternalUrl(url: string, options?: { newTab?: boolean }): void

// ブラウザバック
goBack(): void
```

---

## データ更新パターン

### パターン4: レコード作成データベース

```tsx
import React, { useState } from 'react';
import { useMutation } from '@awll/sdk';

export default function CreateCustomerForm() {
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
  });

  const createMutation = useMutation('create');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await createMutation.mutate({
        formId: 'customer_form',
        answerData: formData,
      });

      alert(`顧客を作成しました（ID: ${result.recordId}）`);

      // データベースをリセット
      setFormData({ customer_name: '', email: '', phone: '' });
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>新規顧客登録</h1>

      <div>
        <label>顧客名</label>
        <input
          type="text"
          value={formData.customer_name}
          onChange={(e) => setFormData({
            ...formData,
            customer_name: e.target.value
          })}
          required
        />
      </div>

      <div>
        <label>メールアドレス</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({
            ...formData,
            email: e.target.value
          })}
          required
        />
      </div>

      <div>
        <label>電話番号</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({
            ...formData,
            phone: e.target.value
          })}
        />
      </div>

      <button type="submit" disabled={createMutation.isLoading}>
        {createMutation.isLoading ? '登録中...' : '登録'}
      </button>
    </form>
  );
}
```

### パターン5: レコード更新データベース

```tsx
import React, { useState, useEffect } from 'react';
import { useRecord, useMutation, useExecutionContext } from '@awll/sdk';

export default function EditCustomerForm() {
  const context = useExecutionContext();
  const customerId = context.params.customerId;

  const { data: customer, isLoading } = useRecord('customer_form', customerId);
  const updateMutation = useMutation('update');

  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
  });

  // レコード取得後、データベースに反映
  useEffect(() => {
    if (customer) {
      setFormData({
        customer_name: customer.values.customer_name || '',
        email: customer.values.email || '',
        phone: customer.values.phone || '',
      });
    }
  }, [customer]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await updateMutation.mutate({
        formId: 'customer_form',
        recordId: customerId,
        answerData: formData,
      });

      alert('顧客情報を更新しました');
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <form onSubmit={handleSubmit}>
      <h1>顧客情報編集</h1>

      <div>
        <label>顧客名</label>
        <input
          type="text"
          value={formData.customer_name}
          onChange={(e) => setFormData({
            ...formData,
            customer_name: e.target.value
          })}
          required
        />
      </div>

      {/* 他のフィールドは省略 */}

      <button type="submit" disabled={updateMutation.isLoading}>
        {updateMutation.isLoading ? '更新中...' : '更新'}
      </button>
    </form>
  );
}
```

## ベストプラクティス

### ✅ DO（推奨）

1. **エラーハンドリングを必ず実装**
```tsx
const { data, error, isLoading } = useRecords('form_id');

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
```

2. **ローディング状態を表示**
```tsx
<button disabled={mutation.isLoading}>
  {mutation.isLoading ? '処理中...' : '送信'}
</button>
```

3. **型安全性のためTypeScriptを活用**
```tsx
interface CustomerRecord {
  customer_name: string;
  email: string;
  phone: string;
}

const { data } = useRecords<CustomerRecord>('customer_form');
```

4. **パフォーマンス最適化でReact.memoを使用**
```tsx
const RecordRow = React.memo(({ record }) => (
  <tr>
    <td>{record.values.name}</td>
  </tr>
));
```

### ❌ DON'T（非推奨）

1. **window.AWLLSDKを直接参照しない**
```tsx
// ❌ 動作しません
const context = window.AWLLSDK.useExecutionContext();

// ✅ 正しい方法
import { useExecutionContext } from '@awll/sdk';
const context = useExecutionContext();
```

2. **データベースバリデーションを省略しない**
```tsx
// ❌ バリデーションなし
const handleSubmit = async () => {
  await createMutation.mutate({ formId, answerData: formData });
};

// ✅ バリデーション実装
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.email.includes('@')) {
    alert('正しいメールアドレスを入力してください');
    return;
  }

  await createMutation.mutate({ formId, answerData: formData });
};
```

3. **useEffect内で非同期処理を直接実行しない**
```tsx
// ❌ メモリリーク の可能性
useEffect(() => {
  fetch('/api/data').then(setData);
}, []);

// ✅ クリーンアップ関数を実装
useEffect(() => {
  let cancelled = false;

  fetch('/api/data').then(data => {
    if (!cancelled) setData(data);
  });

  return () => { cancelled = true; };
}, []);
```

## トラブルシューティング

### エラー: "Cannot read properties of undefined (reading 'useExecutionContext')"

**原因**: `window.AWLLSDK`を直接参照している

**解決方法**:
```tsx
// ❌ 間違い
const context = window.AWLLSDK.useExecutionContext();

// ✅ 正しい
import { useExecutionContext } from '@awll/sdk';
const context = useExecutionContext();
```

### エラー: "SDK request timeout"

**原因**: バックエンドAPIが応答していない

**解決方法**:
1. `docker compose logs -f backend` でログ確認
2. ネットワーク接続確認
3. ブラウザコンソールでエラー詳細確認

### レコードが表示されない

**原因**: データベースIDが間違っている、または権限不足

**解決方法**:
1. 管理画面（`/admin/forms`）で正しいデータベースIDを確認
2. テナント・ユーザー権限を確認
3. `useRecords`の`error`プロパティでエラー詳細確認

## マルチファイル画面開発

### 概要

マルチファイルモードを使用すると、1つの画面定義を複数のファイルに分割して管理できます。コンポーネントの分離、スタイルの分離、ユーティリティの再利用など、より本格的な画面開発が可能になります。

### マルチファイルモードへの変換

#### API経由

```bash
curl -X POST "https://api.awll-studio.ai/api/v1/screens/{screenId}/convert-to-multifile" \
  -H "Authorization: Bearer <token>"
```

レスポンス:

```json
{
  "success": true,
  "screenId": "scr-001",
  "version": "01ARZ3...",
  "entryPoint": "App.tsx",
  "fileCount": 1
}
```

変換後、既存の `sourceCode` が `App.tsx`（エントリーポイント）として保存されます。

#### UI経由

管理画面のスクリーンビルダーで「マルチファイルに変換」ボタンをクリックします。

> **注意**: マルチファイルへの変換は不可逆です。単一ファイルモードには戻せません。

### ファイル構成例

```
App.tsx                    # エントリーポイント（必須）
components/
  Header.tsx               # ヘッダーコンポーネント
  CustomerTable.tsx        # テーブルコンポーネント
  SearchForm.tsx           # 検索フォーム
hooks/
  useCustomerData.ts       # カスタムフック
styles/
  main.css                 # スタイル
utils/
  formatters.ts            # ユーティリティ関数
```

### エントリーポイント

- エントリーポイントはデフォルトで `App.tsx` です
- エントリーポイントには `export default` が必要です（単一ファイルモードと同じ）
- エントリーポイントファイルは削除できません
- リネームAPIでエントリーポイントを移動した場合、設定は自動更新されます

### ファイル間のimportパターン

マルチファイル画面では、相対パスを使ってファイル間でimportできます。

```tsx
// App.tsx
import React from 'react';
import { useExecutionContext } from '@awll/sdk';
import Header from './components/Header';
import CustomerTable from './components/CustomerTable';
import './styles/main.css';

export default function App() {
  const context = useExecutionContext();

  return (
    <div>
      <Header title="顧客管理" userName={context.currentUser.name} />
      <CustomerTable />
    </div>
  );
}
```

```tsx
// components/Header.tsx
import React from 'react';

interface HeaderProps {
  title: string;
  userName: string;
}

export default function Header({ title, userName }: HeaderProps) {
  return (
    <header>
      <h1>{title}</h1>
      <span>ログインユーザー: {userName}</span>
    </header>
  );
}
```

```tsx
// components/CustomerTable.tsx
import React from 'react';
import { useRecords } from '@awll/sdk';
import { formatDate } from '../utils/formatters';

export default function CustomerTable() {
  const { data, isLoading } = useRecords('customer_form');

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>顧客名</th>
          <th>登録日</th>
        </tr>
      </thead>
      <tbody>
        {data.map((record) => (
          <tr key={record.recordId}>
            <td>{record.values.customer_name}</td>
            <td>{formatDate(record.metadata.createdAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### ファイル操作API

#### ファイル一覧取得

```bash
curl "https://api.awll-studio.ai/api/v1/screens/{screenId}/files" \
  -H "Authorization: Bearer <token>"
```

#### ファイル取得

```bash
curl "https://api.awll-studio.ai/api/v1/screens/{screenId}/files/components/Header.tsx" \
  -H "Authorization: Bearer <token>"
```

#### ファイル作成/更新

```bash
curl -X PUT "https://api.awll-studio.ai/api/v1/screens/{screenId}/files/components/Footer.tsx" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "import React from '\''react'\'';\n\nexport default function Footer() {\n  return <footer>Copyright 2026</footer>;\n}\n"
  }'
```

#### ファイル削除

```bash
curl -X DELETE "https://api.awll-studio.ai/api/v1/screens/{screenId}/files/components/OldComponent.tsx" \
  -H "Authorization: Bearer <token>"
```

#### ファイルリネーム/移動

```bash
curl -X POST "https://api.awll-studio.ai/api/v1/screens/{screenId}/files/rename" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPath": "components/Header.tsx",
    "newPath": "components/AppHeader.tsx"
  }'
```

### 制約事項

- ファイル内容は最大1MB
- エントリーポイントファイルは削除不可（リネームは可能）
- マルチファイルモードでない画面に対してファイル操作APIを呼び出すと `400 Bad Request` が返される
- `contentType` はファイル拡張子から自動判定される（`.tsx` → `text/typescript`, `.css` → `text/css` 等）

## 参考資料

- [Screen SDK API Reference](./screen-sdk-reference.md)
- [Data Structures](./data-structures.md)
- [Security Best Practices](./security-best-practices.md)

---

**次のステップ**: [Script Development](./script-development.md)でビジネスロジックを実装しましょう。
