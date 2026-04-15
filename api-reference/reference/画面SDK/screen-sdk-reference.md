# Screen SDK API Reference

**対象**: AWLL Studio画面開発者
**最終更新**: 2026-03-16

## インポート方法

```typescript
import {
  useExecutionContext,
  useRecords,
  useRecord,
  useMutation,
} from '@awll/sdk';
```

> **重要**: `window.AWLLSDK` や `window.AWLLPreviewSDK` は使用しないでください。

---

## Hook 一覧

| Hook | 用途 | ステータス |
|------|------|----------|
| `useExecutionContext()` | テナント・ユーザー情報取得 | 実装済み |
| `useRecords(options)` | レコード一覧取得 | 実装済み |
| `useRecord(options)` | 単一レコード取得 | 実装済み |
| `useMutation()` | レコード作成/更新/削除 | 実装済み |
| `useNavigation()` | 画面遷移 | 実装中（Issue #884） |
| `useNodes(answerId)` | 階層データ（ノード）取得 | 未実装 |

---

## useExecutionContext()

実行コンテキスト（テナント情報、ユーザー情報、URLパラメータ等）を取得します。

### 戻り値

```typescript
interface ExecutionContext {
  executionType: 'screen';
  tenant: {
    id: string;        // テナントコード (例: "demo")
    name: string;      // テナント名
  };
  currentUser: {
    id: string;        // ユーザーID
    name: string;      // ユーザー名
    email: string;     // メールアドレス
    roles: string[];   // ロール一覧
  };
  params: Record<string, string | undefined>;  // URLパスパラメータ
  query: Record<string, string | string[] | undefined>;   // クエリパラメータ
  screenId?: string;                 // 画面ID
  screen?: {
    screenCode: string;              // 画面コード
  };
  sdkVersion: string;                // SDKバージョン
  protocolVersion: string;           // プロトコルバージョン
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
      <p>ロール: {context.currentUser.roles.join(', ')}</p>
    </div>
  );
}
```

---

## useRecords()

フォームレコード一覧を取得します（ページネーション対応）。

### シグネチャ

```typescript
function useRecords<T>(
  options: string | UseRecordsOptions
): UseRecordsResult<T>
```

### パラメータ

#### 方法1: フォームIDのみ指定（シンプル）

```typescript
useRecords('customer_form')
```

#### 方法2: オプション指定（詳細）

```typescript
interface UseRecordsOptions {
  formId: string;              // フォームID（必須）
  pagination?: {
    page?: number;             // ページ番号（1始まり）
    pageSize?: number;         // 1ページあたりの件数（デフォルト: 20）
  };
  filter?: Record<string, unknown>;  // フィルタ条件
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  enabled?: boolean;           // データ取得を有効にするか（デフォルト: true）
}
```

### 戻り値

```typescript
interface UseRecordsResult<T> {
  data: FormRecord<T>[];     // レコード配列
  total: number;             // 総件数
  page: number;              // 現在のページ番号
  pageSize: number;          // 1ページあたりの件数
  totalPages: number;        // 総ページ数
  isLoading: boolean;        // 初回読み込み中
  isFetching: boolean;       // データ取得中（リフェッチ含む）
  error: AwllError | null;   // エラー情報
  refetch: () => Promise<void>;      // データ再取得
  setPage: (page: number) => void;   // ページ変更
  setPageSize: (size: number) => void; // ページサイズ変更
  setFilters: (filters: Record<string, unknown>) => void; // フィルタ変更
  setSort: (field: string, order: 'asc' | 'desc') => void; // ソート変更
}

interface FormRecord<T = Record<string, unknown>> {
  recordId: string;         // レコードID
  formRecordId: string;     // フォームID
  values: T;                // フィールド値
  metadata: {
    createdAt: string;      // 作成日時 (ISO 8601)
    updatedAt: string;      // 更新日時 (ISO 8601)
    createdBy: string;      // 作成者ID
  };
}
```

### 制約事項

- **ページネーション**: 現在、1ページ目のみ正確な件数を返します。2ページ目以降の取得は段階的に改善予定です。
- **values の内容**: 一覧取得時の `values` にはフォーム定義で検索可能に設定されたフィールドのみが含まれます。全フィールドが必要な場合は `useRecord` で個別取得してください。

