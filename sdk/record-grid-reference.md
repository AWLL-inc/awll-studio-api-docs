# RecordGrid SDK Reference

**対象**: AWLL Studio画面開発者
**最終更新**: 2026-03-15

## 概要

RecordGrid は Notion / GitHub Projects に倣ったミニマルなテーブルUIコンポーネントです。
TanStack Table + TanStack Virtual ベースで、10万行規模のデータを仮想スクロールで表示できます。

## インポート方法

```typescript
import {
  RecordGrid,
  QuickAddRow,
  SidePeek,
  ViewTabBar,
  exportToCsv,
  downloadCsv,
  generateColumnsFromFields,
} from '@/components/recordGrid';

import type {
  RecordColumn,
  RecordGridProps,
  RecordGridViewState,
  ColumnType,
  ViewTab,
  ViewTabBarProps,
} from '@/components/recordGrid';
```

---

## RecordGrid

テーブル本体。仮想スクロール、列リサイズ、ピン留め、選択、ステータスバーを提供。

### 基本使用例

```tsx
import { RecordGrid } from '@/components/recordGrid';

function CustomerList() {
  const columns = [
    { key: 'name', headerName: '顧客名', field: 'name', type: 'text', editable: true },
    { key: 'email', headerName: 'メール', field: 'email', type: 'text' },
    { key: 'status', headerName: 'ステータス', field: 'status', type: 'select' },
  ];

  return (
    <RecordGrid
      records={data}
      columns={columns}
      getRowId={(r) => r.id}
      onRowClick={(row) => console.log('clicked', row)}
      selectionMode="multiple"
      height={600}
    />
  );
}
```

### Props

| Prop | 型 | デフォルト | 説明 |
|------|-----|-----------|------|
| `records` | `T[]` | `[]` | 表示するデータ配列 |
| `columns` | `RecordColumn<T>[]` | 必須 | 列定義 |
| `loading` | `boolean` | `false` | ローディング状態 |
| `error` | `unknown` | - | エラー状態（文字列で表示） |
| `getRowId` | `(row: T) => string` | index | 行のユニークID取得関数 |
| `onRowClick` | `(row: T) => void` | - | 行クリックコールバック |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'none'` | 選択モード |
| `onSelectionChange` | `(ids: string[]) => void` | - | 選択変更コールバック |
| `height` | `number \| string` | `600` | グリッド高さ |
| `rowHeight` | `number` | `36` | 行の高さ（px） |
| `onViewStateChange` | `(state) => void` | - | 列幅変更等の通知 |
| `defaultViewState` | `RecordGridViewState` | - | 初期列幅設定 |
| `enableQuickAdd` | `boolean` | `false` | クイック追加行の表示 |
| `onQuickAdd` | `(value: string) => Promise<void>` | - | クイック追加コールバック |
| `quickAddPlaceholder` | `string` | `'新規追加...'` | プレースホルダー |

### RecordColumn 型

```typescript
interface RecordColumn<T> {
  key: string;           // 一意キー
  headerName: string;    // ヘッダー表示名
  field?: string;        // データ取得キー（ドット記法対応: 'address.city'）
  type?: ColumnType;     // 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'user' | 'reference' | 'file'
  width?: number;        // 列幅（px）
  minWidth?: number;     // 最小幅
  maxWidth?: number;     // 最大幅
  editable?: boolean;    // 編集可否
  pinned?: 'left';       // ピン留め（左固定）
  hidden?: boolean;      // 非表示
  valueGetter?: (row: T) => unknown;    // カスタム値取得
  renderCell?: (params) => ReactNode;   // カスタムセル描画
}
```

### 選択モード

```tsx
// 複数選択（チェックボックス表示）
<RecordGrid
  selectionMode="multiple"
  onSelectionChange={(ids) => console.log('selected:', ids)}
/>

// 単一選択（行クリックでハイライト）
<RecordGrid
  selectionMode="single"
  onSelectionChange={(ids) => console.log('selected:', ids[0])}
/>
```

### 列ピン留め

```tsx
const columns = [
  { key: 'name', headerName: '名前', field: 'name', pinned: 'left' },  // 左固定
  { key: 'email', headerName: 'メール', field: 'email' },              // 通常
];
```

---

## QuickAddRow

テーブル最下行のクイック追加行。RecordGridの`enableQuickAdd`で自動表示されますが、単独でも使用可能。

```tsx
<RecordGrid
  enableQuickAdd={true}
  quickAddPlaceholder="顧客名を入力..."
  onQuickAdd={async (value) => {
    await createAnswer({ name: value });
    // エラー時は入力が保持される
  }}
