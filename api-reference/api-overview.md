# API 概要

## エンドポイント一覧

**API Base URL**: `https://api.awll-studio.ai`

### 認証

| Method | Path | 説明 | 認証 |
|--------|------|------|------|
| POST | `/api/auth/token` | トークン取得（email + password） | 不要 |
| POST | `/api/auth/token/refresh` | トークン更新（refreshToken） | 不要 |
| GET | `/api/auth/me` | 現在のユーザー情報・ロール・テナントを取得 | 必要 |
| GET | `/api/auth/available-tenants` | 所属テナント一覧を取得 | 必要 |

### データベース定義（Forms）

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/v1/forms` | データベース一覧（ページネーション対応） |
| POST | `/api/v1/forms` | データベースを作成 |
| GET | `/api/v1/forms/{formId}` | データベースの詳細を取得 |
| PUT | `/api/v1/forms/{formId}` | データベースを更新 |
| DELETE | `/api/v1/forms/{formId}` | データベースを削除 |
| GET | `/api/v1/forms/{formId}/published` | 公開済みバージョンを取得 |
| GET | `/api/v1/forms/{formId}/versions` | バージョン履歴を取得 |
| GET | `/api/v1/forms/{formId}/versions/{version}` | 特定バージョンを取得 |
| GET | `/api/v1/forms/{formId}/answer-summaries` | REFERENCE フィールド用のサマリー取得 |
| GET | `/api/v1/forms/{formId}/public-settings` | 公開フォーム設定を取得 |
| PATCH | `/api/v1/forms/{formId}/public-settings` | 公開フォーム設定を更新 |

### レコード（Form Answers）

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/v1/forms/{formId}/answers` | レコード一覧（ページネーション・検索対応） |
| POST | `/api/v1/forms/{formId}/answers` | レコードを作成 |
| GET | `/api/v1/forms/{formId}/answers/{answerId}` | レコードの詳細を取得 |
| PUT | `/api/v1/forms/{formId}/answers/{answerId}` | レコードを全体更新 |
| PATCH | `/api/v1/forms/{formId}/answers/{answerId}` | レコードを部分更新（楽観ロック付き） |
| DELETE | `/api/v1/forms/{formId}/answers/{answerId}` | レコードを削除 |
| POST | `/api/v1/forms/{formId}/answers/{answerId}/copy` | レコードを複製 |
| POST | `/api/v1/forms/{formId}/answers/bulk` | レコードを一括作成/更新 |
| POST | `/api/v1/forms/{formId}/answers/bulk-delete` | レコードを一括削除 |
| POST | `/api/v1/forms/{formId}/answers/export` | CSV出力（ZIP形式） |

### 階層データ（Nodes）

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/answers/{answerId}/nodes` | 全ノードを取得 |
| GET | `/api/answers/{answerId}/nodes/{rowId}` | ノードを取得（祖先パス含む） |
| POST | `/api/answers/{answerId}/nodes` | 子ノードを作成 |
| PUT | `/api/answers/{answerId}/nodes/{rowId}` | ノードを更新 |
| DELETE | `/api/answers/{answerId}/nodes/{rowId}` | ノードを削除（子孫も削除） |
| POST | `/api/answers/{answerId}/nodes/{rowId}/copy` | ノードを複製 |

### 画面定義（Screens）

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/v1/screens` | 画面一覧 |
| POST | `/api/v1/screens` | 画面を作成 |
| GET | `/api/v1/screens/{screenId}` | 画面の詳細を取得 |
| PUT | `/api/v1/screens/{screenId}` | 画面を更新 |
| DELETE | `/api/v1/screens/{screenId}` | 画面を削除 |
| GET | `/api/v1/screens/{screenId}/published` | 公開済み画面を取得 |
| POST | `/api/v1/screens/{screenId}/publish` | 画面を公開 |
| POST | `/api/v1/screens/{screenId}/deploy` | 画面をデプロイ |
| POST | `/api/v1/screens/{screenId}/rollback` | 前バージョンにロールバック |
| GET | `/api/v1/screens/{screenId}/versions` | バージョン履歴を取得 |
| GET | `/api/v1/screens/{screenId}/deployments` | デプロイ履歴を取得 |

### 検索

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/search/advanced` | 高度検索（複合フィルタ・ページネーション） |
| POST | `/api/search/fulltext` | 全文検索 |
| POST | `/api/search/faceted` | ファセット検索（カテゴリ別集計） |
| POST | `/api/search/range` | 範囲検索（数値・日付） |
| GET | `/api/search/statistics` | 検索統計情報 |

### 集計

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/aggregates/count` | COUNT |
| POST | `/api/aggregates/sum` | SUM |
| POST | `/api/aggregates/average` | AVERAGE |
| POST | `/api/aggregates/max` | MAX |
| POST | `/api/aggregates/min` | MIN |
| POST | `/api/aggregates/group-by` | GROUP BY（グループ別集計） |

