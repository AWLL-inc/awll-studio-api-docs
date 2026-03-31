# Claude Code + AWLL Studio ベストプラクティス

## 1. CLAUDE.md の書き方

### 最小構成

```markdown
# CLAUDE.md

## AWLL Studio API
- 認証: `source studio-api.sh && studio_login`
- APIドキュメント: https://docs.awll-studio.ai/raw/api-reference/quick-start.md
- PUT禁止 → PATCH使用
- サブレコード → Nodes API
```

### 推奨構成

```markdown
# CLAUDE.md

## What This Repo Is
[リポジトリの目的を1-2行で]

## AWLL Studio API
[認証方法・APIルール]

## Skills
[スキル一覧と概要]

## Repository Layout
[ディレクトリ構成]

## Important Conventions
[チーム固有のルール]
```

### アンチパターン

```markdown
# ❌ 悪い例: 情報過多
長大なAPIリファレンスをCLAUDE.mdに全文コピー
→ コンテキストを圧迫し、指示が埋もれる

# ✅ 良い例: URLで参照
APIドキュメント: https://docs.awll-studio.ai/raw/api-reference/quick-start.md
必要時にWebFetchで取得してください
```

## 2. Skills 設計パターン

### パターンA: 情報収集型

データを取得して整形・分析する。安全（データ変更なし）。

```markdown
# 週次レポート生成

1. 全レコード取得（GET）
2. 今週分をフィルタ
3. 集計・サマリー作成
4. Markdownで出力
```

**適用例**: 売上集計、タスク一覧、KPI算出

### パターンB: データ更新型

既存データを更新する。バックアップ必須。

```markdown
# ステータス一括更新

1. バックアップ取得（GET + enrich=hierarchical）
2. tmp/ に保存
3. 対象レコードをフィルタ
4. PATCH API で更新
5. 結果確認
```

**適用例**: ステータス変更、担当者アサイン、日次記録

### パターンC: データ投入型

新規レコードを作成する。

```markdown
# CSVインポート

1. CSVファイル読み込み
2. バリデーション
3. 各行を POST API でレコード作成
4. 結果サマリー（成功/失敗件数）
```

**適用例**: マスタデータ投入、CSV取り込み

### パターンD: 対話型

ユーザーとの対話で情報を補完しながら実行する。

```markdown
# タスク起票

情報が揃っている場合 → 即時起票
不足している場合 → 対話で補完:
1. プロジェクト選択
2. 親タスク指定
3. タスク内容入力
4. Nodes API POST で起票
```

**適用例**: タスク起票、見積作成、レポート作成

## 3. proactive vs user-invocable の使い分け

### proactive（自動適用）

```yaml
match:
  - "レコード作成"
  - "formId"
  - "/api/v1/forms"
```

**使い所**:
- APIルール（PUT禁止等） → 常に適用すべき
- データ操作原則 → 違反防止
- 命名規則 → 一貫性確保

**注意**: matchキーワードが広すぎると不要な場面で発動する。具体的なキーワードを使う。

### user-invocable（明示的呼び出し）

```
/update-tasks
/create-report
/import-csv
```

**使い所**:
- 定型業務の自動化
- 複数ステップの操作
- 確認が必要な操作

## 4. データ操作の落とし穴

### 落とし穴1: PUTで他フィールドが消える

```json
// ❌ PUTで name だけ更新 → status, email が消失
PUT /api/v1/forms/{formId}/answers/{answerId}
{ "answerData": { "name": "更新後" } }

// ✅ PATCHで name だけ更新 → 他フィールドは維持
PATCH /api/v1/forms/{formId}/answers/{answerId}
[{ "op": "replace", "path": "/name", "value": "更新後" }]
```

### 落とし穴2: Nodes API PUTで部分データ送信

```json
// ❌ hours だけ送信 → name, status が消失
PUT /api/answers/{answerId}/nodes/{rowId}
{ "data": { "hours": 8 } }

// ✅ GET→マージ→PUT（全フィールド含む）
PUT /api/answers/{answerId}/nodes/{rowId}
{ "data": { "name": "タスクA", "status": "done", "hours": 8 } }
```

### 落とし穴3: 504 Gateway Timeout

大量のネストデータ（200件超のサブレコード）をPUTすると504が発生。

```
# 回避策
1. DELETE → POST で再作成（answerIdが変わる点に注意）
2. Nodes API で個別ノードを更新
3. 分割して少量ずつ更新
```

### 落とし穴4: 日本語JSONの文字化け

```bash
# ❌ シェルインライン → エンコーディング問題
curl -d '{"name": "テスト"}' ...

# ✅ ファイル経由
echo '{"name": "テスト"}' > tmp/data.json
curl -d @tmp/data.json ...
```

### 落とし穴5: answerData と Nodes の不整合

```
Nodes API で追加 → answerData（検索インデックス）には自動同期される
ただし answerData に ARRAY を含めて PUT → Nodes との不整合が発生

ルール: answerData の PUT に ARRAY フィールドを含めない
```

## 5. チーム運用のコツ

### スキルは全員で育てる

```
1. 繰り返す業務を見つける → スキル候補
2. 最初は手動で手順を確認 → CLAUDE.md にメモ
3. スキルファイルとして定義 → .claude/skills/ に配置
4. チームメンバーにPRで共有 → レビュー・改善
5. 日々使いながらブラッシュアップ
```

### 判断基準をドキュメント化

```
docs/
├── evaluation-criteria.md    # 評価基準
├── approval-rules.md         # 承認ルール
├── naming-conventions.md     # 命名規則
```

Claude Code がこれらを参照してデータ操作の判断を行えるようになる。

### tmpディレクトリの活用

```bash
tmp/                          # gitignore対象
├── backup_project_20260331.json   # バックアップ
├── import_data.csv                # インポート元データ
├── update_payload.json            # API送信用JSON
└── report_weekly.md               # 生成レポート
```

## 6. トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| 401 Unauthorized | トークン失効（1時間） | `studio_login` で再認証 |
| 403 Forbidden | 権限不足 | テナント管理者に権限付与を依頼 |
| 400 Bad Request | リクエスト不正 | fieldCode/parentRowId/データ型を確認 |
| 504 Gateway Timeout | 大量データPUT | DELETE→POST or Nodes API で分割更新 |
| データが消えた | PUTで全体上書き | バックアップから復元、以後PATCHを使用 |
| サブレコードが表示されない | answerData未同期 | `POST /rebuild-index` を実行 |
