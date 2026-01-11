import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { getSalesLocationPrompt } from '@/lib/prompts';

// Vercelの関数タイムアウト設定
// Proプランでは60秒まで可能
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // H2ブロックごとに処理する場合
    if (data.h2Blocks && Array.isArray(data.h2Blocks)) {
      const results: { [key: string]: string } = {};
      
      // 処理するブロック数を制限（タイムアウト対策）
      // 1リクエストあたり1ブロックのみ処理（タイムアウト回避）
      // 既に「※ここにセールス文を書く」が含まれているブロックはスキップ
      const blocksToProcess = data.h2Blocks.filter((block: any) => {
        if (!block.writtenContent || block.writtenContent.trim().length === 0) {
          return false;
        }
        // 既にセールスマーカーが含まれている場合はスキップ
        const hasSalesMarker = block.writtenContent.includes('※ここにセールス文を書く');
        return !hasSalesMarker;
      });
      
      // 記事全体で既に「※ここにセールス文を書く」が2箇所以上ある場合は、処理をスキップ
      const allBlocks = data.h2Blocks || [];
      const totalSalesMarkers = allBlocks.reduce((count: number, block: any) => {
        if (block.writtenContent && block.writtenContent.includes('※ここにセールス文を書く')) {
          return count + (block.writtenContent.match(/※ここにセールス文を書く/g) || []).length;
        }
        return count;
      }, 0);
      
      console.log(`[Sales Locations] Total sales markers in article: ${totalSalesMarkers}`);
      console.log(`[Sales Locations] Blocks to process: ${blocksToProcess.length}`);
      
      if (totalSalesMarkers >= 2) {
        console.log(`[Sales Locations] Already have ${totalSalesMarkers} sales markers in article. Skipping processing.`);
        return NextResponse.json({ 
          h2BlocksWithSalesMarkers: {},
          message: '記事全体で既に2箇所以上のセールス箇所が追加されています。',
        });
      }
      
      if (blocksToProcess.length === 0) {
        console.log(`[Sales Locations] No blocks to process (all blocks already have sales markers).`);
        return NextResponse.json({ 
          h2BlocksWithSalesMarkers: {},
          message: 'すべてのブロックに既にセールス箇所が追加されています。',
        });
      }
      
      const maxBlocksPerRequest = 1; // 1リクエストあたり1ブロックのみ処理（タイムアウト回避）
      const limitedBlocks = blocksToProcess.slice(0, maxBlocksPerRequest);
      
      console.log(`[Sales Locations] Processing block: ${limitedBlocks[0]?.id}, Total markers before: ${totalSalesMarkers}`);
      
      if (blocksToProcess.length > maxBlocksPerRequest) {
        console.warn(`Processing only first ${maxBlocksPerRequest} block out of ${blocksToProcess.length} to avoid timeout. Remaining blocks will need to be processed separately.`);
      }
      
      try {
        for (const block of limitedBlocks) {
          if (!block.writtenContent || block.writtenContent.trim().length === 0) {
            // 執筆内容がない場合はスキップ
            continue;
          }

          // 記事内容が長すぎる場合は先頭2000文字に制限（タイムアウト対策）
          const contentToProcess = block.writtenContent && block.writtenContent.length > 2000 
            ? block.writtenContent.substring(0, 2000) + '\n\n（...以下省略）'
            : block.writtenContent || '';
          
          const blockArticle = `${contentToProcess}`;
          
          // 記事全体で既に「※ここにセールス文を書く」が2箇所以上ある場合は、このブロックには挿入しない
          const currentTotalMarkers = totalSalesMarkers;
          const shouldInsertMarker = currentTotalMarkers < 2;
          
          console.log(`[Sales Locations] Block ${block.id} - Current total markers: ${currentTotalMarkers}, Should insert: ${shouldInsertMarker}`);
          
          // プロンプトを取得
          let fullPrompt;
          try {
            fullPrompt = getSalesLocationPrompt({
              article: blockArticle,
              productUrl: data.productUrl,
              articleTopic: data.articleTopic,
              currentTotalMarkers: currentTotalMarkers,
              shouldInsertMarker: shouldInsertMarker,
            });
          } catch (promptError: any) {
            console.error('Prompt generation error:', promptError);
            throw new Error(`プロンプトの生成に失敗しました: ${promptError.message}`);
          }
          
          // 既存の記事内容を保持したまま、セールス箇所に「※ここにセールス文を書く」を挿入するように指示
          // （プロンプトファイルに既に詳細な指示が含まれているため、追加の指示は不要）
          
          let result;
          try {
            // タイムアウトを55秒に設定（Vercelの60秒制限を考慮）
            result = await callGemini(fullPrompt, 'gemini-3-pro-preview', undefined, 55000);
            console.log(`[Sales Locations] Block ${block.id} - Raw API response length: ${result?.length || 0}`);
            console.log(`[Sales Locations] Block ${block.id} - Raw API response (first 2000 chars):`, result?.substring(0, 2000));
            console.log(`[Sales Locations] Block ${block.id} - Raw API response contains "※ここにセールス文を書く": ${result?.includes('※ここにセールス文を書く') || false}`);
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
          
          // 「記事を分析し、セールス箇所を特定します。」などのメッセージを削除
          cleanedResult = cleanedResult.replace(/記事を分析し、セールス箇所を特定します。[\s\S]*?【セールス箇所提案】/g, '');
          cleanedResult = cleanedResult.replace(/【分析結果】[\s\S]*?【セールス箇所提案】/g, '');
          
          // 「提案内容は適切でしたか?」などの質問を削除
          cleanedResult = cleanedResult.replace(/提案内容は適切でしたか\?[\s\S]*?$/g, '');
          
          // 「---」などの区切り線を削除
          cleanedResult = cleanedResult.replace(/^---+$/gm, '');
          
          // 既存の内容が含まれているか確認（開始部分と終了部分の両方を確認）
          const originalContent = block.writtenContent.trim();
          const originalContentStart = originalContent.substring(0, 100);
          const originalContentEnd = originalContent.substring(Math.max(0, originalContent.length - 100));
          const hasOriginalContentStart = cleanedResult.includes(originalContentStart);
          const hasOriginalContentEnd = cleanedResult.includes(originalContentEnd);
          
          // 「※ここにセールス文を書く」が含まれているか確認
          const hasSalesMarker = cleanedResult.includes('※ここにセールス文を書く');
          
          console.log(`[Sales Locations] Block ${block.id} - Has original content start: ${hasOriginalContentStart}`);
          console.log(`[Sales Locations] Block ${block.id} - Has original content end: ${hasOriginalContentEnd}`);
          console.log(`[Sales Locations] Block ${block.id} - Has sales marker: ${hasSalesMarker}`);
          console.log(`[Sales Locations] Block ${block.id} - Cleaned result length: ${cleanedResult.length}`);
          console.log(`[Sales Locations] Block ${block.id} - Original content length: ${originalContent.length}`);
          console.log(`[Sales Locations] Block ${block.id} - Cleaned result (first 500 chars):`, cleanedResult.substring(0, 500));
          
          // 既存の内容の開始部分と終了部分の両方が含まれていることを確認
          const hasOriginalContent = hasOriginalContentStart && hasOriginalContentEnd;
          
          if (!hasOriginalContent) {
            // 既存の内容が完全に保持されていない場合は警告し、元の内容を返す
            console.warn(`既存の内容が完全に保持されていない可能性があります。ブロックID: ${block.id}`);
            console.warn(`元の内容の最初の100文字: ${originalContentStart}`);
            console.warn(`元の内容の最後の100文字: ${originalContentEnd}`);
            console.warn(`APIレスポンスの最初の500文字: ${cleanedResult.substring(0, 500)}`);
            console.warn(`APIレスポンスの最後の500文字: ${cleanedResult.substring(Math.max(0, cleanedResult.length - 500))}`);
            // 安全のため、元の内容を返す
            console.log(`[Sales Locations] Block ${block.id} - Returning original content (content not fully preserved)`);
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
            // 既存の内容の完全性を確認（開始部分と終了部分の両方を確認）
            const originalContent = block.writtenContent.trim();
            const originalContentEnd = originalContent.substring(Math.max(0, originalContent.length - 100));
            const finalResult = cleanedResult.trim();
            const hasOriginalContentEndInFinal = finalResult.includes(originalContentEnd);
            
            // 既存の内容の開始部分と終了部分の両方が含まれていることを確認
            if (!hasOriginalContentEndInFinal) {
              console.warn(`[Sales Locations] Block ${block.id} - Original content end not found in result. Returning original content.`);
              console.warn(`[Sales Locations] Block ${block.id} - Original content end: ${originalContentEnd}`);
              console.warn(`[Sales Locations] Block ${block.id} - Final result end: ${finalResult.substring(Math.max(0, finalResult.length - 200))}`);
              results[block.id] = block.writtenContent;
            } else {
              // 「※ここにセールス文を書く」が含まれている場合は、必ずAPIレスポンスを返す
              const hasSalesMarkerInFinal = finalResult.includes('※ここにセールス文を書く');
              
              console.log(`[Sales Locations] Block ${block.id} - Final result length: ${finalResult.length}`);
              console.log(`[Sales Locations] Block ${block.id} - Original content length: ${originalContent.length}`);
              console.log(`[Sales Locations] Block ${block.id} - Final result contains "※ここにセールス文を書く": ${hasSalesMarkerInFinal}`);
              console.log(`[Sales Locations] Block ${block.id} - Current total markers: ${currentTotalMarkers}, Should insert: ${shouldInsertMarker}`);
              
              // 記事全体で既に2箇所以上ある場合は、マーカーを追加しない（既存の内容をそのまま返す）
              if (currentTotalMarkers >= 2 && hasSalesMarkerInFinal) {
                console.log(`[Sales Locations] Block ${block.id} - Already have 2+ markers, removing marker from result`);
                // 「※ここにセールス文を書く」を削除して、既存の内容のみを返す
                const resultWithoutMarker = finalResult.replace(/※ここにセールス文を書く\n?/g, '').trim();
                results[block.id] = resultWithoutMarker || block.writtenContent;
              } else if (hasSalesMarkerInFinal) {
                // 「※ここにセールス文を書く」が含まれている場合は、APIレスポンスを返す
                console.log(`[Sales Locations] Block ${block.id} - Returning API response with sales marker`);
                results[block.id] = finalResult;
              } else {
                // 「※ここにセールス文を書く」が含まれていない場合は、元の内容を返す
                console.log(`[Sales Locations] Block ${block.id} - No sales marker found in result. Returning original content (this is OK if not needed).`);
                results[block.id] = block.writtenContent;
              }
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
        h2BlocksWithSalesMarkers: results,
      });
    }
    
    // 記事全体を処理する場合（後方互換性のため）
    if (!data.article) {
      return NextResponse.json(
        { error: '記事データが提供されていません。' },
        { status: 400 }
      );
    }
    
    // プロンプトを取得
    const fullPrompt = getSalesLocationPrompt({
      article: data.article,
      productUrl: data.productUrl,
      articleTopic: data.articleTopic,
    });
    
    // タイムアウトを55秒に設定（Vercelの60秒制限を考慮）
    const result = await callGemini(fullPrompt, 'gemini-3-pro-preview', undefined, 55000);
    
    return NextResponse.json({ salesLocations: result });
  } catch (error: any) {
    console.error('Error generating sales locations:', error);
    return NextResponse.json(
      { error: error.message || 'セールス箇所の特定に失敗しました' },
      { status: 500 }
    );
  }
}

