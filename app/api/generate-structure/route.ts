import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { getStructurePrompt } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const fullPrompt = getStructurePrompt(data);
    let structure = await callGemini(fullPrompt, 'gemini-3-pro-preview');
    
    // 不要な前置きメッセージを削除
    structure = structure.replace(/すべての情報収集が完了しました。これからSEO記事構成を作成いたします。[\s\S]*?(?=#|H2:|タイトル)/i, '');
    structure = structure.replace(/すべての情報収集が完了しました。[\s\S]*?(?=#|H2:|タイトル)/i, '');
    
    // 「H2: まとめ」の見出しのみを残し、その配下のH3とその後のセクションを削除
    const summaryIndex = structure.search(/H2[:：]\s*まとめ/i);
    if (summaryIndex !== -1) {
      // 「H2: まとめ」の行を取得
      const lines = structure.split('\n');
      let keepLines: string[] = [];
      let foundSummaryH2 = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 「H2: まとめ」を見つけたら、その行のみを追加して終了
        if (line.match(/H2[:：]\s*まとめ/i)) {
          keepLines.push(line);
          foundSummaryH2 = true;
          break;
        }
        
        // 「H2: まとめ」が見つかるまでの行はすべて保持
        if (!foundSummaryH2) {
          keepLines.push(line);
        }
      }
      
      structure = keepLines.join('\n').trim();
    } else {
      // 「H2: まとめ」がない場合でも、FAQセクションと外部引用セクションは削除
      const faqIndex = structure.search(/(▼\s*)?(FAQ|よくある質問|Q&A|H2[:：]\s*(FAQ|よくある質問|Q&A))/i);
      const externalRefIndex = structure.search(/(▼\s*)?(外部引用|統計データ|外部引用・統計データ候補)/i);
      
      let cutIndex = structure.length;
      if (faqIndex !== -1 && faqIndex < cutIndex) cutIndex = faqIndex;
      if (externalRefIndex !== -1 && externalRefIndex < cutIndex) cutIndex = externalRefIndex;
      
      if (cutIndex < structure.length) {
        structure = structure.substring(0, cutIndex).trim();
      }
    }
    
    return NextResponse.json({ structure });
  } catch (error: any) {
    console.error('Error generating structure:', error);
    return NextResponse.json(
      { error: error.message || '記事構成の生成に失敗しました' },
      { status: 500 }
    );
  }
}

