import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { getTitlePrompt } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const fullPrompt = getTitlePrompt(data);
    const response = await callGemini(fullPrompt, 'gemini-3-pro-preview');
    
    // タイトルを配列に分割（より柔軟な実装）
    const lines = response.split('\n');
    const titles: string[] = [];
    
    console.log('API Response (first 1000 chars):', response.substring(0, 1000)); // デバッグ用
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // 空行をスキップ
      if (!trimmed) continue;
      
      // 数字で始まる行（1. 2. など）を検出
      const numberMatch = trimmed.match(/^(\d+)[\.．]\s*(.+)$/);
      if (numberMatch && numberMatch[2]) {
        const title = numberMatch[2].trim();
        // 30文字以上40文字以下のタイトルのみを追加
        if (title.length >= 30 && title.length <= 40) {
          titles.push(title);
        } else if (title.length > 0) {
          // 文字数が範囲外の場合はログに記録
          console.log(`タイトル文字数が範囲外: ${title.length}文字 - ${title.substring(0, 50)}`);
        }
      }
      // 【】で囲まれたカテゴリー名はスキップ
      else if (/^【.+】/.test(trimmed)) {
        continue;
      }
      // 数字だけで始まる行（見出しなど）をスキップ
      else if (/^\d+[\.．]\s*$/.test(trimmed)) {
        continue;
      }
      // その他の行で、30文字以上40文字以下のものもタイトルとして扱う（フォールバック）
      else if (trimmed.length >= 30 && trimmed.length <= 40 && !trimmed.startsWith('#') && !trimmed.startsWith('##')) {
        // 既に追加されていない場合のみ追加
        if (!titles.includes(trimmed)) {
          titles.push(trimmed);
        }
      }
    }
    
    console.log(`解析されたタイトル数: ${titles.length}個`);
    if (titles.length > 0) {
      console.log('最初の5つのタイトル:', titles.slice(0, 5));
    }
    
    // タイトルが0個の場合はエラーを返す
    if (titles.length === 0) {
      console.error('タイトルが0個です。レスポンス全体:', response);
      return NextResponse.json(
        { 
          error: 'タイトルが生成されませんでした。プロンプトの出力形式を確認してください。', 
          rawResponse: response.substring(0, 2000),
          debug: {
            linesCount: lines.length,
            firstLines: lines.slice(0, 10)
          }
        },
        { status: 500 }
      );
    }
    
    // 30個未満の場合は警告を追加（ただしエラーにはしない）
    if (titles.length < 30) {
      console.warn(`生成されたタイトル数が30個未満です: ${titles.length}個`);
    }
    
    return NextResponse.json({ titles, count: titles.length });
  } catch (error: any) {
    console.error('Error generating titles:', error);
    return NextResponse.json(
      { error: error.message || 'タイトルの生成に失敗しました' },
      { status: 500 }
    );
  }
}

