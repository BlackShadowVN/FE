import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Lấy cookie auth_data
  const authCookie = request.cookies.get('auth_data')
  const { pathname } = request.nextUrl

  // Nếu đã đăng nhập và đang truy cập trang login hoặc register
  if (authCookie && (pathname === '/login' || pathname === '/register')) {
    // Redirect về trang profile
    return NextResponse.redirect(new URL('/profile', request.url))
  }

  // Nếu chưa đăng nhập và truy cập các trang cần đăng nhập
  if (!authCookie && (pathname.startsWith('/profile') || pathname.startsWith('/orders'))) {
    // Redirect về trang login và lưu URL hiện tại để redirect lại sau khi đăng nhập
    const loginURL = new URL('/login', request.url)
    loginURL.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginURL)
  }

  return NextResponse.next()
}

// Khai báo đường dẫn mà middleware sẽ được thực thi
export const config = {
  matcher: ['/login', '/register', '/profile/:path*', '/orders/:path*'],
} 