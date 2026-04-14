# Screen SDK API Reference

**対象**: AWLL Studio画面開発者
**最終更新**: 2026-04-14

## インポート方法

```typescript
import {
  useExecutionContext,
  useRecords,
  useRecord,
  useMutation,
  useNodes,
  useNodeMutation,
  useFileUpload,
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

## Hook選択ガイド — useRecords vs useRecord vs useNodes

| Hook / API | 用途 | ARRAYフィールド（サブテーブル） |
|------------|------|-------------------------------|
| `useRecords` | **一覧画面** — 検索・ページネーション | **参照のみ**（`[{__rowId}]`、Projection Table） |
| `useRecord` | **詳細画面（ルートフィールド）** | **不完全** — `__rowId` 参照のみの場合あり |
| `useNodes` | **サブテーブル取得** ✅ 推奨 | **全階層の完全データ**（Node Table） |

> ⚠️ **重要**: `useRecords` / `useRecord` はARRAYフィールドの完全データを**保証しません**。サブテーブルを表示する詳細画面では、必ず **`useNodes`** を併用してください。

---

## useRecords()

データベースレコード一覧を取得します（ページネーション対応）。

> ⚠️ **注意**: Projection Table（検索用）からデータを返すため、**ARRAYフィールド（サブテーブル）のデータは含まれません**。サブテーブルを含む完全データが必要な場合は `useRecord()` を使用してください。

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

単一レコードのルートフィールドを取得します。

> **注意**: ARRAYフィールド（サブテーブル）の中身は `__rowId` 参照のみの場合があります。サブテーブルの完全データが必要な場合は `useNodes` を併用してください。

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

### FILE型フィールドの値

`useRecord` がFILE型フィールドを含むレコードを取得すると、値は `FileMetadata` オブジェクト（または配列）として返されます。

```typescript
// 単一ファイルフィールド
const fileValue = record.values.document;  // FileMetadata | null

// 複数ファイルフィールド（allowMultiple: true）
const filesValue = record.values.receipts; // FileMetadata[] | null
```

`FileMetadata` の構造は [useFileUpload](#usefileupload) セクションを参照してください。

> ⚠️ **重要**: `FileMetadata.key` はストレージキーであり、**URLではありません**。画像表示やダウンロードには `useFileUpload().downloadFile(key)` で署名付きURLを取得してください。

```tsx
// ✅ 正しい: downloadFileで署名付きURLを取得して表示
const { downloadFile } = useFileUpload();
const { url } = await downloadFile(record.values.photo.key);
// → url を <img src={url}> で使用

// ❌ 間違い: keyを直接URLとして使用
<img src={record.values.photo.key} />  // 表示されない
```

### USER型フィールド（ユーザーリファレンス）の値

USER型フィールドは**取得時と保存時でデータ形式が異なります**。これを混同するとデータ破損が発生します。

#### 取得時（useRecord / useRecords）

バックエンドがユーザーIDを自動展開し、オブジェクト形式で返します。

```typescript
// SINGLE選択モード
record.values.assignee
// → { userId: "uuid-123", username: "田中太郎", email: "tanaka@example.com" }

// MULTIPLE選択モード
record.values.reviewers
// → [{ userId: "uuid-1", username: "田中", email: "..." }, { userId: "uuid-2", ... }]
```

#### 保存時（useMutation / API）

**ユーザーID文字列**（UUID）で保存します。オブジェクトを渡してはいけません。

```typescript
// ✅ 正しい: ユーザーID文字列で保存
await updateMutation.mutate({
  formId, recordId,
  answerData: { assignee: "uuid-123" },  // SINGLE
});

await createMutation.mutate({
  formId,
  answerData: { reviewers: ["uuid-1", "uuid-2"] },  // MULTIPLE
});

// ❌ 間違い: useRecordの展開済みオブジェクトをそのまま渡す
await updateMutation.mutate({
  formId, recordId,
  answerData: { assignee: record.values.assignee },  // → {} に上書きされる
});
```

> 🚨 **致命的アンチパターン**: `useRecord` の値をスプレッドして `useMutation('update')` に渡すと、USERフィールドが展開済みオブジェクト形式のまま送信され、**空オブジェクト `{}` に上書き**されます。必ずフラットフィールドのみ個別に指定してください。

#### USER型フィールドの値の対応表

| 操作 | 形式 | 例 |
|------|------|-----|
| 取得（SINGLE） | `{ userId, username, email }` | `record.values.assignee.username` で表示 |
| 取得（MULTIPLE） | `[{ userId, username, email }, ...]` | `.map(u => u.username)` で表示 |
| 保存（SINGLE） | `"userId"` 文字列 | `answerData: { assignee: "uuid-123" }` |
| 保存（MULTIPLE） | `["userId", ...]` 配列 | `answerData: { reviewers: ["uuid-1", "uuid-2"] }` |
| クリア（SINGLE） | `null` | `answerData: { assignee: null }` |
| クリア（MULTIPLE） | `[]` | `answerData: { reviewers: [] }` |

#### 表示時の注意（React Error #31 防止）

```tsx
// ❌ オブジェクトを直接レンダリング → React Error #31
<td>{record.values.assignee}</td>

