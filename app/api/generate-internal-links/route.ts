import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { getInternalLinkPrompt } from '@/lib/prompts';
import { getArticleList } from '@/lib/google-sheets';
import { readFileSync } from 'fs';
import { join } from 'path';

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
        spreadsheetData = await getArticleList();
        dataSource = 'google-sheets';
        console.log(`✅ Fetched ${spreadsheetData.length} articles from Google Sheets`);
      } catch (sheetsError: any) {
        console.error('⚠️ Google Sheets API error, using fallback:', sheetsError?.message || sheetsError);
        // エラーが発生した場合は、フォールバックとしてローカルのJSONファイルを使用
        spreadsheetData = loadArticleListFallback();
        dataSource = 'fallback';
        if (spreadsheetData.length > 0) {
          console.log(`✅ Using fallback: ${spreadsheetData.length} articles loaded`);
        } else {
          console.error('❌ Fallback also failed: No articles loaded');
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
      
      try {
        for (const block of data.h2Blocks) {
          if (!block.writtenContent || block.writtenContent.trim().length === 0) {
            // 執筆内容がない場合はスキップ
            continue;
          }

          const blockArticle = `## ${block.h2Title}\n${block.h3s?.map((h3: any) => `### ${h3.title}`).join('\n') || ''}\n\n${block.writtenContent || ''}`;
          
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
          
          // 既存の記事内容を保持したまま、内部リンクを挿入するように指示
          fullPrompt += `

## ⚠️【超重要】出力形式について⚠️
- **既存の記事内容を一字一句そのまま保持してください**
- **既存の記事内容を削除したり、変更したり、要約したりしてはいけません**
- **既存の記事内容をそのまま出力し、適切な箇所に内部リンクを挿入してください**
- **既存の記事内容の中に、適切な箇所に「参考記事:記事タイトル(URL)」という形式で内部リンクを挿入してください**

## ⚠️【超重要】内部リンクの設置基準⚠️
- **1つのH2ブロック（見出しセクション）内に、関連する記事が複数ある場合は、2〜3個の内部リンクを挿入してください**
- **1つのH2ブロック内に、関連する記事が1つしかない場合でも、そのブロック内の異なる箇所に複数の内部リンクを挿入できる場合は、複数挿入してください**
- **記事の内容を詳しく読み、記事一覧から関連する記事を積極的に選んでください**
- **記事の各セクション・段落を分析し、関連する記事が複数ある場合は、複数の箇所に内部リンクを挿入してください**
- **記事の内容と記事一覧の記事タイトル・内容を照らし合わせ、関連性の高い記事を選んでください**
- **専門用語や概念の初出時に、その詳細解説記事がある場合は内部リンクを挿入してください**
- **「〜の方法」「〜のやり方」等、具体的な手順を示唆する箇所に内部リンクを挿入してください**
- **ツールやサービスの言及時に、そのレビュー・解説記事がある場合は内部リンクを挿入してください**
- **関連トピックへの言及があり、読者が興味を持ちそうな場合に内部リンクを挿入してください**
- **「詳しくは〜」「詳細は〜」等の補足を示唆する表現がある箇所に内部リンクを挿入してください**
- **必ず1つ以上の内部リンクを挿入してください（可能な限り複数の内部リンクを挿入してください）**
- **内部リンクを1つも挿入しない場合は、出力として不適切です**
- **内部リンクの数が少なすぎる場合も、出力として不適切です**
- **1つのH2ブロック内に、関連する記事が複数ある場合は、最低でも2個以上の内部リンクを挿入してください**
- **スプレッドシートの記事一覧から、記事内容に関連する記事を選んで内部リンクとして挿入してください**
- **記事内容に関連する記事が1つも見つからない場合は、記事一覧から最も関連性の高い記事を選んで挿入してください**
- 内部リンクは必ず「参考記事:」で始めてください
- 記事タイトルは[]で囲まず、「参考記事:記事タイトル(URL)」の形式で記述してください
- 記事のURLも必ず含めてください（例：参考記事:Webライターとは?8年経験者が解説!(https://example.com/article)）
- 元の記事の構造（見出し、本文）を維持しながら、自然な流れで内部リンクを挿入してください
- **既存の文章を全て残したまま、内部リンクだけを追加してください**
- **既存の文章を削除したり、変更したり、要約したりしてはいけません**
- **既存の文章を一字一句そのまま保持し、適切な箇所に内部リンクを挿入してください**
- **見出し（##、###、H2:、H3:など）は一切出力しないでください**
- **見出しを含めず、本文の内容のみを出力してください**
- **分析結果や提案メッセージは一切出力しないでください**
- **「記事を分析し、内部リンクの挿入箇所を提案します」などのメッセージは出力しないでください**
- **「【分析結果】」「【内部リンク挿入提案】」などの見出しは出力しないでください**
- **「提案内容は適切でしたか?」などの質問は出力しないでください**
- **「---」などの区切り線も出力しないでください**
- **既存の記事内容に内部リンクを挿入した結果のみを出力してください**
- **出力は既存の記事内容（内部リンク挿入済み）のみで、それ以外は一切出力しないでください**
- 内部リンクを挿入した記事内容を出力してください（見出しは含めず、本文のみ）
- **出力例：**
  既存の文章の一部です。ここに内部リンクを挿入します。
  参考記事:Webライターとは?8年経験者が解説!(https://example.com/article)
  既存の文章の続きです。`;
          
          let result;
          try {
            result = await callGemini(fullPrompt, 'gemini-3-pro-preview');
            console.log(`[Internal Links] Block ${block.id} - Raw API response length: ${result?.length || 0}`);
            console.log(`[Internal Links] Block ${block.id} - Raw API response (first 500 chars):`, result?.substring(0, 500));
          } catch (geminiError: any) {
            console.error(`Gemini API error for block ${block.id}:`, geminiError);
            throw new Error(`Gemini API呼び出しに失敗しました: ${geminiError.message || '不明なエラー'}`);
          }
          
          if (!result) {
            console.warn(`No result for block ${block.id}`);
            // 結果がない場合は既存の内容をそのまま返す
            results[block.id] = block.writtenContent;
            continue;
          }
          
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
          
          // 既存の内容が含まれているか確認
          const originalContentStart = block.writtenContent.trim().substring(0, 100);
          const hasOriginalContent = cleanedResult.includes(originalContentStart);
          
          // 内部リンクが含まれているか確認
          const hasInternalLink = cleanedResult.includes('参考記事:');
          
          console.log(`[Internal Links] Block ${block.id} - Has original content: ${hasOriginalContent}`);
          console.log(`[Internal Links] Block ${block.id} - Has internal link: ${hasInternalLink}`);
          console.log(`[Internal Links] Block ${block.id} - Cleaned result length: ${cleanedResult.length}`);
          console.log(`[Internal Links] Block ${block.id} - Cleaned result (first 500 chars):`, cleanedResult.substring(0, 500));
          
          if (!hasOriginalContent) {
            // 既存の内容が含まれていない場合は警告し、既存の内容をそのまま返す
            console.warn(`既存の内容が保持されていない可能性があります。ブロックID: ${block.id}`);
            console.warn(`元の内容の最初の100文字: ${originalContentStart}`);
            console.warn(`APIレスポンスの最初の500文字: ${cleanedResult.substring(0, 500)}`);
            // 既存の内容をそのまま返す（安全策）
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
            
            // 【重要】既存の文章（「H2: 」「H3: 」などの表記を含む）は一切変更しない
            // 既存の内容の完全性を確認（既存の内容が一字一句保持されているか）
            const originalContentLines = block.writtenContent.split('\n');
            const finalResultLines = cleanedResult.split('\n');
            
            // 既存の内容の各行が最終結果に含まれているか確認（順序は変わっても良いが、内容は保持されている必要がある）
            let allOriginalLinesPreserved = true;
            for (const originalLine of originalContentLines) {
              const trimmedOriginal = originalLine.trim();
              if (trimmedOriginal.length > 0) {
                // 既存の行が最終結果に含まれているか確認
                const found = finalResultLines.some(resultLine => resultLine.includes(trimmedOriginal) || trimmedOriginal.includes(resultLine.trim()));
                if (!found) {
                  console.warn(`[Internal Links] Block ${block.id} - Original line not found in result: ${trimmedOriginal.substring(0, 50)}`);
                  allOriginalLinesPreserved = false;
                }
              }
            }
            
            if (!allOriginalLinesPreserved) {
              console.warn(`[Internal Links] Block ${block.id} - Some original content may have been modified. Using original content.`);
              // 既存の内容が変更されている可能性がある場合は、既存の内容をそのまま返す
              results[block.id] = block.writtenContent;
            } else {
              const finalResult = cleanedResult.trim();
              console.log(`[Internal Links] Block ${block.id} - Final result length: ${finalResult.length}`);
              console.log(`[Internal Links] Block ${block.id} - Final result contains "参考記事:": ${finalResult.includes('参考記事:')}`);
              console.log(`[Internal Links] Block ${block.id} - Original content preserved: ${allOriginalLinesPreserved}`);
              results[block.id] = finalResult;
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
    
    // 既存の記事内容を保持したまま、内部リンクを挿入するように指示
    fullPrompt += `

## ⚠️【超重要】出力形式について⚠️
- **既存の記事内容を一字一句そのまま保持してください**
- **既存の記事内容を削除したり、変更したり、要約したりしてはいけません**
- **既存の記事内容をそのまま出力し、適切な箇所に内部リンクを挿入してください**
- **既存の記事内容の中に、適切な箇所に「参考記事:記事タイトル(URL)」という形式で内部リンクを挿入してください**
- 内部リンクは必ず「参考記事:」で始めてください
- 記事タイトルは[]で囲まず、「参考記事:記事タイトル(URL)」の形式で記述してください
- 記事のURLも必ず含めてください（例：参考記事:Webライターとは?8年経験者が解説!(https://example.com/article)）
- 元の記事の構造（見出し、本文）を維持しながら、自然な流れで内部リンクを挿入してください
- **既存の文章を全て残したまま、内部リンクだけを追加してください**
- **既存の文章を削除したり、変更したり、要約したりしてはいけません**
- **既存の文章を一字一句そのまま保持し、適切な箇所に内部リンクを挿入してください**
- **見出し（##、###、H2:、H3:など）は一切出力しないでください**
- **見出しを含めず、本文の内容のみを出力してください**
- **分析結果や提案メッセージは一切出力しないでください**
- **「記事を分析し、内部リンクの挿入箇所を提案します」などのメッセージは出力しないでください**
- **「【分析結果】」「【内部リンク挿入提案】」などの見出しは出力しないでください**
- **「提案内容は適切でしたか?」などの質問は出力しないでください**
- **既存の記事内容に内部リンクを挿入した結果のみを出力してください**
- 内部リンクを挿入した記事全体を出力してください`;
    
    let result;
    try {
      result = await callGemini(fullPrompt, 'gemini-3-pro-preview');
    } catch (geminiError: any) {
      console.error('Gemini API error:', geminiError);
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

