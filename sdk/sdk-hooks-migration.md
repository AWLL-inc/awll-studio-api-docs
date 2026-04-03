# SDK Hooks React Query移行ガイド

## 📋 概要

Issue #504により、SDK HooksをReact Queryと統合し、統一的なキャッシュ戦略を実装しました。
このドキュメントは、既存のSDKフック（`useRecords`、`useMutation`）から新しいReact Query統合版への移行方法を説明します。

## 🎯 移行の目的

1. **キャッシュ管理の統一化** - React Queryによる一元的なキャッシュ管理
2. **パフォーマンス向上** - 不要なAPIコール削減とキャッシュヒット率向上
3. **開発者体験の向上** - 標準化されたAPIと型安全性

## 📊 移行対象

### 既存フック → 新フック対応表

| 既存フック | 新フック | 互換ラッパー |
|-----------|---------|-------------|
| `useRecords` | `useRecordsQuery` | `useRecordsCompat` |
| `useMutation` | `useCreateRecordMutation`<br>`useUpdateRecordMutation`<br>`useDeleteRecordMutation` | なし |

## 🔄 段階的移行戦略

### Phase 1: 互換ラッパーによる即時移行（推奨）

既存コードを最小限の変更で移行できます。

```typescript
// 旧コード
import { useRecords } from '@/sdk/hooks/useRecords';

function MyComponent() {
  const {
    data,
    isLoading,
    setPage,
    refetch,
  } = useRecords({
    formId: 'CUSTOMER_FORM',
    pagination: { page: 1, pageSize: 20 },
  });

  // setter系メソッドを使用
  const handlePageChange = (page: number) => {
    setPage(page);
  };
}
```

```typescript
// 互換ラッパー使用（最小限の変更）
import { useRecordsCompat } from '@/sdk/hooks/useRecordsQuery';

function MyComponent() {
  const {
    data,
    isLoading,
    setPage, // ⚠️ 非推奨（console.warnが出る）
    refetch,
  } = useRecordsCompat({
    formId: 'CUSTOMER_FORM',
    pagination: { page: 1, pageSize: 20 },
  });

  // まだsetterメソッドが使えるが、警告が表示される
  const handlePageChange = (page: number) => {
    setPage(page); // console.warn: "setPage is deprecated. Use query params instead."
  };
}
```

### Phase 2: 完全移行（最終形）

React Query APIを直接使用し、最適なパフォーマンスを実現します。

```typescript
// 新コード（完全移行）
import { useRecordsQuery } from '@/sdk/hooks/useRecordsQuery';
import { useState } from 'react';

function MyComponent() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const { data, isLoading, refetch } = useRecordsQuery({
    formId: 'CUSTOMER_FORM',
    pagination: { page, pageSize },
  });

  // stateで管理（React Queryが自動的に再フェッチ）
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div>
      {data?.records.map(record => (
        <div key={record.recordId}>{record.values.name}</div>
      ))}
    </div>
  );
}
```

## 📝 移行例

### 1. レコード取得の移行

#### Before (useRecords)
```typescript
const {
  data,
  total,
  page,
  pageSize,
  isLoading,
  error,
  setPage,
  setFilters,
  refetch,
} = useRecords({
  formId: 'FORM_001',
  filter: { status: 'active' },
  pagination: { page: 1, pageSize: 10 },
});
```

#### After (useRecordsQuery)
```typescript
const [filters, setFilters] = useState({ status: 'active' });
const [page, setPage] = useState(1);

const { data, isLoading, error } = useRecordsQuery({
  formId: 'FORM_001',
  filters,
  pagination: { page, pageSize: 10 },
});

// データアクセス
const records = data?.records ?? [];
const total = data?.total ?? 0;
```

### 2. ミューテーションの移行

#### Before (useMutation)
```typescript
const mutation = useMutation({
  formId: 'FORM_001',
});

// 作成
await mutation.create(newData);
// 更新
await mutation.update(recordId, updatedData);
// 削除
await mutation.remove(recordId);
```

#### After (個別のミューテーションフック)
```typescript
import {
  useCreateRecordMutation,
  useUpdateRecordMutation,
  useDeleteRecordMutation,
} from '@/sdk/hooks/useMutationQuery';

// 作成
const createMutation = useCreateRecordMutation('FORM_001');
await createMutation.mutateAsync(newData);

// 更新
const updateMutation = useUpdateRecordMutation('FORM_001');
await updateMutation.mutateAsync({ recordId, data: updatedData });

// 削除
const deleteMutation = useDeleteRecordMutation('FORM_001');
await deleteMutation.mutateAsync({ recordId });
```

## ⚠️ 注意事項

### 非推奨となる機能

1. **setterメソッド** - `setPage()`, `setPageSize()`, `setFilters()`, `setSort()`
   - 理由: React Queryはstateベースの管理を推奨
   - 代替: コンポーネントのstateで管理

2. **forceRefreshKey** - 強制リフレッシュ用の内部キー
   - 理由: React Queryのinvalidation機構で代替
   - 代替: `queryClient.invalidateQueries()`

### 新しく追加される機能

1. **楽観的更新** - UIの即座更新とエラー時の自動ロールバック
2. **キャッシュ無効化** - 関連データの自動同期
3. **並列フェッチ** - 複数のクエリを効率的に実行

## 🔍 移行チェックリスト

- [ ] 既存の`useRecords`使用箇所を特定（`grep "useRecords\(" frontend/src`）
- [ ] 互換ラッパー（`useRecordsCompat`）で動作確認
- [ ] setter系メソッドをstateベースに置き換え
- [ ] `useMutation`を個別のミューテーションフックに置き換え
- [ ] forceRefreshKey関連のコードを削除
- [ ] テスト実行と動作確認

## 📚 参考資料

- [React Query v5 Documentation](https://tanstack.com/query/latest)
- [Issue #504: キャッシュ戦略実装](https://github.com/AWLL-inc/awll-studio/issues/504)
- [ADR-010: SDK Hooks React Query Integration](../../docs/ADR/ADR-010-sdk-hooks-react-query-integration.md)

## 🆘 サポート

移行に関する質問や問題がある場合は、以下にお問い合わせください：
- GitHub Issue: #504
- Slack: #awll-studio-dev

---

**最終更新日**: 2026-01-16
**作成者**: Claude Code