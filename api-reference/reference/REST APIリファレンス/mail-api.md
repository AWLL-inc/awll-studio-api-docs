# メール送信 API

## 概要

メール送信・使用量管理API。テンプレート変数による動的な件名・本文の生成、送信履歴の記録、月次使用量の集計を提供します。

**ベースパス**: `/api/v1/mail`

---

## エンドポイント一覧

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| POST | `/api/v1/mail/send` | メール送信 | ADMIN / DEVELOPER |
| GET | `/api/v1/mail/usage` | テナント月次使用量取得 | ADMIN |
| GET | `/api/v1/mail/usage/all` | 全テナント月次使用量取得 | SUPER_ADMIN |

---

## POST /api/v1/mail/send

メールを送信します。テンプレート変数（`{{key}}` 形式）を使用して、件名・本文を動的に生成できます。送信履歴は自動的に記録されます。

### リクエスト

```json
{
  "to": "user@example.com",
  "subject": "{{customer_name}}様へのご連絡",
  "body": "{{customer_name}}様\n\nいつもお世話になっております。\n\n{{message}}",
  "templateVariables": {
    "customer_name": "山田太郎",
    "message": "新商品のご案内です。"
  }
}
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|------|--------------|------|
| to | string | Yes | `@Email` | 送信先メールアドレス |
| subject | string | Yes | 最大200文字 | メール件名（テンプレート変数使用可） |
| body | string | Yes | 最大10,000文字 | メール本文（テンプレート変数使用可） |
| templateVariables | object | No | - | テンプレート変数（`{{key}}` → value に置換） |

### レスポンス

**200 OK** — 送信処理完了（成功/失敗は `status` で判定）

```json
{
  "messageId": "9322270b-4164-485c-b65b-440ff9ecb85e",
  "status": "SENT",
  "error": null
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| messageId | string | メッセージID（UUID） |
| status | string | `SENT`（成功）/ `FAILED`（失敗） |
| error | string? | エラーメッセージ（失敗時のみ） |

### エラーレスポンス

| コード | 説明 |
|--------|------|
| 400 | バリデーションエラー（メールアドレス不正、件名/本文が空 等） |
| 401 | 認証エラー |
| 403 | 権限不足（ADMIN / DEVELOPER 権限が必要） |

### テンプレート変数

件名・本文内の `{{key}}` がテンプレート変数として認識され、`templateVariables` の対応する値に置換されます。

```
件名: "{{customer_name}}様へのご連絡"
templateVariables: { "customer_name": "山田太郎" }
→ 結果: "山田太郎様へのご連絡"
```

- 未定義のキーはそのまま残ります（`{{undefined_key}}` → `{{undefined_key}}`）
- 同一キーが複数箇所にあれば全て置換されます

---

## GET /api/v1/mail/usage

テナントのメール送信月次使用量を取得します。

### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| month | string | No | 対象月（`yyyy-MM` 形式、省略時は当月） |

### レスポンス

**200 OK**

```json
{
  "tenantCode": "DEMO",
  "month": "2026-03",
  "sentCount": 150,
  "failedCount": 3
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| tenantCode | string | テナントコード |
| month | string | 対象月（yyyy-MM） |
| sentCount | integer | 送信成功件数 |
| failedCount | integer | 送信失敗件数 |

---

## GET /api/v1/mail/usage/all

全テナントのメール送信月次使用量を取得します（SUPER_ADMIN専用）。

### パラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| month | string | No | 対象月（`yyyy-MM` 形式、省略時は当月） |

### レスポンス

**200 OK**

```json
[
  {
    "tenantCode": "DEMO",
    "month": "2026-03",
    "sentCount": 150,
    "failedCount": 3
  },
  {
    "tenantCode": "TEST",
    "month": "2026-03",
    "sentCount": 42,
    "failedCount": 0
  }
]
```

---

## 送信元アドレス

全てのメールは `noreply@awll-studio.ai` から送信されます（テナント別のカスタム送信元には未対応）。

---

## 制限事項

| 項目 | 制限 |
|------|------|
| 送信先 | 1リクエスト1宛先 |
| 件名 | 最大200文字 |
| 本文 | 最大10,000文字 |
| 送信形式 | テキストメールのみ（HTML未対応） |
| 添付ファイル | 未対応 |

---

**作成日**: 2026-03-24
**関連Issue**: #948
