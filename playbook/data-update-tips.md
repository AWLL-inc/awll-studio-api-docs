# AWLL Studio データ更新のコツ

## 504 Gateway Timeout を避けるために

### 原因

3階層以上のネストされた ARRAY データを含むレコードの PUT 更新で、504 Gateway Timeout が発生することがあります。

- 例: 案件20件以上 × 各案件の月次売上10件以上 = 200件超のサブレコード
- CloudFront のタイムアウト（約30秒）以内にサーバー側の処理が完了しない

### 対策

#### 1. 新規作成（POST）は大丈夫

POST `/api/v1/forms/{formId}/answers` は大量のネストデータでも成功します。
PUT で 504 が出る場合は、レコードを **DELETE → POST で再作成** する方が確実です。

```
# ❌ 大量データの PUT 更新 → 504
PUT /api/v1/forms/{formId}/answers/{answerId}

# ✅ 削除して再作成
DELETE /api/v1/forms/{formId}/answers/{answerId}
POST /api/v1/forms/{formId}/answers
```

> **注意**: DELETE → POST すると answerId が変わります。外部からリンクしている場合は影響あり。

#### 2. Nodes API で個別ノードを更新

特定のサブレコードだけ更新したい場合は、Nodes API で個別ノードを更新します。

```
PUT /api/answers/{answerId}/nodes/{rowId}
Body: { "data": { "name": "プロジェクトA", "status": "active", "monthly_sales": [...] } }
```

**重要**: 全フィールドを含めること。送らなかったフィールドは消えます。

#### 3. Nodes API の注意点

- Nodes API で更新しても **answerData（検索インデックス）には反映されない**
- カスタム画面（Screen SDK）は answerData を読むため、Nodes API だけでは画面に反映されない
- 504 が出ても **サーバー側では処理が完了している場合がある**

### まとめ

| 操作 | 方法 | answerData反映 | 504リスク |
|------|------|---------------|----------|
| 新規作成 | POST /answers | ○ | 低 |
| 全体更新 | PUT /answers/{id} | ○ | **高**（ネスト多い場合） |
| 個別ノード更新 | PUT /nodes/{rowId} | × | 中 |
| 削除→再作成 | DELETE + POST | ○ | 低 |
| UI手動更新 | AWLL Studio画面 | ○ | なし |
