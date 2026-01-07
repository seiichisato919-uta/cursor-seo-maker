# クォータ（割り当て）ページへのアクセス方法

## 方法1: Generative Language APIの詳細ページから（推奨）

### ステップ1: Generative Language APIを開く

1. 現在の画面で、リストの中から「Generative Language API」を探す
2. 「Generative Language API」をクリック

### ステップ2: 「割り当てとシステム上限」タブを選択

1. Generative Language APIの詳細ページが開く
2. 上部にタブが表示されます：
   - 「指標」（Metrics）
   - 「割り当てとシステム上限」（Quotas and system limits）← これをクリック
   - 「認証情報」（Credentials）
   - 「費用」（Costs）

3. 「割り当てとシステム上限」タブをクリック
4. クォータの一覧が表示されます

## 方法2: 直接URLにアクセス

ブラウザのアドレスバーに以下のURLを入力：

```
https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
```

Enterキーを押すと、直接クォータページにアクセスできます。

## 方法3: 左側のメニューから（別の場所）

1. 画面上部の「☰」（ハンバーガーメニュー）をクリック
2. 「IAMと管理」を探す
3. 「割り当て」または「Quotas」を探す
   - 見つからない場合は、検索バーに「割り当て」と入力

## クォータページで確認すること

1. **検索バーに「generate_content」と入力**
2. 以下のクォータを確認：
   - `generate_content_free_tier_requests`（無料枠リクエスト）
   - `generate_content_requests_per_minute`（1分あたりのリクエスト数）
   - `generate_content_requests_per_day`（1日あたりのリクエスト数）

3. **各クォータの制限値を確認**
   - 「制限」列で現在の制限値を確認
   - 「使用量」列で現在の使用量を確認

4. **必要に応じて割り当ての増加をリクエスト**
   - クォータを選択
   - 「割り当ての編集」または「Edit Quotas」をクリック
   - 新しい制限値を入力
   - 「送信」をクリック

## トラブルシューティング

### Q: 「割り当てとシステム上限」タブが見つからない
A: 
- Generative Language APIの詳細ページが正しく開いているか確認
- 別のブラウザで試す
- 直接URLにアクセスする（方法2）

### Q: クォータが表示されない
A: 
- プロジェクトが正しく選択されているか確認
- 請求アカウントがリンクされているか確認
- 数分待ってから再度試す


