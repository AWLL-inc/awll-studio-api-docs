# AI API

## 概要

AIテキスト生成、AIチャット（SSEストリーミング）、AI利用同意管理のAPIです。

**ベースパス**: `/api/v1/ai`

---

## エンドポイント一覧

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| POST | `/api/v1/ai/generate` | テキスト生成 | USER / ADMIN |
| GET | `/api/v1/ai/consent` | AI利用同意状態取得 | USER |
| POST | `/api/v1/ai/consent` | AI利用同意を記録 | USER |
| POST | `/api/v1/ai/chat` | AIチャット（SSEストリーミング） | USER |
| GET | `/api/v1/ai/chat/{jobId}/stream` | SSE再接続 | USER |
| GET | `/api/v1/ai/chat/{jobId}/status` | ジョブステータス確認 | USER |
| GET | `/api/v1/ai/conversations` | 会話一覧取得 | USER |
| GET | `/api/v1/ai/conversations/{conversationId}/messages` | 会話メッセージ取得 | USER |
| DELETE | `/api/v1/ai/conversations/{conversationId}` | 会話削除 | USER |
| POST | `/api/v1/ai/chat/{conversationId}/confirm` | Write操作の承認/却下 | USER |
| POST | `/api/v1/ai/upload` | ファイルアップロード（AI用） | USER |
| GET | `/api/v1/ai/health` | AIヘルスチェック | USER |

---

## POST /api/v1/ai/generate

ユーザープロンプトとコンテキストデータを送信し、AIが生成したテキストを取得します。

