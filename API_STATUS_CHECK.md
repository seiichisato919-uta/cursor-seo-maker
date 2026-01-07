# Generative Language APIの有効化確認方法

## 現在の画面から確認する方法

### 方法1: Generative Language APIをクリックして確認（推奨）

1. リストの中から「Generative Language API」を探す
2. 「Generative Language API」をクリック
3. 詳細ページが開いたら、「ステータス」を確認
   - 「有効」または「Enabled」と表示されていればOK
   - 「無効」または「Disabled」と表示されている場合は、「有効にする」ボタンをクリック

### 方法2: リスト内でステータスを確認

現在のリストに「ステータス」列がある場合は、その列で「有効」と表示されているか確認してください。

## 確認後の次のステップ

### Generative Language APIが有効になっている場合

1. アプリケーションに戻る
2. ブラウザで `http://localhost:3003` を開く
3. 「記事構成を作成する」ボタンをクリック
4. エラーが出ないことを確認

### Generative Language APIが無効になっている場合

1. 「Generative Language API」をクリック
2. 詳細ページで「有効にする」ボタンをクリック
3. 有効化が完了するまで待つ（数秒〜1分程度）
4. 再度アプリケーションで試す

## トラブルシューティング

### Q: 「Generative Language API」がリストに表示されない
A: 
1. 上部の「APIとサービスを有効にする」ボタンをクリック
2. 検索バーに「Generative Language API」と入力
3. 「Generative Language API」を選択
4. 「有効にする」ボタンをクリック

### Q: 有効になっているが、まだエラーが出る
A: 
- 数分待ってから再度試す（反映に時間がかかる場合があります）
- 請求アカウントが正しくリンクされているか再確認
- APIキーが正しく設定されているか確認（`.env.local`ファイル）


