# Screen SDK API Reference

**対象**: AWLL Studio画面開発者
**最終更新**: 2026-03-30

## インポート方法

```typescript
import {
  useExecutionContext,
  useRecords,
  useRecord,
  useMutation,
  useNodes,
  useNodeMutation,
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

## メール送信について

Screen SDK（React Hooks）にはメール送信用のフックは現在提供されていません。

メール送信が必要な場合は、以下の方法を使用してください：

| 方法 | 用途 |
|------|------|
| **Script SDK** `api.sendEmail()` | スクリプトルール内でのメール自動送信（ステータス変更時の通知等） |
| **REST API** `POST /api/v1/mail/send` | カスタムアプリケーションからの送信（ADMIN/DEVELOPER権限が必要） |

詳細は [Script SDK APIリファレンス - api.sendEmail()](./script-sdk-reference.md#apisendemaioptions) および [メール送信 API](../api-specs/openapi/public/reference/REST%20APIリファレンス/mail-api.md) を参照してください。

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

## useNodes()

サブテーブル（ノード）のデータを取得するフック。depth/parentRowId/fieldCodeでフィルタ可能。

### シグネチャ

```typescript
function useNodes(options: UseNodesOptions): UseNodesResult
```

### UseNodesOptions

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `answerId` | `string` | Yes | レコードID |
| `depth` | `number` | No | 階層の深さ（0=ルート, 1=サブテーブル, 2=サブサブテーブル） |
| `parentRowId` | `string` | No | 親ノードのrowId（直接の子のみ取得） |
| `fieldCode` | `string` | No | フィールドコードでフィルタ |
| `limit` | `number` | No | 取得件数上限（デフォルト100、最大1000） |
| `offset` | `number` | No | オフセット（デフォルト0） |
| `enabled` | `boolean` | No | フック有効/無効（デフォルトtrue） |

### UseNodesResult

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `data` | `NodeItem[]` | ノードデータ配列 |
| `totalCount` | `number` | フィルタ後の総件数 |
| `isLoading` | `boolean` | 初回読み込み中 |
| `isFetching` | `boolean` | 再取得中 |
| `error` | `AwllError \| null` | エラー情報 |
| `refetch` | `() => void` | 手動再取得 |

### NodeItem

```typescript
interface NodeItem {
  rowId: string;           // ノードの一意ID
  parentRowId: string | null; // 親ノードのrowId（ルートはnull）
  answerRef: string;       // 所属するレコードID
  fieldCode: string | null; // ARRAYフィールドのコード
  depth: number;           // 階層の深さ（0=ルート）
  ancestorPath: string;    // 祖先パス
  data: Record<string, unknown>; // ノードデータ
}
```

### 使用例

```tsx
// 全ノード取得
const { data } = useNodes({ answerId: 'answer-123' });

// depth=1のサブテーブル行のみ
const { data } = useNodes({ answerId: 'answer-123', depth: 1 });

// 特定の親の直接の子のみ
const { data } = useNodes({ answerId: 'answer-123', parentRowId: 'row-456' });

// フィールドコード + ページネーション
const { data, totalCount } = useNodes({
  answerId: 'answer-123',
  fieldCode: 'tasks',
  limit: 20,
  offset: 0,
});
```

---

## useNodeMutation()

サブテーブル（ノード）の作成・更新・削除フック。

> ⚠️ `useMutation` は**ルートレコード専用**です。サブテーブル行の操作には `useNodeMutation` を使用してください。

### シグネチャ

```typescript
function useNodeMutation(): UseNodeMutationResult
```

### UseNodeMutationResult

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `createNode` | `(answerId, options) => Promise<NodeItem>` | ノード行追加 |
| `createResult` | `{ isLoading, error }` | 作成操作の状態 |
| `updateNode` | `(answerId, rowId, options) => Promise<NodeItem>` | ノード行更新 |
| `updateResult` | `{ isLoading, error }` | 更新操作の状態 |
| `deleteNode` | `(answerId, rowId) => Promise<void>` | ノード行削除 |
| `deleteResult` | `{ isLoading, error }` | 削除操作の状態 |
| `reset` | `() => void` | 全状態リセット |

### createNode オプション

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `parentRowId` | `string` | Yes | 親ノードのrowId |
| `fieldCode` | `string` | Yes | ARRAYフィールドのコード |
| `data` | `Record<string, unknown>` | Yes | ノードデータ |

### updateNode オプション

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `data` | `Record<string, unknown>` | Yes | ノードデータ（**全フィールド置換**） |

### 使用例

```tsx
const { createNode, updateNode, deleteNode } = useNodeMutation();

// 作成
const newNode = await createNode(answerId, {
  parentRowId: rootNodeId,
  fieldCode: 'tasks',
  data: { task_name: '新タスク', status: 'todo' },
});

// 更新（⚠️ 全フィールド置換 — 省略したフィールドは消失）
await updateNode(answerId, rowId, {
  data: { task_name: '更新済み', status: 'done' },
});

