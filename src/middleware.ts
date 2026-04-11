import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Session auffrischen — wichtig: kein Code zwischen createServerClient und getUser!
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Geschützte Routen: (app)/* brauchen Auth
  const isAppRoute = pathname.startsWith('/atlas') ||
    pathname.startsWith('/deltat') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/admin')

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Eingeloggte Nutzer von Auth-Seiten weglenken → DeltaT als Standard-Einstieg
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/deltat'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