// ✅ プロパティを取り出して表示
<td>{record.values.assignee?.username ?? '-'}</td>
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

### 🚨 update は PUT（全体置換） — ARRAYフィールドに注意

`useMutation('update')` は内部で **PUT（全体置換）** を実行します。
`answerData` に送信しなかったフィールドは **消失** します。

#### 絶対にやってはいけないこと

```tsx
// 🚨 useRecordの値をそのままスプレッドすると、ARRAYフィールド・USERフィールドが壊れる
const currentValues = record.values;
await updateMutation.mutate({
  formId, recordId,
  answerData: { ...currentValues, status: 'completed' },  // ❌ ARRAYフィールドのデータが消失
});
```

`useRecord` / `getAnswer` が返す `values` には、ARRAYフィールドは `__rowId` 参照のみが含まれ、実データはNodes APIで管理されています。これをそのまま `answerData` に渡すと、**サブテーブルの全行データが空に上書き**されます。USERフィールドも展開済みオブジェクト形式のため、**空オブジェクトに上書き**されます。

#### 正しい使い方

```tsx
// ✅ ルートフィールド（TEXT/NUMBER/SELECT/DATE等）のみ指定
await updateMutation.mutate({
  formId, recordId,
  answerData: { status: 'completed', notes: '完了' },
});

// ✅ サブテーブルの操作は useNodeMutation を使用
const { createNode, updateNode, deleteNode } = useNodeMutation();
await updateNode(answerId, rowId, { data: { amount: 1500000 } });
```

> **PATCH APIについて**: `PATCH /api/v1/forms/{formId}/answers/{id}` は部分更新に対応していますが、
> `If-Match` ヘッダー（楽観的排他制御）が必須であり、iframe SDKブリッジの `postMessage` 経由ではカスタムヘッダーを送信できないため、画面コードからは利用できません。

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
| `data` | `Record<string, unknown>` | Yes | ノードデータ（**シャローマージ** — 変更フィールドのみ指定可能、未送信フィールドは保持） |

### 使用例

```tsx
const { createNode, updateNode, deleteNode } = useNodeMutation();

// 作成
const newNode = await createNode(answerId, {
  parentRowId: rootNodeId,
  fieldCode: 'tasks',
  data: { task_name: '新タスク', status: 'todo' },
});

// 更新（✅ シャローマージ — 変更フィールドのみ送信OK、未送信フィールドは保持）
await updateNode(answerId, rowId, {
  data: { status: 'done' },  // task_name は既存値が保持される
});

// 削除（⚠️ CASCADE — 子ノードも全削除）
await deleteNode(answerId, rowId);
```

### 注意事項

1. **シャローマージ**: `updateNode` は `data` に含まれるフィールドのみ上書きし、未送信フィールドは既存値を保持します。`{ "field": null }` で明示的にnullクリアも可能です。
2. **CASCADE削除**: `deleteNode` は子孫ノードも全て削除します。
3. **手動refetch**: 操作後は `useNodes` の `refetch()` を呼んで最新データを反映してください。
4. **useMutationとの使い分け**:
   - `useMutation` → ルートレコード（FormAnswer）のCRUD
   - `useNodeMutation` → サブテーブル行（Node）のCRUD

### HTTPメソッド対応表（REST API直接呼び出し時の注意）

画面SDKを使わずREST APIを直接呼び出す場合、正しいHTTPメソッドを使用してください。

| API | HTTPメソッド | 用途 |
|-----|------------|------|
| レコード作成 | **POST** `/api/v1/forms/{formId}/answers` | レコード作成 |
| レコード更新（全体置換） | **PUT** `/api/v1/forms/{formId}/answers/{id}` | ルートフィールド全体置換 |
| レコード部分更新 | **PATCH** `/api/v1/forms/{formId}/answers/{id}` | 差分更新（`operations` + `If-Match` 必須） |
| レコード削除 | **DELETE** `/api/v1/forms/{formId}/answers/{id}` | レコード削除 |
| ノード作成 | **POST** `/api/answers/{id}/nodes` | サブテーブル行追加 |
| ノード更新 | **PUT** `/api/answers/{id}/nodes/{rowId}` | サブテーブル行更新 |
| ノード削除 | **DELETE** `/api/answers/{id}/nodes/{rowId}` | サブテーブル行削除 |