// 削除（⚠️ CASCADE — 子ノードも全削除）
await deleteNode(answerId, rowId);
```

### 注意事項

1. **全フィールド置換**: `updateNode` は `data` に含まれないフィールドを削除します。必ず全フィールドを送信してください。
2. **CASCADE削除**: `deleteNode` は子孫ノードも全て削除します。
3. **手動refetch**: 操作後は `useNodes` の `refetch()` を呼んで最新データを反映してください。
4. **useMutationとの使い分け**:
   - `useMutation` → ルートレコード（FormAnswer）のCRUD
   - `useNodeMutation` → サブテーブル行（Node）のCRUD

---

## サブテーブル（ARRAY型）データ取得のベストプラクティス

### 重要: useRecords はサブテーブルの完全なデータを保証しない

`useRecords`（一覧API）が返す `values` のサブテーブルフィールドは、レコードによって**データが不完全な場合がある**:

| レコード | values.tasks の中身 |
|---------|-------------------|
| レコードA | 全タスクデータあり（展開済み） |
| レコードB | `[{__rowId: "..."}, {__rowId: "..."}]` — **rowIdのみ** |

これは一覧APIの `searchableFields` がサブテーブルデータを部分的にしか含めていないためです。

### 一覧画面 vs 詳細画面の使い分け

| 画面 | レコード取得 | サブテーブル取得 |
|------|------------|----------------|
| **一覧画面** | `useRecords` | `values.tasks.length` で概算（パフォーマンス優先） |
| **詳細画面** | `useRecord(formId, recordId)` | **`useNodes({ answerId, depth: 1, fieldCode })` を必ず使う** |

### 詳細画面でのサブテーブル取得パターン

```tsx
import { useExecutionContext, useRecord, useNodes } from '@awll/sdk';

export default function DetailScreen() {
  const ctx = useExecutionContext();
  const recordId = ctx?.params?.recordId;

  // ルートフィールド（name, due_date等）
  const { data: record, isLoading } = useRecord({
    formId: 'YOUR_FORM_ID',
    recordId,
  });

  // サブテーブル（タスク等）— Node APIで確実に全データ取得
  const { data: tasks, isLoading: tasksLoading } = useNodes({
    answerId: recordId,
    depth: 1,              // サブテーブル行のみ（サブサブテーブルは含まない）
    fieldCode: 'tasks',    // 特定のARRAYフィールドのみ取得
    enabled: !!recordId,
  });

  // tasks の各ノードのデータは node.data.フィールド名 でアクセス
  // 例: node.data.name, node.data.assignee, node.data.due_date
}
```

### useNodes が返すノードの構造

```typescript
interface NodeItem {
  rowId: string;          // ノードID
  parentRowId: string;    // 親ノードID（ルート行は "ROOT"）
  answerRef: string;      // レコードID（answerId）
  fieldCode: string;      // サブテーブルのフィールドコード（例: "tasks"）
  depth: number;          // 階層レベル（1=サブテーブル行, 2=サブサブテーブル行）
  data: Record<string, unknown>;  // フィールド値
}
```

**注意**: フィールド値は `node.data.フィールド名` でアクセスします（`node.フィールド名` ではありません）。

### アンチパターン

```tsx
// ❌ BAD: useRecords で全件取得してfindで検索（サブテーブルデータが不完全）
const { data } = useRecords({ formId: FORM_ID, pagination: { pageSize: 50 } });
const record = data?.find(r => r.recordId === targetId);
const tasks = record?.values?.tasks; // ← __rowId のみの場合がある

// ❌ BAD: useRecords の values.tasks を信頼してタスク詳細を表示
tasks.map(t => <div>{t.name}</div>); // ← t が {__rowId: "..."} のみの場合クラッシュ

// ✅ GOOD: useRecord + useNodes で確実に取得
const { data: record } = useRecord({ formId: FORM_ID, recordId: targetId });
const { data: tasks } = useNodes({ answerId: targetId, depth: 1, fieldCode: 'tasks' });
tasks.map(node => <div>{node.data.name}</div>); // ← 常に完全なデータ
```

### サブサブテーブル（3階層目）の取得

サブテーブルの中にさらにサブテーブルがある場合（例: タスク → サブタスク）:

```tsx
// タスク（depth=1）を取得
const { data: tasks } = useNodes({ answerId: recordId, depth: 1, fieldCode: 'tasks' });

// 特定タスクのサブタスク（depth=2, 親ノード指定）を取得
const { data: subtasks } = useNodes({
  answerId: recordId,
  parentRowId: selectedTaskRowId,  // 親タスクのrowId
  enabled: !!selectedTaskRowId,
});
```

---

## 参考資料

- [Screen Development](./screen-development.md)
- [Data Structures](./data-structures.md)
- [AWLL Studio公式ドキュメント](https://docs.awll-studio.ai)
