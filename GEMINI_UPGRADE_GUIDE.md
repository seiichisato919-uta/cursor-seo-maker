# Google AI Studio 有料プランへのアップグレードガイド

## ステップ1: Google AI Studioにアクセス

1. ブラウザで [Google AI Studio](https://aistudio.google.com/) を開く
2. Googleアカウントでログイン（必要に応じて）

## ステップ2: アカウント設定を開く

1. 右上のアカウントアイコンまたはメニューをクリック
2. 「設定」または「Settings」を選択
3. または、直接 [Google AI Studio の設定ページ](https://aistudio.google.com/app/settings) にアクセス

## ステップ3: プランと請求を確認

1. 設定ページで「プランと請求」または「Plan & Billing」セクションを探す
2. 現在のプラン（無料プラン）が表示されていることを確認

## ステップ4: 有料プランにアップグレード

### 方法A: Google Cloud Consoleから（推奨）

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. 左メニューから「APIとサービス」→「ライブラリ」を選択
4. 「Generative Language API」を検索して有効化
5. 左メニューから「請求」または「Billing」を選択
6. 「アカウントをリンク」または「請求アカウントを作成」をクリック
7. クレジットカード情報を入力して請求アカウントを作成

### 方法B: Google AI Studioから直接

1. Google AI Studioの設定ページで「アップグレード」または「Upgrade」ボタンを探す
2. クリックしてアップグレード手順に進む
3. 必要に応じてGoogle Cloud Consoleにリダイレクトされる

## ステップ5: 請求アカウントの設定

1. **請求アカウントの作成**
   - クレジットカード情報を入力
   - 請求先住所を入力
   - 利用規約に同意

2. **請求アカウントの確認**
   - メールアドレスに確認メールが届く
   - メール内のリンクをクリックして確認

## ステップ6: APIキーの確認

1. Google AI Studioに戻る
2. [APIキーのページ](https://aistudio.google.com/app/apikey) にアクセス
3. 既存のAPIキーが有料プランで動作するか確認
4. 必要に応じて新しいAPIキーを作成

## ステップ7: クォータと制限の確認

1. Google Cloud Consoleで「APIとサービス」→「割り当て」を選択
2. 「Generative Language API」の割り当てを確認
3. 必要に応じて割り当ての増加をリクエスト

## ステップ8: 動作確認

1. アプリケーションで再度「記事構成を作成する」ボタンをクリック
2. エラーが出ないことを確認
3. 記事構成が正常に生成されることを確認

## 料金について

### Gemini APIの料金（2024年時点）

**gemini-3-pro-preview**:
- 入力: $0.00 / 1Mトークン（無料）
- 出力: $0.00 / 1Mトークン（無料）
- ただし、プレビュー期間中は無料枠が制限される場合があります

**gemini-1.5-pro**:
- 入力: $1.25 / 1Mトークン
- 出力: $5.00 / 1Mトークン

**gemini-1.5-flash**:
- 入力: $0.075 / 1Mトークン
- 出力: $0.30 / 1Mトークン

**注意**: 料金は変更される可能性があります。最新の料金は [Google AI Studio の料金ページ](https://ai.google.dev/pricing) で確認してください。

## トラブルシューティング

### Q: アップグレードボタンが見つからない
A: Google Cloud Consoleから直接請求アカウントを作成してください。

### Q: クレジットカード情報を入力できない
A: ブラウザのポップアップブロッカーを無効化してください。

### Q: 請求アカウントを作成したが、まだエラーが出る
A: 
1. APIキーが正しく設定されているか確認
2. 数分待ってから再度試す（反映に時間がかかる場合があります）
3. Google Cloud Consoleで「Generative Language API」が有効になっているか確認

### Q: 料金が心配
A: 
- Google Cloud Consoleで予算アラートを設定できます
- 使用量を定期的に確認してください
- 無料枠が利用可能なモデル（gemini-1.5-flashなど）への切り替えも検討できます

## 次のステップ

有料プランにアップグレードしたら：
1. アプリケーションを再起動（必要に応じて）
2. 再度「記事構成を作成する」ボタンをクリック
3. 正常に動作することを確認

## 参考リンク

- [Google AI Studio](https://aistudio.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Gemini API 料金](https://ai.google.dev/pricing)
- [Gemini API ドキュメント](https://ai.google.dev/gemini-api/docs)


