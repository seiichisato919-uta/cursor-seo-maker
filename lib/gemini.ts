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
    if (error.message === 'Gemini API timeout') {
      throw new Error('API呼び出しがタイムアウトしました。プロンプトを短縮するか、記事を分割して処理してください。');
    }
    throw error;
  }
}

