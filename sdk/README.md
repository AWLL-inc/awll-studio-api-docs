# SDK ドキュメント

AWLL Studio で **画面 (React)** と **スクリプト (JavaScript)** を作成するための SDK リファレンスです。Claude Code が画面・スクリプトを生成する際の仕様参照先でもあります。

## 画面開発 (Screen SDK)

業務画面を React + TypeScript で構築します。

| ドキュメント | 内容 |
|------------|------|
| [画面開発ガイド](./screen-development.md) | React 画面定義の作成方法とベストプラクティス |
| [Screen SDK Reference](./screen-sdk-reference.md) | `useRecords` / `useRecord` / `useMutation` 等の Hooks API |
| [RecordGrid コンポーネント](./record-grid-reference.md) | Notion 風テーブル UI のリファレンス |

## スクリプト開発 (Script SDK)

レコード作成・更新時に自動実行されるビジネスロジックを JavaScript で記述します。

| ドキュメント | 内容 |
|------------|------|
| [スクリプト開発ガイド](./script-development.md) | スクリプトの作成方法とベストプラクティス |
| [Script SDK Reference](./script-sdk-reference.md) | `ON_CREATE` / `ON_UPDATE` / `ON_CHANGE` トリガー、`api.sendEmail()` 等 |

## 計算フィールド

| ドキュメント | 内容 |
|------------|------|
| [計算フィールド リファレンス](./calculated-field-reference.md) | 数式・集約関数の設定方法と使用例 |

## 共通仕様・その他

| ドキュメント | 内容 |
|------------|------|
| [データ構造仕様](./data-structures.md) | フィールド型・回答データ・レコード構造 |
| [PDF ダウンロード](./pdf-download.md) | PDF 出力機能の SDK 統合 |
| [データ更新ベストプラクティス](./data-update-best-practices.md) | 大量更新・並行更新時の注意点 |
| [エラー分類](./ERROR-CLASSIFICATION.md) | SDK エラーの種類と対処 |
| [SDK Hooks 移行ガイド](./sdk-hooks-migration.md) | 旧 Hooks からの移行手順 |
| [セキュリティベストプラクティス](./security-best-practices.md) | 認証・権限・データアクセスの注意点 |

## 対象読者

- AWLL Studio で画面 / スクリプトをコード生成・編集する **開発者**
- Claude Code を介してこれらを構築する **業務担当者** (詳細仕様の参照用)

> まずは Claude Code で画面・スクリプトを作って動かしたい場合は、[はじめての方へ](../GETTING_STARTED.md) と [業務シナリオ例](../business-examples.md) をご覧ください。
