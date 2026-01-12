import Anthropic from '@anthropic-ai/sdk';

let anthropic: Anthropic | null = null;

export function getClaudeClient() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('[Claude] ===== Client Initialization =====');
    console.log('[Claude] ANTHROPIC_API_KEY exists:', !!apiKey);
    console.log('[Claude] ANTHROPIC_API_KEY length:', apiKey?.length || 0);
    console.log('[Claude] ANTHROPIC_API_KEY starts with sk-ant:', apiKey?.startsWith('sk-ant-') || false);
    console.log('[Claude] ANTHROPIC_API_KEY first 20 chars:', apiKey?.substring(0, 20) || 'N/A');
    console.log('[Claude] ANTHROPIC_API_KEY last 10 chars:', apiKey?.substring(apiKey.length - 10) || 'N/A');
    
    // APIキーに余分なスペースや改行が含まれていないか確認
    if (apiKey) {
      const trimmed = apiKey.trim();
      if (trimmed !== apiKey) {
        console.warn('[Claude] WARNING: API key has leading/trailing whitespace!');
        console.warn('[Claude] Original length:', apiKey.length);
        console.warn('[Claude] Trimmed length:', trimmed.length);
      }
      if (apiKey.includes('\n') || apiKey.includes('\r')) {
        console.warn('[Claude] WARNING: API key contains newline characters!');
      }
    }
    
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    
    if (!apiKey.startsWith('sk-ant-')) {
      console.warn('[Claude] ANTHROPIC_API_KEY format may be incorrect. Expected format: sk-ant-...');
    }
    
    // トリムしたAPIキーを使用（余分なスペースを削除）
    const cleanApiKey = apiKey.trim();
    console.log('[Claude] Using cleaned API key, length:', cleanApiKey.length);
    
    anthropic = new Anthropic({ apiKey: cleanApiKey });
  }
  return anthropic;
}

export async function callClaude(prompt: string, model: string = 'claude-sonnet-4-5-20250929', maxTokens: number = 8192) {
  try {
    const client = getClaudeClient();
    
    // プロンプトの長さをログに記録
    const promptLength = prompt.length;
    console.log(`[Claude] Prompt length: ${promptLength} characters`);
    
    // プロンプトが長すぎる場合は警告
    if (promptLength > 200000) {
      console.warn(`[Claude] Warning: Prompt is very long (${promptLength} chars). This may cause timeout or truncation.`);
    }
    
    const message = await client.messages.create({
      model,
      max_tokens: maxTokens, // デフォルト8192（長い記事に対応）
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    throw new Error('Unexpected response type from Claude');
  } catch (error: any) {
    console.error('Claude API Error:', error);
    
    // 認証エラーの場合、より分かりやすいエラーメッセージを返す
    if (error.status === 401 || error.message?.includes('authentication_error') || error.message?.includes('invalid x-api-key')) {
      throw new Error('Claude APIの認証に失敗しました。ANTHROPIC_API_KEY環境変数が正しく設定されているか確認してください。');
    }
    
    // その他のエラーはそのままスロー
    throw error;
  }
}

