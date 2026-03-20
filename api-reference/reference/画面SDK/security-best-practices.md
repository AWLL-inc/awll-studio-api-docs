# Security Best Practices - セキュリティベストプラクティス

**対象**: AWLL Studio開発者
**難易度**: 中級〜上級
**最終更新**: 2026-02-04

## 概要

AWLL Studioプラットフォームで画面とスクリプトを開発する際のセキュリティベストプラクティスです。

---

## 認証・認可

### 1. ユーザー情報の取得

画面では `useExecutionContext()` で現在のユーザー情報を取得します。

```tsx
import { useExecutionContext } from '@awll/sdk';

export default function MyScreen() {
  const context = useExecutionContext();

  // 現在のユーザー情報
  console.log('ユーザーID:', context.currentUser.id);
  console.log('ユーザー名:', context.currentUser.name);
  console.log('ロール:', context.currentUser.roles);

  // ロールベースの表示制御
  const isAdmin = context.currentUser.roles.includes('ADMIN');

  return (
    <div>
      <h1>ようこそ、{context.currentUser.name}さん</h1>
      {isAdmin && <button>管理者メニュー</button>}
    </div>
  );
}
```

### 2. ロールベースのアクセス制御

```tsx
import { useExecutionContext } from '@awll/sdk';

export default function AdminScreen() {
  const context = useExecutionContext();
  const isAdmin = context.currentUser.roles.includes('ADMIN');

  if (!isAdmin) {
    return (
      <div>
        <h1>アクセス拒否</h1>
        <p>この画面は管理者のみアクセス可能です。</p>
      </div>
    );
  }

  return (
    <div>
      <h1>管理画面</h1>
      {/* 管理者専用コンテンツ */}
    </div>
  );
}
```

### 3. スクリプトでの権限チェック

スクリプトでは、APIが自動的に権限チェックを実行します。

```javascript
// スクリプトは実行ユーザーの権限で動作
console.log('実行ユーザー:', userId);

try {
  // 権限がない場合、PermissionDeniedError がスローされる
  api.updateRecord('customer_form', recordId, { status: 'deleted' });
} catch (error) {
  if (error.message.includes('permission')) {
    console.error('権限エラー:', error.message);
    throw new Error('レコード更新権限がありません');
  }
  throw error;
}
```

---

## 入力検証（バリデーション）

### 1. クライアント側バリデーション

```tsx
import { useState } from 'react';
import { useMutation } from '@awll/sdk';

export default function CreateCustomerForm() {
  const [formData, setFormData] = useState({
    customer_name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});

  const createMutation = useMutation('create');

  const validate = () => {
    const newErrors = {};

    // 必須チェック
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = '顧客名は必須です';
    }

    // メールアドレス形式チェック
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email)) {
      newErrors.email = '正しいメールアドレスを入力してください';
    }

    // 電話番号形式チェック
    const phonePattern = /^[0-9-]+$/;
    if (formData.phone && !phonePattern.test(formData.phone)) {
      newErrors.phone = '電話番号は数字とハイフンのみ使用できます';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // バリデーション実行
    if (!validate()) {
      return;
    }

    try {
      await createMutation.mutate({
        formId: 'customer_form',
        answerData: formData,
      });
      alert('作成成功');
    } catch (error) {
      alert(`エラー: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          value={formData.customer_name}
          onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
          required
        />
        {errors.customer_name && <span style={{ color: 'red' }}>{errors.customer_name}</span>}
      </div>

      <div>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        {errors.email && <span style={{ color: 'red' }}>{errors.email}</span>}
      </div>

      <button type="submit" disabled={createMutation.isLoading}>
        作成
      </button>
    </form>
  );
}
```

### 2. サーバー側バリデーション（スクリプト）

```javascript
// ON_CREATE トリガー

// メールアドレスの重複チェック
const existingCustomers = api.getRecords('customer_form');
const duplicate = existingCustomers.find(c =>
  c.fields.email === record.email
);

if (duplicate) {
  console.error('メールアドレス重複:', record.email);
  throw new Error(`このメールアドレスは既に登録されています: ${record.email}`);
}

// メールアドレス形式チェック
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailPattern.test(record.email)) {
  throw new Error('正しいメールアドレスを入力してください');
}

// 電話番号形式チェック
if (record.phone && !/^[0-9-]+$/.test(record.phone)) {
  throw new Error('電話番号は数字とハイフンのみ使用できます');
}

console.log('バリデーションOK');
```

---

## XSS（クロスサイトスクリプティング）対策

### 1. ユーザー入力のエスケープ

Reactは自動的にXSSを防ぎますが、`dangerouslySetInnerHTML`は使用しないでください。

```tsx
// ✅ 安全（Reactが自動エスケープ）
<div>{record.values.customer_name}</div>

