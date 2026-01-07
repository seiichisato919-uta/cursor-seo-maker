# GitHubとVercelへのデプロイ手順

## ✅ 現在の状態

Gitリポジトリは初期化済みで、すべてのファイルがコミットされています。

## 📋 次のステップ

### 1. GitHubリポジトリの作成

1. [GitHub](https://github.com)にアクセスしてログインします
2. 右上の「+」ボタンから「New repository」を選択します
3. リポジトリ名を入力します（例: `seo-article-creator`）
4. 説明を追加します（オプション）
5. **Public**または**Private**を選択します
6. **「Initialize this repository with a README」はチェックしないでください**（既にローカルにリポジトリがあるため）
7. 「Create repository」をクリックします

### 2. ローカルリポジトリをGitHubにプッシュ

GitHubでリポジトリを作成したら、以下のコマンドを実行してください：

```bash
cd "/Users/katanoyousuke/Cursorテスト/新しいフォルダ/重要！汎用型SEO記事作成システム"

# リモートリポジトリを追加（YOUR_USERNAMEとYOUR_REPO_NAMEを実際の値に置き換えてください）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# メインブランチに切り替え
git branch -M main

# GitHubにプッシュ
git push -u origin main
```

**注意**: `YOUR_USERNAME`と`YOUR_REPO_NAME`を実際のGitHubのユーザー名とリポジトリ名に置き換えてください。

例：
```bash
git remote add origin https://github.com/katanoyousuke/seo-article-creator.git
git push -u origin main
```

### 3. Vercelへのデプロイ

#### 方法A: Vercel Webインターフェースを使用（推奨）

1. [Vercel](https://vercel.com)にアクセスしてログインします
   - GitHubアカウントでログインすることを推奨します

2. 「Add New...」→「Project」をクリックします

3. GitHubリポジトリをインポートします
   - 先ほど作成したリポジトリを選択します

4. プロジェクト設定を確認します：
   - **Framework Preset**: Next.js（自動検出されるはず）
   - **Root Directory**: `./`（デフォルト）
   - **Build Command**: `npm run build`（デフォルト）
   - **Output Directory**: `.next`（デフォルト）
   - **Install Command**: `npm install`（デフォルト）

5. **「Environment Variables」セクションで以下を追加します**：
   - `GEMINI_API_KEY`: あなたのGemini APIキー
   - `ANTHROPIC_API_KEY`: あなたのClaude APIキー

6. 「Deploy」をクリックします

7. デプロイが完了したら、Vercelから提供されるURL（例: `https://your-project.vercel.app`）にアクセスして確認します

#### 方法B: Vercel CLIを使用

1. Vercel CLIをインストールします：
```bash
npm i -g vercel
```

2. プロジェクトディレクトリでログインします：
```bash
cd "/Users/katanoyousuke/Cursorテスト/新しいフォルダ/重要！汎用型SEO記事作成システム"
vercel login
```

3. デプロイします：
```bash
vercel
```

4. 環境変数を設定します：
```bash
vercel env add GEMINI_API_KEY
vercel env add ANTHROPIC_API_KEY
```

5. 本番環境にデプロイします：
```bash
vercel --prod
```

## 🔐 環境変数の設定

Vercelのダッシュボードで、プロジェクト設定 > Environment Variables から以下を設定してください：

- `GEMINI_API_KEY`: あなたのGemini APIキー
- `ANTHROPIC_API_KEY`: あなたのClaude APIキー

**重要**: 
- 環境変数を設定した後、**再デプロイが必要**です
- 環境変数は本番環境（Production）、プレビュー環境（Preview）、開発環境（Development）それぞれに設定できます

## ✅ デプロイ後の確認

デプロイが完了したら、以下を確認してください：

1. Vercelから提供されるURLにアクセスできるか
2. アプリケーションが正常に動作するか
3. APIエンドポイントが正常に動作するか（環境変数が正しく設定されているか）

## 🐛 トラブルシューティング

### ビルドエラーが発生する場合

1. Vercelのダッシュボードでビルドログを確認します
2. 環境変数が正しく設定されているか確認します
3. `package.json`の依存関係が正しいか確認します

### APIエラーが発生する場合

1. 環境変数（`GEMINI_API_KEY`、`ANTHROPIC_API_KEY`）が正しく設定されているか確認します
2. APIキーが有効か確認します
3. Vercelのログでエラーメッセージを確認します

