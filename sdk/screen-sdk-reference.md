# Screen SDK API Reference

**対象**: AWLL Studio画面開発者
**最終更新**: 2026-02-15

## インポート方法

```typescript
import {
  useExecutionContext,
  useRecords,
  useRecord,
  useMutation,
} from '@awll/sdk';
```

⚠️ **重要**: `window.AWLLSDK` や `window.AWLLPreviewSDK` は使用しないでください。

---

## useExecutionContext()

実行コンテキスト（テナント情報、ユーザー情報、URLパラメータ等）を取得します。

### 戻り値

```typescript
interface ExecutionContext {
  executionType: 'screen';
  tenant: {
    id: string;        // テナントID (例: "demo")
    name: string;      // テナント名
  };
  currentUser: {
    id: string;        // ユーザーID
    name: string;      // ユーザー名
    email: string;     // メールアドレス
    roles: string[];   // ロール一覧
  };
  params: Record<string, unknown>;  // URLパラメータ
  query: Record<string, unknown>;   // クエリパラメータ
  screenId: string;                 // 画面ID
  sdkVersion: string;               // SDKバージョン
  protocolVersion: string;          // プロトコルバージョン
}
```

### 使用例

```tsx
import { useExecutionContext } from '@awll/sdk';

export default function MyScreen() {
  const context = useExecutionContext();

  return (
    <div>
      <h1>ようこそ、{context.currentUser.name}さん</h1>
      <p>テナント: {context.tenant.name}</p>
      <p>ユーザーID: {context.currentUser.id}</p>
      <p>ロール: {context.currentUser.roles.join(', ')}</p>
    </div>
  );
}
```

---

## useRecords()

データベースレコード一覧を取得します（ページネーション対応）。

### シグネチャ

```typescript
function useRecords(
  options: string | UseRecordsOptions
): UseRecordsResult
```

### パラメータ

#### 方法1: データベースIDのみ指定（シンプル）

```typescript
useRecords('customer_form')
```

#### 方法2: オプション指定（詳細）

```typescript
interface UseRecordsOptions {
  formId: string;              // データベースID（必須）
  pagination?: {
    page?: number;             // ページ番号（1始まり）
    pageSize?: number;         // 1ページあたりの件数（デフォルト20、最大1000）
  };
  filters?: Record<string, unknown>;  // フィルタ条件（実装予定）
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}
```

### 戻り値

```typescript
interface UseRecordsResult {
  data: FormRecord[];      // レコード配列
  total: number;           // 総件数
  page: number;            // 現在のページ番号
  pageSize: number;        // 1ページあたりの件数
  totalPages: number;      // 総ページ数
  isLoading: boolean;      // 初回読み込み中
  isFetching: boolean;     // データ取得中
  error: {
    type: string;
    message: string;
    code: string;
  } | null;
  refetch: () => void;             // データ再取得
  setPage: (page: number) => void; // ページ変更
  setPageSize: (size: number) => void; // ページサイズ変更
}

interface FormRecord {
  recordId: string;         // レコードID
  formRecordId: string;     // データベースレコードID
  values: Record<string, unknown>;  // フィールド値
  metadata: {
    createdAt: string;      // 作成日時 (ISO 8601)
    updatedAt: string;      // 更新日時 (ISO 8601)
    createdBy: string;      // 作成者ID
  };
}
```

### データの自動更新

同じ `formId` に対して `useMutation` で作成・更新・削除を実行すると、`useRecords` のデータが**自動的に再取得**されます。手動で `refetch()` を呼ぶ必要はありません。

```tsx
// mutate() 成功後、useRecords('customer_form') のデータが自動更新される
const { data } = useRecords('customer_form');
const deleteMutation = useMutation('delete');

const handleDelete = async (recordId) => {
  await deleteMutation.mutate({ formId: 'customer_form', recordId });
  // data は自動で最新化される（refetch不要）
};
```

手動でデータを再取得したい場合は `refetch()` を使用できます:

```tsx
const { data, refetch } = useRecords('customer_form');

// 任意のタイミングで再取得
<button onClick={refetch}>更新</button>
```

### ✅ Nodes API経由の更新とanswerDataの同期（Issue #1325で改善済み）

`useRecords` / `useRecord` は `answerData` を読みます。Issue #1325 の自動同期実装により、Nodes API（`PUT /api/answers/{answerId}/nodes/{rowId}`）で
サブテーブル行を更新すると、**answerData も自動同期されます**。

`rebuild-index` の手動呼び出しは通常不要です。データ更新後は `refetch()` で最新データを再取得してください。

```tsx
// Nodes API更新後はrefetchだけでOK（answerDataは自動同期済み）
refetch();
```

### 使用例

#### 例1: シンプルな一覧表示

```tsx
import { useRecords } from '@awll/sdk';

export default function CustomerList() {
  const { data, total, isLoading, error } = useRecords('customer_form');

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;

  return (
    <div>
      <h1>顧客一覧 ({total}件)</h1>
      <ul>
        {data.map((record) => (
          <li key={record.recordId}>
            {record.values.customer_name} - {record.values.email}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

#### 例2: ページネーション付き

```tsx
import { useRecords } from '@awll/sdk';

