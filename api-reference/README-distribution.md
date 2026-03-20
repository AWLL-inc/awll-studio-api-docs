# AWLL Studio API 構築ガイド

AWLL Studio プラットフォームを REST API 経由で操作するためのナレッジ集です。

## 対象読者

- AWLL Studio上にデータベース・画面をAPI経由で構築したい開発者
- AIエージェント(Claude等)にAWLL Studioの操作を指示する人

## ディレクトリ構成

```
.
├── README.md                    # 本ファイル
├── CLAUDE.md                    # AIエージェント用の指示書
├── settings.yaml                # API認証情報 (※各自で記入)
│
└── reference/
    ├── v1/                      # REST API リファレンス (修正版)
    │   ├── README.md            # API概要
    │   ├── authentication.md    # 認証ガイド
    │   ├── corrections.md       # 公式リファレンスからの修正点一覧
    │   ├── forms-api.md         # データベース定義 API
    │   ├── form-answers-api.md  # レコード CRUD API
    │   ├── nodes-api.md         # 階層データ(ノード) API
    │   ├── screens-api.md       # 画面定義 API
    │   ├── search-aggregates-api.md  # 検索・集計 API
    │   ├── webhooks-menus-api.md     # Webhook・メニュー API
    │   ├── users-permissions-api.md  # ユーザー・権限 API
    │   └── admin-api.md         # 管理者 API
    │
    ├── 画面SDK/                  # カスタム画面・スクリプト開発SDK
    │   ├── README.md
    │   ├── screen-development.md     # React画面開発ガイド
    │   ├── screen-sdk-reference.md   # Screen SDK APIリファレンス
    │   ├── script-development.md     # スクリプト開発ガイド
    │   ├── script-sdk-reference.md   # Script SDK APIリファレンス
    │   ├── data-structures.md        # データ構造仕様
    │   └── security-best-practices.md
    │
    └── form-generator/          # データベーススキーマ定義ガイド
        └── README.md            # 全フィールド型の仕様・制約・実用例
```

## クイックスタート

### 1. 認証情報を設定

`settings.yaml` に自身のAWLL Studio認証情報を記入してください。

```yaml
awll_studio:
  base_url: "https://api.awll-studio.ai"
  email: "your-email@example.com"
  password: "your-password"
  tenant_code: "your-tenant"
```

### 2. トークン取得

```bash
TOKEN=$(curl -s -X POST "https://api.awll-studio.ai/api/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}' | jq -r '.idToken')
```

### 3. データベース作成

```bash
curl -s -X POST "https://api.awll-studio.ai/api/v1/forms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: your-tenant" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "title": "顧客マスタ",
    "schema": {
      "fields": [
        {
          "fieldRecordId": "01ABC123DEF456GH",
          "fieldCode": "name",
          "fieldName": "顧客名",
          "fieldType": "TEXT",
          "required": true,
          "order": 0
        }
      ]
    }
  }'
```

## 重要: 公式リファレンスとの差異

公式リファレンス(OpenAPI仕様)には記載されていない重要な仕様があります。必ず `reference/v1/corrections.md` を確認してください。

主な差異:

| 項目 | 公式リファレンス | 実際の仕様 |
|------|----------------|-----------|
| フォーム作成時のフィールド定義 | `fieldCode`, `fieldName` のみ記載 | **`fieldRecordId`(ULID)と`order`が必須** (FormBuilder UIで編集するため) |
| ノード作成 | `parentRowId` が required | ルートノードはAPI作成不可。**レコード作成時に自動生成** |
| 画面デプロイ | ソースコードアップロード後にdeploy | **コンパイルはUI上でのみ可能** |
| AI生成プロンプトとAPIのプロパティ名 | `fieldId` | APIでは **`fieldCode`** を使用 |

## Rate Limiting

- 60リクエスト/分(ユーザー単位)
- 超過時: HTTP 429
- ヘッダー: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