> 🚨 **Node API に PATCH メソッドはありません。** ノード更新は **PUT のみ** です。`PATCH /api/answers/{id}/nodes/{rowId}` を送信すると 405 Method Not Allowed（Internal Server Error）になります。ノードの部分更新は PUT で `data` に変更フィールドのみ指定すれば、サーバー側でシャローマージされます。

---

## サブテーブル行の削除ボタン実装パターン

サブテーブル（サブレコード）の削除ボタン実装は迷いやすいポイントです。以下の3点に注意してください:
1. **`useNodeMutation` の `deleteNode` を使う**（`useMutation` ではない）
2. **削除後に `refetch()` で一覧を再取得する**
3. **確認ダイアログを挟む**（CASCADE削除で子孫ノードも全削除されるため）

### 基本パターン: テーブル行の削除ボタン

```tsx
import React from 'react';
import { useRecord, useNodes, useNodeMutation, useExecutionContext } from '@awll/sdk';

export default function TaskManager() {
  const { params } = useExecutionContext();
  const formId = params.formId;
  const answerId = params.answerId;
  const { data: record } = useRecord(formId, answerId);
  const { data: tasks, isLoading, refetch } = useNodes({
    answerId,
    depth: 1,
    fieldCode: 'tasks',
  });
  const { createNode, deleteNode, deleteResult } = useNodeMutation();

  // 削除ハンドラ
  const handleDelete = async (rowId: string, taskName: string) => {
    if (!confirm(`「${taskName}」を削除しますか？\n※ 子データも全て削除されます`)) return;
    try {
      await deleteNode(answerId, rowId, formId);  // formId推奨（パフォーマンス向上）
      refetch();  // ← 必須: 削除後にノード一覧を再取得
    } catch (err) {
      alert('削除に失敗しました: ' + (err as Error).message);
    }
  };

  // 追加ハンドラ
  const handleAdd = async () => {
    const rootNodeId = record?.rootNodeId || answerId;
    await createNode(answerId, {
      parentRowId: rootNodeId,
      fieldCode: 'tasks',
      data: { task_name: '新規タスク', status: 'todo' },
      formId,
    });
    refetch();
  };

  if (isLoading) return <div>読み込み中...</div>;

  return (
    <div>
      <h2>タスク一覧 ({tasks.length}件)</h2>
      <button onClick={handleAdd}>+ 追加</button>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
            <th style={{ padding: 8, textAlign: 'left' }}>タスク名</th>
            <th style={{ padding: 8, textAlign: 'left' }}>ステータス</th>
            <th style={{ padding: 8, width: 80 }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((node) => (
            <tr key={node.rowId} style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: 8 }}>{node.data?.task_name}</td>
              <td style={{ padding: 8 }}>{node.data?.status}</td>
              <td style={{ padding: 8, textAlign: 'center' }}>
                <button
                  onClick={() => handleDelete(node.rowId, node.data?.task_name || '')}
                  disabled={deleteResult.isLoading}
                  style={{ color: 'red', cursor: 'pointer' }}
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

### deleteNode の引数

```typescript
await deleteNode(answerId, rowId, formId?);
```

| 引数 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `answerId` | `string` | Yes | レコードID |
| `rowId` | `string` | Yes | 削除するノードの `rowId`（`useNodes` で取得） |
| `formId` | `string` | No | データベースID（指定推奨 — 内部の逆引きScanを回避しパフォーマンス向上） |

### よくある間違い

| ❌ 間違い | ✅ 正しい | 説明 |
|-----------|----------|------|
| `mutation.delete(answerId)` | `deleteNode(answerId, rowId)` | `useMutation.delete` はルートレコード**全体**を削除する |
| `deleteNode(rowId)` | `deleteNode(answerId, rowId)` | 第1引数は `answerId`、第2引数が `rowId` |
| 削除後に `refetch()` を忘れる | `await deleteNode(...); refetch();` | `refetch()` しないと画面に削除済み行が残る |
| `useRecord` の `answerId` で削除 | `useNodes` の `node.rowId` で削除 | `answerId` はレコード全体のID、`rowId` はサブテーブル行のID |

### 編集 + 削除の組み合わせパターン

```tsx
// 各行にインライン編集 + 削除ボタンを配置する例
const handleUpdate = async (rowId: string, newStatus: string) => {
  await updateNode(answerId, rowId, {
    data: { status: newStatus },  // シャローマージ: statusのみ更新、他フィールドは保持
    formId,
  });
  refetch();
};

// JSX内
<td>
  <select
    value={node.data?.status}
    onChange={(e) => handleUpdate(node.rowId, e.target.value)}
  >
    <option value="todo">未着手</option>
    <option value="in_progress">進行中</option>
    <option value="done">完了</option>
  </select>
