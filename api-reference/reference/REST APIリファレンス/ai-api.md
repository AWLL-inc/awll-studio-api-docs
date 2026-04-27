# AI生成 API

## 概要

LLM（Anthropic Claude）を用いたテキスト生成API。プロンプトと任意のコンテキストデータを送信すると、バックエンド固定の system prompt と組み合わせて生成結果が返されます。Screen SDK では [`useAIGenerate()`](../画面SDK/screen-sdk-reference.md#useaigenerate) フックでラップされています。

**ベースパス**: `/api/v1/ai`

---

## エンドポイント一覧

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| POST | `/api/v1/ai/generate` | テキスト生成（プロンプト + コンテキスト） | USER / ADMIN |

---

## POST /api/v1/ai/generate

ユーザープロンプトとコンテキストデータを送信し、LLM が生成したテキストを取得します。

### リクエスト

```bash
curl -X POST "${BASE_URL}/api/v1/ai/generate" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Tenant-Code: ${TENANT}" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "prompt": "下記の対象者に対する1on1コメント案を作成してください。",
    "contextData": {
      "targetName": "山田太郎",
      "achievements": "Q4目標達成、新人指導2名"
    }
  }'
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|------|--------------|------|
| prompt | string | Yes | 最大10,000文字 | ユーザープロンプト。**system prompt は含まない** |
| contextData | object | No | 任意のキー/値 | 補助コンテキスト。**user メッセージに追記される**（system prompt には混入しない） |

> **system prompt はバックエンド固定**: API クライアント側からは上書きできない設計です（プロンプトインジェクション防止）。

### レスポンス

**200 OK** — 生成成功

```json
{
  "generatedText": "山田さん、お疲れ様です。Q4目標達成と新人指導お見事でした...",
  "usage": {
    "inputTokens": 169,
    "outputTokens": 50,
    "model": "claude-sonnet-4-20250514"
  }
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| generatedText | string | LLM が生成したテキスト |
| usage.inputTokens | number | 入力トークン数 |
| usage.outputTokens | number | 出力トークン数 |
| usage.model | string | 実際に使用されたモデル名 |

### エラーレスポンス

| HTTPコード | 説明 |
|------------|------|
| 400 | バリデーションエラー（`prompt` が空、10,000文字超 等） |
| 401 | 認証エラー（トークン不正・期限切れ） |
| 403 | 権限不足 |
| 429 | レート制限超過（`RATE_LIMIT` 系エラー） |
| 504 | LLM 応答が120秒以内に返らなかった（タイムアウト） |
| 500 | LLM 呼び出し失敗、その他内部エラー |

### レート制限

| 単位 | 上限 |
|------|------|
| ユーザー | 10 回 / 分 |
| テナント | 100 回 / 時 |

### タイムアウト

120 秒（バックエンド固定）。

### モデル

呼び出し側からモデル指定はできません。バックエンドで既定の Claude モデルを使用します。実際に使用されたモデル名はレスポンスの `usage.model` で確認できます。

### contextData の取り扱い（セキュリティ）

`contextData` は user メッセージに追記される形で LLM に送信されます。**機密情報（給与・個人情報・APIキー等）を渡さないでください**。system prompt は固定なので、機密情報の隔離はできません。

---

## 関連

- SDK ヘルパー: [Screen SDK Reference - useAIGenerate()](../画面SDK/screen-sdk-reference.md#useaigenerate)

**追加日**: 2026-04-21（AWLL-inc/awll-studio PR #1574）
