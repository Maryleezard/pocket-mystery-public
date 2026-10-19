import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Odświeża sesję logowania przy każdym żądaniu. Dostęp do stron i danych
// sprawdzają same strony i trasy API, nie to proxy.
export async function proxy(request: NextRequest) {
  let odpowiedz = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          odpowiedz = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => odpowiedz.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => odpowiedz.headers.set(key, value));
        },
      },
    },
  );

  // Nie wstawiać kodu między utworzeniem klienta a getClaims(): grozi losowym wylogowywaniem.
  await supabase.auth.getClaims();

  return odpowiedz;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