</td>
<td>
  <button onClick={() => handleDelete(node.rowId, node.data?.task_name)}>
    削除
  </button>
</td>
```

---

## useNavigation()

画面間遷移を行うReact Hook。iframe内の画面コードからホスト側のルーティングを制御します。

> ⚠️ iframe は `sandbox` 属性で `allow-top-navigation` なしで実行されるため、`<a target="_top">` や `window.top.location` は使用できません。画面間遷移には必ず `useNavigation` を使用してください。

### シグネチャ

```typescript
function useNavigation(): UseNavigationResult
```

### UseNavigationResult

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `navigateToScreen` | `(screenCode, params?) => Promise<{success, screenId}>` | 別の画面に遷移 |
| `navigateToForm` | `(formId, options?) => Promise<{success}>` | DB一覧/新規作成/編集に遷移 |
| `navigateToExternalUrl` | `(url, options?) => Promise<{success}>` | 外部URLに遷移 |
| `goBack` | `() => Promise<{success}>` | 前の画面に戻る |
| `isNavigating` | `boolean` | 遷移処理中フラグ |

### navigateToScreen

```typescript
navigateToScreen(screenCode: string, params?: Record<string, string>): Promise<{success: boolean, screenId: string}>
```

| 引数 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `screenCode` | `string` | Yes | 遷移先の画面コード（`^[a-z0-9_]+$`、50文字以内） |
| `params` | `Record<string, string>` | No | クエリパラメータ（URLに `?key=value&...` として付与） |

- `screenCode` から `screenId` を自動解決（`GET /api/v1/screens/code/{screenCode}/published`）
- ブラウザバック・リロード・URL共有いずれも動作する

### navigateToForm

```typescript
navigateToForm(formId: string, options?: { mode?: 'list' | 'create' | 'edit'; recordId?: string }): Promise<{success: boolean}>
```

| mode | 遷移先 | 説明 |
|------|--------|------|
| `list`（デフォルト） | `/forms/:formId/answers` | データベース一覧画面 |
| `create` | `/forms/:formId/answers/new` | 新規作成画面 |
| `edit` | `/forms/:formId/answers/:recordId/edit` | レコード編集画面（`recordId` 必須） |

### navigateToExternalUrl

```typescript
navigateToExternalUrl(url: string, options?: { newTab?: boolean }): Promise<{success: boolean}>
```

| 引数 | 型 | 必須 | 説明 |
|------|-----|------|------|
| `url` | `string` | Yes | 遷移先URL（`http:` / `https:` のみ許可） |
| `options.newTab` | `boolean` | No | `true` で新しいタブで開く（デフォルト: `false`） |

### 使用例

```tsx
import { useNavigation } from '@awll/sdk';

export default function DealManagement() {
  const { navigateToScreen, navigateToForm, goBack, isNavigating } = useNavigation();

  // 別画面に遷移（クエリパラメータ付き）
  const handleViewBilling = async (month: string) => {
    await navigateToScreen('ww_billing', { month });
  };

  // DB編集画面に遷移
  const handleEditRecord = async (formId: string, recordId: string) => {
    await navigateToForm(formId, { mode: 'edit', recordId });
  };

  // 戻る
  const handleBack = async () => {
    await goBack();
  };

  return (
    <div>
      <button onClick={handleBack} disabled={isNavigating}>← 戻る</button>
      <button onClick={() => handleViewBilling('2026-04')}>
        請求管理画面で確認する（2026年04月）→
      </button>
    </div>
  );
}
```

### 遷移先でパラメータを受け取る

```tsx
import { useExecutionContext } from '@awll/sdk';

export default function BillingScreen() {
  const context = useExecutionContext();
  const month = context?.query?.month || context?.params?.month;
  // → '2026-04'

  return <div>請求管理: {month}</div>;
}
```

### 注意事項

1. **screenCode のバリデーション**: 英小文字・数字・アンダースコアのみ。先頭・末尾のアンダースコア不可。
2. **params のサニタイズ**: ホスト側でサニタイズされるため、XSSリスクはありません。
3. **`<a target="_top">` は使用不可**: iframe sandbox制約により `allow-top-navigation` フラグがないため、直接のトップフレーム操作はブロックされます。

---

## useGeneratePdf()

PDF帳票を生成してダウンロードするフックです。バックエンドでThymeleafテンプレートにデータを流し込み、PDFを生成します。

```tsx
function useGeneratePdf(): {
  generatePdf: (options: GeneratePdfRequestPayload) => Promise<GeneratePdfResponsePayload>;
  isLoading: boolean;
  error: AwllError | null;
  result: GeneratePdfResponsePayload | null;
}
```

### パラメータ（GeneratePdfRequestPayload）

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `templateName` | `string` | Yes | テンプレート名（`templates/pdf/` 配下、拡張子なし。英小文字・数字・ハイフンのみ） |
| `variables` | `Record<string, unknown>` | Yes | テンプレートに渡す変数（Thymeleafのコンテキスト変数） |
| `fileName` | `string` | No | ダウンロード時のファイル名（拡張子なし、省略時はテンプレート名） |

### レスポンス（GeneratePdfResponsePayload）

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `downloadUrl` | `string` | 署名付きダウンロードURL（15分有効） |
| `key` | `string` | ストレージオブジェクトキー |
| `expiresAt` | `string` | URL有効期限（ISO 8601） |

### 使用例

```tsx
import { useRecords, useGeneratePdf } from '@awll/sdk';