### データの自動更新

同じ `formId` に対して `useMutation` で作成・更新・削除を実行すると、`useRecords` のデータが**自動的に再取得**されます。

```tsx
const { data } = useRecords('customer_form');
const { remove } = useMutation();

const handleDelete = async (recordId) => {
  await remove({ formId: 'customer_form', recordId });
  // data は自動で最新化される（refetch不要）
};
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
    data, total, page, totalPages, setPage, isFetching,
  } = useRecords({
    formId: 'customer_form',
    pagination: { page: 1, pageSize: 20 },
  });

  return (
    <div>
      <h1>顧客一覧 ({total}件)</h1>
      {isFetching && <div>取得中...</div>}

      <table>
        <thead><tr><th>顧客名</th><th>メール</th></tr></thead>
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
        <button onClick={() => setPage(page - 1)} disabled={page === 1}>前へ</button>
        <span>ページ {page} / {totalPages}</span>
        <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>次へ</button>
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

### パラメータ

```typescript
interface UseRecordOptions {
  formId: string;              // フォームID（必須）
  recordId: string;            // レコードID（必須）
  enabled?: boolean;           // データ取得を有効にするか（デフォルト: true）
}
```

簡易呼び出し（従来互換）:

```typescript
useRecord(formId, recordId)
```

### 戻り値

```typescript
interface UseRecordResult<T> {
  data: FormRecord<T> | null;  // レコード（存在しない場合null）
  isLoading: boolean;          // 読み込み中
  isFetching: boolean;         // データ取得中
  error: AwllError | null;     // エラー情報
  refetch: () => void;         // データ再取得
}
```

### 既知の制約

- **values にARRAYフィールドのデータが含まれない**: 現在、レコード詳細取得の `values` にはARRAY型フィールド（サブテーブル）のデータが含まれません。階層データの取得には `useNodes` hookの実装が必要です（未実装）。

### 使用例

```tsx
import { useRecord, useExecutionContext } from '@awll/sdk';