// ❌ 危険（XSSの可能性）
<div dangerouslySetInnerHTML={{ __html: record.values.customer_name }} />
```

### 2. URLのサニタイズ

```tsx
import { useExecutionContext } from '@awll/sdk';

export default function LinkScreen() {
  const context = useExecutionContext();
  const url = context.query.redirectUrl;

  // ✅ 安全なURLのみ許可
  const isValidUrl = (url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' && parsed.host.endsWith('.awll-studio.ai');
    } catch {
      return false;
    }
  };

  if (!isValidUrl(url)) {
    return <div>不正なURLです</div>;
  }

  return <a href={url}>リンク</a>;
}
```

---

## CSRF（クロスサイトリクエストフォージェリ）対策

AWLL Studio APIは自動的にCSRF対策を実装しています。開発者は特別な対応は不要です。

---

## 機密情報の取り扱い

### 1. ログ出力での注意事項

```javascript
// ❌ 機密情報を出力しない
console.log('ユーザー情報:', record); // パスワードが含まれる可能性

// ✅ 必要な情報のみ出力
console.log('顧客名:', record.customer_name);
console.log('メール:', record.email);
```

### 2. APIキーの管理

```tsx
// ❌ ハードコードしない
const API_KEY = 'sk-1234567890abcdef'; // 危険！

// ✅ 環境変数を使用（バックエンドで管理）
// フロントエンドでAPIキーを扱わない設計にする
```

### 3. パスワードの取り扱い

```tsx
// ❌ パスワードをフォームで扱わない
<input type="text" value={password} onChange={...} />

// ✅ パスワードはバックエンドで暗号化
<input
  type="password"
  value={password}
  onChange={...}
  autoComplete="new-password"
/>
```

---

## データアクセス制御

### 1. テナント分離

AWLL Studioは自動的にテナント分離を実装しています。

```tsx
const context = useExecutionContext();

// 自動的に現在のテナントのデータのみ取得
const { data } = useRecords('customer_form');
console.log('テナントID:', context.tenant.id);
```

### 2. レコードレベルのアクセス制御

```javascript
// スクリプトでレコードを取得
const customers = api.getRecords('customer_form');

// 自分が作成したレコードのみフィルタ
const myCustomers = customers.filter(c =>
  c.fields.created_by === userId
);

console.log('自分のレコード数:', myCustomers.length);
```

---

## エラーメッセージ

### 1. エラー情報の露出を最小化

```tsx
// ❌ 詳細なエラーを表示
catch (error) {
  alert(`エラー: ${error.stack}`); // スタックトレースは表示しない
}

// ✅ ユーザーフレンドリーなメッセージ
catch (error) {
  console.error('エラー詳細:', error); // コンソールにのみ記録
  alert('データの取得に失敗しました。しばらくしてから再度お試しください。');
}
```

### 2. エラーハンドリングのベストプラクティス

```tsx
const { data, error, isLoading } = useRecords('customer_form');

if (error) {
  // エラータイプに応じた適切なメッセージ
  let message = 'エラーが発生しました';

  switch (error.type) {
    case 'PERMISSION_DENIED':
      message = 'この操作を実行する権限がありません';
      break;
    case 'NOT_FOUND':
      message = 'データが見つかりません';
      break;
    case 'NETWORK_ERROR':
      message = 'ネットワークエラーが発生しました';
      break;
    default:
      message = 'データの取得に失敗しました';
  }

  return <div>{message}</div>;
}
```

---

## セキュアコーディング チェックリスト

### 画面開発

- [ ] `useExecutionContext()`で現在のユーザー情報を確認している
- [ ] ロールベースのアクセス制御を実装している
- [ ] ユーザー入力をバリデーションしている
- [ ] `dangerouslySetInnerHTML`を使用していない
- [ ] エラーメッセージに機密情報を含めていない
- [ ] APIキーをハードコードしていない

### スクリプト開発

- [ ] 権限チェックのエラーハンドリングを実装している
- [ ] ユーザー入力をサーバー側でバリデーションしている
- [ ] 機密情報をログ出力していない
- [ ] 無限ループを作っていない
- [ ] 大量のレコードを一度に処理していない

---

## インシデント対応

セキュリティインシデントを発見した場合：

1. **即座に管理者に報告**
2. **影響範囲を特定**
3. **ログを確認**（サーバーログでエラー・警告を検索）
4. **必要に応じてアクセスを一時停止**

---

## 参考資料

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Screen Development](./screen-development.md)
- [Script Development](./script-development.md)
- [Data Structures](./data-structures.md)

---

**注意**: セキュリティは継続的な取り組みです。定期的にこのドキュメントを見直し、最新のベストプラクティスに従ってください。