export default function PaginatedList() {
  const {
    data,
    total,
    page,
    pageSize,
    totalPages,
    setPage,
    isFetching,
  } = useRecords({
    formId: 'customer_form',
    pagination: { page: 1, pageSize: 20 },
  });

  return (
    <div>
      <h1>顧客一覧 ({total}件)</h1>
      {isFetching && <div>取得中...</div>}

      <table>
        <thead>
          <tr>
            <th>顧客名</th>
            <th>メール</th>
          </tr>
        </thead>
        <tbody>
          {data.map((record) => (
            <tr key={record.recordId}>
              <td>{record.values.customer_name}</td>
              <td>{record.values.email}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>
          前へ
        </button>
        <span>ページ {page} / {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
          次へ
        </button>
      </div>
    </div>
  );
}
```

---

## useRecord()

単一レコードを取得します。

### シグネチャ

```typescript
function useRecord<T>(
  options: UseRecordOptions
): UseRecordResult<T>
```

> ⚠️ **重要: iframe SDKブリッジとフロントエンド本体でAPIが異なります**
>
> - **画面（Screen）コード内**: `useRecord(formId, recordId)` — 2つの引数（iframe SDKブリッジ経由）
> - **フロントエンド本体コード**: `useRecord({ formId, recordId })` — オブジェクト引数
>
> 以下は**画面コード（iframe内）での使い方**です。

### パラメータ（画面コード / iframe SDKブリッジ）

- `formId` (string): データベースID
- `recordId` (string): レコードID

### パラメータ（フロントエンド本体コード）

```typescript
interface UseRecordOptions {
  formId: string;       // データベースID（必須）
  recordId: string;     // レコードID（必須）
  expand?: 'children' | boolean;  // 子データの展開
  enabled?: boolean;    // データ取得を有効にするか（デフォルト: true）
}
```

### 戻り値

```typescript
interface UseRecordResult<T = Record<string, unknown>> {
  data: FormRecord<T> | null;  // レコード（存在しない場合null）
  isLoading: boolean;          // 初回読み込み中
  isFetching: boolean;         // データ取得中（リフェッチ含む）
  error: AwllError | null;     // エラー情報
  refetch: () => void;         // データ再取得
}
```

### 使用例

```tsx
import { useRecord, useExecutionContext } from '@awll/sdk';

export default function CustomerDetail() {
  const context = useExecutionContext();
  const customerId = context.params.customerId; // URLパラメータから取得

  const { data: customer, isLoading, error } = useRecord({ formId: 'customer_form', recordId: customerId });

  if (isLoading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error.message}</div>;
  if (!customer) return <div>顧客が見つかりません</div>;

  return (
    <div>
      <h1>顧客詳細</h1>
      <dl>
        <dt>顧客名</dt>
        <dd>{customer.values.customer_name}</dd>

        <dt>メールアドレス</dt>
        <dd>{customer.values.email}</dd>

        <dt>作成日時</dt>
        <dd>{new Date(customer.metadata.createdAt).toLocaleString('ja-JP')}</dd>
      </dl>
    </div>
  );
}
```

---

## useMutation()

データの作成・更新・削除を実行します。

**自動データ更新**: ミューテーション成功後、同じ `formId` を使用している `useRecords` のデータが自動的に再取得されます。

### シグネチャ

```typescript
function useMutation<T extends Record<string, unknown> = Record<string, unknown>>(): UseMutationResult<T>
```

> ⚠️ **重要: iframe SDKブリッジとフロントエンド本体でAPIが異なります**
>
> - **画面（Screen）コード内**: `useMutation('update')` のように操作名を引数で渡し、`.mutate()` で実行（iframe SDKブリッジ経由）
> - **フロントエンド本体コード**: `useMutation()` 引数なしで、`.update()` / `.create()` / `.remove()` メソッドを使い分け
>
> 以下は**画面コード（iframe内）での使い方**です。

### 戻り値（画面コード / iframe SDKブリッジ）

```typescript
interface UseMutationResult {
  mutate: (data: MutationInput) => Promise<MutationOutput>;
  isLoading: boolean;  // 操作中フラグ
  error: Error | null; // エラー情報
}

// CREATE: useMutation('create')
interface CreateInput {
  formId: string;
  answerData: Record<string, unknown>;
}

// UPDATE: useMutation('update')
interface UpdateInput {
  formId: string;
  recordId: string;
  answerData: Record<string, unknown>;
}

// DELETE: useMutation('delete')
interface DeleteInput {
  formId: string;
  recordId: string;
}
```

### 参考: フロントエンド本体コードでの戻り値

```typescript
// ※ 画面コードでは使えません。フロントエンド本体のHook用です。
interface UseMutationResult<T = Record<string, unknown>> {
  create: (options: { formId: string; data: T }) => Promise<FormRecord<T>>;
  createResult: { data: FormRecord<T> | null; error: AwllError | null; isLoading: boolean };
  update: (options: { formId: string; recordId: string; data: Partial<T> }) => Promise<FormRecord<T>>;
  updateResult: { data: FormRecord<T> | null; error: AwllError | null; isLoading: boolean };
  remove: (options: { formId: string; recordId: string }) => Promise<void>;
  deleteResult: { error: AwllError | null; isLoading: boolean };
  reset: () => void;
}
```

### 使用例

#### 例1: レコード作成（一覧が自動更新される）

```tsx
import { useRecords, useMutation } from '@awll/sdk';
import { useState } from 'react';

export default function CustomerManager() {
  const { data, total, isLoading } = useRecords('customer_form');
  const createMutation = useMutation('create');

  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await createMutation.mutate({
        formId: 'customer_form',
        answerData: formData,
      });
      // data は自動で最新化される（refetch不要）
      setFormData({ customer_name: '', email: '' });
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <div>
      <h1>顧客一覧 ({total}件)</h1>
      <ul>
        {data.map((record) => (
          <li key={record.recordId}>
            {record.values.customer_name} - {record.values.email}
          </li>
        ))}
      </ul>

      <form onSubmit={handleSubmit}>
        <input
          value={formData.customer_name}
          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
          placeholder="顧客名"
          required
        />
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="メール"
          required
        />
        <button type="submit" disabled={createMutation.isLoading}>
          {createMutation.isLoading ? '作成中...' : '作成'}
        </button>
      </form>
    </div>
  );
}
```

#### 例2: レコード更新

```tsx
import { useRecord, useMutation } from '@awll/sdk';
import { useState, useEffect } from 'react';

export default function EditCustomerForm({ customerId }) {
  const { data: customer, isLoading } = useRecord({ formId: 'customer_form', recordId: customerId });
  const updateMutation = useMutation('update');

  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        customer_name: customer.values.customer_name || '',
        email: customer.values.email || '',
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

      alert('更新成功');
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={formData.customer_name}
        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
      />
      <button type="submit" disabled={updateMutation.isLoading}>
        {updateMutation.isLoading ? '更新中...' : '更新'}
      </button>
    </form>
  );
}
```

#### 例3: レコード削除（一覧が自動更新される）

```tsx
import { useRecords, useMutation } from '@awll/sdk';

export default function CustomerListWithDelete() {
  const { data, total, isLoading } = useRecords('customer_form');
  const deleteMutation = useMutation('delete');

  const handleDelete = async (recordId) => {
    if (!confirm('本当に削除しますか？')) return;

    try {
      await deleteMutation.mutate({
        formId: 'customer_form',
        recordId,
      });
      // data は自動で最新化される（refetch不要）
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <div>
      <h1>顧客一覧 ({total}件)</h1>
      <table>
        <thead>
          <tr><th>顧客名</th><th>メール</th><th>操作</th></tr>
        </thead>
        <tbody>
          {data.map((record) => (
            <tr key={record.recordId}>
              <td>{record.values.customer_name}</td>
              <td>{record.values.email}</td>
              <td>
                <button
                  onClick={() => handleDelete(record.recordId)}
                  disabled={deleteMutation.isLoading}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## エラーハンドリング

### エラーの種類

SDK APIから返されるエラーには以下の種類があります：

```typescript
interface SDKError {
  type: string;      // エラータイプ
  message: string;   // エラーメッセージ
  code: string;      // エラーコード
}
```

### 主なエラータイプ

| type | 説明 |
|------|------|
| `VALIDATION_ERROR` | バリデーションエラー |
| `NOT_FOUND` | レコードが見つからない |
| `PERMISSION_DENIED` | 権限不足 |
| `NETWORK_ERROR` | ネットワークエラー |
| `TIMEOUT` | タイムアウト |
| `UNKNOWN_ERROR` | 不明なエラー |

### エラーハンドリング例

```tsx
const { data, error, isLoading } = useRecords('customer_form');

if (error) {
  switch (error.type) {
    case 'PERMISSION_DENIED':
      return <div>権限がありません</div>;
    case 'NOT_FOUND':
      return <div>データベースが見つかりません</div>;
    case 'NETWORK_ERROR':
      return <div>ネットワークエラーが発生しました</div>;
    default:
      return <div>エラー: {error.message}</div>;
  }
}
```

---

## ダイアログ（confirm / alert）

画面内でブラウザ標準の `confirm()` および `alert()` が使用できます。

```tsx
const handleDelete = async (recordId) => {
  if (!confirm('本当に削除しますか？')) return;

  try {
    await deleteMutation.mutate({ formId: 'customer_form', recordId });
    alert('削除しました');
  } catch (error) {
    alert(`エラー: ${error.message}`);
  }
};
```

---

## パフォーマンス最適化

### React.memoの使用

```tsx
const RecordRow = React.memo(({ record }) => (
  <tr>
    <td>{record.values.name}</td>
    <td>{record.values.email}</td>
  </tr>
));
```

### useCallbackの使用

```tsx
const handlePageChange = React.useCallback((newPage) => {
  setPage(newPage);
}, [setPage]);
```

---

## 参考資料

- [Screen Development](./screen-development.md)
- [Data Structures](./data-structures.md)
- [AWLL Studio公式ドキュメント](https://docs.awll-studio.ai)
