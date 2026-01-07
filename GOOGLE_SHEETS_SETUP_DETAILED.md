# Google Sheets API連携 - 詳細セットアップガイド

## ステップバイステップ手順

### ステップ1: Google Cloud Consoleにアクセス

1. ブラウザで [Google Cloud Console](https://console.cloud.google.com/) を開く
2. Googleアカウントでログイン（必要に応じて）

### ステップ2: プロジェクトを作成（または選択）

1. 画面上部の「プロジェクトの選択」をクリック
2. 「新しいプロジェクト」をクリック
3. プロジェクト名を入力（例：`SEO記事作成システム`）
4. 「作成」をクリック
5. プロジェクトが作成されたら、そのプロジェクトを選択

### ステップ3: Google Sheets APIを有効化

1. 左側のメニューから「☰」（ハンバーガーメニュー）をクリック
2. 「APIとサービス」→「ライブラリ」を選択
3. 検索バーに「Google Sheets API」と入力
4. 「Google Sheets API」をクリック
5. 「有効にする」ボタンをクリック
6. 有効化が完了するまで待つ（数秒〜1分程度）

### ステップ4: サービスアカウントを作成

1. 左側のメニューから「APIとサービス」→「認証情報」を選択
2. 画面上部の「+ 認証情報を作成」をクリック
3. 「サービスアカウント」を選択

#### サービスアカウントの詳細設定

**ステップ4-1: サービスアカウント情報**
- サービスアカウント名：`seo-article-creator`（任意の名前でOK）
- サービスアカウントID：自動生成される（そのままでOK）
- 説明（任意）：`SEO記事作成システム用のサービスアカウント`
- 「作成して続行」をクリック

**ステップ4-2: ロールの付与（オプション）**
- このステップはスキップしてもOK（「続行」をクリック）
- または「編集者」を選択して「続行」をクリック

**ステップ4-3: ユーザーへのアクセス権の付与（オプション）**
- このステップはスキップしてOK（「完了」をクリック）

### ステップ5: JSONキーをダウンロード

1. 「認証情報」ページに戻る
2. 作成したサービスアカウントの名前（例：`seo-article-creator@プロジェクト名.iam.gserviceaccount.com`）をクリック
3. 上部のタブから「キー」を選択
4. 「キーを追加」→「新しいキーを作成」をクリック
5. キーのタイプで「JSON」を選択
6. 「作成」をクリック
7. **JSONファイルが自動的にダウンロードされます**

**重要**: このJSONファイルは再ダウンロードできないため、安全な場所に保存してください。

### ステップ6: JSONファイルの内容を確認

ダウンロードしたJSONファイルを開くと、以下のような内容が表示されます：

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "xxxxx",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "seo-article-creator@your-project-id.iam.gserviceaccount.com",
  "client_id": "xxxxx",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**特に重要な項目**:
- `client_email`: このメールアドレスを次のステップで使用します

### ステップ7: スプレッドシートをサービスアカウントと共有

1. スプレッドシートを開く：
   https://docs.google.com/spreadsheets/d/1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA/edit

2. 右上の「共有」ボタンをクリック

3. 「ユーザーやグループを追加」の欄に、JSONファイル内の `client_email` の値をコピー&ペースト
   - 例：`seo-article-creator@your-project-id.iam.gserviceaccount.com`

4. 権限を「閲覧者」に設定（読み取り専用でOK）

5. 「送信」をクリック

6. 「通知を送信しない」にチェックを入れて「送信」をクリック（サービスアカウントには通知不要）

### ステップ8: 環境変数に設定

`.env.local` ファイルを開き、以下のいずれかの方法で設定します。

#### 方法A: JSONファイルの内容を環境変数に設定（推奨）

1. ダウンロードしたJSONファイルを開く
2. 内容をすべてコピー（Ctrl+A / Cmd+A → Ctrl+C / Cmd+C）
3. `.env.local` に以下を追加：

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**注意点**:
- JSON全体をシングルクォート `'` で囲む
- JSON内の改行（`\n`）はそのまま残す（エスケープ不要）
- ダブルクォートはそのまま使用可能

#### 方法B: JSONファイルを配置する方法

1. プロジェクトの `keys/` ディレクトリにJSONファイルを配置
2. ファイル名を `google-sheets-service-account.json` にリネーム
3. `.env.local` に以下を追加：

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA
GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH=keys/google-sheets-service-account.json
```

### ステップ9: 動作確認

1. 開発サーバーを再起動（`.env.local` の変更を反映）
2. 内部リンクAPIを呼び出す
3. ログに「Fetched X articles from Google Sheets」と表示されれば成功

## トラブルシューティング

### エラー: "認証情報の読み込みに失敗しました"
- JSONファイルのパスが正しいか確認
- 環境変数の設定が正しいか確認
- JSONファイルの形式が正しいか確認

### エラー: "Permission denied" または "アクセスが拒否されました"
- スプレッドシートがサービスアカウントと共有されているか確認
- `client_email` の値が正しいか確認
- スプレッドシートの共有設定を確認

### エラー: "APIが有効になっていません"
- Google Sheets APIが有効化されているか確認
- プロジェクトが正しく選択されているか確認

## セキュリティに関する注意事項

- JSONキーファイルは機密情報です。Gitにコミットしないでください
- `.gitignore` に `keys/` と `.env.local` が追加されています
- JSONファイルを他人と共有しないでください
- サービスアカウントのキーが漏洩した場合は、すぐにキーを削除して新しいキーを作成してください