### メール送信

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/v1/mail/send` | メール送信（SES経由、ADMIN/DEVELOPER権限） |
| GET | `/api/v1/mail/usage` | テナント月次メール使用量取得（ADMIN権限） |
| GET | `/api/v1/mail/usage/all` | 全テナント月次メール使用量取得（SUPER_ADMIN権限） |

### スクリプトルール（Admin）

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/admin/script-rules` | ルール作成 |
| GET | `/api/admin/script-rules` | ルール一覧取得 |
| GET | `/api/admin/script-rules/{ruleId}` | ルール取得 |
| PUT | `/api/admin/script-rules/{ruleId}` | ルール更新（楽観ロック） |
| DELETE | `/api/admin/script-rules/{ruleId}` | ルール削除 |
| POST | `/api/admin/script-rules/{ruleId}/execute` | テスト実行 |
| POST | `/api/admin/script-rules/execute` | データベースルール一括実行 |
| POST | `/api/admin/script-rules/test` | スクリプト検証 |
| GET | `/api/admin/script-rules/{ruleId}/versions` | バージョン一覧 |
| POST | `.../versions/{versionNumber}/publish` | バージョン公開 |
| POST | `/api/admin/script-rules/{ruleId}/unpublish` | 非公開化 |
| POST | `.../schedule/enable` | スケジュール有効化 |
| POST | `.../schedule/disable` | スケジュール無効化 |
| POST | `.../schedule/trigger` | 即時実行 |
| GET | `.../schedule/state` | スケジュール状態取得 |
| GET | `/api/admin/script-rules/{ruleId}/executions` | 実行履歴一覧 |
| GET | `.../executions/{logId}` | 実行履歴詳細 |

### ボタンクリックアクション

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/v1/forms/{formId}/answers/{answerId}/actions/{actionId}` | ON_BUTTON_CLICKルール実行 |

### メニュー

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/v1/menu` | サイドバーメニューを取得 |
| PUT | `/api/v1/menu` | サイドバーメニューを更新 |

### Webhook

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/v1/webhooks` | Webhook一覧 |
| POST | `/api/v1/webhooks` | Webhookを作成 |
| GET | `/api/v1/webhooks/{webhookId}` | Webhookの詳細を取得 |
| PUT | `/api/v1/webhooks/{webhookId}` | Webhookを更新 |
| DELETE | `/api/v1/webhooks/{webhookId}` | Webhookを削除 |
| POST | `/api/v1/webhooks/{webhookId}/test` | Webhookをテスト送信 |

### データベース権限

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/v1/permissions/databases/{databaseId}/check` | 現在のユーザーの権限を確認 |
| GET | `/api/v1/permissions/databases/{databaseId}/users` | データベースの権限付きユーザー一覧 |
| GET | `/api/v1/permissions/users/{userId}/databases` | ユーザーのデータベース権限一覧 |
| GET | `/api/v1/permissions/users/search` | ユーザー検索（権限付与UI用） |
| POST | `/api/v1/permissions/grant` | 権限を付与 |
| DELETE | `/api/v1/permissions/revoke` | 権限を取り消し |

### ユーザー

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/v1/users` | ユーザー一覧 |
| GET | `/api/v1/users/summary` | ユーザーサマリー（USER フィールド用） |
| POST | `/api/v1/users/me/password` | パスワード変更 |

---

## データ構造

### レコード（FormAnswer）の構造

```json
{
  "tenantId": "your-tenant",
  "formId": "customer-db",
  "answerId": "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  "version": 3,
  "versionUlid": "01ARZ3NDEKTSV4RRFFQ69G5FAW",
  "answerData": {
    "name": "株式会社ABC",
    "email": "info@abc.co.jp",
    "status": "取引中",
    "deals": [
      {
        "deal_name": "案件A",
        "amount": 1500000,
        "stage": "提案中"
      }
    ]
  },
  "state": "ACTIVE",
  "createdAt": "2026-03-16T09:00:00Z",
  "updatedAt": "2026-03-16T10:30:00Z",
  "createdBy": "user-uuid",
  "updatedBy": "user-uuid"
}
```

### フィールド型

| 型 | 説明 | 値の例 |
|----|------|--------|
| TEXT | テキスト | `"株式会社ABC"` |
| NUMBER | 数値 | `1500000` |
| DATE | 日付（日時） | `"2026-03-16"` or `"2026-03-16T09:00:00Z"` |
| SELECT | 単一選択 | `"取引中"` |
| CHECKBOX | 複数選択 | `["オプションA", "オプションB"]` |
| MARKDOWN | リッチテキスト | `"# 見出し\n本文..."` |
| ARRAY | 配列（サブテーブル） | `[{"name": "行1"}, {"name": "行2"}]` |
| REFERENCE | 他データベースへの参照 | `"ANSWER#01ARZ3..."` |
| CALCULATED | 自動計算 | （自動算出。入力不要） |
| USER | ユーザー選択 | `"user-uuid"` |
| FILE | ファイル添付 | （ファイルメタデータ） |

### 楽観ロック（PATCH）

部分更新時は `If-Match` ヘッダーに現在の `versionUlid` を指定してください。

```bash
# 競合がない場合: 200 OK（更新成功）
# 競合がある場合: 412 Precondition Failed（再取得が必要）
curl -X PATCH \
  -H "If-Match: \"01ARZ3NDEKTSV4RRFFQ69G5FAW\"" \
  -d '{"patches": [{"op": "replace", "path": "/name", "value": "新しい名前"}]}'
```
