# PDF帳票ダウンロード

画面SDKからPDF帳票を生成・ダウンロードする機能です。

## 概要

Thymeleafテンプレートにデータを流し込んでPDFを生成し、ブラウザでダウンロードします。

## 使い方

### postMessage API

画面（Screen）のJavaScriptから `postMessage` でPDF生成をリクエストします。

```typescript
// PDF生成リクエスト
window.parent.postMessage({
  type: 'GENERATE_PDF_REQUEST',
  payload: {
    templateName: 'generic-report',
    variables: {
      title: '月次レポート',
      items: [
        { name: '売上', value: '1,000,000円' },
        { name: '経費', value: '500,000円' }
      ]
    },
    fileName: 'monthly-report'  // 省略時はテンプレート名
  }
}, '*');
```

### レスポンス

```typescript
window.addEventListener('message', (event) => {
  if (event.data.type === 'GENERATE_PDF_RESPONSE') {
    const { downloadUrl, key, expiresAt } = event.data.payload;
    // downloadUrl をブラウザで開くとPDFがダウンロードされます
    window.open(downloadUrl, '_blank');
  }
});
```

## 型定義

```typescript
interface GeneratePdfRequestPayload {
  /** テンプレート名（templates/pdf/ 配下、拡張子なし） */
  templateName: string;
  /** テンプレートに渡す変数 */
  variables: Record<string, unknown>;
  /** ダウンロード時のファイル名（拡張子なし、省略時はテンプレート名） */
  fileName?: string;
}

interface GeneratePdfResponsePayload {
  /** ダウンロード用の署名付きURL（15分有効） */
  downloadUrl: string;
  /** ストレージオブジェクトキー */
  key: string;
  /** URL有効期限（ISO 8601） */
  expiresAt: string;
}
```

## テンプレート

テンプレートは `resources/templates/pdf/` 配下にThymeleaf HTML形式で配置します。
テンプレート名には英小文字・数字・ハイフンのみ使用可能です。

### 組み込みテンプレート

| テンプレート名 | 説明 |
|---------------|------|
| `generic-report` | 汎用レポート（タイトル、テーブル、フッター） |

## 制約事項

- ダウンロードURLの有効期限: 15分
- テンプレート名: 英小文字・数字・ハイフンのみ（パストラバーサル防止）
- ファイル名: 最大100文字
