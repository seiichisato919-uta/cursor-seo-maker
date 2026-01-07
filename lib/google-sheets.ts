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
    
    // スプレッドシートのデータを取得
    // A列（タイトル）とB列（URL）を取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A2:B', // A1はヘッダーなので、A2から開始
    });
    
    const rows = response.data.values || [];
    
    // データを整形
    const articleList = rows
      .filter((row: any[]) => row.length >= 2 && row[0] && row[1]) // タイトルとURLが両方ある行のみ
      .map((row: any[]) => ({
        title: row[0].trim(),
        url: row[1].trim(),
      }));
    
    return articleList;
  } catch (error: any) {
    console.error('Error fetching article list from Google Sheets:', error);
    
    // エラーが発生した場合は、フォールバックとしてローカルのJSONファイルを使用
    try {
      const fallbackPath = join(process.cwd(), 'data', 'article-list.json');
      const fallbackData = JSON.parse(readFileSync(fallbackPath, 'utf-8'));
      console.log('Using fallback article list from local file');
      return fallbackData;
    } catch (fallbackError) {
      console.error('Error loading fallback article list:', fallbackError);
      throw new Error('記事一覧の取得に失敗しました');
    }
  }
}

