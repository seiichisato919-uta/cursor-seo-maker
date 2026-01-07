import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { getWritingPrompt } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { selectedText, editingInstruction, fullContent, blockData, articleData } = data;
    
    if (!selectedText || !editingInstruction) {
      return NextResponse.json(
        { error: '選択テキストと編集指示が必要です' },
        { status: 400 }
      );
    }
    
    // 記事執筆プロンプトを取得
    const basePrompt = getWritingPrompt(articleData);
    
    // 選択部分の編集用プロンプトを作成
    const prompt = `${basePrompt}

## 重要：選択部分の編集指示

以下の執筆内容の一部を選択し、ユーザーの編集指示に従って編集してください。

## 選択された部分：
${selectedText}

## 編集指示：
${editingInstruction}

## 執筆内容全体（参考用）：
${fullContent || ''}

## H2ブロック情報（参考用）：
H2ブロック: ${blockData?.h2Title || ''}
H3一覧: ${JSON.stringify(blockData?.h3s || [])}

## 指示：
選択部分を編集指示に従って修正してください。
- 選択部分の前後の文脈を考慮して、自然な流れになるように編集してください
- 執筆内容全体の整合性を保ちながら編集してください
- 編集後の選択部分のみを出力してください（前後の文脈は含めない）
- マークダウン形式を維持してください`;

    const editedText = await callGemini(prompt, 'gemini-3-pro-preview');
    
    return NextResponse.json({ editedText: editedText.trim() });
  } catch (error: any) {
    console.error('Error editing writing part:', error);
    return NextResponse.json(
      { error: error.message || '選択部分の編集に失敗しました' },
      { status: 500 }
    );
  }
}


