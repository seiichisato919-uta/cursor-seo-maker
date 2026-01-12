import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { getInternalLinkPrompt } from '@/lib/prompts';
import { getArticleList } from '@/lib/google-sheets';
import { readFileSync } from 'fs';
import { join } from 'path';

// Vercelの関数タイムアウト設定
// Proプランでは60秒まで可能
export const maxDuration = 60;

/**
 * 記事一覧データを読み込む（フォールバック用）
 */
function loadArticleListFallback(): any[] {
  const possiblePaths = [
    join(process.cwd(), 'data', 'article-list.json'),
    join(process.cwd(), 'public', 'article-list.json'),
    join(process.cwd(), '..', 'data', 'article-list.json'),
  ];
  
  // __dirnameが利用可能な場合も試す
  if (typeof __dirname !== 'undefined') {
    possiblePaths.push(join(__dirname, '..', '..', '..', 'data', 'article-list.json'));
    possiblePaths.push(join(__dirname, '..', '..', '..', 'public', 'article-list.json'));
    possiblePaths.push(join(__dirname, '..', '..', 'data', 'article-list.json'));
    possiblePaths.push(join(__dirname, '..', '..', 'public', 'article-list.json'));
  }
  
  for (const filePath of possiblePaths) {
    try {
      console.log(`Trying to load article list from: ${filePath}`);
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      console.log(`✅ Successfully loaded ${data.length} articles from fallback file: ${filePath}`);
      return data;
    } catch (error) {
      console.error(`❌ Failed to load from ${filePath}:`, error);
      continue;
    }
  }
  
  console.error('❌ All fallback paths failed. Returning empty array.');
  return [];
}

