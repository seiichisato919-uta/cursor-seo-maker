# Google Sheets API連携セットアップガイド

## 手順1: Google Cloud Consoleでプロジェクトを作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. プロジェクト名を入力して作成

## 手順2: Google Sheets APIを有効化

1. Google Cloud Consoleの左メニューから「APIとサービス」→「ライブラリ」を選択
2. 「Google Sheets API」を検索
3. 「Google Sheets API」を選択して「有効にする」をクリック

## 手順3: サービスアカウントを作成

1. Google Cloud Consoleの左メニューから「APIとサービス」→「認証情報」を選択
2. 上部の「認証情報を作成」→「サービスアカウント」を選択
3. サービスアカウント名を入力（例：`seo-article-creator`）
4. 「作成して続行」をクリック
5. ロールは「編集者」を選択（または必要に応じて調整）
6. 「完了」をクリック

## 手順4: 認証情報（JSONキー）をダウンロード

1. 作成したサービスアカウントをクリック
2. 「キー」タブを選択
3. 「キーを追加」→「新しいキーを作成」を選択
4. キーのタイプで「JSON」を選択
5. 「作成」をクリック
6. JSONファイルがダウンロードされます

## 手順5: JSONキーファイルをプロジェクトに配置

1. ダウンロードしたJSONファイルをプロジェクトの `keys/` ディレクトリに配置
2. ファイル名を `google-sheets-service-account.json` にリネーム（または任意の名前）
3. **重要**: `.gitignore` に `keys/` を追加して、Gitにコミットしないようにする

## 手順6: スプレッドシートをサービスアカウントと共有

1. スプレッドシート（https://docs.google.com/spreadsheets/d/1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA/edit）を開く
2. 右上の「共有」ボタンをクリック
3. サービスアカウントのメールアドレス（JSONファイル内の `client_email` の値）を入力
4. 権限を「閲覧者」に設定
5. 「送信」をクリック

## 手順7: 環境変数の設定

`.env.local` ファイルに以下を追加します。

### 方法A: JSONファイルを使用する場合（推奨：セキュリティ面で安全）

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA
GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH=keys/google-sheets-service-account.json
```

### 方法B: 環境変数に直接JSONを設定する場合

JSONファイルの内容を1行にまとめて、環境変数に設定します：

```env
GOOGLE_SHEETS_SPREADSHEET_ID=1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
```

**注意**: JSONファイルの内容をそのままコピーして、シングルクォートで囲んでください。

## 完了

これで、Google Sheets APIを使ってスプレッドシートのデータを自動的に取得できるようになります。

## 認証情報の共有方法

JSONファイルの内容を共有する場合は、以下の形式で `.env.local` に設定してください：

1. JSONファイルを開く
2. 内容をすべてコピー
3. `.env.local` の `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` に貼り付け（シングルクォートで囲む）

