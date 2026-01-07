# クォータエラーの解決方法

## エラーの原因

エラーメッセージから、以下のことが分かります：
- `gemini-3-pro-preview`モデルの無料枠リクエスト制限に達した
- 無料枠の制限が0に設定されている可能性がある

## 解決方法

### 方法1: Google Cloud Consoleでクォータを確認・増加させる（推奨）

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクト「my-seo-system」を選択
3. 左メニューから「APIとサービス」→「割り当て」を選択
4. 検索バーに「Generative Language API」と入力
5. 「Generative Language API」の割り当てを確認
6. 必要に応じて割り当ての増加をリクエスト

### 方法2: 請求アカウントの設定を再確認

1. [Google Cloud Console 請求ページ](https://console.cloud.google.com/billing) にアクセス
2. 「請求先アカウント2」をクリック
3. 「請求アカウントの詳細」で以下を確認：
   - 請求アカウントのステータスが「アクティブ」になっているか
   - 支払い方法が正しく設定されているか
   - クレジットカード情報が有効か

### 方法3: 別のモデルに変更（一時的な解決策）

`gemini-3-pro-preview`が無料枠で利用できない場合、以下のモデルに変更できます：

- `gemini-1.5-pro`（有料だが、請求アカウントがあれば利用可能）
- `gemini-1.5-flash`（より安価）

## クォータの確認手順（詳細）

### ステップ1: 割り当てページにアクセス

1. Google Cloud Consoleでプロジェクト「my-seo-system」を選択
2. 左メニューから「APIとサービス」→「割り当て」を選択
3. または、直接URLにアクセス：
   ```
   https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
   ```

### ステップ2: クォータを確認

1. 検索バーに「generate_content」と入力
2. 以下のクォータを確認：
   - `generate_content_free_tier_requests`（無料枠リクエスト）
   - `generate_content_requests_per_minute`（1分あたりのリクエスト数）
   - `generate_content_requests_per_day`（1日あたりのリクエスト数）

### ステップ3: クォータの増加をリクエスト（必要な場合）

1. 増加したいクォータを選択
2. 「割り当ての編集」または「Edit Quotas」をクリック
3. 新しい制限値を入力
4. 「送信」をクリック
5. 承認まで数日かかる場合があります

## トラブルシューティング

### Q: 請求アカウントがリンクされているのに、まだエラーが出る
A: 
- 数分待ってから再度試す（反映に時間がかかる場合があります）
- 請求アカウントのステータスが「アクティブ」になっているか確認
- 支払い方法が正しく設定されているか確認

### Q: クォータの増加リクエストが承認されない
A: 
- Google Cloud Consoleのサポートに問い合わせる
- または、別のモデル（gemini-1.5-proなど）に変更する

### Q: すぐに使いたい
A: 
- 別のモデル（gemini-1.5-pro）に変更することを検討してください
- コードを変更してモデル名を変更する必要があります

## 次のステップ

1. Google Cloud Consoleでクォータを確認
2. 必要に応じてクォータの増加をリクエスト
3. または、別のモデルに変更する