export async function POST(request: NextRequest) {
  try {
    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'リクエストデータの解析に失敗しました。データ形式を確認してください。' },
        { status: 400 }
      );
    }
    
    // スプレッドシートデータが提供されている場合はそれを使用
    // 提供されていない場合は、Google Sheets APIから取得を試みる
    let spreadsheetData = data.spreadsheetData;
    let dataSource = 'manual';
    
    if (!spreadsheetData) {
      try {
        // Google Sheets APIから取得を試みる
        console.log('Attempting to fetch article list from Google Sheets...');
        spreadsheetData = await getArticleList();
        dataSource = 'google-sheets';
        console.log(`✅ Fetched ${spreadsheetData.length} articles from Google Sheets`);
      } catch (sheetsError: any) {
        console.error('⚠️ Google Sheets API error, using fallback:', sheetsError?.message || sheetsError);
        console.error('Error stack:', sheetsError?.stack);
        // エラーが発生した場合は、フォールバックとしてローカルのJSONファイルを使用
        spreadsheetData = loadArticleListFallback();
        dataSource = 'fallback';
        if (spreadsheetData && spreadsheetData.length > 0) {
          console.log(`✅ Using fallback: ${spreadsheetData.length} articles loaded`);
        } else {
          console.error('❌ Fallback also failed: No articles loaded');
          // 最後の手段として、ハードコードされたデータを使用
          spreadsheetData = [
            { title: "Webライターとは？8年経験者が解説！未経験からの始め方9ステップ", url: "https://webwriter-school.net/webwriter/" },
            { title: "簡単！Wordpressブログの始め方｜Webライター初心者向けに超わかりやすく解説", url: "https://webwriter-school.net/blog-start/" },
            { title: "2025年版！SEO対策のやり方54選｜わかりやすく基本から解説", url: "https://webwriter-school.net/seo/" },
            { title: "セールスライティングの型10選！細かい39のコツも例文つきで解説", url: "https://webwriter-school.net/sales-writing/" },
            { title: "Googleアナリティクスの設定方法と使い方【初心者でも今日導入できる】", url: "https://webwriter-school.net/google-analytics/" },
            { title: "Googleサーチコンソールの設定方法と使い方【初心者でも登録カンタン】", url: "https://webwriter-school.net/search-console/" },
            { title: "【初心者向け】Wordpressのおすすめプラグイン【必須5選も紹介】", url: "https://webwriter-school.net/plugin/" },
            { title: "ワードプレステーマ賢威を5年つかった本音レビュー｜SEOに強い", url: "https://webwriter-school.net/keni/" },
            { title: "SEO検索順位チェックツールGRCのダウンロード手順と使い方を解説", url: "https://webwriter-school.net/grc/" },
            { title: "他校の校長が解説！Writing Hacksのメリット10選｜評判も紹介", url: "https://webwriter-school.net/writinghacks/" },
            { title: "Rank Trackerの導入手順と使い方｜SEOで勝つための機能が豊富すぎる", url: "https://webwriter-school.net/ranktracker/" },
            { title: "新クラウドソーシング「スキジャン」がリリース【とりあえず登録しとこう】", url: "https://webwriter-school.net/skijan/" },
            { title: "【無料プレゼント】Webライター大規模教材8個を受け取れます！", url: "https://webwriter-school.net/present/" },
            { title: "Webライター適性診断ツール", url: "https://webwriter-school.net/tekisei/" },
            { title: "Webライター「佐藤誠一」のプロフィール", url: "https://webwriter-school.net/profile/" },
            { title: "問い合わせフォーム", url: "https://webwriter-school.net/contact/" },
          ];
          dataSource = 'hardcoded';
          console.log(`✅ Using hardcoded fallback: ${spreadsheetData.length} articles`);
        }
      }
    }
    
    if (!spreadsheetData || spreadsheetData.length === 0) {
      console.error('❌ No article list data available');
      console.error(`Data source: ${dataSource}`);
      console.error(`Current working directory: ${process.cwd()}`);
      return NextResponse.json(
        { 
          error: '記事一覧データが取得できませんでした',
          details: `データソース: ${dataSource}, 作業ディレクトリ: ${process.cwd()}`
        },
        { status: 500 }
      );
    }
    
    console.log(`✅ Article list loaded successfully: ${spreadsheetData.length} articles from ${dataSource}`);
    
    // H2ブロックごとに処理する場合
    if (data.h2Blocks && Array.isArray(data.h2Blocks)) {
      const results: { [key: string]: string } = {};
      
      // 処理するブロック数を制限（タイムアウト対策）
      // 無料プランの10秒制限を考慮して、1ブロックずつ処理する
      const blocksToProcess = data.h2Blocks.filter((block: any) => block.writtenContent && block.writtenContent.trim().length > 0);
      const maxBlocksPerRequest = 1; // 1リクエストあたり1ブロックのみ処理（タイムアウト回避）
      const limitedBlocks = blocksToProcess.slice(0, maxBlocksPerRequest);
      
      if (blocksToProcess.length > maxBlocksPerRequest) {
        console.warn(`Processing only first ${maxBlocksPerRequest} block out of ${blocksToProcess.length} to avoid timeout. Remaining blocks will need to be processed separately.`);
      }
      
      try {
        for (const block of limitedBlocks) {
          // 記事内容が長すぎる場合は先頭8000文字に制限（タイムアウト対策、ただし長い記事にも対応）
          // H3が16個ある場合など、長い記事でも処理できるように8000文字に拡張
          const originalContentLength = block.writtenContent?.length || 0;
          const maxContentLength = 8000;
          const isTruncated = originalContentLength > maxContentLength;
          const contentToProcess = isTruncated
            ? block.writtenContent.substring(0, maxContentLength) + '\n\n（...以下省略）'
            : block.writtenContent || '';
          
          // 処理された部分の最後の100文字を保存（既存内容の確認用）
          const processedContentEnd = contentToProcess.substring(Math.max(0, contentToProcess.length - 100));
          
          console.log(`[Internal Links] Block ${block.id} - Content length: ${originalContentLength}, Processing: ${contentToProcess.length}, Truncated: ${isTruncated}`);
          
          const blockArticle = `## ${block.h2Title}\n${block.h3s?.map((h3: any) => `### ${h3.title}`).join('\n') || ''}\n\n${contentToProcess}`;
          
          // プロンプトを取得
          let fullPrompt;
          try {
            fullPrompt = getInternalLinkPrompt({
              article: blockArticle,
              spreadsheetData: spreadsheetData,
            });
          } catch (promptError: any) {
            console.error('Prompt generation error:', promptError);
            throw new Error(`プロンプトの生成に失敗しました: ${promptError.message}`);
          }
          
          // プロンプトに既に出力形式の指示が含まれているので、追加の指示は不要
          
          // デバッグログ：プロンプトの長さと内容の一部を確認
          console.log(`[Internal Links] Block ${block.id} - Prompt length: ${fullPrompt.length}`);
          console.log(`[Internal Links] Block ${block.id} - Prompt preview (last 2000 chars):`, fullPrompt.substring(Math.max(0, fullPrompt.length - 2000)));
          console.log(`[Internal Links] Block ${block.id} - Article content length: ${blockArticle.length}`);
          console.log(`[Internal Links] Block ${block.id} - Spreadsheet data count: ${spreadsheetData?.length || 0}`);
          // プロンプトに記事一覧が含まれているか確認
          const hasArticleList = fullPrompt.includes('記事一覧') || fullPrompt.includes('Webライター');
          console.log(`[Internal Links] Block ${block.id} - Prompt contains article list: ${hasArticleList}`);
          
          // 記事一覧が空の場合は警告
          if (!spreadsheetData || spreadsheetData.length === 0) {
            console.error(`[Internal Links] Block ${block.id} - ERROR: No article list available! Cannot generate internal links.`);
            console.error(`[Internal Links] Block ${block.id} - This is likely why Gemini API is not generating internal links.`);
          }
          
          let result;
          try {
            // タイムアウトを55秒に設定（Vercelの60秒制限を考慮）
            result = await callGemini(fullPrompt, 'gemini-3-pro-preview', undefined, 55000);
            console.log(`[Internal Links] Block ${block.id} - Raw API response length: ${result?.length || 0}`);
            console.log(`[Internal Links] Block ${block.id} - Raw API response (first 2000 chars):`, result?.substring(0, 2000));
            console.log(`[Internal Links] Block ${block.id} - Raw API response contains "参考記事：": ${result?.includes('参考記事：') || false}`);
            console.log(`[Internal Links] Block ${block.id} - Raw API response contains "参考記事:": ${result?.includes('参考記事:') || false}`);
          } catch (geminiError: any) {
            console.error(`Gemini API error for block ${block.id}:`, geminiError);
            
            // タイムアウトエラーの場合は、既存の内容をそのまま返す
            if (geminiError.message && geminiError.message.includes('timeout')) {
              console.warn(`Timeout for block ${block.id}, returning original content`);
              results[block.id] = block.writtenContent;
              continue;
            }
            
            // 429エラー（使用制限超過）の場合は、エラーメッセージをそのまま返す
            if (geminiError.message?.includes('429') || geminiError.message?.includes('Too Many Requests') || geminiError.message?.includes('quota') || geminiError.message?.includes('使用制限')) {
              throw new Error(geminiError.message);
            }
            
            throw new Error(`Gemini API呼び出しに失敗しました: ${geminiError.message || '不明なエラー'}`);
          }
          
          if (!result) {
            console.warn(`No result for block ${block.id}`);
            // 結果がない場合は既存の内容をそのまま返す
            results[block.id] = block.writtenContent;
            continue;
          }
          
          // 既存の内容を取得（デバッグログ用）
          const originalContent = block.writtenContent.trim();
          
          // デバッグ：Gemini APIの生レスポンスを確認
          console.log(`[Internal Links] Block ${block.id} - ===== RAW GEMINI RESPONSE =====`);
          console.log(`[Internal Links] Block ${block.id} - Full response length: ${result.length}`);
          console.log(`[Internal Links] Block ${block.id} - Full response (first 3000 chars):`, result.substring(0, 3000));
          console.log(`[Internal Links] Block ${block.id} - Full response (last 3000 chars):`, result.substring(Math.max(0, result.length - 3000)));
          console.log(`[Internal Links] Block ${block.id} - Contains "参考記事：": ${result.includes('参考記事：')}`);
          console.log(`[Internal Links] Block ${block.id} - Contains "参考記事:": ${result.includes('参考記事:')}`);
          console.log(`[Internal Links] Block ${block.id} - Contains original content start: ${result.includes(originalContent.substring(0, 50))}`);
          
          // 不要な分析結果やメッセージを削除
          let cleanedResult = result;
          
          // 「記事を分析し、内部リンクの挿入箇所を提案します。」などのメッセージを削除
          cleanedResult = cleanedResult.replace(/記事を分析し、内部リンクの挿入箇所を提案します。[\s\S]*?【内部リンク挿入提案】/g, '');
          cleanedResult = cleanedResult.replace(/【分析結果】[\s\S]*?【内部リンク挿入提案】/g, '');
          cleanedResult = cleanedResult.replace(/検出した見出し数:[\s\S]*?選定した関連記事:[\s\S]*?/g, '');
          
          // 「提案内容は適切でしたか?」などの質問を削除
          cleanedResult = cleanedResult.replace(/提案内容は適切でしたか\?[\s\S]*?削除すべきリンク提案はありますか\?/g, '');
          cleanedResult = cleanedResult.replace(/追加でリンクを検討すべき箇所はありますか\?/g, '');
          cleanedResult = cleanedResult.replace(/削除すべきリンク提案はありますか\?/g, '');
          cleanedResult = cleanedResult.replace(/提案内容は以上です。[\s\S]*?$/g, '');
          
          // 「---」などの区切り線を削除
          cleanedResult = cleanedResult.replace(/^---+$/gm, '');
          
          console.log(`[Internal Links] Block ${block.id} - ===== AFTER CLEANING =====`);
          console.log(`[Internal Links] Block ${block.id} - Cleaned length: ${cleanedResult.length}`);
          console.log(`[Internal Links] Block ${block.id} - Contains "参考記事：": ${cleanedResult.includes('参考記事：')}`);
          console.log(`[Internal Links] Block ${block.id} - Contains "参考記事:": ${cleanedResult.includes('参考記事:')}`);
          
          // 既存の内容が含まれているか確認（開始部分と終了部分の両方を確認）
          // originalContentは上で既に定義済み
          const originalContentStart = originalContent.substring(0, 100);
          
          // コンテンツが切り詰められている場合は、処理された部分の最後の100文字で確認
          // そうでない場合は、元のコンテンツ全体の最後の100文字で確認
          const originalContentEnd = isTruncated 
            ? processedContentEnd 
            : originalContent.substring(Math.max(0, originalContent.length - 100));
          
          const hasOriginalContentStart = cleanedResult.includes(originalContentStart);
          const hasOriginalContentEnd = cleanedResult.includes(originalContentEnd);
          
          // 内部リンクが含まれているか確認（全角コロンと半角コロンの両方をチェック）
          const hasInternalLink = cleanedResult.includes('参考記事：') || cleanedResult.includes('参考記事:');
          
          console.log(`[Internal Links] Block ${block.id} - Has original content start: ${hasOriginalContentStart}`);
          console.log(`[Internal Links] Block ${block.id} - Has original content end: ${hasOriginalContentEnd}`);
          console.log(`[Internal Links] Block ${block.id} - Has internal link: ${hasInternalLink}`);
          console.log(`[Internal Links] Block ${block.id} - Cleaned result length: ${cleanedResult.length}`);
          console.log(`[Internal Links] Block ${block.id} - Original content length: ${originalContent.length}`);
          console.log(`[Internal Links] Block ${block.id} - Cleaned result (first 1000 chars):`, cleanedResult.substring(0, 1000));
          console.log(`[Internal Links] Block ${block.id} - Original content start:`, originalContentStart);
          console.log(`[Internal Links] Block ${block.id} - Original content end:`, originalContentEnd);
          
          // 既存の内容の開始部分と終了部分の両方が含まれていることを確認
          const hasOriginalContent = hasOriginalContentStart && hasOriginalContentEnd;
          
          if (!hasOriginalContent) {
            // 既存の内容が完全に保持されていない場合は警告し、元の内容を返す
            console.warn(`既存の内容が完全に保持されていない可能性があります。ブロックID: ${block.id}`);
            console.warn(`元の内容の最初の100文字: ${originalContentStart}`);
            console.warn(`元の内容の最後の100文字: ${originalContentEnd}`);
            console.warn(`APIレスポンスの最初の500文字:`, cleanedResult.substring(0, 500));
            console.warn(`APIレスポンスの最後の500文字:`, cleanedResult.substring(Math.max(0, cleanedResult.length - 500)));
            // 安全のため、元の内容を返す（内部リンクが含まれていても、既存の内容が完全に保持されていない場合は元の内容を優先）
            console.log(`[Internal Links] Block ${block.id} - Returning original content (content not fully preserved)`);
            results[block.id] = block.writtenContent;
          } else {
            // 既存の内容が含まれている場合
            // 先頭部分に見出し（##、###など）が含まれている場合は削除
            // 既存の内容の開始位置を特定
            const originalStartIndex = cleanedResult.indexOf(originalContentStart);
            
            if (originalStartIndex > 0) {
              // 既存の内容の前にある部分を取得
              const beforeContent = cleanedResult.substring(0, originalStartIndex);
              // 見出し行を削除（行全体が見出しの場合のみ）
              const cleanedBefore = beforeContent
                .split('\n')
                .filter(line => {
                  const trimmed = line.trim();
                  // 行全体が見出しマークダウン（##、###など）の場合のみ削除
                  if (trimmed.match(/^#{1,6}\s+[^#]*$/)) return false;
                  // 行全体がH2:、H3:などの形式の場合のみ削除
                  if (trimmed.match(/^H[234][:：]\s+[^H]*$/i)) return false;
                  // 行全体がh2:、h3:などの形式の場合のみ削除（小文字）
                  if (trimmed.match(/^h[234][:：]\s+[^h]*$/)) return false;
                  return true;
                })
                .join('\n');
              
              // 既存の内容の後ろの部分を取得
              const afterContent = cleanedResult.substring(originalStartIndex);
              
              // 結合（先頭の空白行も削除）
              cleanedResult = (cleanedBefore + '\n' + afterContent).replace(/^\n+/, '').trim();
            } else {
              // 既存の内容が先頭にある場合でも、先頭に見出しが含まれている可能性がある
              // 先頭から既存の内容の開始位置までを見出しとして削除
              const lines = cleanedResult.split('\n');
              let foundOriginalStart = false;
              const cleanedLines: string[] = [];
              
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const trimmed = line.trim();
                
                // 既存の内容の開始位置を特定
                if (!foundOriginalStart && line.includes(originalContentStart.substring(0, 50))) {
                  foundOriginalStart = true;
                  cleanedLines.push(line);
                  continue;
                }
                
                // 既存の内容が見つかる前は、見出し行を削除
                if (!foundOriginalStart) {
                  // 行全体が見出しマークダウン（##、###など）の場合のみ削除
                  if (trimmed.match(/^#{1,6}\s+[^#]*$/)) continue;
                  // 行全体がH2:、H3:などの形式の場合のみ削除
                  if (trimmed.match(/^H[234][:：]\s+[^H]*$/i)) continue;
                  // 行全体がh2:、h3:などの形式の場合のみ削除（小文字）
                  if (trimmed.match(/^h[234][:：]\s+[^h]*$/)) continue;
                }
                
                cleanedLines.push(line);
              }
              
              cleanedResult = cleanedLines.join('\n').trim();
            }
            
            // 既存の内容の開始位置と終了位置を特定して、その範囲内の内容を保持
            // コンテンツが切り詰められている場合は、処理された部分の最後の100文字で確認
            const endContentToCheck = isTruncated ? processedContentEnd : originalContentEnd;
            const originalEndIndex = cleanedResult.lastIndexOf(endContentToCheck);
            
            // 既存の内容の範囲が正しく特定できているか確認
            if (originalStartIndex >= 0 && originalEndIndex >= originalStartIndex) {
              // 既存の内容の範囲内の部分を抽出
              const extractedContent = cleanedResult.substring(originalStartIndex, originalEndIndex + endContentToCheck.length);
              
              // 既存の内容の長さと抽出した内容の長さを比較
              const extractedLength = extractedContent.length;
              const originalLength = originalContent.length;
              
              console.log(`[Internal Links] Block ${block.id} - Extracted content length: ${extractedLength}`);
              console.log(`[Internal Links] Block ${block.id} - Original content length: ${originalLength}`);
              
              // 抽出した内容が元の内容の80%以上の長さを持っていることを確認（内部リンクが追加されるため、少し長くなる可能性がある）
              if (extractedLength >= originalLength * 0.8) {
                const finalResult = cleanedResult.trim();
                const hasInternalLinkInFinal = finalResult.includes('参考記事：') || finalResult.includes('参考記事:');
                
                console.log(`[Internal Links] Block ${block.id} - Final result length: ${finalResult.length}`);
                console.log(`[Internal Links] Block ${block.id} - Final result contains "参考記事：": ${finalResult.includes('参考記事：')}`);
                console.log(`[Internal Links] Block ${block.id} - Final result contains "参考記事:": ${finalResult.includes('参考記事:')}`);
                
                if (hasInternalLinkInFinal) {
                  // 内部リンクが含まれている場合は、APIレスポンスを返す
                  console.log(`[Internal Links] Block ${block.id} - Returning API response with internal links`);
                  results[block.id] = finalResult;
                } else {
                  // 内部リンクが含まれていない場合でも、Gemini APIが何か変更を加えている可能性がある
                  // 元の内容と比較して、実際に変更があるかどうかを確認
                  const contentActuallyChanged = finalResult !== originalContent;
                  
                  if (contentActuallyChanged) {
                    // 内容が変更されている場合は、Gemini APIが何か処理をしている可能性がある
                    // しかし内部リンクが含まれていないので、警告を出して元の内容を返す
                    console.warn(`[Internal Links] Block ${block.id} - Content changed but no internal links found.`);
                    console.warn(`[Internal Links] Block ${block.id} - This suggests Gemini API processed the content but did not add internal links.`);
                    console.warn(`[Internal Links] Block ${block.id} - Returning original content to preserve data integrity.`);
                    results[block.id] = block.writtenContent;
                  } else {
                    // 内容が変更されていない = Gemini APIが元の内容をそのまま返している
                    console.error(`[Internal Links] Block ${block.id} - ERROR: Gemini API returned unchanged content with no internal links!`);
                    console.error(`[Internal Links] Block ${block.id} - This means Gemini API did not process the request properly.`);
                    console.error(`[Internal Links] Block ${block.id} - Possible causes:`);
                    console.error(`[Internal Links] Block ${block.id} - 1. Article list is empty or not loaded`);
                    console.error(`[Internal Links] Block ${block.id} - 2. Prompt is too long and instructions were ignored`);
                    console.error(`[Internal Links] Block ${block.id} - 3. Gemini API did not understand the instructions`);
                    console.error(`[Internal Links] Block ${block.id} - 4. Content is too long and was truncated`);
                    results[block.id] = block.writtenContent;
                  }
                }
              } else {
                // 抽出した内容が短すぎる場合は、元の内容を返す
                console.warn(`[Internal Links] Block ${block.id} - Extracted content is too short. Returning original content.`);
                results[block.id] = block.writtenContent;
              }
            } else {
              // 既存の内容の範囲が特定できない場合は、元の内容を返す
              console.warn(`[Internal Links] Block ${block.id} - Could not identify original content range. Returning original content.`);
              results[block.id] = block.writtenContent;
            }
          }
        }
      } catch (processingError: any) {
        console.error('Error processing blocks:', processingError);
        return NextResponse.json(
          { error: `H2ブロックの処理に失敗しました: ${processingError.message}` },
          { status: 500 }
        );
      }
      
      // デバッグログを追加
      console.log(`[Internal Links] Returning results for ${Object.keys(results).length} blocks`);
      Object.keys(results).forEach(blockId => {
        const content = results[blockId];
        const originalContent = data.h2Blocks.find((b: any) => b.id === blockId)?.writtenContent || '';
        const hasInternalLink = content.includes('参考記事：') || content.includes('参考記事:');
        const contentChanged = content !== originalContent;
        
        console.log(`[Internal Links] Block ${blockId} - Final result has internal link: ${hasInternalLink}`);
        console.log(`[Internal Links] Block ${blockId} - Final result length: ${content.length}`);
        console.log(`[Internal Links] Block ${blockId} - Original content length: ${originalContent.length}`);
        console.log(`[Internal Links] Block ${blockId} - Content changed: ${contentChanged}`);
        console.log(`[Internal Links] Block ${blockId} - Final result preview (first 1000 chars):`, content.substring(0, 1000));
        
        if (!hasInternalLink && contentChanged) {
          console.warn(`[Internal Links] Block ${blockId} - WARNING: Content changed but no internal links found!`);
          console.warn(`[Internal Links] Block ${blockId} - This might indicate Gemini API did not follow instructions.`);
        }
        
        if (!hasInternalLink && !contentChanged) {
          console.warn(`[Internal Links] Block ${blockId} - WARNING: Content unchanged and no internal links found!`);
          console.warn(`[Internal Links] Block ${blockId} - This might indicate Gemini API did not generate internal links.`);
        }
      });
      
      return NextResponse.json({ 
        h2BlocksWithLinks: results,
        articleCount: spreadsheetData.length,
        source: data.spreadsheetData ? 'manual' : 'google-sheets'
      });
    }
    
    // 記事全体を処理する場合（後方互換性のため）
    if (!data.article) {
      return NextResponse.json(
        { error: '記事データが提供されていません。' },
        { status: 400 }
      );
    }

    let fullPrompt;
    try {
      fullPrompt = getInternalLinkPrompt({
        article: data.article,
        spreadsheetData: spreadsheetData,
      });
    } catch (promptError: any) {
      console.error('Prompt generation error:', promptError);
      return NextResponse.json(
        { error: `プロンプトの生成に失敗しました: ${promptError.message}` },
        { status: 500 }
      );
    }
    
    // 既存の記事内容を保持したまま、内部リンクを挿入するように指示（簡潔版）
    fullPrompt += `

## 出力形式
- 既存の記事内容を一字一句そのまま保持し、適切な箇所に「参考記事：記事タイトル(URL)」形式で内部リンクを挿入
- 内部リンクは必ず「参考記事：」（全角コロン）で始める
- 見出しは出力せず、本文のみを出力
- 分析結果やメッセージは一切出力しない`;
    
    let result;
    try {
      // タイムアウトを55秒に設定（Vercelの60秒制限を考慮）
      result = await callGemini(fullPrompt, 'gemini-3-pro-preview', undefined, 55000);
    } catch (geminiError: any) {
      console.error('Gemini API error:', geminiError);
      
      // 429エラー（使用制限超過）の場合は、エラーメッセージをそのまま返す
      if (geminiError.message?.includes('429') || geminiError.message?.includes('Too Many Requests') || geminiError.message?.includes('quota') || geminiError.message?.includes('使用制限')) {
        return NextResponse.json(
          { error: geminiError.message },
          { status: 429 }
        );
      }
      
      // タイムアウトエラーの場合は、より詳細なエラーメッセージを返す
      if (geminiError.message && geminiError.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'API呼び出しがタイムアウトしました。記事が長すぎる可能性があります。H2ブロックごとに分割して処理してください。' },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: `Gemini API呼び出しに失敗しました: ${geminiError.message || '不明なエラー'}` },
        { status: 500 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { error: '内部リンクの生成結果が空でした。' },
        { status: 500 }
      );
    }

    // 【重要】既存の文章（「H2: 」「H3: 」などの表記を含む）は一切変更しない
    // プロンプトで「見出しは出力しない」と指示しているため、見出し削除処理は不要
    // 既存の内容をそのまま保持する
    let cleanedResult = result.trim();
    
    return NextResponse.json({ 
      internalLinks: cleanedResult,
      articleWithLinks: cleanedResult,
      articleCount: spreadsheetData.length,
      source: data.spreadsheetData ? 'manual' : 'google-sheets'
    });
  } catch (error: any) {
    console.error('Error generating internal links:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || '内部リンクの生成に失敗しました。詳細はサーバーログを確認してください。' },
      { status: 500 }
    );
  }
}

