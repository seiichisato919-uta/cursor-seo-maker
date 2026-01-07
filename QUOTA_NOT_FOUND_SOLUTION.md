# クォータが見つからない場合の対処法

## 問題の原因

`generate_content_free_tier_requests`が見つからない場合、`gemini-3-pro-preview`モデルが無料枠（free tier）に対応していない可能性があります。

## 確認すべき他のクォータ

### 1. 一般的なリクエスト制限を確認

フィルター欄で以下を検索してください：

1. **`generate_content_requests_per_minute`**（1分あたりのリクエスト数）
2. **`generate_content_requests_per_day`**（1日あたりのリクエスト数）
3. **`generate_content`**（より広い検索）

これらのクォータの制限値を確認してください。

### 2. モデル固有のクォータを確認

フィルター欄で以下を検索してください：

1. **`gemini-3-pro`**（モデル名で検索）
2. **`gemini-3-pro-preview`**（完全なモデル名で検索）

## 解決方法

### 方法1: 別のモデルに変更（推奨）

`gemini-3-pro-preview`が無料枠に対応していない場合、以下のモデルに変更することを検討してください：

- **`gemini-1.5-pro`**（有料だが、請求アカウントがあれば利用可能）
- **`gemini-1.5-flash`**（より安価で高速）

### 方法2: 請求アカウントの設定を再確認

1. [Google Cloud Console 請求ページ](https://console.cloud.google.com/billing) にアクセス
2. 「請求先アカウント2」をクリック
3. 以下を確認：
   - ステータスが「アクティブ」になっているか
   - 支払い方法が正しく設定されているか
   - クレジットカード情報が有効か

### 方法3: Google AI Studioで確認

1. [Google AI Studio](https://aistudio.google.com/) にアクセス
2. 右上のアカウントアイコンをクリック
3. 「設定」または「Settings」を選択
4. 「プランと請求」または「Plan & Billing」セクションを確認
5. 有料プランが有効になっているか確認

## 推奨される対応

`gemini-3-pro-preview`が無料枠に対応していない可能性が高いため、以下のいずれかを検討してください：

1. **`gemini-1.5-pro`に変更する**（請求アカウントがあれば利用可能）
2. **Google AI Studioで有料プランの設定を確認する**

## 次のステップ

1. まず、他のクォータ（`generate_content_requests_per_minute`など）を確認
2. それでも解決しない場合は、モデルの変更を検討
3. または、Google AI Studioで有料プランの設定を確認