export default function InvoicePage() {
  const { data: records } = useRecords({ formId: 'FORM_ID' });
  const { generatePdf, isLoading } = useGeneratePdf();

  const handleDownload = async (record) => {
    try {
      await generatePdf({
        templateName: 'generic-report',
        variables: {
          title: `レポート: ${record.values?.name}`,
          company: record.values?.company_name,
          date: new Date().toLocaleDateString('ja-JP'),
          headers: ['No.', '商品名', '数量', '単価'],
          fields: ['no', 'name', 'quantity', 'price'],
          items: record.values?.items || [],
        },
        fileName: `レポート_${record.values?.name}`,
      });
      // ダウンロードはホスト側で自動開始（window.open）
    } catch (err) {
      console.error('PDF生成エラー:', err.message);
    }
  };

  return (
    <div>
      {(records || []).map((r) => (
        <button key={r.recordId} onClick={() => handleDownload(r)} disabled={isLoading}>
          {isLoading ? '生成中...' : 'PDF出力'}
        </button>
      ))}
    </div>
  );
}
```

### テンプレート変数（generic-report テンプレート）

| 変数 | 型 | 説明 |
|------|-----|------|
| `title` | `string` | レポートタイトル |
| `subtitle` | `string` | サブタイトル（任意） |
| `company` | `string` | 会社名（任意） |
| `author` | `string` | 作成者（任意） |
| `date` | `string` | 作成日（任意） |
| `description` | `string` | 概要テキスト（任意） |
| `headers` | `string[]` | テーブルヘッダー |
| `fields` | `string[]` | テーブルの各行から取得するフィールド名 |
| `items` | `object[]` | テーブルデータ |
| `itemsTitle` | `string` | テーブルセクションのタイトル（デフォルト: "明細"） |
| `notes` | `string` | 備考テキスト（任意） |

### 注意事項

1. **iframe制約**: ダウンロードはホスト側（親ウィンドウ）の `window.open()` で実行されます。iframe内から直接ダウンロードはできません。
2. **タイムアウト**: PDF生成は120秒でタイムアウトします。
3. **テンプレート名**: 英小文字・数字・ハイフンのみ使用可能（パストラバーサル防止）。
4. **日本語対応**: テンプレート内で日本語テキストが正しくレンダリングされます（Noto Sans CJK JP フォント使用）。

---

## useFileUpload()

ファイルのアップロード・ダウンロード・削除を行うフックです。presigned URL方式で、ブラウザから直接ストレージにファイルをアップロードします。

```tsx
function useFileUpload(): {
  uploadFile: (file: File, options?: UploadOptions) => Promise<FileMetadata>;
  downloadFile: (key: string) => Promise<{ url: string }>;
  deleteFile: (key: string) => Promise<{ success: boolean }>;
}
```

### uploadFile(file, options?)

ファイルをS3にアップロードし、メタデータを返します。内部でFileをBase64に変換してpostMessage経由で送信し、presigned PUT URLを取得してS3に直接PUTします。

```tsx
const { uploadFile } = useFileUpload();

