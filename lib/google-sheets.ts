import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join } from 'path';

let sheetsClient: any = null;

/**
 * Google Sheets APIクライアントを取得
 */
export function getSheetsClient() {
  if (!sheetsClient) {
    let serviceAccount: any;
    
    // 方法1: 環境変数から直接JSONを読み込む（推奨）
    if (process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON);
      } catch (error) {
        console.error('Error parsing GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON:', error);
        throw new Error('環境変数GOOGLE_SHEETS_SERVICE_ACCOUNT_JSONの形式が正しくありません');
      }
    } 
    // 方法2: JSONファイルから読み込む
    else {
      const serviceAccountPath = process.env.GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH || 'keys/google-sheets-service-account.json';
      const fullPath = join(process.cwd(), serviceAccountPath);
      
      try {
        serviceAccount = JSON.parse(readFileSync(fullPath, 'utf-8'));
      } catch (error) {
        console.error('Error reading service account file:', error);
        throw new Error('Google Sheets認証情報の読み込みに失敗しました。環境変数GOOGLE_SHEETS_SERVICE_ACCOUNT_JSONを設定するか、JSONファイルを配置してください。');
      }
    }
    
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
      
      sheetsClient = google.sheets({ version: 'v4', auth });
    } catch (error) {
      console.error('Error initializing Google Sheets client:', error);
      throw new Error('Google Sheets認証情報の初期化に失敗しました');
    }
  }
  return sheetsClient;
}

/**
 * スプレッドシートから記事一覧を取得
 */
export async function getArticleList(): Promise<Array<{ title: string; url: string }>> {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1B2Nxv4daI7tiKahG-49W_ITDJOGRomZrW_6i8RENehA';
    const sheets = getSheetsClient();
    
    console.log(`Attempting to fetch from Google Sheets: ${spreadsheetId}`);
    
    // スプレッドシートのデータを取得
    // A列（タイトル）とB列（URL）を取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A2:B100', // A1はヘッダーなので、A2から開始（最大100行まで）
    });
    
    const rows = response.data.values || [];
    console.log(`Fetched ${rows.length} rows from Google Sheets`);
    
    // データを整形（空行を除外）
    const articleList = rows
      .filter((row: any[]) => row && row.length >= 2 && row[0] && row[1] && row[0].trim() && row[1].trim()) // タイトルとURLが両方ある行のみ、かつ空でない
      .map((row: any[]) => ({
        title: row[0].trim(),
        url: row[1].trim(),
      }));
    
    console.log(`Processed ${articleList.length} articles from Google Sheets`);
    return articleList;
  } catch (error: any) {
    console.error('❌ Error fetching article list from Google Sheets:', error?.message || error);
    console.error('Error details:', error);
    
    // エラーが発生した場合は、フォールバックとしてローカルのJSONファイルを使用
    try {
      const possiblePaths = [
        join(process.cwd(), 'data', 'article-list.json'),
        join(process.cwd(), 'public', 'article-list.json'),
      ];
      
      if (typeof __dirname !== 'undefined') {
        possiblePaths.push(join(__dirname, '..', '..', 'data', 'article-list.json'));
        possiblePaths.push(join(__dirname, '..', '..', 'public', 'article-list.json'));
      }
      
      for (const fallbackPath of possiblePaths) {
        try {
          console.log(`Trying fallback path: ${fallbackPath}`);
          const fallbackData = JSON.parse(readFileSync(fallbackPath, 'utf-8'));
          console.log(`✅ Using fallback article list: ${fallbackData.length} articles from ${fallbackPath}`);
          return fallbackData;
        } catch (pathError) {
          console.error(`Failed to load from ${fallbackPath}:`, pathError);
          continue;
        }
      }
      
      throw new Error('フォールバックファイルも読み込めませんでした');
    } catch (fallbackError: any) {
      console.error('❌ Error loading fallback article list:', fallbackError?.message || fallbackError);
      throw new Error(`記事一覧の取得に失敗しました: ${fallbackError?.message || '不明なエラー'}`);
    }
  }
}

