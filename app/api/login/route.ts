import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const correctPassword = process.env.SYSTEM_PASSWORD;

    // パスワードが設定されていない場合は認証をスキップ
    if (!correctPassword) {
      return NextResponse.json(
        { success: true, message: 'パスワードが設定されていません' },
        { status: 200 }
      );
    }

    // パスワードをチェック
    if (password === correctPassword) {
      // 認証成功：cookieを設定（30日間有効）
      const response = NextResponse.json(
        { success: true, message: '認証成功' },
        { status: 200 }
      );

      response.cookies.set('seo-system-auth', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30日間
        path: '/',
      });

      return response;
    } else {
      return NextResponse.json(
        { success: false, error: 'パスワードが正しくありません' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'ログイン処理に失敗しました' },
      { status: 500 }
    );
  }
}

