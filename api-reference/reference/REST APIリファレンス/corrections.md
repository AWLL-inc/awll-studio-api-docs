# reference版からの修正点一覧

reference版（`../reference/`）のAPI仕様を検証した結果、以下の差異を特定・修正しました。

---

## 重大な修正（Critical）

### 1. Nodes API: ルートノード作成に関する誤解（feedback対応）

**問題**: reference版で `CreateNodeRequest` の `parentRowId`, `fieldCode`, `data` がすべて `required` と定義されているが、ルートノード作成方法が不明。

**正しい仕様**:
- `POST /api/answers/{answerId}/nodes` は**子ノード作成専用**
- ルートノードはレコード作成時（`POST /api/v1/forms/{formId}/answers`）に**自動生成**される
- ルートノード作成用の公開APIは存在しない
- `parentRowId` に `null`, `""`, `"ROOT"` を指定するとエラーになる
- `parentRowId` には**既存ノードのrowId**を正確に指定する必要がある
- `fieldCode` には**親ノードが持つARRAY型フィールドのfieldCode**を指定する

**修正内容**: [nodes-api.md](./nodes-api.md) にcurl例付きの正しい使用方法を記載。FAQ形式でfeedbackの疑問に回答。

### 2. PATCH操作の独自形式

**問題**: reference版では標準的なJSON Patch（RFC 6902）を示唆しているが、実際の `op` は独自形式。

**正しい仕様**: PatchOperation の `op` フィールドは以下の独自値を使用:
- `replace` - フィールド値を置換
- `append` - 配列に要素を追加
- `update` - 配列内の特定要素を更新
- `delete` - 配列内の特定要素を削除

`path` も標準JSONPointer形式ではなく、独自構文。

**修正内容**: [form-answers-api.md](./form-answers-api.md) に正しいPatchOperation定義を記載。

---

## エンドポイントの追加（reference版に未記載）

### Forms API
| エンドポイント | 説明 |
|--------------|------|
| `POST /api/v1/forms/ai-create` | AI自動生成（ストリーミング） |
| `POST /api/v1/forms/ai-create-job` | AI自動生成（非同期ジョブ） |
| `GET /api/v1/forms/ai-jobs/{jobId}` | ジョブステータス取得 |
| `GET /api/v1/forms/ai-jobs` | ユーザーのジョブ一覧 |
| `DELETE /api/v1/forms/ai-jobs/{jobId}` | ジョブキャンセル |

### Form Answers API
| エンドポイント | 説明 |
|--------------|------|
| `PUT /api/v1/forms/{formId}/answers/bulk` | 一括**更新**（reference版はPOSTの一括作成のみ記載） |
| `POST /api/v1/forms/{formId}/answers/rebuild-index` | 検索インデックス再構築 |

### Screens API
| エンドポイント | 説明 |
|--------------|------|
| `DELETE /api/v1/screens/{screenId}/versions/{version}` | バージョン削除 |

### Admin API（全て未記載）
| エンドポイント | 説明 |
|--------------|------|
| `GET/POST/PUT/DELETE /api/admin/roles/*` | ロール管理 |
| `GET/POST/PUT /api/admin/users/*` | ユーザー管理 |
| `POST /api/admin/users/{userId}/reset-password` | パスワードリセット |
| `GET/POST/DELETE /api/admin/users/invitations/*` | 招待管理 |
| `POST /api/admin/users/invite` | ユーザー招待 |
| `POST /api/admin/users/bulk-invite` | 一括招待 |
| `GET/POST/PUT/DELETE /api/admin/script-rules/*` | スクリプトルール管理 |
| `POST /api/admin/script-rules/test` | テストスクリプト実行 |

---

## エンドポイントの廃止

| エンドポイント | 状態 | 理由 |
|--------------|------|------|
| `POST /api/v1/forms/{formId}/publish` | **410 Gone** | `PUT /api/v1/forms/{formId}` が常にPUBLISHED状態で保存するため不要 |

