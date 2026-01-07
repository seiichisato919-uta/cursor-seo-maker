# 環境変数の説明 - 何をどこに入れるか

## 環境変数の種類

`.env.local` ファイルには、**2種類の異なる情報**を設定します：

### 1. GOOGLE_SHEETS_SPREADSHEET_ID（スプレッドシートのID）

**これは何？**
- GoogleスプレッドシートのURLから取得できるIDです
- Google Cloud Consoleで取得するものではありません

**どこから取得する？**
スプレッドシートのURLを見てください：
```
https://docs.google.com/spreadsheets/d/1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA/edit
                                                      ↑この部分がスプレッドシートID
```

**設定する値：**
```env
GOOGLE_SHEETS_SPREADSHEET_ID=1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA
```

**重要**: この値は**既に正しい値**です。変更する必要はありません！

---

### 2. GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON（認証情報）

**これは何？**
- Google Cloud ConsoleでダウンロードしたJSONキーファイルの内容です
- サービスアカウントの認証情報が含まれています

**どこから取得する？**
1. Google Cloud Consoleでサービスアカウントを作成
2. JSONキーをダウンロード
3. JSONファイルの内容をすべてコピー

**設定する値：**
```env
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

**重要**: ここに、Google Cloud ConsoleでダウンロードしたJSONファイルの内容を設定します！

---

## まとめ

| 環境変数名 | 何を設定する？ | どこから取得？ |
|-----------|--------------|--------------|
| `GOOGLE_SHEETS_SPREADSHEET_ID` | スプレッドシートのID | スプレッドシートのURLから取得（既に正しい値） |
| `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` | 認証情報（JSON） | Google Cloud ConsoleでダウンロードしたJSONファイルの内容 |

## .env.localファイルの完成例

```env
# Gemini API（設定が必要）
GEMINI_API_KEY=your_gemini_api_key_here

# Claude API（設定が必要）
ANTHROPIC_API_KEY=your_claude_api_key_here

# Google Sheets API - スプレッドシートID（変更不要）
GOOGLE_SHEETS_SPREADSHEET_ID=1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA

# Google Sheets API - 認証情報（ここにJSONファイルの内容を設定）
GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"seo-article-creator@your-project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

## よくある質問

### Q: GOOGLE_SHEETS_SPREADSHEET_IDは変更する必要がある？
A: **いいえ、変更不要です**。既に正しい値が設定されています。

### Q: GOOGLE_SHEETS_SERVICE_ACCOUNT_JSONには何を入れる？
A: **Google Cloud ConsoleでダウンロードしたJSONファイルの内容**を設定します。

### Q: 2つともGoogle Cloud Consoleで取得するの？
A: いいえ。
- `GOOGLE_SHEETS_SPREADSHEET_ID`: スプレッドシートのURLから取得（既に正しい値）
- `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON`: Google Cloud ConsoleでダウンロードしたJSONファイルの内容