/>
```

---

## SidePeek

行クリック時に右側に開くサイドパネル。WAI-ARIA Dialog準拠（aria-modal、Escapeキー対応）。

```tsx
import { SidePeek } from '@/components/recordGrid';

function MyPage() {
  const [selectedRow, setSelectedRow] = useState(null);

  return (
    <>
      <RecordGrid
        records={data}
        columns={columns}
        onRowClick={(row) => setSelectedRow(row)}
      />
      <SidePeek
        open={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        onOpenFullPage={() => navigate(`/detail/${selectedRow.id}`)}
        onPrev={() => { /* 前のレコード */ }}
        onNext={() => { /* 次のレコード */ }}
      >
        <RecordDetail record={selectedRow} />
      </SidePeek>
    </>
  );
}
```

### Props

| Prop | 型 | 説明 |
|------|-----|------|
| `open` | `boolean` | 表示/非表示 |
| `onClose` | `() => void` | 閉じるコールバック |
| `onOpenFullPage` | `() => void` | フルページ遷移 |
| `onPrev` | `() => void` | 前のレコード（↑キー対応） |
| `onNext` | `() => void` | 次のレコード（↓キー対応） |
| `width` | `number \| string` | パネル幅（デフォルト: 480px） |
| `children` | `ReactNode` | パネル内コンテンツ |

---

## ViewTabBar

ビュータブの切替UI。複数ビュー（全件一覧/未対応/担当者別等）を管理。

```tsx
import { ViewTabBar } from '@/components/recordGrid';

const views = [
  { id: 'all', label: '全件一覧', isDefault: true },
  { id: 'open', label: '未対応のみ' },
  { id: 'mine', label: '担当者別' },
];

<ViewTabBar
  views={views}
  activeViewId={activeViewId}
  onViewChange={(viewId) => setActiveViewId(viewId)}
  onViewCreate={() => createNewView()}
  onViewDelete={(viewId) => deleteView(viewId)}
/>
```

### キーボード操作

- **Tab**: アクティブタブにフォーカス
- **Enter / Space**: タブをアクティベート
- **Arrow Left/Right**: タブ間移動（Phase 5で実装予定）

---

## CSVエクスポート

```typescript
import { exportToCsv, downloadCsv } from '@/components/recordGrid';

// CSV文字列を生成（UTF-8 BOM付き、RFC 4180準拠）
const csv = exportToCsv(records, columns);

// ブラウザでダウンロード
downloadCsv(csv, 'customers.csv');
```

- UTF-8 BOM付き（Excel文字化け対策）
- 改行: `\r\n`（RFC 4180準拠）
- 引用符: 二重引用符エスケープ（`""`)
- hidden列は自動スキップ

---

## スキーマからcolumns自動生成

FormDefinitionのフィールド定義からRecordGrid用のcolumnsを自動生成。

```typescript
import { generateColumnsFromFields } from '@/components/recordGrid';

// FormDefinition.schema.fields から自動生成
const columns = generateColumnsFromFields(formDefinition.schema.fields);
// → RecordColumn[] が返される（型・幅・editable自動判定）
```

### フィールドタイプ → ColumnType マッピング

| FormDefinition | RecordGrid | editable |
|---------------|------------|----------|
| TEXT | text | ✅ |
| NUMBER | number | ✅ |
| DATE | date | ✅ |
| SELECT | select | ✅ |
| CHECKBOX | checkbox | ✅ |
| USER | user | ✅ |
| REFERENCE | reference | ✅ |
| MARKDOWN | markdown | ❌ |
| ARRAY | text | ❌ |
| CALCULATED | number | ❌ |
| FILE | file | ❌ |

---

## アクセシビリティ

- `role="grid"` + `aria-rowcount` + `aria-rowindex`
- `role="columnheader"` / `role="row"` / `role="gridcell"`
- チェックボックス: `aria-label="すべて選択"` / `"行 X を選択"`
- SidePeek: `role="dialog"` + `aria-modal="true"` + Escapeキー
- ViewTabBar: `role="tablist"` + `role="tab"` + `aria-selected` + `tabIndex`

---

## 更新履歴

- 2026-03-15: 初版作成（Phase 1-4実装完了）
