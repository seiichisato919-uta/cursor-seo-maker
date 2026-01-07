import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { loadPromptFile } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { selectedText, editingInstruction, fullStructure, initialData } = data;
    
    if (!selectedText || !editingInstruction) {
      return NextResponse.json(
        { error: '選択テキストと編集指示が必要です' },
        { status: 400 }
      );
    }
    
    // 記事構成プロンプトとナレッジを読み込む
    const basePrompt = loadPromptFile('SEO記事構成プロンプト');
    const knowledgeFile = loadPromptFile('記事構成のお手本集');
    
    // 選択部分の編集用プロンプトを作成
    let prompt = `あなたはSEO記事構成の編集スペシャリストです。

以下の記事構成の一部を選択し、ユーザーの編集指示に従って編集してください。

## 編集対象の選択部分：
${selectedText}

## 編集指示：
${editingInstruction}

## 記事構成全体（参考用）：
${fullStructure || ''}

## 元の入力情報（参考用）：
メインキーワード: ${initialData?.mainKeyword || ''}
関連キーワード: ${initialData?.relatedKeywords || ''}
ターゲット読者: ${initialData?.targetReader || ''}
検索意図: ${initialData?.searchIntent || ''}
記事のゴール: ${initialData?.articleGoal || ''}

## 指示：
選択部分を編集指示に従って修正してください。
- 選択部分の前後の文脈を考慮して、自然な流れになるように編集してください
- 記事構成全体の整合性を保ちながら編集してください
- 編集後の選択部分のみを出力してください（前後の文脈は含めない）
- マークダウン形式（H2、H3など）を維持してください`;

    // ナレッジファイルがある場合は追加
    if (knowledgeFile) {
      prompt += `

## ナレッジ: 記事構成のお手本集
以下のお手本集を参照し、構成の作り方・雰囲気・流れを学習してください：

${knowledgeFile}`;
    }
    
    const editedText = await callGemini(prompt, 'gemini-3-pro-preview');
    
    return NextResponse.json({ editedText: editedText.trim() });
  } catch (error: any) {
    console.error('Error editing structure part:', error);
    return NextResponse.json(
      { error: error.message || '選択部分の編集に失敗しました' },
      { status: 500 }
    );
  }
}


