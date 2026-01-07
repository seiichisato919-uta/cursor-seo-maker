# APIエンドポイント一覧

## 実装済みのAPIエンドポイント

### 1. 記事構成の作成
- **エンドポイント**: `POST /api/generate-structure`
- **プロンプト**: `SEO記事構成プロンプト`
- **ナレッジ**: `記事構成のお手本集`
- **AIモデル**: `gemini-3-pro-preview`
- **リクエストボディ**:
  ```json
  {
    "mainKeyword": "string",
    "relatedKeywords": "string",
    "targetReader": "string",
    "searchIntent": "string",
    "competitorArticles": "string",
    "sampleStructure": "string",
    "primaryInfo": "string",
    "articleGoal": "string"
  }
  ```

### 2. タイトル生成
- **エンドポイント**: `POST /api/generate-titles`
- **プロンプト**: `SEO記事タイトルプロンプト`
- **AIモデル**: `gemini-3-pro-preview`
- **リクエストボディ**:
  ```json
  {
    "keyword": "string",
    "targetReader": "string",
    "structure": "string"
  }
  ```

### 3. 記事執筆
- **エンドポイント**: `POST /api/generate-writing`
- **プロンプト**: `SEO記事執筆プロンプト`
- **ナレッジ**: `執筆プロンプトに反映したいこと`
- **AIモデル**: `gemini-3-pro-preview`
- **リクエストボディ**:
  ```json
  {
    "h2Block": "string",
    "h3s": ["string"],
    "keyword": "string",
    "targetReader": "string",
    "searchIntent": "string",
    "structure": "string",
    "mediaExample": "string"
  }
  ```

### 4. 内部リンク提案
- **エンドポイント**: `POST /api/generate-internal-links`
- **プロンプト**: `内部リンクプロンプト`
- **ナレッジ**: スプレッドシート「Webライターの学校」記事一覧（手動で提供）
- **AIモデル**: `gemini-3-pro-preview`
- **リクエストボディ**:
  ```json
  {
    "article": "string",
    "spreadsheetData": {
      "title": "string",
      "url": "string"
    }[]
  }
  ```

### 5. セールス箇所特定
- **エンドポイント**: `POST /api/generate-sales-locations`
- **プロンプト**: `セールス箇所特定のプロンプト`
- **AIモデル**: `gemini-3-pro-preview`
- **リクエストボディ**:
  ```json
  {
    "article": "string",
    "productUrl": "string",
    "articleTopic": "string"
  }
  ```

### 6. 導入文・セールス文・まとめ文・ディスクリプション執筆
- **エンドポイント**: `POST /api/generate-intro-sales-summary-desc`
- **プロンプト**: `導入文・セールス文・まとめ文・ディスクリプションのプロンプト`
- **ナレッジ**: 
  - `導入文のお手本`
  - `セールス文のお手本`
  - `まとめ文のお手本`
  - `ディスクリプションのお手本`
- **AIモデル**: `gemini-3-pro-preview`
- **リクエストボディ**:
  ```json
  {
    "keyword": "string",
    "article": "string",
    "productUrl": "string",
    "introReaderWorry": "string",
    "salesLocation": "string",
    "descriptionKeywords": "string"
  }
  ```

### 7. 監修者の吹き出し
- **エンドポイント**: `POST /api/generate-supervisor-comments`
- **プロンプト**: `監修者吹き出しプロンプト`
- **AIモデル**: `gemini-3-pro-preview`
- **リクエストボディ**:
  ```json
  {
    "article": "string"
  }
  ```

### 8. WordPress HTML変換
- **エンドポイント**: `POST /api/convert-to-wordpress`
- **プロンプト**: `ワードプレス入稿プロンプト`
- **AIモデル**: `claude-sonnet-4-5-20250929`
- **リクエストボディ**:
  ```json
  {
    "article": "string"
  }
  ```

## 注意事項

- すべてのAPIエンドポイントはエラーハンドリングを実装済み
- プロンプトファイルが見つからない場合はフォールバックプロンプトを使用
- ナレッジファイルは自動的にプロンプトに組み込まれます
- 内部リンクAPIでは、スプレッドシートデータを手動で提供する必要があります（将来的にGoogle Sheets API連携を実装予定）


