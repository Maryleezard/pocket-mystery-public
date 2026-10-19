import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Klient Supabase działający w imieniu zalogowanego gracza (sesja w ciasteczkach).
// Tworzony od nowa przy każdym żądaniu.
export async function klientSesji() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Wywołane z komponentu serwerowego, który nie może zapisywać ciasteczek.
            // Sesję odświeża wtedy proxy, więc można to pominąć.
          }
        },
      },
    },
  );
}
