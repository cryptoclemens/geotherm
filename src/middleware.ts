import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Env-Vars prüfen — fehlen sie, wird die App durchgelassen (kein Hard-Crash)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // Supabase nicht erreichbar — App trotzdem rendern, Auth-Schutz greift client-seitig
    return NextResponse.next({ request })
  }

  const { pathname } = request.nextUrl

  // Geschützte Routen: (app)/* brauchen Auth
  const isAppRoute = pathname.startsWith('/atlas') ||
    pathname.startsWith('/deltat') ||
    pathname.startsWith('/projects') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin')

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Eingeloggte Nutzer von Auth-Seiten weglenken → Dashboard als Einstieg
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup')
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
