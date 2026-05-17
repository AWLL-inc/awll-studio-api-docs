# はじめての方へ

AWLL Studio をはじめてお使いになる方向けのガイドです。
**Claude Code に指示するだけで、最初のデータベースと画面が作成され、ブラウザでご確認いただける**ところまでを通してご体験いただけます。

所要時間: 約 10〜15 分

---

## このガイドの流れ

1. Claude Code を AWLL Studio 用にセットアップする
2. Claude Code に依頼して「顧客マスタ」というデータベースを作成する
3. そのデータベースを一覧表示する画面を作成し、デプロイする
4. ブラウザでログインし、作成された画面を確認する

---

## 0. 事前に手元に揃えるもの

AWLL Studio のプロダクト URL は以下の通り固定です。

- アプリ: `https://awll-studio.ai`
- API ベース: `https://api.awll-studio.ai`

ユーザーごとに用意するものは次の 3 点だけです。

| 項目 | 取得方法 |
|------|---------|
| ログイン情報 (メール / パスワード) | 担当者よりお渡し済み |
| テナントコード | 同上 |
| [Claude Code](https://claude.ai/code) | 未インストールの場合は事前にインストールをお願いします |

> 💡 **お渡し済みの情報が見当たらない場合**は、先に進まず担当者までお問い合わせください。

---

## 1. Claude Code を AWLL Studio 用にセットアップする

任意の作業ディレクトリで Claude Code を開き、プロジェクト直下に `CLAUDE.md` を作成し、以下の内容を貼り付けてください。

> 既存の `CLAUDE.md` がある場合は、末尾に追記してください。

```markdown
## AWLL Studio

このプロジェクトでは AWLL Studio (https://api.awll-studio.ai) の REST API を操作します。

### 接続情報
- API Base URL: https://api.awll-studio.ai
- アプリ URL: https://awll-studio.ai
- テナントコード: <あなたのテナントコード>
- メール: <あなたのメール>
- パスワード: <あなたのパスワード>

### 必ず参照するドキュメント (WebFetch で取得)
- クイックスタート (curl 例): https://docs.awll-studio.ai/raw/api-reference/quick-start.md
- データベーススキーマ定義: https://docs.awll-studio.ai/raw/api-reference/database-schema.md
- API 操作原則 (必須ルール): https://docs.awll-studio.ai/raw/api-reference/CLAUDE.md
- Screen SDK Reference: https://docs.awll-studio.ai/raw/sdk/screen-sdk-reference.md
- Script SDK Reference: https://docs.awll-studio.ai/raw/sdk/script-sdk-reference.md

### 必須ルール
- 認証: `POST /api/auth/token` で IDトークン取得 (有効期限 1 時間)
- 全リクエストに `Authorization: Bearer <token>` と `X-Tenant-Code: <tenant>` を付与
- レコード更新は **Nodes API** を使う (PUT /answers は非推奨)
- ARRAY フィールドはレコード作成時に `answerData` に直接含める
- 日本語 JSON は `tmp/` 配下のファイル経由で送信する
```

> 🔐 **認証情報をリポジトリに含めないようご注意ください**。
> 上記はテンプレートとしてご利用いただき、実際の値は `.env` または `tmp/settings.local.yaml` に分離し、`CLAUDE.md` 側からは「`tmp/settings.local.yaml` を参照」と記載する運用を推奨します。
> 詳細は [Playbook セットアップガイド](./playbook/setup-guide.md) をご参照ください。

---

## 2. Claude Code に「最初のデータベース」を依頼する

Claude Code を起動し、以下のプロンプトをそのまま入力してください。

```text
AWLL Studio に顧客管理用のデータベースを作成し、サンプルレコードを 3 件投入してください。
```

CLAUDE.md に記載した API 仕様・必須ルール (ULID 生成や `X-Tenant-Code` 付与など) は Claude Code が自動的に参照します。フィールド設計についても Claude Code にお任せいただけます。

> ✅ **チェックポイント**: `https://awll-studio.ai` にログインして「データベース」一覧を開き、作成されたデータベースが表示されていれば成功です。
>
> 💡 想定と異なる結果になった場合は、続けて「顧客名を必須にしてください」「メモを複数行にしてください」のように追加で指示することで、Claude Code が修正を反映します。

---

## 3. Claude Code に「最初の画面」を依頼する

続けて Claude Code に以下のプロンプトを入力してください。

```text
先ほど作成した顧客マスタを一覧表示する画面を作成し、デプロイのうえ、サイドバーメニューにも追加してください。
```

CLAUDE.md に Screen SDK のリファレンスを記載しているため、Claude Code が `useRecords` を使った React コードの生成 → コンパイル → デプロイ → メニュー追加までを一括で実行します。

> ✅ **チェックポイント**: Claude Code から `success: true` と `screenId` / `cdnUrl` が返却されていれば成功です。
>
> 💡 一覧の列構成 (顧客名 / メール / 電話番号など) を変更したい場合は、続けて「列を顧客名と電話番号のみにしてください」のように指示してください。

---

## 4. ブラウザでログインして確認する

1. アプリ URL `https://awll-studio.ai` を開く
2. Step 0 でお渡しされたメール / パスワードでログイン
3. サイドバーから **「顧客ダッシュボード」** を選択
4. Step 2 で投入したサンプルレコード 3 件がテーブル表示されていれば完了です。

> 💡 画面が表示されない場合:
> - サイドバーに項目が表示されない → `PUT /api/v1/menu` で既存メニューを上書きしていないかご確認ください (GET → マージ → PUT の手順)
> - データが 0 件 → `GET /api/v1/forms/{formId}/answers` でレコードの有無をご確認ください
> - 詳細なトラブルシュートは [API 操作原則](./playbook/api-operation-guide.md) をご参照ください

---

## 次にやること

ここまでで、Claude Code への指示を通じてデータベースと画面を構築する流れをご体験いただけたかと思います。
**以降も同様の要領で、業務に必要なデータベースや画面を Claude Code にご依頼ください。** 例えば、次のような指示で進めていただけます。

```text
案件管理のデータベースを作成し、ステータス別にカード表示する画面もご用意ください。
```

```text
先ほどの顧客マスタに「担当者」フィールドを追加し、顧客一覧の画面にも列を追加してください。
```

```text
受注レコードが作成された際に、担当者へメールを送信するスクリプトを設定してください。
```

### さらに詳しく知りたくなった場合

仕様の細部を把握したい、ご自身で API を直接呼び出したい、といった場面でご活用ください。通常のご利用では参照は必須ではありません。

| ご興味 | 関連ドキュメント |
|------|--------------|
| データベース設計の詳細 (フィールド型・制約など) | [データベーススキーマ定義](./api-reference/database-schema.md) |
| 画面コードをご自身で記述したい | [Screen SDK Reference](./sdk/screen-sdk-reference.md) / [画面開発ガイド](./sdk/screen-development.md) |
| レコード作成・更新時のロジックを追加したい | [Script SDK Reference](./sdk/script-sdk-reference.md) / [スクリプト開発ガイド](./sdk/script-development.md) |
| curl で API を直接呼び出したい | [クイックスタート (curl)](./api-reference/quick-start.md) / [API 概要](./api-reference/api-overview.md) |
| Claude Code で繰り返し業務を自動化したい | [Playbook セットアップガイド](./playbook/setup-guide.md) / [週次運用サイクル](./playbook/weekly-workflow.md) |

---

## トラブルシュート

| 症状 | 原因 / 対処 |
|------|----------|
| `401 Unauthorized` | トークンの有効期限切れ (1 時間)。再度 `POST /api/auth/token` を実行してください |
| `403 Forbidden` | `X-Tenant-Code` ヘッダーが未付与、またはテナント所属外です |
| 画面デプロイ後にメニューに表示されない | `PUT /api/v1/menu` は全件置換のため、GET で取得した既存項目をマージして送信してください |
| `429 Too Many Requests` | レート制限 (60 req/min) に達しています。数十秒お待ちのうえ再試行してください |
| サブレコードが画面で 0 件表示される | Nodes API ではなく、レコード作成時に `answerData` 内に ARRAY を含めてください ([API 操作原則](./playbook/api-operation-guide.md) 参照) |

---

## サポート

ご不明な点やうまくいかない場合は、担当者までお問い合わせください。
