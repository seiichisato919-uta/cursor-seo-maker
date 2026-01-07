# SEO記事作成システム

LLMを使ったSEO記事自動生成システムです。

## 機能

1. **記事構成の作成** - SEO記事構成プロンプトを使用して記事構成を生成
2. **タイトル生成** - SEO記事タイトルプロンプトを使用してタイトル候補を生成
3. **記事執筆** - SEO記事執筆プロンプトを使用してH2ブロック単位で記事を執筆
4. **内部リンク提案** - 内部リンクプロンプトを使用して関連記事へのリンクを提案
5. **セールス箇所特定** - セールス箇所特定のプロンプトを使用して訴求箇所を特定
6. **導入文・セールス文・まとめ文・ディスクリプション執筆** - 各プロンプトを使用して執筆
7. **監修者の吹き出し執筆** - 監修者吹き出しプロンプトを使用してコメントを生成
8. **WordPress HTML変換** - ワードプレス入稿プロンプトを使用してHTMLに変換

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```env
GEMINI_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_claude_api_key_here
```

**注意**: 
- Gemini APIは `gemini-3-pro-preview` モデルを使用します
- Claude APIは `claude-sonnet-4-5-20250929` モデルを使用します

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## プロジェクト構造

```
汎用型SEO記事作成システム/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── page.tsx           # メインページ
│   └── layout.tsx         # レイアウト
├── components/            # Reactコンポーネント
│   ├── ArticleInputForm.tsx
│   ├── ArticleStructureEditor.tsx
│   ├── TitleGenerator.tsx
│   └── ArticleWriter.tsx
├── lib/                   # ユーティリティ関数
│   ├── gemini.ts         # Gemini API連携
│   └── claude.ts         # Claude API連携
└── プロンプトファイル/    # 各プロンプトファイル
```

## 使用方法

1. **情報入力**: メインキーワード、関連キーワード、ターゲット読者などの情報を入力
2. **記事構成作成**: 入力情報を基に記事構成を生成（手動編集可能）
3. **タイトル生成**: タイトル候補を生成し、選択または手動入力
4. **記事執筆**: H2ブロック単位で記事を執筆
5. **各種機能**: 内部リンク提案、セールス箇所特定、導入文執筆など
6. **WordPress HTML変換**: 完成した記事をWordPress用HTMLに変換

## 技術スタック

- **Next.js 14** - Reactフレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Google Gemini API** - LLM（記事構成、タイトル、執筆など）
- **Anthropic Claude API** - LLM（WordPress HTML変換）

## 今後の実装予定

- [ ] データベース連携（記事データの保存）
- [ ] 共有リンク機能
- [ ] ユーザー指示の記録機能
- [ ] エラーハンドリングの強化
- [ ] UI/UXの改善

## ライセンス

このプロジェクトはプライベートプロジェクトです。