const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const metadata = await uploadFile(file, {
    fieldId: 'document_file',  // 必須: フィールドコード
    formId: 'FORM_ID',         // オプション: データベースID
    answerId: 'ANSWER_ID',     // オプション: レコードID
  });

  console.log(metadata.key);        // ストレージキー
  console.log(metadata.fileName);   // ファイル名
  console.log(metadata.mimeType);   // MIME タイプ
  console.log(metadata.size);       // ファイルサイズ（バイト）
  console.log(metadata.uploadedAt); // アップロード時刻（ISO 8601）
};
```

**パラメータ**:

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `file` | `File` | Yes | ブラウザのFileオブジェクト |
| `options.fieldId` | `string` | Yes | フィールドコード（デフォルト: `'attachments'`） |
| `options.formId` | `string` | No | データベースID（per-database権限検証用） |
| `options.answerId` | `string` | No | レコードID |

**戻り値**: `Promise<FileMetadata>`

```typescript
interface FileMetadata {
  key: string;           // ストレージキー（ダウンロード・削除時に使用）
  fileName: string;      // ファイル名
  mimeType: string;      // MIME タイプ
  size: number;          // ファイルサイズ（バイト）
  uploadedAt: string;    // アップロード時刻（ISO 8601）
}
```

**制約**:
- ファイルサイズ上限: 100MB（システム上限）。フィールド定義の `maxSizeMB` で個別に制限可能
- ブロックされるMIMEタイプ: `text/html`, `application/javascript` 等（XSS防止）
- presigned URLの有効期限: 5分
- タイムアウト: 60秒（iframe postMessage）

### downloadFile(key)

ストレージのファイルをダウンロードします。署名付きURL（15分有効）を取得し、新規タブで開きます。

```tsx
const { downloadFile } = useFileUpload();

const handleDownload = async () => {
  const fileKey = record?.values?.document_file?.key;
  if (fileKey) {
    const result = await downloadFile(fileKey);
    // → 新規タブでファイルが開く / ダウンロードされる
    // result.url: 署名付きURL
  }
};
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `key` | `string` | Yes | ストレージキー（`uploadFile` の戻り値 `.key`） |

**戻り値**: `Promise<{ url: string }>` — 署名付きURL（15分有効）

### deleteFile(key)

ストレージ上のファイルを削除します。削除後はレコード側でもファイルフィールドを `null` に更新してください。

```tsx
const { deleteFile } = useFileUpload();
const updateMutation = useMutation('update');

const handleDelete = async () => {
  const fileKey = record?.values?.document_file?.key;
  if (fileKey) {
    await deleteFile(fileKey);
    // レコード更新でファイル参照を除去
    await updateMutation.mutate({ formId, recordId: answerId, answerData: { document_file: null } });
  }
};
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `key` | `string` | Yes | ストレージキー |

**戻り値**: `Promise<{ success: boolean }>`

### 完全サンプル: ファイルアップロード画面

```tsx
import React, { useRef } from 'react';
import { useRecord, useMutation, useFileUpload, useExecutionContext } from '@awll/sdk';

export default function FileUploadDemo() {
  const { params } = useExecutionContext();
  const formId = params.formId;
  const answerId = params.answerId;
  const { data: record } = useRecord(formId, answerId);
  const updateMutation = useMutation('update');
  const { uploadFile, downloadFile, deleteFile } = useFileUpload();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const metadata = await uploadFile(file, { fieldId: 'attachment', formId, answerId });
      // アップロード成功 → レコードにメタデータを保存
      await updateMutation.mutate({ formId, recordId: answerId, answerData: { attachment: metadata } });
      alert('アップロード完了: ' + metadata.fileName);
    } catch (err) {
      alert('アップロード失敗: ' + (err as Error).message);
    }
  };

  const handleDownload = async () => {
    const key = record?.values?.attachment?.key;
    if (key) await downloadFile(key);
  };

  const handleDelete = async () => {
    const key = record?.values?.attachment?.key;
    if (key) {
      await deleteFile(key);
      await updateMutation.mutate({ formId, recordId: answerId, answerData: { attachment: null } });
    }
  };

  const attachment = record?.values?.attachment;
  return (
    <div>
      <h2>ファイル管理</h2>
      {attachment ? (
        <div>
          <p>{attachment.fileName} ({(attachment.size / 1024).toFixed(1)} KB)</p>
          <button onClick={handleDownload}>ダウンロード</button>
          <button onClick={handleDelete} style={{ marginLeft: 8 }}>削除</button>
        </div>
      ) : (
        <input type="file" ref={inputRef} onChange={handleUpload} />
      )}
    </div>
  );
}
```

### 注意事項

1. **Base64変換**: iframe内でFileオブジェクトを直接postMessageで送信できないため、内部でBase64に変換しています。100MBを超えるファイルはメモリ制約でエラーになる可能性があります。
2. **ファイル名サニタイズ**: バックエンド側でパストラバーサル・Content-Dispositionインジェクション防止のサニタイズが自動適用されます。
3. **暗号化**: アップロードされたファイルはサーバーサイド暗号化で自動暗号化されます。
4. **テナント分離**: S3キーの `tenants/{tenantCode}/` プレフィックスにより、テナント間のファイルアクセスは自動的にブロックされます。
5. **権限**: アップロードには `FORM_ANSWER:WRITE`、ダウンロードには `FORM_ANSWER:READ` 権限が必要です。

### 画像のインライン表示（img タグ）

FILE型フィールドの画像を画面内で `<img>` タグとして表示するには、`downloadFile()` で署名付きURLを取得して使用します。

> ✅ **CSP対応済み**: iframe内のCSPは署名付きURLの画像を直接表示できるよう設定済みです。

#### 単一ファイルの画像プレビュー

```tsx
import React, { useState, useEffect } from 'react';
import { useRecord, useFileUpload, useExecutionContext } from '@awll/sdk';

