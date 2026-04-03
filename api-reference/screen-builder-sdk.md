# スクリーンビルダー SDK リファレンス

AWLL Studio のスクリーンビルダーで使用できる SDK（`@awll/sdk`）のリファレンスです。業務画面をコードで構築する際に参照してください。

---

## 技術スタック

- React 19 + TypeScript 5.8
- MUI v7 コンポーネント（`@mui/material`）
- `@awll/sdk` Hooks

---

## @awll/sdk Hooks

### useRecords(formCode)

データベースのレコードを取得します。

```tsx
const { data, isLoading, error } = useRecords('customer');
```

| 戻り値 | 型 | 説明 |
|--------|------|------|
| `data` | `Record[]` | レコードの配列 |
| `isLoading` | `boolean` | 読み込み中フラグ |
| `error` | `Error \| null` | エラー情報 |

### useMutation(formCode)

レコードの作成・更新・削除を行います。

```tsx
const mutation = useMutation('customer');

// 作成
await mutation.create({ name: '新規顧客', email: 'new@example.com' });

// 更新
await mutation.update(recordId, { name: '更新後の名前' });

// 削除
await mutation.delete(recordId);
```

### useExecutionContext()

現在の実行コンテキスト（テナント情報、ユーザー情報）を取得します。

```tsx
const { tenantId, userId } = useExecutionContext();
```

### メール送信

Screen SDK（React Hooks）にはメール送信用のフックはありません。メール送信が必要な場合は以下を使用してください：

- **Script SDK**: スクリプトルール内で `api.sendEmail({ to, subject, body, templateVariables })` を使用（SES経由）
- **REST API**: `POST /api/v1/mail/send` で直接送信（ADMIN/DEVELOPER権限が必要）

---

## 利用可能な MUI コンポーネント

| カテゴリ | コンポーネント |
|---------|--------------|
| レイアウト | Box, Container, Grid, Stack |
| 入力 | TextField, Select, Button, Checkbox, Switch |
| データ表示 | Table, TableContainer, Card, List |
| フィードバック | Alert, Snackbar, Dialog, Progress |
| ナビゲーション | Tabs, Breadcrumbs, Menu |

---

## 実装例

### 顧客一覧画面

```tsx
import { useRecords, useMutation, useExecutionContext } from '@awll/sdk';
import {
  Box, Card, CardContent, Typography,
  CircularProgress, Alert, Button
} from '@mui/material';

export default function CustomerList() {
  const { data: customers, isLoading, error } = useRecords('customer');
  const mutation = useMutation('customer');
  const { tenantId, userId } = useExecutionContext();

  const handleCreate = async () => {
    await mutation.create({ name: '新規顧客' });
  };

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <Box>
      <Button variant="contained" onClick={handleCreate}>
        新規作成
      </Button>
      {customers?.map(customer => (
        <Card key={customer.id} sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6">{customer.name}</Typography>
            <Typography color="text.secondary">{customer.email}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
```

---

## コーディングルール

1. コンポーネントは**関数コンポーネント**で実装
2. TypeScript の**型定義**を適切に行う
3. MUI コンポーネントを活用して UI を構築
4. エラーハンドリング（Loading / Error / Empty 状態）を必ず実装

---

**更新日**: 2026-03-17
