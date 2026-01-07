# デプロイ手順

## GitHubへのプッシュ

### 1. GitHubリポジトリの作成

1. [GitHub](https://github.com)にアクセスしてログインします
2. 右上の「+」ボタンから「New repository」を選択します
3. リポジトリ名を入力します（例: `seo-article-creator`）
4. 「Create repository」をクリックします

### 2. ローカルリポジトリをGitHubにプッシュ

以下のコマンドを実行してください（`YOUR_USERNAME`と`YOUR_REPO_NAME`を実際の値に置き換えてください）：

```bash
cd "/Users/katanoyousuke/Cursorテスト/新しいフォルダ/重要！汎用型SEO記事作成システム"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## Vercelへのデプロイ

### 方法1: Vercel CLIを使用（推奨）

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

### 方法2: Vercel Webインターフェースを使用

1. [Vercel](https://vercel.com)にアクセスしてログインします
2. 「Add New...」→「Project」をクリックします
3. GitHubリポジトリをインポートします
4. プロジェクト設定で以下を確認します：
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`（デフォルト）
   - **Build Command**: `npm run build`（デフォルト）
   - **Output Directory**: `.next`（デフォルト）
   - **Install Command**: `npm install`（デフォルト）

5. 「Environment Variables」セクションで以下を追加します：
   - `GEMINI_API_KEY`: あなたのGemini APIキー
   - `ANTHROPIC_API_KEY`: あなたのClaude APIキー

6. 「Deploy」をクリックします

## 環境変数の設定

Vercelのダッシュボードで、プロジェクト設定 > Environment Variables から以下を設定してください：

- `GEMINI_API_KEY`: あなたのGemini APIキー
- `ANTHROPIC_API_KEY`: あなたのClaude APIキー

**重要**: 環境変数を設定した後、再デプロイが必要です。

## デプロイ後の確認

デプロイが完了したら、Vercelから提供されるURL（例: `https://your-project.vercel.app`）にアクセスして、アプリケーションが正常に動作するか確認してください。

