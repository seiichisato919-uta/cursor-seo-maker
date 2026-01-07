import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';
import { getWordPressPrompt } from '@/lib/prompts';

// HTMLコードだけを抽出する関数
function extractHtmlCode(responseText: string): string {
  // HTMLコードブロック（```html ... ```）を抽出
  const htmlBlockMatch = responseText.match(/```html\s*([\s\S]*?)\s*```/);
  if (htmlBlockMatch) {
    return htmlBlockMatch[1].trim();
  }
  
  // HTMLコードブロック（``` ... ```）を抽出（html指定なしの場合）
  const codeBlockMatch = responseText.match(/```\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  
  // 「# WordPress Gutenberg用HTML変換完了」より前の部分を削除
  let cleaned = responseText;
  const headerMatch = cleaned.match(/# WordPress Gutenberg用HTML変換完了[\s\S]*?以下、そのままWordPressのコードエディタに貼り付け可能なHTMLです。\s*```html\s*/);
  if (headerMatch) {
    cleaned = cleaned.replace(headerMatch[0], '');
  }
  
  // 「---」以降を削除
  const separatorIndex = cleaned.indexOf('---');
  if (separatorIndex !== -1) {
    cleaned = cleaned.substring(0, separatorIndex);
  }
  
  // 「## ✅ 変換完了チェックリスト」以降を削除
  const checklistIndex = cleaned.indexOf('## ✅ 変換完了チェックリスト');
  if (checklistIndex !== -1) {
    cleaned = cleaned.substring(0, checklistIndex);
  }
  
  // 「## 📝 貼り付け手順」以降を削除
  const stepsIndex = cleaned.indexOf('## 📝 貼り付け手順');
  if (stepsIndex !== -1) {
    cleaned = cleaned.substring(0, stepsIndex);
  }
  
  // 「このままご使用いただけます！」以降を削除
  const endIndex = cleaned.indexOf('このままご使用いただけます！');
  if (endIndex !== -1) {
    cleaned = cleaned.substring(0, endIndex);
  }
  
  // 先頭と末尾の空白・改行を削除
  cleaned = cleaned.trim();
  
  // HTMLタグが含まれていない場合は空文字を返す
  if (!cleaned.includes('<!--') && !cleaned.includes('<')) {
    return '';
  }
  
  return cleaned;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const content = data.content || data.article;
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '変換するコンテンツが提供されていません' },
        { status: 400 }
      );
    }
    
    // プロンプトを取得
    const basePrompt = getWordPressPrompt({
      article: content,
    });
    
    // プロンプトに「HTMLコードだけを出力する」という指示を追加
    const fullPrompt = `${basePrompt}

## ⚠️【超重要】出力形式について⚠️
- **HTMLコードだけを出力してください**
- **説明文やチェックリスト、貼り付け手順などは一切出力しないでください**
- **「# WordPress Gutenberg用HTML変換完了」などの見出しは出力しないでください**
- **「以下、そのままWordPressのコードエディタに貼り付け可能なHTMLです。」などの説明文は出力しないでください**
- **「## ✅ 変換完了チェックリスト」以降の内容は一切出力しないでください**
- **「## 📝 貼り付け手順」以降の内容は一切出力しないでください**
- **「このままご使用いただけます！」などのメッセージは出力しないでください**
- **HTMLコードブロック（\`\`\`html ... \`\`\`）で囲まず、HTMLコードだけを出力してください**
- **提供されたコンテンツの全てをHTMLに変換してください（途中で切れないようにしてください）**`;
    
    // WordPress HTML変換はClaudeを使用
    const rawHtml = await callClaude(fullPrompt, 'claude-sonnet-4-5-20250929');
    
    // HTMLコードだけを抽出
    const extractedHtml = extractHtmlCode(rawHtml);
    
    if (!extractedHtml || extractedHtml.trim().length === 0) {
      console.warn('HTMLコードの抽出に失敗しました。元のレスポンスを返します。');
      return NextResponse.json({ html: rawHtml, wordpressHtml: rawHtml });
    }
    
    return NextResponse.json({ html: extractedHtml, wordpressHtml: extractedHtml });
  } catch (error: any) {
    console.error('Error converting to WordPress:', error);
    return NextResponse.json(
      { error: error.message || 'WordPress HTML変換に失敗しました' },
      { status: 500 }
    );
  }
}

