# 通知センター・コメント・メンション統合ガイド

**対象**: テナント開発者 (Screen 開発・カスタム SDK 統合)
**Epic**: [#1886 アプリ内通知センター + コメント・メンション機能](https://github.com/AWLL-inc/awll-studio/issues/1886)
**最終更新**: 2026-05-23

AWLL Studio v2 から、レコード単位の **コメント機能**・**@ メンション**・**アプリ内通知センター**・**通知設定** が標準で利用できます。本ドキュメントは Screen / カスタム UI から SDK を呼び出すテナント開発者向けの統合ガイドです。

---

## 全体像

```
┌──────────────────┐    @ メンション / 担当者割当
│ レコード詳細画面 │ ─────────────────────────┐
│ (Screen / 標準)  │                          │
└──────┬───────────┘                          ▼
       │ CommentThread / MentionInput     ┌──────────────┐
       │ TextField / MarkdownField        │ 通知センター │
       │                                  │ (NotificationBell + Panel)
       ▼                                  │              │
┌──────────────────┐  publishEvent  ─────►│ /api/v1/     │
│ Backend API      │                      │ notifications│
│  /comments /forms/{id}/records/...      └──────────────┘
└──────────────────┘
```

| レイヤー | 主な API / コンポーネント |
|---------|---------------------------|
| **データ API** | `awll.comments.{list,create,update,delete}` / `awll.users.{searchMentionable,lookup}` |
| **React Hooks** | `useComments`, `useCreateComment` |
| **UI コンポーネント** | `<CommentThread>` / `<MentionInput>` / `<MentionDisplay>` |
| **標準フィールド統合** | `TextFieldRenderer` / `MarkdownFieldRenderer` の `mentionEnabled` プロパティ |
| **通知側 API** | `/api/v1/notifications/*` (一覧 / 既読 / 全既読 / 設定 取得・更新) |

---

## 1. コメント機能 — `<CommentThread>`

レコード詳細画面に **コメントスレッド** を配置します。投稿・編集・削除・スクロールフェッチ (cursor paging) を SDK が自動で扱います。

### 最小サンプル

```tsx
import { CommentThread } from '@awll/sdk';
import { useLocation } from 'react-router-dom';

export const RecordDetailScreen = ({ formId, recordId }: Props) => {
  const location = useLocation();

  return (
    <Box>
      {/* ... レコード本体 ... */}
      <CommentThread
        formId={formId}
        recordId={recordId}
        // 必須 (ADR-0011): 通知を踏んだ受信者の戻り先 URL
        returnUrl={location.pathname + location.search}
      />
    </Box>
  );
};
```

### `<CommentThread>` Props

| 名前 | 型 | 必須 | 説明 |
|------|----|------|------|
| `formId` | `string` | ✅ | 対象フォーム (データベース) ID |
| `recordId` | `string` | ✅ | 対象レコード (回答) ID |
| `returnUrl` | `string` | ✅ | **ADR-0011 必須**。通知メールやアプリ内通知のリンク先。`/business/...` 形式の **相対パス** または `https://...` の絶対 URL。`//` 始まりの protocol-relative や制御文字を含む URL は **400 で拒否** されます |
| `maxLength` | `number` | – | 本文最大文字数。`COMMENT_BODY_MAX_LENGTH` (10000) をデフォルトに |

### `returnUrl` のベストプラクティス

| 用途 | 推奨値 |
|-----|-------|
| 標準画面のレコード詳細 | `location.pathname + location.search` (例: `/business/forms/PROJ/answers/A001/edit`) |
| Screen で開いている場合 | テナント独自 URL (`/business/screens/customScreen?recordId=A001` 等) |
| カスタム外部ページ | 絶対 URL (`https://example.com/projects/123`) |

❌ **NG**: `//evil.example.com/x` (protocol-relative)、制御文字を含む URL — `@Pattern` バリデーションで **400** になります。

---

## 2. メンション — `<MentionInput>` と標準フィールド

### 2-a. 標準 TextField / MarkdownField (`mentionEnabled`)

フォーム定義の `TEXT` / `MARKDOWN` フィールドは **デフォルトで `@` メンション有効**。フィールド定義側で `mentionEnabled: false` にすると無効化できます。

```json
{
  "fieldCode": "discussion",
  "fieldType": "MARKDOWN",
  "fieldName": "議論メモ",
  "mentionEnabled": true  // 省略時 true。明示 false でオプトアウト
}
```

- TipTap Mention extension で `@` 入力中に候補がポップアップ
- 永続化フォーマットは `<span data-type="mention" data-id="<uuid>" data-label="<displayName>">@{uuid}</span>` (Backend `MentionParser.kt` が検知)
- view モードでは `@{uuid}` が `@<displayName>` に解決 (`useMentionedUsers` 経由)

### 2-b. カスタム UI で `<MentionInput>` を使う

Screen 内のカスタムフォームで使う場合:

```tsx
import { MentionInput } from '@awll/sdk';

export const DiscussionForm = ({ formId }: { formId: string }) => {
  const [text, setText] = useState('');

  return (
    <MentionInput
      formId={formId}      // Phase 9 #2: awll.users から候補を自動構築
      value={text}
      onChange={setText}
      label="議論メモ"
      multiline
      rows={4}
    />
  );
};
```

または `searchUsers` を自前提供する形:

```tsx
import { MentionInput, awll } from '@awll/sdk';

const searchUsers = useCallback(
  (q: string) => awll.users.searchMentionable(formId, { q, limit: 10 }),
  [formId],
);

return <MentionInput searchUsers={searchUsers} value={text} onChange={setText} />;
```

### 2-c. メンション表示 (`<MentionDisplay>`)

read-only 表示で `@{uuid}` を `@<displayName>` に置換:

```tsx
import { MentionDisplay, extractMentions } from '@awll/sdk';
import { useMentionedUsers } from '@/hooks/useMentionedUsers';

const segments = extractMentions(value);
const userIds = segments.filter(s => s.type === 'mention').map(s => s.userId);
const { data: usersMap } = useMentionedUsers(userIds);

return (
  <Typography>
    {segments.map((seg, i) =>
      seg.type === 'mention'
        ? <MentionDisplay key={i} userId={seg.userId} user={usersMap?.[seg.userId]} />
        : <span key={i}>{seg.text}</span>
    )}
  </Typography>
);
```

---

## 3. 担当者割り当て (USER フィールド)

`USER` 型フィールドに値を入れると、新たに割り当てられたユーザーへ通知が飛びます (重複は差分検知で抑止)。

```json
{ "fieldCode": "assignee", "fieldType": "USER", "selectionMode": "single" }
{ "fieldCode": "reviewers", "fieldType": "USER", "selectionMode": "multiple" }
```

- `selectionMode: single` → スカラー UUID
- `selectionMode: multiple` → UUID 配列

ARRAY 内のサブフィールドに USER がある場合も、Phase 9 で再帰探索に対応済です。

---

## 4. 通知 API — テナントの独自 UI 用

ヘッダーの通知ベルは標準で組み込み済 (`BusinessHeader` / `AdminHeader`)。テナント独自 UI から API を直接叩く場合は以下:

### REST API

| メソッド | エンドポイント | 用途 |
|---------|---------------|------|
| `GET` | `/api/v1/notifications?limit=20&cursor=...&unreadOnly=true` | 一覧 (cursor paging) |
| `GET` | `/api/v1/notifications/unread-count` | 未読件数 (バッジ) |
| `PATCH` | `/api/v1/notifications/{id}/read` | 個別既読化 |
| `POST` | `/api/v1/notifications/read-all` | 全既読化 |
| `GET` | `/api/v1/notifications/preferences` | 通知設定取得 |
| `PUT` | `/api/v1/notifications/preferences` | 通知設定更新 |

### 通知設定の例

```typescript
// GET /api/v1/notifications/preferences
{
  "mentionsEnabled": true,
  "assignmentsEnabled": true
}

// PUT (種別ごとに ON/OFF)
{
  "mentionsEnabled": false,
  "assignmentsEnabled": true
}
```

OFF にした種別は Backend (`MentionDetectionListener`) 側で生成スキップされます。フロントエンドの「設定 OFF だから無視」ではなく **生成しない** ため、後追いで再 ON にしても遡って通知は飛びません。

---

## 5. originUrl 必須化 (ADR-0011) と SDK 型安全性

通知の link は **発信元画面の URL** を返す必要があり、`returnUrl` / `originUrl` は **型レベルで必須化** されています。

| API | 必須引数 | 用途 |
|-----|---------|------|
| `awll.comments.create({ formId, recordId, body, returnUrl })` | `returnUrl` | コメント通知のクリック先 |
| `awll.forms.createAnswer({ formId, data, originUrl })` | `originUrl` | レコード作成時のメンション通知のクリック先 |
| `awll.forms.updateAnswer({ ..., originUrl })` | `originUrl` | 同上 (更新時) |

SDK 側で TypeScript の `Required<>` 型強制 + Backend `@Pattern` バリデーションの **二重防御** で抜け道を防いでいます。

### URL の許可形式 (Backend `@Pattern`)

```
^(https?://|/(?!/))[^\x00-\x1f\x7f]*$
```

| パターン | 例 | 判定 |
|---------|-----|-----|
| 相対パス | `/business/forms/PROJ/answers/A001` | ✅ |
| 絶対 URL | `https://example.com/projects/123` | ✅ |
| protocol-relative | `//evil.example.com/x` | ❌ (open redirect 拒否) |
| 制御文字 | `/path\r\nheader: x` | ❌ (CRLF injection 拒否) |
| 危険なスキーム | `javascript:alert(1)` | ❌ (XSS 拒否) |

---

## 6. よくあるパターン

### 6-a. SDK iframe 内から `<CommentThread>` を表示

iframe 内の Screen から SDK 経由でコメント機能を呼ぶ:

```tsx
// Screen 定義 (テナントが書く)
import { CommentThread, useExecutionContext } from '@awll/sdk';

export default function MyRecordScreen() {
  const ctx = useExecutionContext();
  const recordId = ctx.queryParams.recordId;

  return (
    <CommentThread
      formId={ctx.formId}
      recordId={recordId}
      returnUrl={`/business/screens/${ctx.screenCode}?recordId=${recordId}`}
    />
  );
}
```

### 6-b. テナント独自の通知 UI を作る

```tsx
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@awll/sdk';

export const useUnreadCount = () =>
  useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () =>
      apiClient.get('/api/v1/notifications/unread-count').then(r => r.data.count as number),
    refetchInterval: 30_000,  // 30 秒ポーリング
  });
```

### 6-c. AI / Bot からのコメント投稿

API key 認証 or service account でコメント投稿:

```typescript
await awll.comments.create({
  formId: 'PROJ',
  recordId: 'A001',
  body: '@{<reviewer-uuid>} 自動レビュー完了しました',
  returnUrl: `https://app.example.com/projects/${projectId}/ai-reviews/${reviewId}`,
});
```

---

## 7. トラブルシューティング

| 症状 | 原因と対応 |
|------|-----------|
| `400 Bad Request: returnUrl は...` | `returnUrl` 未指定 / protocol-relative / 制御文字混入 → ADR-0011 / 上記 §5 を再確認 |
| メンションしても通知が飛ばない | (1) 受信者の通知設定で OFF / (2) actor=受信者 (自分宛は通知しない) / (3) `mentionEnabled: false` 指定 |
| 通知ベルに件数が出ない | `/api/v1/notifications/unread-count` を 30 秒間隔でポーリングしているか / WebSocket 未対応 |
| view モードで `@{uuid}` のまま表示される | `useMentionedUsers(userIds)` で bulk lookup していない / `<MentionDisplay>` を経由していない |
| ARRAY 内のメンションが検知されない | Phase 9 で再帰探索に対応済。最新版にアップデート要 |

---

## 8. 関連リンク

- [Epic #1886](https://github.com/AWLL-inc/awll-studio/issues/1886) — 全 Phase 設計と完了条件
- [ADR-0011](../../concept/decisions/) — originUrl / returnUrl 必須化の判断
- [Screen SDK Reference](./screen-sdk-reference.md) — Screen 全般の SDK
- [Script SDK Reference](./script-sdk-reference.md) — スクリプトルール (バックエンド側 hook)
- [Security Best Practices](./security-best-practices.md) — 認証 / 権限 / XSS 対策の総合
