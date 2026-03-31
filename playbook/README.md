# AWLL Studio Playbook テンプレート

Claude Code と AWLL Studio を組み合わせて業務を効率化するための Playbook テンプレートです。

## Playbook とは

AWLL Studio の API を Claude Code から操作し、日々の業務を自動化・効率化するための仕組みです。

- **シェルヘルパー**: ターミナルから AWLL Studio API を簡単に呼び出す関数群
- **Claude Code スキル**: `/コマンド名` で実行できる業務自動化スキル
- **データ操作原則**: 安全にデータを更新するためのルール

## クイックスタート

### 1. リポジトリを作成

自社用の Playbook リポジトリを作成し、以下の構成で配置します。

```
your-playbook/
├── .env.template           # 環境変数テンプレート
├── studio-api.sh             # APIシェルヘルパー
├── CLAUDE.md               # Claude Code 設定
├── .claude/skills/         # Claude Code スキル定義
│   └── studio-api.md         # API操作ガイド（自動適用）
├── scripts/                # データ投入・変換スクリプト
├── tmp/                    # 一時ファイル（gitignored）
└── docs/                   # 業務ドキュメント
```

### 2. 環境変数を設定

`.env.template` をコピーして `.env` を作成:

```bash
cp .env.template .env
```

```env
# .env
YOUR_EMAIL=your-email@example.com
YOUR_PASSWORD=your-password
STUDIO_BASE_URL=https://your-tenant.awll-studio.ai
STUDIO_TENANT_CODE=your-tenant
```

### 3. シェルヘルパーを使う

```bash
source studio-api.sh
studio_login                    # 認証（トークン有効期限: 1時間）
studio_forms                    # データベース一覧
studio_answers <formId>         # レコード一覧
studio_get /api/v1/forms        # 任意のエンドポイントにGET
```

### 4. Claude Code で操作

```
Claude Code を起動し、Playbook リポジトリで作業:

$ claude

> 顧客データベースのレコード一覧を取得して
> 新しい顧客レコードを作成して: 会社名=株式会社テスト, 担当者=田中太郎
```

## 含まれるドキュメント

| ファイル | 内容 |
|---------|------|
| [api-operation-guide.md](./api-operation-guide.md) | API操作原則（PUT禁止・PATCH推奨・バックアップ等） |
| [data-update-tips.md](./data-update-tips.md) | 大量データ更新のコツ・504回避策 |
| [skill-template.md](./skill-template.md) | Claude Code スキルの作成テンプレート |
| [weekly-workflow.md](./weekly-workflow.md) | 週次運用サイクルの設計例 |
