import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { getSupervisorCommentPrompt } from '@/lib/prompts';

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
      // 既に「<佐藤誠一吹き出し>」が含まれているブロックはスキップ
      const blocksToProcess = data.h2Blocks.filter((block: any) => {
        if (!block.writtenContent || block.writtenContent.trim().length === 0) {
          return false;
        }
        // 「導入文」「ディスクリプション」「まとめ」には監修者の吹き出しを書かない
        const h2Title = block.h2Title || '';
        const isIntroBlock = h2Title.includes('導入') || h2Title.includes('導入文');
        const isDescriptionBlock = h2Title.includes('ディスクリプション') || h2Title.includes('description');
        const isSummaryBlock = h2Title.includes('まとめ');
        if (isIntroBlock || isDescriptionBlock || isSummaryBlock) {
          return false;
        }
        // 既に監修者の吹き出しが含まれている場合はスキップ
        const hasSupervisorComment = block.writtenContent.includes('<佐藤誠一吹き出し>');
        return !hasSupervisorComment;
      });
      
      console.log(`[Supervisor Comments] Found ${blocksToProcess.length} blocks to process (excluding already processed blocks)`);
      
      if (blocksToProcess.length === 0) {
        console.log(`[Supervisor Comments] No blocks to process (all blocks already have supervisor comments or are excluded).`);
        return NextResponse.json({ 
          h2BlocksWithComments: {},
          message: 'すべてのブロックに既に監修者の吹き出しが追加されています。',
        });
      }
      
      const maxBlocksPerRequest = 1; // 1リクエストあたり1ブロックのみ処理（タイムアウト回避）
      const limitedBlocks = blocksToProcess.slice(0, maxBlocksPerRequest);
      
      console.log(`[Supervisor Comments] Processing block: ${limitedBlocks[0]?.id}`);
      
      if (blocksToProcess.length > maxBlocksPerRequest) {
        console.warn(`Processing only first ${maxBlocksPerRequest} block out of ${blocksToProcess.length} to avoid timeout. Remaining blocks will need to be processed separately.`);
      }
      
      try {
        for (const block of limitedBlocks) {
          // フロントエンド側で既にフィルタリングされているが、念のため再度確認
          if (!block.writtenContent || block.writtenContent.trim().length === 0) {
            // 執筆内容がない場合はスキップ
            results[block.id] = block.writtenContent || '';
            continue;
          }
          // 「導入文」「ディスクリプション」「まとめ」には監修者の吹き出しを書かない
          const h2Title = block.h2Title || '';
          const isIntroBlock = h2Title.includes('導入') || h2Title.includes('導入文');
          const isDescriptionBlock = h2Title.includes('ディスクリプション') || h2Title.includes('description');
          const isSummaryBlock = h2Title.includes('まとめ');
          
          if (isIntroBlock || isDescriptionBlock || isSummaryBlock) {
            // これらのブロックには監修者の吹き出しを挿入しない
            results[block.id] = block.writtenContent;
            continue;
          }
          
          // 記事内容が長すぎる場合は先頭2000文字に制限（タイムアウト対策）
          const contentToProcess = block.writtenContent && block.writtenContent.length > 2000 
            ? block.writtenContent.substring(0, 2000) + '\n\n（...以下省略）'
            : block.writtenContent || '';
          
          const blockArticle = `${contentToProcess}`;
          
          // プロンプトを取得
          let fullPrompt;
          try {
            fullPrompt = getSupervisorCommentPrompt({
              article: blockArticle,
              h2Title: h2Title,
            });
          } catch (promptError: any) {
            console.error('Prompt generation error:', promptError);
            throw new Error(`プロンプトの生成に失敗しました: ${promptError.message}`);
          }
          
          // 既存の記事内容を保持したまま、監修者の吹き出しを挿入するように指示
          fullPrompt += `

## ⚠️【超重要】出力形式について⚠️
- **監修者名は「佐藤誠一」で統一してください**
- **既存の記事内容を一字一句そのまま保持してください**
- **既存の記事内容を削除したり、変更したり、要約したりしてはいけません**
- **既存の記事内容をそのまま出力し、適切な箇所に監修者の吹き出しを挿入してください**
- **監修者の吹き出しの形式：**
  <佐藤誠一吹き出し>
  〜コメント〜
  </佐藤誠一吹き出し>
- **コメントは改行を含めて、複数行でもOKです**
- **既存の文章を全て残したまま、監修者の吹き出しだけを追加してください**
- **既存の文章を削除したり、変更したり、要約したりしてはいけません**
- **既存の文章を一字一句そのまま保持し、適切な箇所に監修者の吹き出しを挿入してください**
- **見出し（##、###、H2:、H3:など）は一切出力しないでください**
- **見出しを含めず、本文の内容のみを出力してください**
- **分析結果や提案メッセージは一切出力しないでください**
- **「記事を分析し、監修者の吹き出しを挿入します」などのメッセージは出力しないでください**
- **「【分析結果】」「【監修者コメント挿入】」などの見出しは出力しないでください**
- **「提案内容は適切でしたか?」などの質問は出力しないでください**
- **「---」などの区切り線も出力しないでください**
- **既存の記事内容に監修者の吹き出しを挿入した結果のみを出力してください**
- **出力は既存の記事内容（監修者の吹き出し挿入済み）のみで、それ以外は一切出力しないでください**
- **監修者の吹き出しは、記事の内容に価値を追加する専門的なコメントとして挿入してください**
- **監修者の吹き出しは50-100文字程度で、簡潔に専門的なアドバイスを提供してください**
- **全てのH2やH3に監修者の吹き出しを入れる必要はありません**
- **監修者の吹き出しを挿入する必要がない箇所では、既存の記事内容をそのまま出力してください（必ずしも挿入する必要はありません）**
- **監修者の吹き出しは、読者にとって価値のある専門的なアドバイスや補足情報を提供できる箇所にのみ挿入してください**
- **出力例：**
  既存の文章の一部です。ここに監修者のコメントを挿入すべきです。
  <佐藤誠一吹き出し>
  ここに監修者のコメントを挿入します。
  専門的なアドバイスや補足情報を提供します。
  </佐藤誠一吹き出し>
  既存の文章の続きです。`;
          
          let result;
          try {
            // タイムアウトを55秒に設定（Vercelの60秒制限を考慮）
            result = await callGemini(fullPrompt, 'gemini-3-pro-preview', undefined, 55000);
            console.log(`[Supervisor Comments] Block ${block.id} - Raw API response length: ${result?.length || 0}`);
            console.log(`[Supervisor Comments] Block ${block.id} - Raw API response (first 2000 chars):`, result?.substring(0, 2000));
            console.log(`[Supervisor Comments] Block ${block.id} - Raw API response contains "<佐藤誠一吹き出し>": ${result?.includes('<佐藤誠一吹き出し>') || false}`);
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
          
          // 「記事を分析し、監修者の吹き出しを挿入します。」などのメッセージを削除
          cleanedResult = cleanedResult.replace(/記事を分析し、監修者の吹き出しを挿入します。[\s\S]*?【監修者コメント挿入】/g, '');
          cleanedResult = cleanedResult.replace(/【分析結果】[\s\S]*?【監修者コメント挿入】/g, '');
          
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
          
          // 「<佐藤誠一吹き出し>」が含まれているか確認
          const hasSupervisorComment = cleanedResult.includes('<佐藤誠一吹き出し>');
          
          console.log(`[Supervisor Comments] Block ${block.id} - Has original content start: ${hasOriginalContentStart}`);
          console.log(`[Supervisor Comments] Block ${block.id} - Has original content end: ${hasOriginalContentEnd}`);
          console.log(`[Supervisor Comments] Block ${block.id} - Has supervisor comment: ${hasSupervisorComment}`);
          console.log(`[Supervisor Comments] Block ${block.id} - Cleaned result length: ${cleanedResult.length}`);
          console.log(`[Supervisor Comments] Block ${block.id} - Original content length: ${originalContent.length}`);
          console.log(`[Supervisor Comments] Block ${block.id} - Cleaned result (first 500 chars):`, cleanedResult.substring(0, 500));
          
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
            console.log(`[Supervisor Comments] Block ${block.id} - Returning original content (content not fully preserved)`);
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
                  console.warn(`[Supervisor Comments] Block ${block.id} - Original line not found in result: ${trimmedOriginal.substring(0, 50)}`);
                  allOriginalLinesPreserved = false;
                }
              }
            }
            
            if (!allOriginalLinesPreserved) {
              console.warn(`[Supervisor Comments] Block ${block.id} - Some original content may have been modified. Using original content.`);
              // 既存の内容が変更されている可能性がある場合は、既存の内容をそのまま返す
              results[block.id] = block.writtenContent;
            } else {
              const finalResult = cleanedResult.trim();
              console.log(`[Supervisor Comments] Block ${block.id} - Final result length: ${finalResult.length}`);
              console.log(`[Supervisor Comments] Block ${block.id} - Final result contains "<佐藤誠一吹き出し>": ${finalResult.includes('<佐藤誠一吹き出し>')}`);
              console.log(`[Supervisor Comments] Block ${block.id} - Original content preserved: ${allOriginalLinesPreserved}`);
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
        h2BlocksWithComments: results,
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
    const fullPrompt = getSupervisorCommentPrompt({
      article: data.article,
    });
    
    const result = await callGemini(fullPrompt, 'gemini-3-pro-preview');
    
    return NextResponse.json({ comments: result });
  } catch (error: any) {
    console.error('Error generating supervisor comments:', error);
    return NextResponse.json(
      { error: error.message || '監修者の吹き出しの生成に失敗しました' },
      { status: 500 }
    );
  }
}
