# Claude Code スキル作成テンプレート

AWLL Studio API を活用する Claude Code スキルの作成方法です。

## スキルとは

Claude Code の `.claude/skills/` に配置する Markdown ファイルで、特定の業務を自動化するための指示書です。
`/コマンド名` で呼び出したり、キーワードに反応して自動発動させることができます。

## スキルの種類

| 種類 | 発動方法 | 例 |
|------|---------|-----|
| **user-invocable** | `/コマンド名` で明示的に呼び出し | `/create-report`, `/update-status` |
| **proactive** | キーワードに反応して自動発動 | API操作時のルール適用 |

## テンプレート: user-invocable スキル

```markdown
---
name: your-skill-name
description: スキルの説明（1行）
type: user-invocable
---

# スキル名

## 概要

このスキルが何をするかの説明。

## 前提条件

- AWLL Studio にログイン済み（`source studio-api.sh && studio_login`）
- 対象データベース: {データベース名}（formId: `{formId}`）

## 実行手順

### Step 1: データ取得

対象のレコードを取得する。

``bash
studio_get "/api/v1/forms/{formId}/answers?limit=100"
``

### Step 2: データ加工

取得したデータを加工する。

### Step 3: 更新

加工したデータを PATCH API で更新する。

``bash
studio_patch "/api/v1/forms/{formId}/answers/{answerId}" @tmp/update.json
``

## 注意事項

- PUT ではなく PATCH を使用すること
- 更新前にバックアップを取得すること
```

## テンプレート: proactive スキル

```markdown
---
name: studio-api-rules
description: AWLL Studio API 操作時のルールを自動適用
type: proactive
match:
  - "AWLL"
  - "awll-studio"
  - "レコード作成"
  - "レコード更新"
  - "formId"
  - "/api/v1/forms"
---

# AWLL Studio API ルール

API 操作時に自動適用されるルール。

## 必須ルール

1. PUT API は原則使用禁止 → PATCH を使う
2. サブレコード操作は Nodes API を使う
3. 更新前にバックアップ取得
```

## スキル設計のベストプラクティス

### 1. 明確なステップ分割

```
Step 1: 現状データの取得（GET）
Step 2: バックアップ保存（tmp/ に保存）
Step 3: データ加工・変換
Step 4: 更新実行（PATCH / Nodes API）
Step 5: 結果確認（GET で検証）
```

### 2. エラーハンドリング

```markdown
## エラー時の対応

- 504 Gateway Timeout → バックアップから復元可能。再試行 or DELETE→POST
- 400 Bad Request → リクエストボディを確認（fieldCode, parentRowId 等）
- 401 Unauthorized → `studio_login` で再認証
```

### 3. 日本語データの扱い

日本語を含む JSON はシェルのインライン文字列ではなく、**ファイル経由**で送信:

```bash
# ❌ インライン（文字化け・構文エラーの原因）
curl -d '{"name": "テスト"}' ...

# ✅ ファイル経由
echo '{"name": "テスト"}' > tmp/data.json
curl -d @tmp/data.json ...
```

### 4. 冪等性の確保

同じスキルを2回実行しても問題が起きないように設計:

```markdown
## 冪等性

- レコード作成前に既存レコードを検索し、重複を防止
- 更新は PATCH で差分のみ → 同じ値で再実行しても問題なし
```

## スキルの配置

```
.claude/skills/
├── studio-api.md              # API操作ルール（proactive）
├── your-domain/
│   ├── create-report.md     # レポート作成スキル
│   ├── update-status.md     # ステータス一括更新スキル
│   └── weekly-summary.md    # 週次集計スキル
```

## 実例: ステータス一括更新スキル

```markdown
---
name: update-status
description: 指定条件のレコードのステータスを一括更新
type: user-invocable
---

# ステータス一括更新

## 使い方

``
/update-status 完了していないタスクのステータスを「進行中」に更新して
``

## 手順

1. 対象データベースのレコードを取得
2. 条件に合致するレコードをフィルタ
3. 各レコードを PATCH API で更新
4. 結果サマリーを表示

## API操作

- 一覧取得: GET /api/v1/forms/{formId}/answers?limit=100
- 更新: PATCH /api/v1/forms/{formId}/answers/{answerId}
- Body: [{ "op": "replace", "path": "/status", "value": "in_progress" }]
```
