import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // APIルートは除外（パスワード保護の対象外）
  if (request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // パスワード保護が有効な場合のみチェック
  const password = process.env.SYSTEM_PASSWORD;
  if (!password) {
    // パスワードが設定されていない場合は保護なし
    return NextResponse.next();
  }

  // 認証済みかチェック（cookieで管理）
  const isAuthenticated = request.cookies.get('seo-system-auth')?.value === 'true';

  // 認証済みの場合はそのまま通過
  if (isAuthenticated) {
    return NextResponse.next();
  }

  // 認証ページへのリダイレクト
  if (request.nextUrl.pathname !== '/login') {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * 以下のパスを除くすべてのリクエストパスにマッチ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