---

## レスポンスフィールドの追加（reference版に未記載）

### FormAnswerResponse
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `recalculatedData` | object? | `recalculate=true` 時のみ、再計算結果 |
| `recalculationError` | string? | 再計算エラーメッセージ |
| `rootNodeId` | string? | ルートノードID |

### FormAnswerListResponse
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `searchScope` | string | 検索スコープ |
| `searchableFields` | string[] | 検索可能フィールド一覧 |

### AnswerDetailResponse（PATCH用）
| フィールド | 型 | 説明 |
|-----------|-----|------|
| `updatedFields` | string[] | 更新されたフィールド一覧 |
| `calculatedFields` | object | 再計算されたフィールド |

---

## クエリパラメータの追加（reference版に未記載）

### GET /api/v1/forms
| パラメータ | 説明 |
|-----------|------|
| `state` | DRAFT / PUBLISHED フィルタ |

### GET /api/v1/forms/{formId}/answers
| パラメータ | 説明 |
|-----------|------|
| `search` | 検索キーワード（部分一致、最大200文字） |

### GET /api/v1/forms/{formId}/answers/{answerId}
| パラメータ | 説明 |
|-----------|------|
| `recalculate` | true で最新スキーマに基づいて再計算 |
| `enrich` | `hierarchical` で階層的にデータを展開 |

### GET /api/v1/screens
| パラメータ | 説明 |
|-----------|------|
| `status` | DRAFT / PUBLISHED / DELETED フィルタ |

---

## 権限モデルの補足

reference版では権限が「ADMIN / USER / VIEWER」の3ロールのみ記載されていましたが、実際には：

- ロールはカスタム作成可能（`/api/admin/roles`）
- 権限は「リソース:アクション」形式で細粒度管理
- 個別データベースレベルの権限（VIEW/EDIT/BUSINESS_ACCESS）が追加
- DEVELOPER ロールが存在

---

## メニューAPIの権限フィルタリング

- DEVELOPER/USER権限の場合、`BUSINESS_ACCESS` 権限がないデータベースのメニュー項目は非表示
- ADMINは全メニュー表示

---

## 一括操作の詳細

### reference版との差異
1. **一括作成と一括更新は別エンドポイント**: `POST /bulk`（作成）、`PUT /bulk`（更新）
2. **部分成功をサポート**: 一部のみ失敗した場合、成功分は処理され、個別の結果リストが返却される

---

## ARRAYフィールド（サブレコード）のデータ投入に関する重大な注意

### 問題

Nodes API（`POST /api/answers/{answerId}/nodes`）でサブレコードを作成しても、**一覧画面のテーブル表示にサブレコードが反映されない**（「0件」と表示される）。

### 原因（自動同期実装以前）

以前は一覧画面が `answerData`（検索インデックス）を参照しており、Nodes API で作成したデータはノードツリーには追加されるが answerData には反映されなかった。

### 現在の状況（自動同期で改善済み）

自動同期実装により、通常の Node 操作（作成・削除・移動・更新）後の `rebuild-index` は不要。Nodes API で作成したサブレコードも answerData に自動同期される。

ただし、初期データ投入時は answerData に直接配列として含める方式も引き続き有効であり、大量データの一括投入にはこちらを推奨。

```json
// ✅ 方法1（推奨: 初期データ投入時）: answerData に ARRAY を直接書く
POST /api/v1/forms/{formId}/answers
{
  "answerData": {
    "name": "顧客名",
    "properties": [
      {"address": "東京都港区", "purchase_price": 3000},
      {"address": "大阪府大阪市", "purchase_price": 2500}
    ]
  }
}

// ✅ 方法2（自動同期実装以降）: Nodes APIで個別追加 → answerDataに自動同期される
```

ネストされたARRAY（3階層）も answerData の中にそのままネストして書く。

---

**作成日**: 2026-03-16
**更新日**: 2026-03-24
