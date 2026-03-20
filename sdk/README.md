# AWLL Studio Platform Skills

AWLL Studioプラットフォーム上で画面定義（React）とビジネスロジック（JavaScript）を作成するためのベストプラクティス集です。

## 📚 Skills一覧

### 画面開発
- [**screen-development.md**](./screen-development.md) - React画面定義の作成方法とベストプラクティス
- [**screen-sdk-reference.md**](./screen-sdk-reference.md) - Screen SDK API完全リファレンス

### ビジネスロジック開発
- [**script-development.md**](./script-development.md) - JavaScriptスクリプトの作成方法とベストプラクティス
- [**script-sdk-reference.md**](./script-sdk-reference.md) - Script SDK API完全リファレンス

### UIコンポーネント
- [**record-grid-reference.md**](./record-grid-reference.md) - RecordGrid SDK（Notion風テーブルUI）完全リファレンス

### データ構造
- [**data-structures.md**](./data-structures.md) - データベース定義、回答データ、レコード構造の仕様

### セキュリティ
- [**security-best-practices.md**](./security-best-practices.md) - 認証、権限、データアクセスのベストプラクティス

## 🎯 対象ユーザー

- AWLL Studioプラットフォームで画面を開発する開発者
- スクリプトでビジネスロジックを実装する開発者
- プラットフォームAPIを使用するシステム管理者

## 🚀 クイックスタート

### 1. 画面を作成する

```bash
# 管理画面にアクセス
https://awll-studio.ai/admin/screens

# 新規画面作成
- 画面名: customer_list
- 画面コード: customer_list
- ソースコード: screen-development.md を参照
```

### 2. スクリプトを作成する

```bash
# 管理画面にアクセス
https://awll-studio.ai/admin/scripts

# 新規スクリプト作成
- スクリプト名: customer_validation
- トリガー: ON_CREATE
- コード: script-development.md を参照
```

## 📖 ドキュメント構成

各Skillsファイルは以下の構成で記載されています：

1. **概要**: Skillの目的と対象読者
2. **基本概念**: 重要な概念の説明
3. **使い方**: 実際のコード例とステップバイステップガイド
4. **ベストプラクティス**: 推奨される実装パターン
5. **アンチパターン**: 避けるべき実装例
6. **トラブルシューティング**: よくある問題と解決方法
7. **リファレンス**: API仕様とデータ構造

## 🔗 関連リソース

- [AWLL Studio公式ドキュメント](https://docs.awll-studio.ai)
- [APIリファレンス](https://api-docs.awll-studio.ai)
- [コミュニティフォーラム](https://community.awll-studio.ai)

## 📝 更新履歴

- 2026-03-15: RecordGrid SDK リファレンス追加
- 2026-02-15: フィールドタイプ定義を実装に合わせて更新、技術実装詳細を非表示化
- 2026-02-04: 初版作成

---

**Note**: このSkills集は継続的に更新されます。最新版は常にGitHubリポジトリを参照してください。
