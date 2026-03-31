# Playbook セットアップガイド

Claude Code + AWLL Studio で業務を自動化するための環境構築手順です。

## 前提条件

- AWLL Studio のアカウント（メールアドレス + パスワード）
- [Claude Code](https://claude.ai/code) CLI インストール済み
- [GitHub CLI (`gh`)](https://cli.github.com/) インストール済み
- bash / zsh 環境

## Step 1: リポジトリ作成

自社用の Playbook リポジトリを作成します。

```bash
mkdir my-awll-playbook
cd my-awll-playbook
git init
```

### 推奨ディレクトリ構成

```
my-awll-playbook/
├── .env.template              # 環境変数テンプレート（git管理）
├── .env                       # 実際の認証情報（gitignore）
├── .gitignore
├── studio-api.sh                # APIシェルヘルパー
├── CLAUDE.md                  # Claude Code 設定（最重要）
├── .claude/
│   └── skills/                # Claude Code スキル定義
│       ├── studio-api.md        # API操作ルール（proactive、自動適用）
│       └── your-domain/       # 業務スキル
│           ├── create-report.md
│           └── update-status.md
├── scripts/                   # データ投入・変換スクリプト
├── tmp/                       # 一時ファイル（gitignore）
└── docs/                      # 業務ドキュメント・判断基準
```

## Step 2: .env 設定

### .env.template（git管理対象）

```env
# AWLL Studio 認証情報
YOUR_EMAIL=your-email@example.com
YOUR_PASSWORD=your-password

# API接続先
STUDIO_BASE_URL=https://awll-studio.ai
STUDIO_TENANT_CODE=your-tenant-code
```

### .gitignore

```
.env
tmp/
node_modules/
```

## Step 3: シェルヘルパー（studio-api.sh）

AWLL Studio API を簡単に呼び出すための関数群です。

```bash
#!/usr/bin/env bash
# studio-api.sh — AWLL Studio API Helper Functions

# .envから環境変数を読み込み
if [ -f .env ]; then
  set -a; source .env; set +a
fi

STUDIO_TOKEN=""

# 認証（トークン取得）
studio_login() {
  local response
  response=$(curl -s -X POST "${STUDIO_BASE_URL}/api/auth/token" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${YOUR_EMAIL}\", \"password\": \"${YOUR_PASSWORD}\"}")

  STUDIO_TOKEN=$(echo "$response" | jq -r '.idToken // .token // empty')

  if [ -z "$STUDIO_TOKEN" ]; then
    echo "❌ ログイン失敗"
    echo "$response" | jq .
    return 1
  fi
  echo "✅ ログイン成功（トークン有効期限: 1時間）"
}

# GET リクエスト
studio_get() {
  curl -s -X GET "${STUDIO_BASE_URL}$1" \
    -H "Authorization: Bearer ${STUDIO_TOKEN}" \
    -H "X-Tenant-Code: ${STUDIO_TENANT_CODE}" | jq .
}

# POST リクエスト
studio_post() {
  curl -s -X POST "${STUDIO_BASE_URL}$1" \
    -H "Authorization: Bearer ${STUDIO_TOKEN}" \
    -H "X-Tenant-Code: ${STUDIO_TENANT_CODE}" \
    -H "Content-Type: application/json" \
    -d "$2" | jq .
}

# PATCH リクエスト（推奨: レコード更新に使用）
studio_patch() {
  curl -s -X PATCH "${STUDIO_BASE_URL}$1" \
    -H "Authorization: Bearer ${STUDIO_TOKEN}" \
    -H "X-Tenant-Code: ${STUDIO_TENANT_CODE}" \
    -H "Content-Type: application/json" \
    -d @"$2" | jq .
}

# DELETE リクエスト
studio_delete() {
  curl -s -X DELETE "${STUDIO_BASE_URL}$1" \
    -H "Authorization: Bearer ${STUDIO_TOKEN}" \
    -H "X-Tenant-Code: ${STUDIO_TENANT_CODE}" | jq .
}

# ---- 便利関数 ----

# データベース一覧
studio_forms() {
  studio_get "/api/v1/forms"
}

# レコード一覧
studio_answers() {
  studio_get "/api/v1/forms/$1/answers?limit=${2:-20}"
}

# レコード詳細（階層データ含む）
studio_answer() {
  studio_get "/api/v1/forms/$1/answers/$2?enrich=hierarchical"
}

# テナント切り替え
studio_use_tenant() {
  STUDIO_TENANT_CODE="$1"
  echo "テナント切り替え: $STUDIO_TENANT_CODE"
}
```

### 使い方

```bash
source studio-api.sh
studio_login
studio_forms                           # データベース一覧
studio_answers FORM_ID                 # レコード一覧（デフォルト20件）
studio_answers FORM_ID 100             # レコード一覧（100件）
studio_answer FORM_ID ANSWER_ID        # レコード詳細（階層データ含む）
```

## Step 4: CLAUDE.md 設定

Claude Code が AWLL Studio API を理解するための設定ファイルです。

```markdown
# CLAUDE.md

## What This Repo Is

自社の業務を AWLL Studio + Claude Code で効率化するための Playbook リポジトリ。

## AWLL Studio API

### 認証
- `source studio-api.sh && studio_login` で認証
- トークン有効期限: 1時間
- Rate limit: 60 req/min
- ヘッダー: `Authorization: Bearer <token>` + `X-Tenant-Code`

### APIドキュメント
- REST API: https://docs.awll-studio.ai/raw/api-reference/quick-start.md
- Screen SDK: https://docs.awll-studio.ai/raw/sdk/screen-sdk-reference.md
- Script SDK: https://docs.awll-studio.ai/raw/sdk/script-sdk-reference.md
- API操作原則: https://docs.awll-studio.ai/raw/playbook/api-operation-guide.md

### 必須ルール
- PUT API は使用禁止 → PATCH で差分更新
- サブレコード操作は Nodes API を使用
- Nodes API の PUT は GET→マージ→PUT の手順
- 更新前に `enrich=hierarchical` でバックアップ取得
- 日本語JSONはファイル経由で送信（`-d @tmp/data.json`）
- 一時ファイルは `tmp/` に保存

## Skills

- `.claude/skills/studio-api.md` — API操作時に自動適用されるルール
- `.claude/skills/your-domain/` — 業務スキル
```

## Step 5: スキル作成

### API操作ルール（proactive — 自動適用）

`.claude/skills/studio-api.md`:

```markdown
---
name: studio-api
description: AWLL Studio API 操作時のルールを自動適用
type: proactive
match:
  - "AWLL"
  - "レコード作成"
  - "レコード更新"
  - "formId"
  - "/api/v1/forms"
---

# AWLL Studio API 操作ルール

## 必須ルール

1. PUT API は使用禁止 → PATCH で差分更新
2. サブレコード操作は Nodes API を使用
3. 更新前にバックアップ取得
4. 日本語JSONはファイル経由で送信
```

### 業務スキル（user-invocable — 手動呼び出し）

`.claude/skills/your-domain/update-status.md`:

```markdown
---
name: update-status
description: レコードのステータスを一括更新
type: user-invocable
---

# ステータス一括更新

## 使い方

/update-status 未着手のタスクを進行中に変更して

## 手順

1. `studio_login` で認証
2. `studio_answers FORM_ID 100` でレコード取得
3. 条件に合致するレコードをフィルタ
4. 各レコードを PATCH API で更新
5. 結果サマリーを表示
```

## 運用ルール

### 日次

```bash
# 作業開始時
git pull origin main

# 作業終了時
git add -A && git commit -m "作業内容" && git push
```

### スキルの育て方

1. 繰り返す業務を見つける
2. スキルファイルを作成
3. Claude Code で実行・改善
4. PR を作成してチームに共有
