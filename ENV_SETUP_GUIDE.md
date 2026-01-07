# 環境変数の設定方法 - 超わかりやすいガイド

## 方法A: JSONファイルの内容を環境変数に設定

### ステップ1: JSONファイルを開く

1. ダウンロードしたJSONファイルを見つける
   - 通常は「ダウンロード」フォルダにあります
   - ファイル名は `プロジェクト名-xxxxx.json` のような形式です

2. JSONファイルを開く
   - ファイルをダブルクリック
   - メモ帳やテキストエディットで開きます

### ステップ2: JSONファイルの内容をすべてコピー

1. JSONファイルを開いた状態で、**すべての内容を選択**します
   - Windows: `Ctrl + A`（コントロールキーを押しながらAキー）
   - Mac: `Cmd + A`（コマンドキーを押しながらAキー）
   - または、マウスで最初から最後までドラッグして選択

2. **すべての内容をコピー**します
   - Windows: `Ctrl + C`
   - Mac: `Cmd + C`
   - または、右クリック → 「コピー」

**コピーする内容の例**:
```json
{
  "type": "service_account",
  "project_id": "your-project-123456",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "seo-article-creator@your-project-123456.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/seo-article-creator%40your-project-123456.iam.gserviceaccount.com"
}
```

### ステップ3: .env.localファイルを開く（または作成）

1. プロジェクトのフォルダを開く
   - `/Users/katanoyousuke/Cursorテスト/新しいフォルダ/汎用型SEO記事作成システム/` を開く

2. `.env.local` ファイルを探す
   - ファイル名が `.env.local` のファイルを探します
   - 見つからない場合は、新規作成します

3. `.env.local` ファイルを開く
   - テキストエディタ（メモ帳、テキストエディット、VS Codeなど）で開きます

### ステップ4: 環境変数を追加

`.env.local` ファイルに、以下の内容を追加します：

```env
GEMINI_API_KEY=AIzaSyC-SzSVqT8Ygsfx02-TsaNjmFlVJemiyA8
ANTHROPIC_API_KEY=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

GOOGLE_SHEETS_SPREADSHEET_ID=1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project-123456","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"seo-article-creator@your-project-123456.iam.gserviceaccount.com","client_id":"123456789012345678901","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}'
```

### ステップ5: JSONの内容を1行にまとめる（重要！）

環境変数では改行が使えないため、JSONを1行にまとめる必要があります。

#### 方法1: 手動で1行にする

1. コピーしたJSONの内容をメモ帳などに貼り付け
2. すべての改行を削除して1行にする
3. 前後にシングルクォート `'` を追加

#### 方法2: オンラインツールを使う（簡単）

1. ブラウザで [JSON Minifier](https://jsonformatter.org/json-minify) などのツールを開く
2. JSONの内容を貼り付け
3. 「Minify」ボタンをクリック
4. 1行になったJSONをコピー
5. `.env.local` に貼り付け、前後にシングルクォート `'` を追加

#### 方法3: VS Codeを使う場合

1. JSONファイルをVS Codeで開く
2. すべて選択（`Cmd+A` / `Ctrl+A`）
3. 右クリック → 「フォーマット」→「JSONを圧縮」
4. 1行になったJSONをコピー
5. `.env.local` に貼り付け、前後にシングルクォート `'` を追加

### ステップ6: .env.localファイルに追加

`.env.local` ファイルの最後に、以下の形式で追加します：

```env
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

**重要なポイント**:
- `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON=` の後に、シングルクォート `'` を付ける
- JSONの内容を1行で貼り付ける
- 最後にシングルクォート `'` を付ける
- 改行は入れない（1行で書く）

### ステップ7: ファイルを保存

1. `.env.local` ファイルを保存
   - Windows: `Ctrl + S`
   - Mac: `Cmd + S`
   - または、メニューから「保存」

### ステップ8: 開発サーバーを再起動

環境変数の変更を反映するため、開発サーバーを再起動します：

1. ターミナルで実行中のサーバーを停止
   - `Ctrl + C`（コントロールキーを押しながらCキー）

2. 再度起動
   ```bash
   npm run dev
   ```

## 完成例

`.env.local` ファイルの完成例：

```env
GEMINI_API_KEY=AIzaSyC-SzSVqT8Ygsfx02-TsaNjmFlVJemiyA8
ANTHROPIC_API_KEY=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

GOOGLE_SHEETS_SPREADSHEET_ID=1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"my-project-123456","private_key_id":"abc123def456","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"seo-article-creator@my-project-123456.iam.gserviceaccount.com","client_id":"123456789012345678901","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/seo-article-creator%40my-project-123456.iam.gserviceaccount.com"}'
```

## よくある質問

### Q: JSONを1行にするのが難しい
A: オンラインツール（JSON Minifier）を使うと簡単です。または、VS Codeの「JSONを圧縮」機能を使います。

### Q: シングルクォートとダブルクォートの違いは？
A: 
- シングルクォート `'` : 環境変数の値を囲むために使用
- ダブルクォート `"` : JSON内の文字列を囲むために使用（そのまま）

### Q: エラーが出る
A: 
- JSONが1行になっているか確認
- シングルクォートで囲まれているか確認
- JSONの形式が正しいか確認（カンマの位置など）

### Q: 改行を削除する方法は？
A: 
- メモ帳などで、改行を検索して削除
- または、オンラインツールを使う


