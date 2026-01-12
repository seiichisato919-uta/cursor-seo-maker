import { NextRequest, NextResponse } from 'next/server';
import { callClaude } from '@/lib/claude';
import { getWordPressPrompt } from '@/lib/prompts';

// Vercelの関数タイムアウト設定
export const maxDuration = 60;

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
    // 環境変数の確認（より詳細なログ）
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('[Convert to WordPress] ===== Environment Variable Check =====');
    console.log('[Convert to WordPress] ANTHROPIC_API_KEY exists:', !!apiKey);
    console.log('[Convert to WordPress] ANTHROPIC_API_KEY length:', apiKey?.length || 0);
    console.log('[Convert to WordPress] ANTHROPIC_API_KEY first 10 chars:', apiKey?.substring(0, 10) || 'N/A');
    console.log('[Convert to WordPress] ANTHROPIC_API_KEY starts with sk-ant:', apiKey?.startsWith('sk-ant-') || false);
    console.log('[Convert to WordPress] All env vars:', Object.keys(process.env).filter(key => key.includes('ANTHROPIC') || key.includes('CLAUDE')));
    
    if (!apiKey) {
      console.error('[Convert to WordPress] ERROR: ANTHROPIC_API_KEY is not set!');
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY環境変数が設定されていません。Vercelの環境変数設定を確認してください。' },
        { status: 500 }
      );
    }
    
    const data = await request.json();
    
    const content = data.content || data.article;
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: '変換するコンテンツが提供されていません' },
        { status: 400 }
      );
    }
    
    // コンテンツの長さをログに記録
    const contentLength = content.length;
    console.log(`[Convert to WordPress] Content length: ${contentLength} characters`);
    
    // プロンプトを取得
    const basePrompt = getWordPressPrompt({
      article: content,
    });
    
    // プロンプトの長さをログに記録
    const promptLength = basePrompt.length;
    console.log(`[Convert to WordPress] Prompt length: ${promptLength} characters`);
    
    // 長いコンテンツの場合は、max_tokensを増やす
    // コンテンツが長いほど、出力されるHTMLも長くなるため
    let maxTokens = 8192; // デフォルト8192
    if (contentLength > 10000) {
      maxTokens = 16384; // 長いコンテンツの場合は16384に増やす
      console.log(`[Convert to WordPress] Using increased max_tokens: ${maxTokens} for long content`);
    }
    
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
    const rawHtml = await callClaude(fullPrompt, 'claude-sonnet-4-5-20250929', maxTokens);
    
    // レスポンスの長さをログに記録
    console.log(`[Convert to WordPress] Response length: ${rawHtml.length} characters`);
    
    // レスポンスが短すぎる場合は警告（途中で切れている可能性）
    if (rawHtml.length < contentLength * 0.5) {
      console.warn(`[Convert to WordPress] Warning: Response is shorter than expected. Content: ${contentLength} chars, Response: ${rawHtml.length} chars`);
    }
    
    // HTMLコードだけを抽出
    const extractedHtml = extractHtmlCode(rawHtml);
    
    if (!extractedHtml || extractedHtml.trim().length === 0) {
      console.warn('HTMLコードの抽出に失敗しました。元のレスポンスを返します。');
      return NextResponse.json({ html: rawHtml, wordpressHtml: rawHtml });
    }
    
    return NextResponse.json({ html: extractedHtml, wordpressHtml: extractedHtml });
  } catch (error: any) {
    console.error('Error converting to WordPress:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.status,
      statusCode: error.statusCode,
      name: error.name,
    });
    
    // 認証エラーの場合、より分かりやすいエラーメッセージを返す
    if (error.status === 401 || error.statusCode === 401 || error.message?.includes('authentication_error') || error.message?.includes('invalid x-api-key') || error.message?.includes('認証に失敗')) {
      return NextResponse.json(
        { 
          error: 'Claude APIの認証に失敗しました。Vercelの環境変数設定でANTHROPIC_API_KEYが正しく設定されているか確認してください。',
          details: '環境変数が設定されていない、または無効なAPIキーが設定されている可能性があります。VercelのSettings > Environment Variablesで確認してください。'
        },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'WordPress HTML変換に失敗しました' },
      { status: 500 }
    );
  }
}

