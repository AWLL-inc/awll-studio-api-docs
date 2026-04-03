# SDK エラー分類表

**Issue**: #435 P1-6
**Last Updated**: 2026-01-10
**Status**: v1.1.0

このドキュメントは、AWLL SDK で使用されるエラータイプとエラーコードの完全な分類表です。

---

## 📋 目次

1. [エラー分類概要](#エラー分類概要)
2. [エラータイプ一覧](#エラータイプ一覧)
3. [エラーコード対応表](#エラーコード対応表)
4. [使用ガイドライン](#使用ガイドライン)
5. [サーバー↔クライアント対応](#サーバークライアント対応)

---

## エラー分類概要

### エラー構造

```typescript
interface AwllError {
  type: AwllErrorType;        // エラーカテゴリ（閉集合）
  message: string;            // ユーザー向けメッセージ
  code: string;               // 機械可読コード（閉集合）
  errors?: FieldValidationError[];  // フィールド検証エラー（VALIDATION_ERROR時）
  requiredPermission?: string;      // 必要な権限（PERMISSION_ERROR時）
  resource?: {                      // リソース情報（NOT_FOUND時）
    type: string;
    id: string;
  };
  ruleId?: string;                  // ルールID（RULE_EXECUTION_ERROR時）
  ruleName?: string;                // ルール名（RULE_EXECUTION_ERROR時）
  traceId?: string;                 // トレースID（デバッグ用）
  statusCode?: number;              // HTTPステータスコード
  details?: unknown;                // 追加詳細情報
}
```

### 設計原則

1. **閉集合化**: `type`と`code`は事前定義された値のみ使用
2. **一貫性**: すべてのthrow経路で統一されたエラー形式
3. **デバッグ性**: `traceId`と`command`を含めて追跡可能に
4. **国際化対応**: `message`は動的生成可能、`code`で識別

---

## エラータイプ一覧

### 1. VALIDATION_ERROR

**説明**: 入力データの検証エラー
**HTTP Status**: 400 Bad Request
**リトライ可否**: ❌ 不可（データ修正が必要）

**使用場面**:
- データベースフィールドのバリデーション失敗
- 必須項目の欠落
- データ型の不一致
- ビジネスルールの違反

**エラーコード**:

| コード | 説明 | 例 |
|--------|------|-----|
| `VALIDATION_ERROR` | 汎用検証エラー | - |
| `REQUIRED_FIELD_MISSING` | 必須項目欠落 | `name`フィールドが空 |
| `INVALID_FORMAT` | 不正なフォーマット | メールアドレス形式エラー |
| `VALUE_OUT_OF_RANGE` | 値が範囲外 | 年齢が0未満または150超 |
| `INVALID_TYPE` | データ型エラー | 数値フィールドに文字列 |

**例**:
```typescript
{
  type: 'VALIDATION_ERROR',
  message: '入力データに誤りがあります',
  code: 'REQUIRED_FIELD_MISSING',
  errors: [
    { field: 'name', message: '名前は必須です', code: 'REQUIRED' },
    { field: 'email', message: 'メールアドレスの形式が不正です', code: 'INVALID_FORMAT' }
  ]
}
```

---

### 2. PERMISSION_ERROR

**説明**: 権限不足エラー
**HTTP Status**: 403 Forbidden
**リトライ可否**: ❌ 不可（権限付与が必要）

**使用場面**:
- ユーザーが操作権限を持たない
- ロールベースアクセス制御(RBAC)の拒否
- テナント間のアクセス制御違反

**エラーコード**:

| コード | 説明 | 例 |
|--------|------|-----|
| `PERMISSION_DENIED` | 汎用権限エラー | - |
| `INSUFFICIENT_ROLE` | ロール不足 | ADMIN権限が必要 |
| `RESOURCE_ACCESS_DENIED` | リソースアクセス拒否 | 他テナントのデータ |
| `OPERATION_NOT_ALLOWED` | 操作不許可 | 削除権限なし |

**例**:
```typescript
{
  type: 'PERMISSION_ERROR',
  message: 'この操作を実行する権限がありません',
  code: 'INSUFFICIENT_ROLE',
  requiredPermission: 'FORM_DELETE',
  resource: { type: 'FORM', id: 'CUSTOMER_FORM' }
}
```

---

### 3. RULE_EXECUTION_ERROR

**説明**: ビジネスルール実行エラー
**HTTP Status**: 422 Unprocessable Entity
**リトライ可否**: ❌ 不可（ルール条件の修正が必要）

**使用場面**:
- 計算式エラー
- 条件分岐の失敗
- 自動採番ルールのエラー

**エラーコード**:

| コード | 説明 | 例 |
|--------|------|-----|
| `RULE_EXECUTION_FAILED` | ルール実行失敗 | - |
| `CALCULATION_ERROR` | 計算エラー | ゼロ除算 |
| `CONDITION_NOT_MET` | 条件不一致 | IF条件が偽 |
| `AUTO_NUMBER_EXHAUSTED` | 自動採番枯渇 | 連番上限到達 |

**例**:
```typescript
{
  type: 'RULE_EXECUTION_ERROR',
  message: '計算ルールの実行に失敗しました',
  code: 'CALCULATION_ERROR',
  ruleId: 'CALC_001',
  ruleName: '合計金額計算',
  details: { expression: 'price * quantity', error: 'Division by zero' }
}
```

---

### 4. CONFLICT_ERROR

**説明**: データ競合エラー
**HTTP Status**: 409 Conflict
**リトライ可否**: ⚠️ 条件付き可（最新データ取得後）

**使用場面**:
- 楽観的ロック違反
- 一意制約違反
- 同時更新の検出

**エラーコード**:

| コード | 説明 | 例 |
|--------|------|-----|
| `CONFLICT` | 汎用競合エラー | - |
| `OPTIMISTIC_LOCK_ERROR` | 楽観的ロックエラー | バージョン不一致 |
| `DUPLICATE_KEY` | 重複キー | 一意制約違反 |
| `CONCURRENT_MODIFICATION` | 同時更新 | 他ユーザーが更新中 |

**例**:
```typescript
{
  type: 'CONFLICT_ERROR',
  message: 'データが他のユーザーによって更新されています',
  code: 'OPTIMISTIC_LOCK_ERROR',
  resource: { type: 'RECORD', id: 'rec-12345' },
  details: { expectedVersion: 5, actualVersion: 6 }
}
```

---

### 5. NOT_FOUND

**説明**: リソース未検出エラー
**HTTP Status**: 404 Not Found
**リトライ可否**: ❌ 不可（リソースが存在しない）

**使用場面**:
- データベース定義が見つからない
- レコードIDが存在しない
- 画面コードが無効

**エラーコード**:

| コード | 説明 | 例 |
|--------|------|-----|
| `NOT_FOUND` | 汎用未検出エラー | - |
| `FORM_NOT_FOUND` | データベース未検出 | formId不正 |
| `RECORD_NOT_FOUND` | レコード未検出 | recordId不正 |
| `SCREEN_NOT_FOUND` | 画面未検出 | screenCode不正 |

**例**:
```typescript
{
  type: 'NOT_FOUND',
  message: '指定されたレコードが見つかりません',
  code: 'RECORD_NOT_FOUND',
  resource: { type: 'RECORD', id: 'rec-99999' }
}
```

---

### 6. NETWORK_ERROR

**説明**: ネットワーク通信エラー
**HTTP Status**: 503 Service Unavailable
**リトライ可否**: ✅ 可（エクスポネンシャルバックオフ推奨）

**使用場面**:
- ホストとの通信失敗
- タイムアウト以外のネットワーク障害
- iframe外での実行

**エラーコード**:

| コード | 説明 | 例 |
|--------|------|-----|
| `NETWORK_ERROR` | 汎用ネットワークエラー | - |
| `CONNECTION_FAILED` | 接続失敗 | ホスト応答なし |
| `NOT_IN_IFRAME` | iframe外実行 | 通常ウィンドウで実行 |
| `ORIGIN_MISMATCH` | Origin不一致 | CORS拒否 |

**例**:
```typescript
{
  type: 'NETWORK_ERROR',
  message: 'ネットワーク通信に失敗しました',
  code: 'CONNECTION_FAILED',
  traceId: 'trace-abc123'
}
```

---

### 7. INTERNAL_ERROR

**説明**: 内部エラー
**HTTP Status**: 500 Internal Server Error
**リトライ可否**: ⚠️ 条件付き可（一時的障害の場合）

**使用場面**:
- プログラムバグ
- 予期しない例外
- システム障害

**エラーコード**:

| コード | 説明 | 例 |
|--------|------|-----|
| `INTERNAL_ERROR` | 汎用内部エラー | - |
| `UNKNOWN_ERROR` | 不明なエラー | キャッチできない例外 |
| `DATABASE_ERROR` | データベースエラー | DB接続失敗 |
| `SYSTEM_ERROR` | システムエラー | メモリ不足 |

**例**:
```typescript
{
  type: 'INTERNAL_ERROR',
  message: '内部エラーが発生しました',
  code: 'DATABASE_ERROR',
  traceId: 'trace-xyz789',
  details: { originalError: 'Connection timeout' }
}
```

---

### 8. TIMEOUT

**説明**: タイムアウトエラー
**HTTP Status**: 504 Gateway Timeout
**リトライ可否**: ✅ 可（リトライ機能使用推奨）

**使用場面**:
- リクエストがタイムアウト（デフォルト15秒）
- 長時間実行操作の中断

**エラーコード**:

| コード | 説明 | 例 |
|--------|------|-----|
| `REQUEST_TIMEOUT` | リクエストタイムアウト | 15秒超過 |
| `OPERATION_TIMEOUT` | 操作タイムアウト | 長時間処理 |

**例**:
```typescript
{
  type: 'TIMEOUT',
  message: 'リクエストがタイムアウトしました（15秒）',
  code: 'REQUEST_TIMEOUT',
  traceId: 'trace-timeout123',
  details: { timeout: 15000, command: 'GET_RECORDS_REQUEST' }
}
```

---

### 9. CANCELLED

**説明**: キャンセルエラー（P1-3で追加）
**HTTP Status**: 499 Client Closed Request
**リトライ可否**: ❌ 不可（ユーザーによるキャンセル）

**使用場面**:
- ユーザーによる明示的なキャンセル
- 画面遷移によるリクエスト中断
- コンポーネントアンマウント時の自動キャンセル

**エラーコード**:

| コード | 説明 | 例 |
|--------|------|-----|
| `REQUEST_CANCELLED` | リクエストキャンセル | abort()呼び出し |
| `COMPONENT_UNMOUNTED` | コンポーネントアンマウント | 画面遷移 |

**例**:
```typescript
{
  type: 'CANCELLED',
  message: 'リクエストがキャンセルされました',
  code: 'REQUEST_CANCELLED',
  traceId: 'trace-cancel456'
}
```

---

### 10. PROTOCOL_VERSION_MISMATCH

**説明**: プロトコルバージョン不一致エラー
**HTTP Status**: 426 Upgrade Required
**リトライ可否**: ❌ 不可（SDK更新が必要）

**使用場面**:
- SDK バージョンとホストの不一致
- 互換性のないプロトコルバージョン

**エラーコード**:

| コード | 説明 | 例 |
|--------|------|-----|
| `PROTOCOL_VERSION_MISMATCH` | バージョン不一致 | SDK 1.0 vs Host 2.0 |
| `SDK_UPDATE_REQUIRED` | SDK更新必要 | 旧バージョンSDK |

**例**:
```typescript
{
  type: 'PROTOCOL_VERSION_MISMATCH',
  message: 'SDKのバージョンが古いため更新が必要です',
  code: 'SDK_UPDATE_REQUIRED',
  details: { sdkVersion: '1.0.0', requiredVersion: '2.0.0' }
}
```

---

### 11. COMMAND_NOT_ALLOWED

**説明**: コマンド不許可エラー
**HTTP Status**: 405 Method Not Allowed
**リトライ可否**: ❌ 不可（コマンドが無効）

**使用場面**:
- 未対応のコマンド
- コンテキストで許可されていないコマンド

**エラーコード**:

| コード | 説明 | 例 |
|--------|------|-----|
| `COMMAND_NOT_ALLOWED` | コマンド不許可 | - |
| `UNKNOWN_COMMAND` | 未知のコマンド | 存在しないコマンド |
| `DISABLED_COMMAND` | 無効化コマンド | 機能フラグOFF |

**例**:
```typescript
{
  type: 'COMMAND_NOT_ALLOWED',
  message: 'このコマンドは許可されていません',
  code: 'UNKNOWN_COMMAND',
  details: { command: 'INVALID_COMMAND' }
}
```

---

## エラーコード対応表

### クライアント側（SDK）で生成されるエラー

| type | code | 発生箇所 | 説明 |
|------|------|----------|------|
| `NETWORK_ERROR` | `NOT_IN_IFRAME` | `postMessage.ts` | iframe外で実行 |
| `NETWORK_ERROR` | `CONNECTION_FAILED` | `postMessage.ts` | ホスト接続失敗 |
| `TIMEOUT` | `REQUEST_TIMEOUT` | `requestManager.ts` | タイムアウト |
| `CANCELLED` | `REQUEST_CANCELLED` | `requestManager.ts` | キャンセル |
| `INTERNAL_ERROR` | `UNKNOWN_ERROR` | `hooks/*.ts` | 予期しない例外 |
| `NETWORK_ERROR` | `REQUEST_MANAGER_DESTROYED` | `requestManager.ts` | マネージャー破棄 |

### サーバー側（Host）から返されるエラー

| type | code | HTTPステータス | 説明 |
|------|------|----------------|------|
| `VALIDATION_ERROR` | `*` | 400 | 検証エラー |
| `PERMISSION_ERROR` | `*` | 403 | 権限エラー |
| `NOT_FOUND` | `*` | 404 | 未検出 |
| `CONFLICT_ERROR` | `*` | 409 | 競合 |
| `RULE_EXECUTION_ERROR` | `*` | 422 | ルール実行失敗 |
| `INTERNAL_ERROR` | `*` | 500 | 内部エラー |

---

## 使用ガイドライン

### 1. エラーの throw 方法

**推奨パターン**:
```typescript
// ✅ GOOD: 定義済みのtypeとcodeを使用
throw {
  type: 'VALIDATION_ERROR',
  message: '名前は必須です',
  code: 'REQUIRED_FIELD_MISSING',
  errors: [{ field: 'name', message: '名前は必須です', code: 'REQUIRED' }]
} as AwllError;

// ❌ BAD: 未定義のtypeやcode
throw {
  type: 'MY_CUSTOM_ERROR', // 型定義にない
  code: 'SOME_CODE',
  message: 'Error'
} as AwllError;
```

### 2. エラーの正規化

すべてのキャッチ箇所で`normalizeError()`を使用：

```typescript
function normalizeError(err: unknown): AwllError {
  // Already an AwllError
  if (isAwllError(err)) {
    return err;
  }

  // Standard Error
  if (err instanceof Error) {
    return {
      type: 'INTERNAL_ERROR',
      message: err.message,
      code: 'UNKNOWN_ERROR',
    };
  }

  // Fallback
  return {
    type: 'INTERNAL_ERROR',
    message: 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
  };
}
```

### 3. traceId の付与

すべてのエラーに`traceId`を含める：

```typescript
const traceId = generateTraceId();

try {
  // ...
} catch (err) {
  const awllError = normalizeError(err);
  awllError.traceId = traceId;
  throw awllError;
}
```

### 4. ログ出力

**P1-7で整備予定**:
- `console.error`のみを使用
- `traceId`と`command`を含める
- ログレベル制御対応

```typescript
console.error('[SDK] useRecords error:', {
  type: error.type,
  code: error.code,
  message: error.message,
  traceId: error.traceId,
  command: 'GET_RECORDS_REQUEST'
});
```

---

## サーバー↔クライアント対応

### エラー変換フロー

```
[Backend] → [Host messageHandler] → [SDK requestManager] → [SDK Hooks] → [User Code]
   ↓              ↓                      ↓                   ↓              ↓
DB Error    ErrorPayload         AwllError           normalizeError    AwllError
```

### Backend → Host 変換例

```kotlin
// Backend (Kotlin)
throw ValidationException("名前は必須です", field = "name")

// ↓ Host messageHandlerで変換

// Host (TypeScript)
const errorPayload: ErrorPayload = {
  status: 'error',
  error: {
    code: 'REQUIRED_FIELD_MISSING',
    name: 'ValidationError',
    message: '名前は必須です',
    details: { field: 'name' }
  }
};
```

### Host → SDK 変換

```typescript
// requestManager.ts (SDK側)
const error: AwllError = {
  type: (payload.error.code as AwllError['type']) || 'INTERNAL_ERROR',
  message: payload.error.message,
  code: payload.error.code,
  details: payload.error.details,
};
```

---

## 変更履歴

- **2026-01-10**: 初版作成（P1-6）
  - 全11種類のエラータイプを定義
  - エラーコード対応表を作成
  - 使用ガイドラインを整備
  - `CANCELLED`タイプを追加（P1-3）

---

## 関連ドキュメント

- [README.md](../README.md) - SDK概要
- [SECURITY-TRUST-BOUNDARIES.md](../SECURITY-TRUST-BOUNDARIES.md) - セキュリティ設計
- [types/index.ts](../types/index.ts) - 型定義
- [sdk-remaining-tasks.md](../../../../issue/sdk-remaining-tasks.md) - 残課題

---

**Last Updated**: 2026-01-10
**Version**: 1.1.0 (P1タスク完了版)
