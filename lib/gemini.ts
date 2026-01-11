import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

export function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function callGemini(
  prompt: string, 
  model: string = 'gemini-3-pro-preview',
  images?: Array<{ mimeType: string; data: string }>,
  timeout: number = 55000 // デフォルト55秒（Vercelの60秒制限を考慮）
) {
  try {
    const genAI = getGeminiClient();
    const model_client = genAI.getGenerativeModel({ 
      model,
      generationConfig: {
        maxOutputTokens: 8000, // 出力トークン数を制限して処理時間を短縮
      },
    });
    
    // タイムアウト付きでAPI呼び出し
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gemini API timeout')), timeout);
    });
    
    const apiCall = async () => {
      // 画像がある場合は画像を含めて送信
      if (images && images.length > 0) {
        const parts: any[] = [{ text: prompt }];
        
        // 画像を追加
        for (const image of images) {
          parts.push({
            inlineData: {
              mimeType: image.mimeType,
              data: image.data,
            },
          });
        }
        
        const result = await model_client.generateContent({ contents: [{ role: 'user', parts }] });
        const response = await result.response;
        return response.text();
      } else {
        // テキストのみの場合
        const result = await model_client.generateContent(prompt);
        const response = await result.response;
        return response.text();
      }
    };
    
    return Promise.race([apiCall(), timeoutPromise]) as Promise<string>;
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    
    // タイムアウトエラー
    if (error.message === 'Gemini API timeout') {
      throw new Error('API呼び出しがタイムアウトしました。プロンプトを短縮するか、記事を分割して処理してください。');
    }
    
    // 429エラー（使用制限超過）
    if (error.message?.includes('429') || error.message?.includes('Too Many Requests') || error.message?.includes('quota')) {
      const errorMessage = `Gemini APIの使用制限に達しました。

【対処方法】
1. Google AI Studioで使用状況を確認してください：
   https://ai.google.dev/rate-limit

2. プランと制限を確認してください：
   https://ai.google.dev/gemini-api/docs/rate-limits

3. 無料プランの場合、1日のリクエスト数に上限があります。
   制限は日次でリセットされますので、時間を置いてから再試行してください。

4. より多くのリクエストが必要な場合は、有料プランへのアップグレードを検討してください。`;
      throw new Error(errorMessage);
    }
    
    throw error;
  }
}

