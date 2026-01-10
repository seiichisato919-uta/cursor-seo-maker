import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * プロンプトファイルを読み込む
 */
export function loadPromptFile(filename: string): string {
  const possiblePaths: string[] = [];
  
  // 方法1: process.cwd()からlib/prompts/を読み込む（Vercel環境で最も確実）
  // Next.jsのAPIルートでは、process.cwd()がプロジェクトルートを指す
  possiblePaths.push(join(process.cwd(), 'lib', 'prompts', `${filename}.txt`));
  possiblePaths.push(join(process.cwd(), 'lib', 'prompts', filename));
  
  // 方法2: __dirnameから相対パスで取得（開発環境）
  if (typeof __dirname !== 'undefined') {
    // .txt拡張子付きで試す
    possiblePaths.push(join(__dirname, 'prompts', `${filename}.txt`));
    // 拡張子なしでも試す
    possiblePaths.push(join(__dirname, 'prompts', filename));
    // プロジェクトルートからも試す
    possiblePaths.push(join(__dirname, '..', '..', filename));
  }
  
  // 方法3: process.cwd()からプロジェクトルート直下を読み込む（フォールバック）
  possiblePaths.push(join(process.cwd(), filename));
  
  // 各パスを順番に試す
  for (const promptPath of possiblePaths) {
    try {
      const content = readFileSync(promptPath, 'utf-8');
      console.log(`✅ Successfully loaded ${filename} from: ${promptPath}`);
      return content;
    } catch (e) {
      // 次のパスを試す
      continue;
    }
  }
  
  // すべてのパスで失敗した場合
  console.error(`❌ Error reading prompt file ${filename}`);
  console.error(`Attempted paths: ${possiblePaths.join(', ')}`);
  console.error(`Current working directory: ${process.cwd()}`);
  if (typeof __dirname !== 'undefined') {
    console.error(`__dirname: ${__dirname}`);
  }
  // フォールバック: 空文字を返す
  return '';
}

/**
 * 記事構成プロンプトを取得（ナレッジファイル付き）
 */
