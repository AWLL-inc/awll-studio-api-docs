import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'AWLL Studio API Docs',
  description: 'AWLL Studio REST API & SDK ドキュメント',
  lang: 'ja-JP',

  head: [
    ['meta', { name: 'robots', content: 'noindex, nofollow' }],
  ],

  // CLAUDE.md と ANNOUNCEMENT.md は社内向けドキュメントのためビルドから除外
  srcExclude: ['**/CLAUDE.md', 'ANNOUNCEMENT.md'],

  // 既存Markdownの相対リンク（ディレクトリ参照）がindex.mdを想定するためdead link扱いになる
  ignoreDeadLinks: true,

  // README.md → index.html にリライト（/api-reference/ 等のディレクトリアクセス対応）
  rewrites: {
    'api-reference/README.md': 'api-reference/index.md',
    'api-reference/reference/form-generator/README.md': 'api-reference/reference/form-generator/index.md',
    'playbook/README.md': 'playbook/index.md',
    'sdk/README.md': 'sdk/index.md',
  },

  themeConfig: {
    nav: [
      { text: 'はじめての方へ', link: '/GETTING_STARTED' },
      { text: '業務シナリオ例', link: '/business-examples' },
      {
        text: '詳細リファレンス',
        items: [
          { text: 'API Reference', link: '/api-reference/' },
          { text: 'SDK', link: '/sdk/' },
          { text: 'Playbook', link: '/playbook/' },
        ],
      },
    ],

    sidebar: {
      '/api-reference/': [
        {
          text: 'はじめに',
          items: [
            { text: '概要', link: '/api-reference/' },
            { text: 'クイックスタート', link: '/api-reference/quick-start' },
            { text: 'API概要', link: '/api-reference/api-overview' },
            { text: '認証ガイド', link: '/api-reference/authentication' },
            { text: 'データベーススキーマ定義', link: '/api-reference/database-schema' },
          ]
        },
        {
          text: 'REST API リファレンス',
          items: [
            { text: '概要', link: '/api-reference/reference/REST APIリファレンス/' },
            { text: '認証ガイド', link: '/api-reference/reference/REST APIリファレンス/authentication' },
            { text: 'データベース定義 API', link: '/api-reference/reference/REST APIリファレンス/forms-api' },
            { text: 'レコード API', link: '/api-reference/reference/REST APIリファレンス/form-answers-api' },
            { text: '階層データ API', link: '/api-reference/reference/REST APIリファレンス/nodes-api' },
            { text: '画面定義 API', link: '/api-reference/reference/REST APIリファレンス/screens-api' },
            { text: '検索・集計 API', link: '/api-reference/reference/REST APIリファレンス/search-aggregates-api' },
            { text: 'ユーザー・権限 API', link: '/api-reference/reference/REST APIリファレンス/users-permissions-api' },
            { text: 'Webhook・メニュー API', link: '/api-reference/reference/REST APIリファレンス/webhooks-menus-api' },
            { text: '管理者専用 API', link: '/api-reference/reference/REST APIリファレンス/admin-api' },
            { text: 'メール送信 API', link: '/api-reference/reference/REST APIリファレンス/mail-api' },
            { text: 'AI生成 API', link: '/api-reference/reference/REST APIリファレンス/ai-api' },
            { text: 'PDF 出力 API', link: '/api-reference/reference/REST APIリファレンス/pdf-api' },
            { text: 'ファイル操作 API', link: '/api-reference/reference/REST APIリファレンス/file-api' },
            { text: 'OpenAPI 仕様補足', link: '/api-reference/reference/REST APIリファレンス/corrections' },
          ]
        },
        {
          text: 'データベーススキーマ定義ガイド',
          items: [
            { text: 'フィールド型・実用例', link: '/api-reference/reference/form-generator/' },
          ]
        },
      ],
      '/sdk/': [
        {
          text: 'SDK ドキュメント',
          items: [
            { text: '概要', link: '/sdk/' },
            { text: 'データ構造仕様', link: '/sdk/data-structures' },
            { text: '画面開発ガイド', link: '/sdk/screen-development' },
            { text: 'Screen SDK Reference', link: '/sdk/screen-sdk-reference' },
            { text: 'スクリプト開発ガイド', link: '/sdk/script-development' },
            { text: 'Script SDK Reference', link: '/sdk/script-sdk-reference' },
            { text: 'RecordGrid コンポーネント', link: '/sdk/record-grid-reference' },
            { text: 'PDF ダウンロード', link: '/sdk/pdf-download' },
            { text: 'データ更新ベストプラクティス', link: '/sdk/data-update-best-practices' },
            { text: 'エラー分類', link: '/sdk/ERROR-CLASSIFICATION' },
            { text: 'SDK Hooks 移行ガイド', link: '/sdk/sdk-hooks-migration' },
            { text: '計算フィールドリファレンス', link: '/sdk/calculated-field-reference' },
            { text: 'セキュリティベストプラクティス', link: '/sdk/security-best-practices' },
          ]
        },
      ],
      '/playbook/': [
        {
          text: 'Playbook',
          items: [
            { text: '概要', link: '/playbook/' },
            { text: 'セットアップ', link: '/playbook/setup-guide' },
            { text: 'API 操作原則', link: '/playbook/api-operation-guide' },
            { text: 'データ更新のコツ', link: '/playbook/data-update-tips' },
            { text: 'ベストプラクティス', link: '/playbook/best-practices' },
            { text: 'スキル作成テンプレート', link: '/playbook/skill-template' },
            { text: '週次運用サイクル', link: '/playbook/weekly-workflow' },
          ]
        },
      ],
    },

    search: {
      provider: 'local'
    },

    outline: {
      level: [2, 3],
      label: '目次'
    },

    footer: {
      message: 'AWLL Studio API Documentation',
      copyright: '© 2026 AWLL Inc.'
    }
  }
})