export default function ImagePreview() {
  const { params } = useExecutionContext();
  const { data: record } = useRecord(params.formId, params.answerId);
  const { downloadFile } = useFileUpload();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const file = record?.values?.photo;
    if (file?.key && file.mimeType?.startsWith('image/')) {
      downloadFile(file.key).then(({ url }) => setImageUrl(url));
    }
  }, [record]);

  return imageUrl ? (
    <img src={imageUrl} alt="写真" style={{ maxWidth: '100%' }} />
  ) : (
    <p>画像なし</p>
  );
}
```

#### 複数ファイル（allowMultiple: true）の画像ギャラリー

```tsx
// ⚠️ || [] はレンダーごとに新しい配列参照を生成するため、useEffectの依存配列には使わない
const receipts = record?.values?.receipts as FileMetadata[] | undefined;
const [urls, setUrls] = useState<Record<string, string>>({});

useEffect(() => {
  if (!receipts?.length) return;
  Promise.all(
    receipts
      .filter(f => f.mimeType?.startsWith('image/'))
      .map(async f => ({ key: f.key, url: (await downloadFile(f.key)).url }))
  ).then(results => {
    setUrls(Object.fromEntries(results.map(r => [r.key, r.url])));
  });
}, [receipts]);  // React Queryのキャッシュが同一である限り参照は安定

// JSX
{(receipts || []).map(f => (
  urls[f.key]
    ? <img key={f.key} src={urls[f.key]} alt={f.fileName} style={{ maxWidth: 200 }} />
    : <span key={f.key}>{f.fileName}</span>
))}
```

> **注意**: 署名付きURLは**15分で有効期限が切れます**。長時間表示する画面では、タイマーで再取得するか、ユーザー操作時に都度取得してください。

#### PDFのインラインプレビュー

FILE型フィールドのPDFを画面内で `<iframe>` として埋め込み表示できます。

> ✅ **CSP対応済み**: iframe内のCSPは署名付きURLのPDFを `<iframe>` で直接表示できるよう設定済みです。

```tsx
import React, { useState, useEffect } from 'react';
import { useRecord, useFileUpload, useExecutionContext } from '@awll/sdk';

export default function PdfPreview() {
  const { params } = useExecutionContext();
  const { data: record } = useRecord(params.formId, params.answerId);
  const { downloadFile } = useFileUpload();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const file = record?.values?.document;
    if (file?.key && file.mimeType === 'application/pdf') {
      downloadFile(file.key).then(({ url }) => setPdfUrl(url));
    }
  }, [record]);

  return pdfUrl ? (
    <iframe
      src={pdfUrl}
      title="PDFプレビュー"
      style={{ width: '100%', height: 600, border: 'none' }}
    />
  ) : (
    <p>PDFなし</p>
  );
}
```

> **注意**:
> - ブラウザ内蔵のPDFビューアで表示されます（Chrome, Firefox, Edge, Safari対応）
> - 高度なPDF操作（検索、注釈等）が必要な場合は PDF.js の導入を検討してください
> - `<object>` / `<embed>` タグも許可済みですが、`<iframe>` が最も互換性が高い方法です

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

## 画面デプロイ手順（publish / compile / deploy の違い）

画面コードを修正した後、ビジネスユーザーに反映するには**3つの独立した操作**を理解する必要があります。

### 操作の違い

| 操作 | やること | ビジネスユーザーへの反映 |
|------|---------|:--:|
| **publishScreen** | データストアのステータスをPUBLISHEDに変更するだけ | ❌ 反映されない |
| **compileScreen** | TSX/JSXをesbuildでIIFEバンドルに変換 → compiledCodeをデータストアに保存 | ❌ 反映されない |
| **deployScreen** | compiledCodeをCDNにアップロード → キャッシュ無効化 → 内部でpublishも実行 | ✅ 反映される |

### 必須手順

```
1. コード編集 (saveScreenFile / updateScreen)
2. compileScreen ← コンパイル必須（スキップ不可）
3. deployScreen  ← CDNアップロード + キャッシュ無効化 + 自動publish
4. ビジネスユーザーがCDN経由でアクセス可能
```

**publishScreenは省略可能** — deployScreenが内部でpublishを実行するため。

### よくある間違い

| やりがちなこと | 結果 | 正しい手順 |
|--------------|------|-----------|
| publishScreenだけ実行 | ビジネスユーザーに反映されない | compileScreen → deployScreen |
| コード修正後にdeployScreenだけ実行 | 古いcompiledCodeがデプロイされる | compileScreen → deployScreen |
| compileScreenだけ実行 | データストアにのみ保存、CDN未反映 | compileScreen → deployScreen |

---

## 画面開発でよくある つまづきポイント

実際のテナント構築で判明した注意点をまとめます。

### 1. useMutation の呼び出し方を間違える

画面コード（iframe SDK）では **`useMutation('操作名')` + `.mutate()`** が正しい形式です。

```tsx
// ❌ NG: フロントエンド本体のAPI — iframe SDKでは create is not a function
const { create, update, remove } = useMutation();
await create({ formId, data: { name: '新規' } });

