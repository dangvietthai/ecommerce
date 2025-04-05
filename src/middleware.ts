import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Nếu đang truy cập trang admin
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session) {
      // Nếu chưa đăng nhập, chuyển về trang login
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Kiểm tra role admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('email', session.user.email)
      .single()

    if (userData?.role !== 'admin') {
      // Nếu không phải admin, chuyển về trang chủ
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return res
}

// Specify which routes to run the middleware on
export const config = {
  matcher: [
    '/admin/:path*',
  ],
} 