Screen SDK では [`useAIGenerate()`](../../sdk/screen-sdk-reference.md#useaigenerate) フックでラップされています。

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

### レスポンス (200)

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
| generatedText | string | 生成されたテキスト |
| usage.inputTokens | number | 入力トークン数 |
| usage.outputTokens | number | 出力トークン数 |
| usage.model | string | 使用されたモデル名 |

### レート制限

| 単位 | 上限 |
|------|------|
| ユーザー | 10 回 / 分 |
| テナント | 100 回 / 時 |

### エラーレスポンス

| HTTPコード | 説明 |
|------------|------|
| 400 | バリデーションエラー（prompt 空、10,000文字超） |
| 401 | 認証エラー |
| 429 | レート制限超過 |
| 504 | タイムアウト（120秒） |

---

## GET /api/v1/ai/consent

現在ログイン中のユーザー × テナントの AI利用同意状態を取得します。

### レスポンス (200)

```json
{
  "consented": true,
  "consentedAt": "2026-04-15T09:00:00Z"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| consented | boolean | 同意済みか |
| consentedAt | string / null | 同意日時（ISO 8601）。未同意時は null |

---

## POST /api/v1/ai/consent

現在ログイン中のユーザー × テナントについて AI利用同意を記録します（upsert）。

### リクエスト

ボディ不要（空オブジェクト `{}` または body なし）。

### レスポンス (200)

```json
{
  "consented": true,
  "consentedAt": "2026-04-15T09:00:00Z"
}
```

### エラーレスポンス

| HTTPコード | 説明 |
|------------|------|
| 404 | ユーザーレコードが存在しない |

---

## POST /api/v1/ai/chat

ユーザーメッセージをAIエージェントに送信し、SSEストリーミングでレスポンスを返します。

### リクエスト

```json
{
  "message": "顧客管理データベースを作成して",
  "conversationId": "conv-abc123",
  "requireConfirmation": true,
  "category": "db",
  "pageContext": {
    "pageType": "answer-detail",
    "formId": "01ABC...",
    "answerId": "01DEF..."
  },
  "attachments": [
    {
      "filename": "data.csv",
      "mimeType": "text/csv",
      "size": 1024,
      "content": {
        "type": "text",
        "text": "name,age\n山田,30\n..."
      }
    }
  ],
  "model": "claude-sonnet-4-20250514"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| message | string | Yes | ユーザーメッセージ（最大10,000文字） |
| conversationId | string | No | 既存会話の続きの場合に指定 |
| requireConfirmation | boolean | No | Write操作の確認を要求するか（デフォルト: true） |
| category | string | No | 会話カテゴリ（`db` / `screen` / `script` / `menu` / `default`） |
| pageContext | object | No | 現在のページコンテキスト |
| pageContext.pageType | string | No | ページ種別（`answer-detail` 等） |
| pageContext.formId | string | No | データベースID |
| pageContext.answerId | string | No | レコードID |
| pageContext.rowId | string | No | サブテーブル行ID |
| pageContext.screenId | string | No | 画面ID |
| attachments | array | No | 添付ファイル（最大5件） |
| attachments[].filename | string | Yes | ファイル名 |
| attachments[].mimeType | string | Yes | MIMEタイプ |
| attachments[].size | number | Yes | ファイルサイズ（0〜5MB） |
| attachments[].content.type | string | Yes | `text` / `image` / `document` |
| attachments[].content.text | string | No | テキストコンテンツ（type=text時） |
| attachments[].content.source | object | No | 画像ソース（type=image時、base64） |
| model | string | No | 使用AIモデル（省略時はデフォルト） |

### レスポンス (200) — SSE ストリーム

`Content-Type: text/event-stream`

#### SSEイベント型

| type | 説明 | data |
|------|------|------|
| `text_delta` | テキスト出力 | `{ "text": "..." }` |
| `tool_use_start` | ツール呼び出し開始 | `{ "toolName": "...", "toolId": "..." }` |
| `tool_use_input` | ツール入力 | `{ "toolId": "...", "input": {...} }` |
| `tool_result` | ツール結果 | `{ "toolId": "...", "result": "...", "isError": false, "duration": 1234 }` |
| `thinking` | 思考中 | `{ "thinking": "..." }` |
| `confirmation_required` | 確認待ち | `{ "confirmationId": "...", "toolName": "...", "description": "..." }` |
| `conversation_id` | 会話ID発行 | `{ "conversationId": "..." }` |
| `job_id` | ジョブID発行 | `{ "jobId": "..." }` |
| `error` | エラー | `{ "message": "..." }` |
| `done` | ストリーム完了 | `{}` |

### テナント機能制御

テナント単位でAI機能のON/OFFが制御されます。無効化時はSSEエラーイベント `AI_FEATURE_DISABLED` が送信されます。

### エラーレスポンス

| HTTPコード | 説明 |
|------------|------|
| 400 | バリデーションエラー（メッセージ空、ファイルサイズ超過） |
| 401 | 認証エラー |

---

## GET /api/v1/ai/chat/{jobId}/stream

SSE再接続。途中切断された場合に、指定インデックス以降のイベントを再送します。

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| jobId | string (path) | Yes | ジョブID |
| from | integer (query) | No | 取得開始イベントインデックス（デフォルト: 0） |

---

## GET /api/v1/ai/chat/{jobId}/status

ジョブの処理状態を取得します（ポーリング用）。

### レスポンス (200)

```json
{
  "status": "running"
}
```

| 値 | 説明 |
|----|------|
| `pending` | 処理待ち |
| `running` | 処理中 |
| `completed` | 完了 |
| `error` | エラー |

---

## GET /api/v1/ai/conversations

現在のユーザーの会話一覧を取得します。

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| context | string (query) | No | 会話カテゴリでフィルタ（`db` / `screen` / `script` / `menu`） |

---

## GET /api/v1/ai/conversations/{conversationId}/messages

指定会話のメッセージ履歴を取得します。会話の所有者のみアクセス可能です。

### レスポンス (200)

```json
{
  "messages": [
    {
      "role": "user",
      "content": "顧客管理データベースを作成して",
      "timestamp": "2026-04-15T09:00:00Z"
    },
    {
      "role": "assistant",
      "content": "顧客管理データベースを作成しました...",
      "toolCalls": [...],
      "timestamp": "2026-04-15T09:00:05Z"
    }
  ]
}
```

### エラーレスポンス

| HTTPコード | 説明 |
|------------|------|
| 403 | アクセス権限なし（他ユーザーの会話） |
| 404 | 会話が削除済み |

---

## DELETE /api/v1/ai/conversations/{conversationId}

会話を削除します。会話の所有者のみ削除可能です。

---

## POST /api/v1/ai/chat/{conversationId}/confirm

AIエージェントのWrite操作（データベース作成・レコード更新等）を承認または却下します。

### リクエスト

```json
{
  "confirmationId": "conf-abc123",
  "action": "approve",
  "reason": "問題なし"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| confirmationId | string | Yes | 確認ID（SSEの `confirmation_required` イベントで取得） |
| action | string | Yes | `approve` または `reject` |
| reason | string | No | 理由（却下時など） |

### エラーレスポンス

| HTTPコード | 説明 |
|------------|------|
| 404 | 確認が既に解決済みまたは消失 |

---

## POST /api/v1/ai/upload

ファイルをアップロードしてAI送信用形式に変換します。

### リクエスト

| ヘッダー | 必須 | 説明 |
|---------|------|------|
| Content-Type | Yes | ファイルのMIMEタイプ |
| X-Filename | No | ファイル名 |

Body: ファイルのバイナリデータ

### 制約

- ファイルサイズ上限: 5MB
- サポートされるタイプ: テキスト、画像、PDF

---

## 関連

- Screen SDK: [useAIGenerate()](../../sdk/screen-sdk-reference.md#useaigenerate)
- Screen SDK: [useAIChat — フロントエンド統合](../../sdk/screen-sdk-reference.md)

---

**追加日**: 2026-04-21（PR #1574 — AI Generate）
**更新日**: 2026-04-30（PR #1793 — AIConsent / AIGateway / セキュリティ）
