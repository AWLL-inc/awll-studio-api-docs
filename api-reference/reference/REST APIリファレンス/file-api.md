# ファイル操作 API

## 概要

S3 presigned URL 方式によるファイルのアップロード・ダウンロード・削除 API です。
レコードの FILE 型フィールドへのファイル添付に使用します。

**ベースパス**: `/api/v1/files`

> **Screen SDK との関係**: Screen SDK の [`useFileUpload()`](../../sdk/screen-sdk-reference.md#usefileupload) フックは、内部でこの REST API を呼び出しています。外部連携やバッチ処理では REST API を直接使用してください。

---

## エンドポイント一覧

| Method | Path | 説明 | 権限 |
|--------|------|------|------|
| POST | `/api/v1/files/presign/upload` | アップロード用 presigned URL 発行 | FORM_ANSWER:WRITE + BUSINESS_ACCESS |
| GET | `/api/v1/files/presign/download` | ダウンロード用 presigned URL 発行 | FORM_ANSWER:READ + BUSINESS_ACCESS |
| DELETE | `/api/v1/files` | ファイル削除 | FORM_ANSWER:WRITE + BUSINESS_ACCESS |

---

## POST /api/v1/files/presign/upload

S3 へのファイルアップロード用 presigned PUT URL を発行します。

### アップロードフロー（3ステップ）

```
1. POST /api/v1/files/presign/upload → presigned URL + key 取得
2. PUT {uploadUrl} (Content-Type: ファイルのMIMEタイプ, Body: バイナリ, Headers: レスポンスの headers)
3. PATCH /api/v1/forms/{formId}/answers/{answerId}
   → ファイルメタデータをレコードの FILE フィールドに保存
```

### リクエスト

```bash
curl -X POST "${BASE_URL}/api/v1/files/presign/upload" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Tenant-Code: ${TENANT}" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "fieldId": "receipts",
    "formId": "01KP4MD4N7GCGCPKQKJ4YNZCEN",
    "answerId": "01ABCDEF12345678",
    "fileName": "invoice-2026-05.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 245760
  }'
```

| フィールド | 型 | 必須 | バリデーション | 説明 |
|-----------|-----|------|--------------|------|
| fieldId | string | Yes | NotBlank | フィールドコード（FILE型フィールドの `fieldCode`） |
| formId | string | No | - | データベースID。指定時は BUSINESS_ACCESS 権限を検証 |
| answerId | string | No | - | レコードID |
| fileName | string | Yes | NotBlank | ファイル名 |
| mimeType | string | Yes | MIME形式 | MIMEタイプ（例: `application/pdf`, `image/png`） |
| sizeBytes | number | Yes | 正の整数 | ファイルサイズ（バイト） |
| maxSizeBytes | number | No | - | 上限バイト数（フィールド定義の `maxSizeMB` から算出。未指定時はシステム上限 100MB） |

### レスポンス (200)

```json
{
  "key": "tenants/DEMO/forms/01KP4MD.../answers/01ABC.../fields/receipts/01J5K.../invoice-2026-05.pdf",
  "uploadUrl": "https://s3.ap-northeast-1.amazonaws.com/...",
  "headers": {
    "x-amz-server-side-encryption": "aws:kms",
    "x-amz-server-side-encryption-aws-kms-key-id": "..."
  },
  "expiresAt": "2026-05-20T10:05:00Z"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| key | string | S3 オブジェクトキー。レコード保存時にこの値を使用 |
| uploadUrl | string | presigned PUT URL（**5分間有効**） |
| headers | object / null | S3 PUT 時に付与すべきヘッダー（KMS暗号化用等） |
| expiresAt | string | URL有効期限（ISO 8601） |

### S3 へのアップロード

presigned URL に対してファイルバイナリを PUT します。

```bash
curl -X PUT "${UPLOAD_URL}" \
  -H "Content-Type: application/pdf" \
  -H "x-amz-server-side-encryption: aws:kms" \
  -H "x-amz-server-side-encryption-aws-kms-key-id: ${KMS_KEY_ID}" \
  --data-binary @invoice-2026-05.pdf
```

> **重要**: `headers` フィールドが返却された場合、それらのヘッダーを S3 PUT リクエストに必ず含めてください。含めないと 403 エラーになります。

### レコードへのメタデータ保存

アップロード完了後、ファイルメタデータをレコードの FILE フィールドに保存します。

```bash
# 単一ファイルフィールドの場合
curl -X PATCH "${BASE_URL}/api/v1/forms/${FORM_ID}/answers/${ANSWER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Tenant-Code: ${TENANT}" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "operations": [
      {
        "op": "replace",
        "path": "/receipts",
        "value": {
          "key": "tenants/DEMO/forms/01KP4MD.../...",
          "fileName": "invoice-2026-05.pdf",
          "mimeType": "application/pdf",
          "size": 245760,
          "uploadedAt": "2026-05-20T10:01:00Z"
        }
      }
    ]
  }'
