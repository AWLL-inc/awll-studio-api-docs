# 案内文テンプレート — AWLL Studio API Docs 公開連絡

新規のお客様 / トライアルユーザーの皆様に向けて、ドキュメントサイト・初回セットアップ・Claude Code 連携をご案内するためのテンプレートです。Slack / メール本文にそのまま貼り付けてご利用ください。

---

## 本文 (コピペ用)

```text
AWLL Studio API ドキュメントサイトのご案内

AWLL Studio の API ドキュメントを公開いたしました。
Claude Code に指示するだけで、お客様のテナント上に最初のデータベースと画面が
作成され、ブラウザで動作をご確認いただけるところまでをガイドしております。

▼ ドキュメントサイト
https://docs.awll-studio.ai

▼ ログイン情報
ユーザー名: {ユーザー名}
パスワード: {パスワード}

──────────────────────────────────────────
▼ まずはここからお進みください (所要 10〜15 分)
──────────────────────────────────────────

「はじめての方へ」を順にお進みいただくと、以下までご体験いただけます。

  ① Claude Code のセットアップ (CLAUDE.md に貼り付けるのみ)
  ② Claude Code に依頼し「顧客マスタ」データベースを作成
  ③ Claude Code に依頼し、一覧表示画面を作成・デプロイ
  ④ ブラウザでログインし、作成された画面をご確認

ガイド: https://docs.awll-studio.ai/GETTING_STARTED

──────────────────────────────────────────
▼ Claude Code をお使いの方へ (CLAUDE.md 推奨スニペット)
──────────────────────────────────────────

プロジェクトの CLAUDE.md に以下を追記いただくと、Claude Code が AWLL Studio の
API 仕様を WebFetch で参照しながらコーディングを支援します。

## AWLL Studio
- クイックスタート: https://docs.awll-studio.ai/raw/api-reference/quick-start.md
- データベーススキーマ定義: https://docs.awll-studio.ai/raw/api-reference/database-schema.md
- API 操作原則 (必須ルール): https://docs.awll-studio.ai/raw/api-reference/CLAUDE.md
- Screen SDK: https://docs.awll-studio.ai/raw/sdk/screen-sdk-reference.md
- Script SDK: https://docs.awll-studio.ai/raw/sdk/script-sdk-reference.md

※ 認証情報 (メール / パスワード / テナントコード) は CLAUDE.md には記載せず、
   .env または tmp/settings.local.yaml に分離する運用を推奨しております。

──────────────────────────────────────────
▼ 次のステップ
──────────────────────────────────────────

ご体験後は、同様の要領で必要なデータベースや画面を Claude Code にご依頼ください。
仕様の詳細を確認されたい場合は、以下のリファレンスをご参照いただけます。

- 業務データのモデリング → データベーススキーマ定義
- 画面を作り込みたい → Screen SDK Reference
- レコードにロジックを追加したい → Script SDK Reference
- 繰り返し業務を自動化したい → Playbook

ご不明な点がございましたら、お気軽にお問い合わせください。
```

---

## 差し込み変数

| プレースホルダ | 内容 |
|--------------|-----|
| `{ユーザー名}` | お渡しするメールアドレス |
| `{パスワード}` | お渡しする初期パスワード |

テナント固有のアプリ URL / API URL がある場合は、本文末尾に追記してください。

## 関連ファイル

- 体験ガイド本体: [GETTING_STARTED.md](./GETTING_STARTED.md)
- Claude Code 詳細セットアップ: [CLAUDE_CODE_SETUP.md](./CLAUDE_CODE_SETUP.md)
- Playbook セットアップ: [playbook/setup-guide.md](./playbook/setup-guide.md)