export default function CustomerDetail() {
  const context = useExecutionContext();
  const customerId = context.params.customerId;

  const { data: customer, isLoading, error } = useRecord('customer_form', customerId);

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
function useMutation<T>(): UseMutationResult<T>
```

### 戻り値

```typescript
interface UseMutationResult<T> {
  // レコード作成
  create: (options: { formId: string; answerData: T }) => Promise<FormRecord<T>>;
  createResult: { data: FormRecord<T> | null; error: AwllError | null; isLoading: boolean };

  // レコード更新
  update: (options: { formId: string; recordId: string; answerData: T }) => Promise<FormRecord<T>>;
  updateResult: { data: FormRecord<T> | null; error: AwllError | null; isLoading: boolean };

  // レコード削除
  remove: (options: { formId: string; recordId: string }) => Promise<void>;
  deleteResult: { error: AwllError | null; isLoading: boolean };

  // 状態リセット
  reset: () => void;
}
```

### 使用例

#### 例1: レコード作成

```tsx
import { useRecords, useMutation } from '@awll/sdk';
import { useState } from 'react';

export default function CustomerManager() {
  const { data, total, isLoading } = useRecords('customer_form');
  const { create, createResult } = useMutation();

  const [formData, setFormData] = useState({ customer_name: '', email: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await create({ formId: 'customer_form', answerData: formData });
      // data は自動で最新化される
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
        <button type="submit" disabled={createResult.isLoading}>
          {createResult.isLoading ? '作成中...' : '作成'}
        </button>
      </form>
    </div>
  );
}
```

#### 例2: レコード削除

```tsx
import { useRecords, useMutation } from '@awll/sdk';

export default function CustomerListWithDelete() {
  const { data, total, isLoading } = useRecords('customer_form');
  const { remove, deleteResult } = useMutation();

  const handleDelete = async (recordId) => {
    if (!confirm('本当に削除しますか？')) return;
    try {
      await remove({ formId: 'customer_form', recordId });
      // data は自動で最新化される
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <div>
      <h1>顧客一覧 ({total}件)</h1>
      <table>
        <thead><tr><th>顧客名</th><th>メール</th><th>操作</th></tr></thead>
        <tbody>
          {data.map((record) => (
            <tr key={record.recordId}>
              <td>{record.values.customer_name}</td>
              <td>{record.values.email}</td>
              <td>
                <button onClick={() => handleDelete(record.recordId)} disabled={deleteResult.isLoading}>
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

## useNavigation()（実装中）

画面遷移を実行します。Issue #884 で実装中。

### 予定API

```typescript
function useNavigation(): {
  navigate: (options: NavigateOptions) => void;
  currentPath: string;
}

interface NavigateOptions {
  screenCode: string;             // 遷移先の画面コード
  params?: Record<string, string>; // パスパラメータ
  query?: Record<string, string>;  // クエリパラメータ
}
```

---

## useNodes()（未実装）

レコードに紐づく階層データ（ノード）を取得します。

### 予定API

```typescript
function useNodes(answerId: string): {
  data: NodeResponse[] | null;
  isLoading: boolean;
  error: AwllError | null;
  refetch: () => void;
}
```

> 現在、カスタム画面からノードデータを取得するSDK hookは存在しません。REST API（`GET /api/answers/{answerId}/nodes`）は利用可能ですが、iframe内からは認証トークンにアクセスできないため、直接fetchで呼び出すことはできません。

---

## メール送信について

Screen SDK（React Hooks）にはメール送信用のフックは現在提供されていません。

メール送信が必要な場合は、以下の方法を使用してください：

| 方法 | 用途 |
|------|------|
| **Script SDK** `api.sendEmail()` | スクリプトルール内でのメール自動送信（ステータス変更時の通知等） |
| **REST API** `POST /api/v1/mail/send` | カスタムアプリケーションからの送信（ADMIN/DEVELOPER権限が必要） |

詳細は [Script SDK APIリファレンス - api.sendEmail()](./script-sdk-reference.md#apisendemaioptions) および [メール送信 API](../REST%20APIリファレンス/mail-api.md) を参照してください。

---

## エラーハンドリング

### エラーの種類

```typescript
interface AwllError {
  type: string;      // エラータイプ
  message: string;   // エラーメッセージ
  code?: string;     // エラーコード
  details?: unknown; // エラー詳細
  statusCode?: number; // HTTPステータスコード
}
```

### 主なエラータイプ

| type | 説明 |
|------|------|
| `VALIDATION_ERROR` | バリデーションエラー |
| `NOT_FOUND` | レコードが見つからない |
| `PERMISSION_ERROR` | 権限不足 |
| `NETWORK_ERROR` | ネットワークエラー |
| `TIMEOUT` | タイムアウト（デフォルト15秒） |
| `CANCELLED` | リクエストがキャンセルされた |
| `UNKNOWN_ERROR` | 不明なエラー |

### エラーハンドリング例

```tsx
const { data, error, isLoading } = useRecords('customer_form');

if (error) {
  switch (error.type) {
    case 'PERMISSION_ERROR':
      return <div>権限がありません</div>;
    case 'NOT_FOUND':
      return <div>フォームが見つかりません</div>;
    case 'NETWORK_ERROR':
      return <div>ネットワークエラーが発生しました</div>;
    case 'TIMEOUT':
      return <div>リクエストがタイムアウトしました</div>;
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
    await remove({ formId: 'customer_form', recordId });
    alert('削除しました');
  } catch (error) {
    alert(`エラー: ${error.message}`);
  }
};
```

---

## 通信方式

カスタム画面はiframe内で実行され、SDKはpostMessageプロトコルを通じて親ウィンドウと通信します。

```
iframe内のカスタム画面コード
  ↓ postMessage（SDK hook呼び出し）
親ウィンドウ（ホスト）
  ↓ API呼び出し（認証付き）
バックエンドAPI
```

この方式により：
- iframe内から直接APIを呼び出す必要がない
- 認証・認可は親ウィンドウで一元管理
- 画面コードからバックエンドの認証トークン（Cognito JWT）にアクセス不可

> **注意**: iframe内から `fetch()` で直接APIを呼び出しても、認証トークンが付与されないため **401 Unauthorized** になります。画面コードからトークンにはアクセスできないため、必ずSDK hookを使用してください。

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
- [Security Best Practices](./security-best-practices.md)
