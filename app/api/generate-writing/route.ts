import { NextRequest, NextResponse } from 'next/server';
import { callGemini } from '@/lib/gemini';
import { getWritingPrompt } from '@/lib/prompts';

export const maxDuration = 10; // Vercelの関数タイムアウト設定（最大10秒）

export async function POST(request: NextRequest) {
  try {
    let data;
    try {
      data = await request.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'リクエストデータの解析に失敗しました。データ形式を確認してください。' },
        { status: 400 }
      );
    }
    
    // 必須パラメータのチェック
    if (!data.h2Block) {
      return NextResponse.json(
        { error: 'H2ブロック情報が不足しています。' },
        { status: 400 }
      );
    }
    
    // プロンプトを取得（ナレッジファイル含む）
    let fullPrompt;
    try {
      fullPrompt = getWritingPrompt(data);
    } catch (promptError: any) {
      console.error('Prompt generation error:', promptError);
      return NextResponse.json(
        { error: `プロンプトの生成に失敗しました: ${promptError.message}` },
        { status: 500 }
      );
    }
    
    // ユーザーからのデータをプロンプトに追加
    let promptWithData = `${fullPrompt}

以下の情報を基に記事を執筆してください：

## 重要：出力形式について
- **HTML形式は絶対に使用しないでください。プレーンテキスト（マークダウン形式）で出力してください**
- HTMLタグ（<div>、<strong>、<ul>、<li>など）は一切使用しないでください
- 見出しは「H2: タイトル」「H3: タイトル」のようにテキストで記述してください
- 箇条書きは「- 項目」のようにテキストで記述してください
- 表は「| 項目 | 説明 |」のようにマークダウン形式で記述してください
- **箇条書きや表を使用する場合は、必ず<ボックス></ボックス>で囲んでください**
- **例（箇条書きの場合）：**
  <ボックス>
  - 項目1
  - 項目2
  - 項目3
  </ボックス>
- **例（表の場合）：**
  <ボックス>
  | 項目 | 説明 |
  |------|------|
  | A | 説明A |
  | B | 説明B |
  </ボックス>
- 該当のH2ブロック（${data.h2Block}）の執筆文のみを出力してください
- 記事全体の構成や他のH2ブロックの内容は出力しないでください
- 該当のH2ブロックの見出し（H2、H3、H4）と本文のみを執筆してください

## 執筆対象のH2ブロック情報
H2ブロック: ${data.h2Block}
${data.h3s && data.h3s.length > 0 
  ? `H3一覧: ${JSON.stringify(data.h3s)}
**重要**: 上記のH3一覧に記載されているH3のみを執筆してください。削除されたH3は執筆しないでください。`
  : `**重要**: このH2ブロックにはH3見出しがありません。H2単体の内容を執筆してください。`}
キーワード: ${data.keyword}
ターゲット読者: ${data.targetReader}
検索意図: ${data.searchIntent}
記事構成（参考）: ${data.structure}
メディアの記事例（参考）: ${data.mediaExample || ''}
執筆指示: ${data.editingInstruction || ''}`;

    // 添付ファイルの処理
    const images: Array<{ mimeType: string; data: string }> = [];
    let filePromptSection = '';
    
    if (data.attachedFiles && data.attachedFiles.length > 0) {
      filePromptSection = `\n\n## ⚠️【超重要】添付ファイル（必須参考資料）⚠️\n`;
      filePromptSection += `以下の添付ファイルが提供されています。**これらのファイルの内容を必ず読み取り、執筆時に参照してください。**\n`;
      filePromptSection += `添付ファイルを無視して執筆することは絶対に禁止です。\n\n`;
      
      data.attachedFiles.forEach((file: any, index: number) => {
        filePromptSection += `\n### ファイル${index + 1}: ${file.name} (${file.type})\n`;
        
        // テキストファイルの場合は内容を追加
        if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md') || file.name.endsWith('.csv')) {
          try {
            const textContent = atob(file.content.split(',')[1]);
            filePromptSection += `**ファイル内容（必ず参照してください）:**\n\`\`\`\n${textContent}\n\`\`\`\n`;
          } catch (e) {
            console.error(`Error decoding text file ${file.name}:`, e);
            filePromptSection += `**注意**: ファイル内容の読み取りに失敗しました。ファイル形式を確認してください。\n`;
          }
        }
        // PDFファイルの場合
        else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          filePromptSection += `**重要**: PDFファイルが添付されています。このPDFの内容を読み取り、執筆時に必ず参照してください。\n`;
          filePromptSection += `PDF内の情報・データ・具体例などを執筆内容に反映してください。\n`;
          // PDFも画像として処理できる場合があるので、Base64データを抽出
          try {
            const base64Data = file.content.split(',')[1];
            if (base64Data) {
              images.push({
                mimeType: file.type,
                data: base64Data,
              });
            }
          } catch (e) {
            console.error(`Error processing PDF ${file.name}:`, e);
          }
        }
        // 画像ファイルの場合
        else if (file.type.startsWith('image/') || file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
          filePromptSection += `**重要**: 画像ファイルが添付されています。この画像の内容を読み取り、執筆時に必ず参照してください。\n`;
          filePromptSection += `画像内のテキスト・図表・データなどを執筆内容に反映してください。\n`;
          // Base64画像データを抽出
          try {
            const base64Data = file.content.split(',')[1];
            const mimeType = file.type || 'image/jpeg';
            if (base64Data) {
              images.push({
                mimeType,
                data: base64Data,
              });
            }
          } catch (e) {
            console.error(`Error processing image ${file.name}:`, e);
          }
        }
        // その他のファイル形式
        else {
          filePromptSection += `**重要**: ファイルが添付されています。可能な限り内容を読み取り、執筆時に参照してください。\n`;
        }
      });
      
      filePromptSection += `\n\n## 添付ファイルの使用方法\n`;
      filePromptSection += `1. 上記の添付ファイルの内容を必ず読み取ってください\n`;
      filePromptSection += `2. 添付ファイルに記載されている情報・データ・具体例を執筆内容に反映してください\n`;
      filePromptSection += `3. 添付ファイルの内容を無視して執筆することは絶対に禁止です\n`;
      filePromptSection += `4. 添付ファイルの内容が執筆内容に反映されているか確認してから出力してください\n`;
    }

    const finalPrompt = promptWithData + filePromptSection;
    
    // Gemini API呼び出し（タイムアウトを8秒に設定）
    let content;
    try {
      content = await callGemini(finalPrompt, 'gemini-3-pro-preview', images.length > 0 ? images : undefined, 8000);
    } catch (geminiError: any) {
      console.error('Gemini API error:', geminiError);
      // タイムアウトエラーの場合は、より分かりやすいメッセージを返す
      if (geminiError.message && (geminiError.message.includes('timeout') || geminiError.message.includes('タイムアウト'))) {
        return NextResponse.json(
          { error: `Gemini API呼び出しがタイムアウトしました。プロンプトが長すぎる可能性があります。記事を短く分割するか、添付ファイルを減らしてください。` },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: `Gemini API呼び出しに失敗しました: ${geminiError.message || '不明なエラー'}` },
        { status: 500 }
      );
    }
    
    if (!content) {
      return NextResponse.json(
        { error: '記事の内容が生成されませんでした。' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Error generating writing:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: error.message || '記事の執筆に失敗しました。詳細はサーバーログを確認してください。' },
      { status: 500 }
    );
  }
}

