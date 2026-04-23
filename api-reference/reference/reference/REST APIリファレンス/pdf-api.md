# PDF API

PDF帳票の生成API。Thymeleafテンプレートにデータを流し込んでPDFを生成し、署名付きURLで返却します。

## POST /api/v1/pdf/generate

PDF帳票を生成し、ダウンロード用の署名付きURLを返却します。

### リクエスト

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| templateName | string | ✅ | テンプレート名（英小文字・数字・ハイフンのみ） |
| variables | object | - | テンプレートに渡す変数 |
| fileName | string | - | ダウンロード時のファイル名（拡張子なし、最大100文字） |

### リクエスト例

```json
{
  "templateName": "generic-report",
  "variables": {
    "title": "月次レポート",
    "items": [
      { "name": "売上", "value": "1,000,000円" },
      { "name": "経費", "value": "500,000円" }
    ]
  },
  "fileName": "monthly-report-2026-04"
}
```

### レスポンス

| フィールド | 型 | 説明 |
|-----------|-----|------|
| downloadUrl | string | ダウンロード用の署名付きURL（15分有効） |
| key | string | ストレージオブジェクトキー |
| expiresAt | string | URL有効期限（ISO 8601） |

### レスポンス例

```json
{
  "downloadUrl": "https://...",
  "key": "pdf/tenant/2026/04/report.pdf",
  "expiresAt": "2026-04-06T10:15:00Z"
}
```

### エラーレスポンス

| ステータス | 説明 |
|-----------|------|
| 400 | バリデーションエラー（テンプレート名不正等） |
| 401 | 認証エラー |
| 404 | テンプレートが存在しない |
| 500 | PDF生成エラー |

### 権限

USER または ADMIN ロールが必要です。