export function getStructurePrompt(data: any): string {
  const basePrompt = loadPromptFile('SEO記事構成プロンプト');
  const knowledgeFile = loadPromptFile('記事構成のお手本集');
  
  // デバッグログ
  if (!basePrompt) {
    console.error('⚠️ 警告: SEO記事構成プロンプトファイルが読み込めませんでした。プロジェクトルートに「SEO記事構成プロンプト」ファイルが存在するか確認してください。');
  } else {
    console.log(`✅ プロンプトファイル「SEO記事構成プロンプト」を読み込みました（${basePrompt.length}文字）。`);
  }
  
  if (!knowledgeFile) {
    console.error('⚠️ 警告: 記事構成のお手本集ファイルが読み込めませんでした。プロジェクトルートに「記事構成のお手本集」ファイルが存在するか確認してください。');
  } else {
    console.log(`✅ ナレッジファイル「記事構成のお手本集」を読み込みました（${knowledgeFile.length}文字）。`);
  }
  
  if (!basePrompt) {
    // フォールバックプロンプト
    return `あなたはSEO記事構成のスペシャリストです。
以下の情報を基に、SEO記事の構成（H2、H3）を作成してください。

メインキーワード: ${data.mainKeyword}
関連キーワード: ${data.relatedKeywords}
ターゲット読者: ${data.targetReader}
検索意図: ${data.searchIntent}
競合記事: ${data.competitorArticles}
お手本の構成: ${data.sampleStructure}
一次情報: ${data.primaryInfo}
記事のゴール: ${data.articleGoal}`;
  }
  
  // ナレッジファイルがある場合は追加
  let knowledgeSection = '';
  if (knowledgeFile) {
    knowledgeSection = `

## ナレッジ: 記事構成のお手本集
以下のお手本集を参照し、構成の作り方・雰囲気・流れを学習してください：

${knowledgeFile}`;
  }
  
  // プロンプトから対話形式の部分を削除
  let processedPrompt = basePrompt;
  if (processedPrompt) {
    // 「完了確認」セクションを削除
    processedPrompt = processedPrompt.replace(/## 完了確認[\s\S]*?これからSEO記事構成を作成いたします。[\s\S]*?\n/g, '');
    // 「すべての情報収集が完了しました」というメッセージを削除
    processedPrompt = processedPrompt.replace(/すべての情報収集が完了しました。これからSEO記事構成を作成いたします。/g, '');
  }
  
  // プロンプトにデータを組み込む
  return `${processedPrompt}${knowledgeSection}

以下の情報を基に記事構成を作成してください：
メインキーワード: ${data.mainKeyword}
関連キーワード: ${data.relatedKeywords}
ターゲット読者: ${data.targetReader}
検索意図: ${data.searchIntent}
競合記事: ${data.competitorArticles}
お手本の構成: ${data.sampleStructure}
一次情報: ${data.primaryInfo}
記事のゴール: ${data.articleGoal}

## 重要：出力形式の厳守
- 「すべての情報収集が完了しました」などの前置きメッセージは一切出力しないでください
- タイトルと記事構成（H2、H3）のみを出力してください
- 「H2: まとめ」は必ず出力してください
- 「H2: まとめ」の配下のH3は出力しないでください（「H2: まとめ」の見出しのみを出力）
- 「H2: まとめ」の後に以下のセクションは出力しないでください：
  - FAQセクション（「H2: FAQ」「H2: よくある質問」「H2: Q&A」「▼ FAQ」など）
  - 外部引用・統計データ候補セクション（「▼ 外部引用・統計データ候補」「外部引用」など）
- 見出しタイトルのみを出力し、説明文や解説は一切含めないでください`;
}

/**
 * タイトル生成プロンプトを取得
 */
export function getTitlePrompt(data: { keyword: string; targetReader: string; structure: string }): string {
  // プロンプトファイルを読み込む
  let basePrompt = loadPromptFile('SEO記事タイトルプロンプト');
  
  // デバッグログ
  if (!basePrompt) {
    console.error('⚠️ 警告: SEO記事タイトルプロンプトファイルが読み込めませんでした。プロジェクトルートに「SEO記事タイトルプロンプト」ファイルが存在するか確認してください。');
  } else {
    console.log(`✅ プロンプトファイル「SEO記事タイトルプロンプト」を読み込みました（${basePrompt.length}文字）。`);
  }
  
  // プロンプトファイルが読み込めない場合のフォールバック
  if (!basePrompt) {
    basePrompt = `あなたはSEOとキャッチコピーの専門家です。

以下の情報を基に、記事タイトル案を30個作成してください。

## 入力情報
メインキーワード: ${data.keyword || '未指定'}
ターゲット読者: ${data.targetReader || '未指定'}
記事構成: ${data.structure || '未指定'}

## タイトル作成の要件
1. **必ず30個のタイトル案を作成してください**（30個未満は不可）
2. **各タイトルは30文字以上40文字以下を厳守してください**（この条件を満たさないタイトルは出力しないでください）
3. キーワードを自然に含めてください
4. 以下のパターンをバランスよく含めてください：
   - 数字型（「5つの方法」「3ステップ」など）
   - 質問型（「〜とは?」「どうすれば〜?」など）
   - ベネフィット型（「〜で成功する」「〜を実現」など）
   - 否定型（「失敗しない〜」「〜してはいけない」など）
   - 権威型（「プロが教える〜」「専門家が解説」など）

## 出力形式
各タイトルを以下の形式で出力してください：
1. タイトル案1
2. タイトル案2
3. タイトル案3
...
30. タイトル案30

**重要**: 必ず30個のタイトルを番号付きで出力してください。カテゴリー分けは不要です。`;
  } else {
    // プロンプトファイルが読み込めた場合、対話形式の部分を削除
    // 「対話の流れ」セクション全体を削除
    basePrompt = basePrompt.replace(/# 対話の流れ[\s\S]*?→すべての回答を受け取ったら、タイトル生成へ/g, '');
    // 「質問1」「質問2」「質問3」のセクションを削除（個別に削除）
    basePrompt = basePrompt.replace(/## 質問1: キーワードの確認[\s\S]*?→ユーザーの回答を受け取った後、次の質問へ/gs, '');
    basePrompt = basePrompt.replace(/## 質問2: 想定読者の確認[\s\S]*?→ユーザーの回答を受け取った後、次の質問へ/gs, '');
    basePrompt = basePrompt.replace(/## 質問3: 記事構成の確認[\s\S]*?→すべての回答を受け取ったら、タイトル生成へ/gs, '');
    // 「重要な注意点」の対話に関する部分を削除
    basePrompt = basePrompt.replace(/# 重要な注意点[\s\S]*?ユーザーの回答内容を要約して確認し、認識が正しいか確認してから次に進んでください/gs, '');
    
    // データを組み込む（プロンプトファイル内に変数がある場合）
    basePrompt = basePrompt.replace(/\$\{keyword\}/g, data.keyword || '未指定');
    basePrompt = basePrompt.replace(/\$\{targetReader\}/g, data.targetReader || '未指定');
    basePrompt = basePrompt.replace(/\$\{structure\}/g, data.structure || '未指定');
    
    // 入力情報を追加
    basePrompt = `${basePrompt}

## 入力情報
メインキーワード: ${data.keyword || '未指定'}
ターゲット読者: ${data.targetReader || '未指定'}
記事構成: ${data.structure || '未指定'}

## タイトル作成の要件
1. **必ず30個のタイトル案を作成してください**（30個未満は不可）
2. **各タイトルは30文字以上40文字以下を厳守してください**（この条件を満たさないタイトルは出力しないでください）
3. キーワードを自然に含めてください
4. 以下のパターンをバランスよく含めてください：
   - 数字型（「5つの方法」「3ステップ」など）
   - 質問型（「〜とは?」「どうすれば〜?」など）
   - ベネフィット型（「〜で成功する」「〜を実現」など）
   - 否定型（「失敗しない〜」「〜してはいけない」など）
   - 権威型（「プロが教える〜」「専門家が解説」など）

## 出力形式
各タイトルを以下の形式で出力してください：
1. タイトル案1
2. タイトル案2
3. タイトル案3
...
30. タイトル案30

**重要**: 必ず30個のタイトルを番号付きで出力してください。カテゴリー分けは不要です。`;
  }
  
  return basePrompt;
}

/**
 * 記事執筆プロンプトを取得（ナレッジファイル付き）
 */
export function getWritingPrompt(data: any): string {
  const basePrompt = loadPromptFile('SEO記事執筆プロンプト');
  const knowledgeFile = loadPromptFile('執筆プロンプトに反映したいこと');
  
  // デバッグログ
  if (!basePrompt) {
    console.error('⚠️ 警告: SEO記事執筆プロンプトファイルが読み込めませんでした。プロジェクトルートに「SEO記事執筆プロンプト」ファイルが存在するか確認してください。');
    return `記事を執筆してください。`;
  }
  
  if (!knowledgeFile) {
    console.error('⚠️ 警告: 執筆プロンプトに反映したいことファイルが読み込めませんでした。プロジェクトルートに「執筆プロンプトに反映したいこと」ファイルが存在するか確認してください。');
  } else {
    console.log(`✅ ナレッジファイル「執筆プロンプトに反映したいこと」を読み込みました（${knowledgeFile.length}文字）。`);
  }
  
  console.log(`✅ プロンプトファイル「SEO記事執筆プロンプト」を読み込みました（${basePrompt.length}文字）。`);
  
  // プロンプトから対話形式の部分を削除し、直接執筆に進む形式に変更
  let prompt = basePrompt;
  
  // 対話形式の指示を削除
  if (prompt) {
    // STEP1の対話形式の部分を削除
    prompt = prompt.replace(/## \*\*STEP1:.*?ユーザーがH2ブロックを指定するまで待機\*\*/gs, '');
    prompt = prompt.replace(/#### \*\*Step 1[a-e]:\*\*[\s\S]*?次の質問に進みます。/g, '');
    prompt = prompt.replace(/質問の例：[\s\S]*?指定してください」/g, '');
    prompt = prompt.replace(/\*\*重要：\*\* ユーザーがH2ブロックを指定するまで、執筆を開始してはいけません。必ず指定を待ってください。/g, '');
  }
  
  let knowledgeSection = '';
  if (knowledgeFile) {
    knowledgeSection = `

## ナレッジ: 執筆プロンプトに反映したいこと
以下のナレッジファイルを参照し、執筆時のルールを完璧に遵守してください：

${knowledgeFile}

**重要**: 上記のナレッジファイルに記載されているすべてのルール・禁止表現・NG/OK例を必ず遵守してください。`;
  }
  
  return `${prompt}${knowledgeSection}

## 重要：出力形式の厳守
- **HTML形式は絶対に使用しないでください**
- **プレーンテキスト（マークダウン形式）で出力してください**
- HTMLタグ（<div>、<strong>、<ul>、<li>、<p>など）は一切使用しないでください
- 見出しは「H2: タイトル」「H3: タイトル」のようにテキストで記述してください
- 箇条書きは「- 項目」のようにテキストで記述してください
- 表は「| 項目 | 説明 |」のようにマークダウン形式で記述してください
- **箇条書きや表を使用する場合は、必ず<ボックス></ボックス>で囲んでください**
- **例（箇条書きの場合）：**
  <ボックス>
  - 項目1
  - 項目2
  - 項目3
  </ボックス>
- **例（表の場合）：**
  <ボックス>
  | 項目 | 説明 |
  |------|------|
  | A | 説明A |
  | B | 説明B |
  </ボックス>`;
}

/**
 * 内部リンクプロンプトを取得（スプレッドシートデータ付き）
 */
export function getInternalLinkPrompt(data: { article: string; spreadsheetData?: any }): string {
  let basePrompt = loadPromptFile('内部リンクプロンプト');
  
  if (!basePrompt) {
    return `内部リンクを提案してください。`;
  }
  
  // プロンプトから不要なセクションのみを削除（重要な指示は残す）
  // 「応答開始時のテンプレート」セクションを削除（分析結果メッセージは不要）
  basePrompt = basePrompt.replace(/## 応答開始時のテンプレート[\s\S]*?\[ここから実際の出力を開始\]/g, '');
  // 「継続的改善のためのフィードバック要請」セクションを削除（対話形式は不要）
  basePrompt = basePrompt.replace(/## 継続的改善のためのフィードバック要請[\s\S]*?削除すべきリンク提案はありますか\?/g, '');
  // 「実行コマンド」セクションを削除（対話形式は不要）
  basePrompt = basePrompt.replace(/## 実行コマンド[\s\S]*?このプロンプトに従って分析と提案を開始してください。[\s\S]*?$/g, '');
  // 「エラーハンドリング」セクションを削除（エラーメッセージは不要）
  basePrompt = basePrompt.replace(/## エラーハンドリング[\s\S]*?記事が添付されていません。[\s\S]*?---/g, '');
  
  let spreadsheetSection = '';
  if (data.spreadsheetData) {
    // 記事一覧を簡潔な形式に変換（全件を送信）
    const articleList = Array.isArray(data.spreadsheetData) 
      ? data.spreadsheetData.map((item: any) => `${item.title} (${item.url})`).join('\n')
      : JSON.stringify(data.spreadsheetData, null, 2);
    
    spreadsheetSection = `

## ナレッジ: 「Webライターの学校」記事一覧
以下の記事一覧から、記事内容に関連する記事を選んで内部リンクを挿入してください（形式: 記事タイトル (URL)）：

${articleList}`;
  }
  
  // 記事内容が長すぎる場合は先頭3000文字に制限（タイムアウト対策）
  const articleToProcess = data.article && data.article.length > 3000 
    ? data.article.substring(0, 3000) + '\n\n（...以下省略）'
    : data.article;
  
  return `${basePrompt}${spreadsheetSection}

記事内容:
${articleToProcess}

## ⚠️【超重要】出力形式⚠️
- **既存の記事内容を一字一句そのまま保持してください**
- **既存の記事内容を削除したり、変更したり、要約したりしてはいけません**
- **既存の記事内容をそのまま出力し、適切な箇所に「参考記事：記事タイトル(URL)」形式で内部リンクを挿入してください**
- **内部リンクは必ず「参考記事：」（全角コロン）で始めてください**
- **既存の文章を全て残したまま、内部リンクだけを追加してください**
- **記事内容の見出し（##、###、H2:、H3:など）は削除せず、そのまま出力してください**
- **記事内容の本文も全てそのまま出力してください**
- **分析結果や提案メッセージは一切出力しないでください**
- **「記事を分析し、内部リンクの挿入箇所を提案します」などのメッセージは出力しないでください**
- **既存の記事内容に内部リンクを挿入した結果のみを出力してください**
- **出力例：**
  既存の文章の一部です。ここに内部リンクを挿入します。
  参考記事：Webライターとは?8年経験者が解説!(https://webwriter-school.net/webwriter/)
  既存の文章の続きです。`;
}

/**
 * セールス箇所特定プロンプトを取得
 */
export function getSalesLocationPrompt(data: any): string {
  const basePrompt = loadPromptFile('セールス箇所特定のプロンプト');
  
  if (!basePrompt) {
    return `セールス箇所を特定してください。`;
  }
  
  // プロンプトから対話形式の部分を削除し、直接セールス箇所に「※ここにセールス文を挿入」を挿入する形式に変更
  let prompt = basePrompt;
  
  // 対話形式の指示を削除
  if (prompt) {
    // ステップ1の対話形式の部分を削除
    prompt = prompt.replace(/## 対話フロー[\s\S]*?## 分析・提案フェーズ/g, '## 分析・提案フェーズ');
    prompt = prompt.replace(/## 実行開始[\s\S]*?$/g, '');
    prompt = prompt.replace(/それでは、\*\*質問1\*\*から始めてください。[\s\S]*?$/g, '');
    prompt = prompt.replace(/ユーザーが全ての情報を提供するまで、段階的に質問を進めてください。[\s\S]*?$/g, '');
  }
  
  return `${prompt}

## 提供された情報
記事のトピック: ${data.articleTopic || '未指定'}
記事内容: ${data.article}
商品・サービスURL: ${data.productUrl || '未指定'}

## ⚠️【超重要】出力形式について⚠️
- **既存の記事内容を一字一句そのまま保持してください**
- **既存の記事内容を削除したり、変更したり、要約したりしてはいけません**
- **既存の記事内容をそのまま出力し、セールス文を挿入すべき箇所に「※ここにセールス文を挿入」という文字を挿入してください**
- **既存の文章を全て残したまま、「※ここにセールス文を挿入」だけを追加してください**
- **既存の文章を削除したり、変更したり、要約したりしてはいけません**
- **既存の文章を一字一句そのまま保持し、適切な箇所に「※ここにセールス文を挿入」を挿入してください**
- **見出し（##、###、H2:、H3:など）は一切出力しないでください**
- **見出しを含めず、本文の内容のみを出力してください**
- **分析結果や提案メッセージは一切出力しないでください**
- **「記事を分析し、セールス箇所を特定します」などのメッセージは出力しないでください**
- **「【分析結果】」「【セールス箇所提案】」などの見出しは出力しないでください**
- **「提案内容は適切でしたか?」などの質問は出力しないでください**
- **「---」などの区切り線も出力しないでください**
- **既存の記事内容に「※ここにセールス文を挿入」を挿入した結果のみを出力してください**
- **出力は既存の記事内容（「※ここにセールス文を挿入」挿入済み）のみで、それ以外は一切出力しないでください**
- **セールス文を挿入すべき箇所が1つもない場合は、最も適切と思われる箇所に1つ以上挿入してください**
- **出力例：**
  既存の文章の一部です。ここにセールス文を挿入すべきです。
  ※ここにセールス文を挿入
  既存の文章の続きです。`;
}

/**
 * 導入文・セールス文・まとめ文・ディスクリプション執筆プロンプトを取得（ナレッジファイル付き）
 */
export function getIntroSalesSummaryDescPrompt(data: any): string {
  const basePrompt = loadPromptFile('導入文・セールス文・まとめ文・ディスクリプションのプロンプト');
  const introSample = loadPromptFile('導入文のお手本');
  const salesSample = loadPromptFile('セールス文のお手本');
  const summarySample = loadPromptFile('まとめ文のお手本');
  const descSample = loadPromptFile('ディスクリプションのお手本');
  
  if (!basePrompt) {
    return `導入文・セールス文・まとめ文・ディスクリプションを執筆してください。`;
  }
  
  let knowledgeSection = '';
  if (introSample || salesSample || summarySample || descSample) {
    knowledgeSection = `

## ナレッジ: お手本集
以下のお手本を参照し、テイストやトーンを学習してください：

${introSample ? `### 導入文のお手本\n${introSample}\n\n` : ''}
${salesSample ? `### セールス文のお手本\n${salesSample}\n\n` : ''}
${summarySample ? `### まとめ文のお手本\n${summarySample}\n\n` : ''}
${descSample ? `### ディスクリプションのお手本\n${descSample}\n\n` : ''}`;
  }
  
  return `${basePrompt}${knowledgeSection}`;
}

/**
 * 監修者吹き出しプロンプトを取得
 */
export function getSupervisorCommentPrompt(data: { article: string; h2Title?: string }): string {
  const basePrompt = loadPromptFile('監修者吹き出しプロンプト');
  
  if (!basePrompt) {
    return `監修者の吹き出しを執筆してください。`;
  }
  
  return `${basePrompt}

記事内容:
${data.article}
${data.h2Title ? `\n見出し: ${data.h2Title}` : ''}`;
}

/**
 * WordPress入稿プロンプトを取得
 */
export function getWordPressPrompt(data: { article: string }): string {
  const basePrompt = loadPromptFile('ワードプレス入稿プロンプト');
  
  if (!basePrompt) {
    return `WordPress用HTMLに変換してください。`;
  }
  
  return `${basePrompt}

記事内容:
${data.article}`;
}