// ✅ OK: iframe SDK の正しい呼び方
const createMutation = useMutation('create');
await createMutation.mutate({ formId, answerData: { name: '新規' } });
```

**特に注意**:
- mutate に渡すキーは **`answerData`**（`data` ではない）
- `useMutation()` 引数なしの `{create, update, remove}` 形式は**画面コードでは動作しない**

### 2. useRecords の呼び出し形式

`useRecords` は文字列とオブジェクトの両方を受け付けますが、**オブジェクト形式を推奨**します。

```tsx
// ⚠️ 動くが、ページネーション制御できない
const { data } = useRecords(FORM_ID);

// ✅ 推奨: ページネーション指定可能
const { data, total } = useRecords({
  formId: FORM_ID,
  pagination: { page: 1, pageSize: 200 },
});
```

`data` は配列として直接返ります（`.items` は不要）。

### 3. useRecord のデータアクセス

```tsx
const { data: record } = useRecord(FORM_ID, recordId);

// フィールドアクセス
const name = record?.values?.name;

// answerId（レコードID）
const answerId = record?.answerId;

// ルートノードID（サブテーブル操作時に必要）
const rootNodeId = record?.rootNodeId || record?.answerId;
```

### 4. PATCH API の path に先頭 `/` を付けない

REST APIを直接呼ぶ場合（画面SDKではなくMCP等から）:

```json
// ❌ NG: `/company_url` というフィールド名で保存されてしまう
{ "operations": [{ "op": "replace", "path": "/company_url", "value": "https://..." }] }

// ✅ OK: `company_url` フィールドが正しく更新される
{ "operations": [{ "op": "replace", "path": "company_url", "value": "https://..." }] }
```

- `If-Match` ヘッダー必須（楽観的ロック、レコード取得時のバージョンを指定）
- ARRAYフィールド（サブテーブル）はPATCHではなくNodes APIで操作

### 5. 新規レコード作成の完全パターン

```tsx
import React, { useState } from 'react';
import { useRecords, useMutation, useNavigation, useExecutionContext } from '@awll/sdk';

export default function CreateRecordScreen() {
  const { params } = useExecutionContext();
  const formId = params.formId;
  const { goBack } = useNavigation();
  const { data: records, total } = useRecords({ formId, pagination: { page: 1, pageSize: 20 } });
  const createMutation = useMutation('create');
  const [formData, setFormData] = useState({ name: '', status: 'new' });

  const handleCreate = async () => {
    try {
      const result = await createMutation.mutate({
        formId,
        answerData: formData,  // ← answerData（dataではない）
      });
      alert('作成完了: ' + result.recordId);
      // useRecords のデータは自動再取得される
    } catch (err) {
      alert('作成失敗: ' + (err as Error).message);
    }
  };

  return (
    <div>
      <h2>新規作成</h2>
      <input
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="名前"
      />
      <select
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
      >
        <option value="new">新規</option>
        <option value="active">有効</option>
      </select>
      <button onClick={handleCreate} disabled={createMutation.isLoading}>
        {createMutation.isLoading ? '作成中...' : '作成'}
      </button>
      <hr />
      <h3>既存レコード ({total}件)</h3>
      <ul>
        {(records || []).map((r) => (
          <li key={r.answerId}>{r.values?.name || r.searchableFields?.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 6. フォーム定義の更新（PUT）での注意

- `description: null` を含めるとエラー → 省略するか空文字 `""` を使う
- 既存フィールドを**全て含めて送信**する（差分更新ではなく全体置換）
- `fieldRecordId`（ULID）と `order` は必須 — 欠如するとFormBuilder UIが壊れる

### 7. 画面のフォルダ移動後はデプロイが必要

`moveScreen` でフォルダ移動すると `compiledCode` がリセットされます。移動後は `compileScreen → deployScreen` の再実行が必要です。

---

## 参考資料

- [Screen Development](./screen-development.md)
- [Data Structures](./data-structures.md)
- [AWLL Studio公式ドキュメント](https://docs.awll-studio.ai)