```

```bash
# 複数ファイルフィールド（allowMultiple: true）の場合
# 既存ファイルを維持しつつ追加するには、既存の配列に追加した値を送信
curl -X PATCH "${BASE_URL}/api/v1/forms/${FORM_ID}/answers/${ANSWER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Tenant-Code: ${TENANT}" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "operations": [
      {
        "op": "replace",
        "path": "/receipts",
        "value": [
          {
            "key": "tenants/DEMO/forms/.../existing-file.pdf",
            "fileName": "existing-file.pdf",
            "mimeType": "application/pdf",
            "size": 102400,
            "uploadedAt": "2026-05-19T08:00:00Z"
          },
          {
            "key": "tenants/DEMO/forms/.../invoice-2026-05.pdf",
            "fileName": "invoice-2026-05.pdf",
            "mimeType": "application/pdf",
            "size": 245760,
            "uploadedAt": "2026-05-20T10:01:00Z"
          }
        ]
      }
    ]
  }'
```

### FileMetadata 構造

レコードの FILE 型フィールドに保存するメタデータの構造:

```json
{
  "key": "tenants/{tenantCode}/forms/{formId}/answers/{answerId}/fields/{fieldId}/{uuid}/{fileName}",
  "fileName": "invoice-2026-05.pdf",
  "mimeType": "application/pdf",
  "size": 245760,
  "uploadedAt": "2026-05-20T10:01:00Z"
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| key | string | S3 オブジェクトキー（presign/upload レスポンスの `key`） |
| fileName | string | ファイル名 |
| mimeType | string | MIMEタイプ |
| size | number | ファイルサイズ（バイト） |
| uploadedAt | string | アップロード日時（ISO 8601） |

### セキュリティ制約

- **MIME タイプブロックリスト**: `text/html`, `application/javascript` 等の XSS 危険なタイプは拒否（400 エラー）
- **ファイルサイズ上限**: システム上限 100MB。フィールド定義の `maxSizeMB` で個別に制限可能
- **テナント分離**: S3 キーにテナントコードが含まれ、ダウンロード・削除時にテナント境界を検証
- **ファイル名サニタイズ**: パストラバーサル・Content-Disposition インジェクション防止

### エラーレスポンス

| HTTPコード | 説明 |
|------------|------|
| 400 | バリデーションエラー（MIME タイプ不正、サイズ超過、ブロックリスト該当） |
| 401 | 認証エラー |
| 403 | 権限不足（FORM_ANSWER:WRITE / BUSINESS_ACCESS） |

---

## GET /api/v1/files/presign/download

S3 からのファイルダウンロード用 presigned GET URL を発行します。

### リクエスト

```bash
curl -G "${BASE_URL}/api/v1/files/presign/download" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Tenant-Code: ${TENANT}" \
  --data-urlencode "key=tenants/DEMO/forms/01KP4MD.../invoice-2026-05.pdf" \
  --data-urlencode "download=true"
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| key | string (query) | Yes | S3 オブジェクトキー |
| download | boolean (query) | No | `true`: `Content-Disposition: attachment` 設定（デフォルト: `false`） |

### レスポンス (200)

```json
{
  "url": "https://s3.ap-northeast-1.amazonaws.com/...?X-Amz-Signature=..."
}
```

| フィールド | 型 | 説明 |
|-----------|-----|------|
| url | string | presigned GET URL（**15分間有効**） |

### エラーレスポンス

| HTTPコード | 説明 |
|------------|------|
| 401 | 認証エラー |
| 403 | 権限不足（FORM_ANSWER:READ / BUSINESS_ACCESS） |

---

## DELETE /api/v1/files

S3 上のファイルを削除します。

> **注意**: ファイル削除後は、レコード側でも FILE フィールドの値を `null`（または配列から該当要素を除去）に更新してください。

### リクエスト

```bash
curl -X DELETE "${BASE_URL}/api/v1/files?key=tenants/DEMO/forms/01KP4MD.../invoice-2026-05.pdf" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Tenant-Code: ${TENANT}"
```

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| key | string (query) | Yes | S3 オブジェクトキー |

### レスポンス

- **204 No Content**: 削除成功

### エラーレスポンス

| HTTPコード | 説明 |
|------------|------|
| 401 | 認証エラー |
| 403 | 権限不足（FORM_ANSWER:WRITE / BUSINESS_ACCESS） |

---

## S3 キー設計

ファイルは以下のキー形式で S3 に保存されます:

```
tenants/{tenantCode}/forms/{formId}/answers/{answerId}/fields/{fieldId}/{uuid}/{fileName}
tenants/{tenantCode}/fields/{fieldId}/{uuid}/{fileName}  （formId 省略時）
```

- `tenantCode`: テナントコード（テナント分離のプレフィックス）
- `formId`: データベースID
- `answerId`: レコードID
- `fieldId`: フィールドコード
- `uuid`: 一意識別子（衝突防止）
- `fileName`: サニタイズ済みファイル名

---

## 完全なフロー例: 請求書 PDF をレコードに添付

```bash
# 1. 認証トークン取得
TOKEN=$(curl -s -X POST "${BASE_URL}/api/auth/token" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"xxx"}' \
  | jq -r '.idToken')

# 2. レコード作成
ANSWER_ID=$(curl -s -X POST "${BASE_URL}/api/v1/forms/${FORM_ID}/answers" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Tenant-Code: ${TENANT}" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{
    "answerData": {
      "payee": "株式会社ABC",
      "amount_incl_tax": 110000,
      "status": "approved"
    }
  }' | jq -r '.answerId')

# 3. Presigned URL 取得
PRESIGN=$(curl -s -X POST "${BASE_URL}/api/v1/files/presign/upload" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Tenant-Code: ${TENANT}" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "{
    \"fieldId\": \"receipts\",
    \"formId\": \"${FORM_ID}\",
    \"answerId\": \"${ANSWER_ID}\",
    \"fileName\": \"invoice.pdf\",
    \"mimeType\": \"application/pdf\",
    \"sizeBytes\": $(stat -c%s invoice.pdf)
  }")

UPLOAD_URL=$(echo "$PRESIGN" | jq -r '.uploadUrl')
S3_KEY=$(echo "$PRESIGN" | jq -r '.key')

# 4. S3 にアップロード（headers も付与）
curl -X PUT "${UPLOAD_URL}" \
  -H "Content-Type: application/pdf" \
  $(echo "$PRESIGN" | jq -r '.headers // {} | to_entries[] | "-H \(.key): \(.value)"') \
  --data-binary @invoice.pdf

# 5. レコードにファイルメタデータを保存
curl -X PATCH "${BASE_URL}/api/v1/forms/${FORM_ID}/answers/${ANSWER_ID}" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "X-Tenant-Code: ${TENANT}" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "{
    \"operations\": [{
      \"op\": \"replace\",
      \"path\": \"/receipts\",
      \"value\": {
        \"key\": \"${S3_KEY}\",
        \"fileName\": \"invoice.pdf\",
        \"mimeType\": \"application/pdf\",
        \"size\": $(stat -c%s invoice.pdf),
        \"uploadedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
      }
    }]
  }"
```

---

## 関連

- Screen SDK: [useFileUpload()](../../sdk/screen-sdk-reference.md#usefileupload)
- [レコード CRUD（PATCH操作）](./form-answers-api.md)
- [AI ファイルアップロード（AI用）](./ai-api.md#post-apiv1aiupload) — AI解析用の別エンドポイント

---

**追加日**: 2026-05-20（ドキュメント追加 — 実装は PR #1144 で追加済み）
