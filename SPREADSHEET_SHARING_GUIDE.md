# スプレッドシートの共有方法 - 超わかりやすいガイド

## ステップ1: JSONファイルを開く

1. ダウンロードしたJSONファイルを見つける
   - 通常は「ダウンロード」フォルダに保存されています
   - ファイル名は `プロジェクト名-xxxxx.json` のような形式です

2. JSONファイルを開く
   - ファイルをダブルクリック
   - テキストエディタ（メモ帳、テキストエディットなど）で開きます

## ステップ2: client_email を見つける

開いたJSONファイルの中身は、以下のような形式になっています：

```json
{
  "type": "service_account",
  "project_id": "your-project-123456",
  "private_key_id": "abc123def456...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "seo-article-creator@your-project-123456.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

**見つけるべきもの**:
- `"client_email":` という行を探してください
- その行の `:` の後にある、`"` で囲まれたメールアドレス形式の文字列が `client_email` です

**例**:
```
"client_email": "seo-article-creator@your-project-123456.iam.gserviceaccount.com"
```

この場合、`seo-article-creator@your-project-123456.iam.gserviceaccount.com` の部分が `client_email` の値です。

## ステップ3: client_email の値をコピー

1. `client_email` の行を見つける
2. `:` の後、`"` と `"` の間にあるメールアドレス部分をマウスで選択（ドラッグ）
   - 例：`seo-article-creator@your-project-123456.iam.gserviceaccount.com`
3. 右クリック → 「コピー」を選択（または Ctrl+C / Cmd+C）

**コピーするのは**:
- ✅ `seo-article-creator@your-project-123456.iam.gserviceaccount.com` の部分だけ
- ❌ `"client_email":` の部分は含めない
- ❌ 前後の `"` も含めない

## ステップ4: スプレッドシートを開く

1. ブラウザで以下のURLを開く：
   https://docs.google.com/spreadsheets/d/1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA/edit

2. スプレッドシートが開きます

## ステップ5: 共有ボタンをクリック

1. スプレッドシートの右上を見てください
2. 「共有」という青いボタンがあります
3. その「共有」ボタンをクリック

## ステップ6: client_email の値を貼り付け

1. 「共有」ボタンをクリックすると、共有設定のウィンドウが開きます

2. 「ユーザーやグループを追加」という欄があります
   - この欄は、メールアドレスを入力するテキストボックスです

3. ステップ3でコピーした `client_email` の値を貼り付けます
   - テキストボックスをクリック
   - 右クリック → 「貼り付け」を選択（または Ctrl+V / Cmd+V）
   - または、テキストボックスに直接ペースト

4. 貼り付けたメールアドレスが表示されます
   - 例：`seo-article-creator@your-project-123456.iam.gserviceaccount.com`

## ステップ7: 権限を設定

1. メールアドレスの右側に「編集者」というドロップダウンメニューがあります
2. そのドロップダウンをクリック
3. 「閲覧者」を選択
   - 読み取り専用でOKです

## ステップ8: 送信

1. 「通知を送信しない」にチェックを入れる（サービスアカウントには通知不要）
2. 「送信」または「共有」ボタンをクリック
3. 共有が完了します

## 完了！

これで、サービスアカウントがスプレッドシートにアクセスできるようになりました。

## よくある質問

### Q: client_email が見つからない
A: JSONファイルを開いて、`"client_email"` という文字列を検索（Ctrl+F / Cmd+F）してください。

### Q: どの部分をコピーすればいい？
A: `:` の後、`"` と `"` の間のメールアドレス部分だけです。
- ✅ コピーする：`seo-article-creator@your-project-123456.iam.gserviceaccount.com`
- ❌ コピーしない：`"client_email": "seo-article-creator@...`（全体）

### Q: 共有ボタンが見つからない
A: スプレッドシートの右上を確認してください。もしくは、スプレッドシートのURLが正しいか確認してください。

### Q: メールアドレスを貼り付けたけどエラーが出る
A: 前後の `"` が含まれていないか確認してください。メールアドレス部分だけをコピーしてください。


