import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { getIntroSalesSummaryDescPrompt } from '@/lib/prompts';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // プロンプトを取得（ナレッジファイル4つ含む）
    const basePrompt = getIntroSalesSummaryDescPrompt({});
    
    // セールス文を挿入する必要があるH2ブロックを特定
    const blocksWithSalesMarkers: Array<{ id: string; content: string }> = [];
    if (data.h2Blocks && Array.isArray(data.h2Blocks)) {
      data.h2Blocks.forEach((block: any) => {
        if (block.writtenContent && block.writtenContent.includes('※ここにセールス文を書く')) {
          blocksWithSalesMarkers.push({
            id: block.id,
            content: block.writtenContent,
          });
        }
      });
    }
    
    // まとめブロックを特定
    const summaryBlock = data.h2Blocks?.find((block: any) => 
      block.h2Title && (block.h2Title.includes('まとめ') || block.h2Title.includes('まとめ'))
    );
    
    // ユーザーからのデータをプロンプトに追加
    const fullPrompt = `${basePrompt}

以下の情報を基に、導入文・セールス文・まとめ文・ディスクリプションを執筆してください：

キーワード: ${data.keyword || data.articleData?.mainKeyword || ''}
記事タイトル: ${data.title || data.articleData?.title || ''}
完成している記事の本文: ${data.article || ''}
商品・サービスのURL: ${data.productUrl || data.articleData?.productUrl || ''}
導入文の冒頭に入れる読者の「悩み」や「キーワード」: ${data.introReaderWorry || data.articleData?.introReaderWorry || ''}
ディスクリプションに含めたいキーワード: ${data.descriptionKeywords || data.articleData?.descriptionKeywords || ''}
${blocksWithSalesMarkers.length > 0 ? `セールス文を挿入する必要がある箇所:\n${blocksWithSalesMarkers.map(b => `ブロックID: ${b.id}\n内容: ${b.content}`).join('\n\n')}` : ''}
${summaryBlock ? `まとめブロックの内容: ${summaryBlock.writtenContent || ''}` : ''}

## ⚠️【超重要】監修者情報⚠️
- **監修者名は「佐藤誠一」で統一してください**
- **導入文、セールス文、まとめ文の監修者名は全て「佐藤誠一」を使用してください**
- **監修者吹き出しの形式：<佐藤誠一吹き出し>...</佐藤誠一吹き出し>**
- **ボタンの形式：<ボタン>佐藤誠一の公式LINEを見る</ボタン>**

## ⚠️【超重要】導入文の監修者情報⚠️
導入文には、以下の形式で監修者情報を追加してください：

<ボックス>
監修者：佐藤誠一
Webライター歴11年
[実績などを記載]←記事の内容に相応しい権威性になる実績を1つ簡潔に書く
</ボックス>

監修者「佐藤誠一」の実績情報：
- SEO歴11年
- 合計7,000記事以上を作成
- 転職記事を4,200本以上執筆
- そのうちGoogle検索TOP10入りキーワード実績：3000以上
- 1サイトで月間100万PV達成（ライターは私のみで達成）
- 転職エージェント様のサイトで月100本のCV達成
- AIを使ってSEO記事作成の時間を1/6に短縮
- 7社様のSEO記事作成プロンプトを開発
- AIを使ってSEO記事作成システムを開発
- トレオンメディアにて「手取り計算ツール」を開発
- 「全国職業相談センター」にて5,000人以上の転職相談も実施｜転職成功実績も多数
- 個人ブログでも年間300万円を収益化
- YouTubeチャンネル登録1.2万人以上
- Xのフォロワー数15,000人
- Xの最大インプレッション15.2万
- XとYouTubeを使って5日間で1,600人を公式LINEにリストイン
- X運用代行｜初月で31%フォロワー増
- SEOディレクター実績：多数
- ディレクターとしてWebライターさんの採用経験も多数

上記の実績情報から、記事の内容に相応しい権威性になる実績を1つ選んで、簡潔に記載してください。

## ⚠️【超重要】出力形式について⚠️
以下の形式で出力してください。各項目を明確に分けて出力してください。

【導入文】
ここに導入文を出力してください。
- 監修者名は「佐藤誠一」で統一
- 監修者吹き出し：<佐藤誠一吹き出し>...</佐藤誠一吹き出し>
- ボタン：<ボタン>佐藤誠一の公式LINEを見る</ボタン>
- 監修者情報ボックスを追加

【セールス文】
セールス文を挿入する必要がある各ブロックについて、以下の形式で出力してください：
ブロックID: [ブロックID]
セールス文: [セールス文の内容のみ]

**重要：セールス文は「※ここにセールス文を書く」の箇所に挿入するセールス文の内容のみを出力してください。既存の文章は一切出力しないでください。**

複数のブロックがある場合は、それぞれを分けて出力してください。

【まとめ文】
ここにまとめ文を出力してください。
- 監修者名は「佐藤誠一」で統一
- 監修者吹き出し：<佐藤誠一吹き出し>...</佐藤誠一吹き出し>
- ボタン：<ボタン>佐藤誠一の公式LINEを見る</ボタン>

【ディスクリプション】
ここにディスクリプションを出力してください。

## ⚠️【超重要】セールス文の挿入について⚠️
- **セールス文は「※ここにセールス文を書く」の箇所に挿入するセールス文の内容のみを出力してください**
- **既存の文章（「※ここにセールス文を書く」を含む）は一切出力しないでください**
- **既存の文章を削除したり、変更したり、要約したりしてはいけません**
- **セールス文の内容のみを出力してください**
- **出力例：**
  ブロックID: block-1
  セールス文: [ここにセールス文の内容のみを出力]
  
  **NG例（既存の文章を含めて出力するのは禁止）：**
  ブロックID: block-1
  セールス文: 既存の文章の一部です。
  [セールス文の内容]
  既存の文章の続きです。`;

    const result = await callGemini(fullPrompt, 'gemini-3-pro-preview');
    
    // 結果をパース
    const parsed: {
      intro?: string;
      sales?: Array<{ blockId: string; content: string }>;
      summary?: string;
      description?: string;
    } = {};
    
    // 【導入文】セクションを抽出
    const introMatch = result.match(/【導入文】\s*([\s\S]*?)(?=【セールス文】|【まとめ文】|【ディスクリプション】|$)/);
    if (introMatch) {
      parsed.intro = introMatch[1].trim();
    }
    
    // 【セールス文】セクションを抽出
    const salesMatch = result.match(/【セールス文】\s*([\s\S]*?)(?=【まとめ文】|【ディスクリプション】|$)/);
    if (salesMatch) {
      const salesContent = salesMatch[1].trim();
      // ブロックIDごとに分割
      const blockMatches = salesContent.matchAll(/ブロックID:\s*([^\n]+)\s*\nセールス文:\s*([\s\S]*?)(?=ブロックID:|$)/g);
      parsed.sales = [];
      for (const match of blockMatches) {
        let salesText = match[2].trim();
        // セールス文の内容のみを抽出（既存の文章が含まれている場合は削除）
        // 「※ここにセールス文を書く」が含まれている場合は、その前後の既存の文章を削除
        salesText = salesText.replace(/[\s\S]*?※ここにセールス文を書く[\s\S]*?/g, '');
        // 既存の文章のパターンを削除（「既存の文章の一部です。」などのパターン）
        salesText = salesText.replace(/既存の文章[^\n]*\n?/g, '');
        salesText = salesText.replace(/既存の文章の続き[^\n]*\n?/g, '');
        parsed.sales.push({
          blockId: match[1].trim(),
          content: salesText.trim(),
        });
      }
    }
    
    // 【まとめ文】セクションを抽出
    const summaryMatch = result.match(/【まとめ文】\s*([\s\S]*?)(?=【ディスクリプション】|$)/);
    if (summaryMatch) {
      parsed.summary = summaryMatch[1].trim();
    }
    
    // 【ディスクリプション】セクションを抽出
    const descMatch = result.match(/【ディスクリプション】\s*([\s\S]*?)$/);
    if (descMatch) {
      parsed.description = descMatch[1].trim();
    }
    
    return NextResponse.json({ 
      intro: parsed.intro,
      sales: parsed.sales,
      summary: parsed.summary,
      description: parsed.description,
      raw: result, // デバッグ用
    });
  } catch (error: any) {
    console.error('Error generating intro/sales/summary/desc:', error);
    return NextResponse.json(
      { error: error.message || '導入文・セールス文・まとめ文・ディスクリプションの生成に失敗しました' },
      { status: 500 }
    );
  }
}

