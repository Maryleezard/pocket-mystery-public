import { NextResponse } from "next/server";
import { emailDlaKlucza } from "@/lib/klucze";
import { baza } from "@/lib/supabase/admin";
import { klientSesji } from "@/lib/supabase/serwer";

// Loguje testera stałym kluczem z jego osobistego linku. Klucz działa wielokrotnie:
// za każdym razem serwer tworzy świeży jednorazowy token Supabase i od razu go zużywa.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const form = await request.formData().catch(() => null);
  const klucz = form?.get("k");

  if (typeof klucz === "string" && klucz) {
    try {
      const email = await emailDlaKlucza(klucz);
      if (email) {
        // generateLink tworzy konto, jeśli go jeszcze nie ma, i nie wysyła e-maila.
        const { data, error } = await baza().auth.admin.generateLink({ type: "magiclink", email });
        if (error || !data.properties?.hashed_token) throw error ?? new Error("Brak tokenu");
        // Dla nowej osoby Supabase zwraca rodzaj "signup", dla istniejącej "magiclink".
        const typ = data.properties.verification_type === "signup" ? "signup" : "magiclink";
        const supabase = await klientSesji();
        const wynik = await supabase.auth.verifyOtp({ token_hash: data.properties.hashed_token, type: typ });
        if (!wynik.error) return NextResponse.redirect(new URL("/", url.origin), { status: 303 });
        console.error("Nie udało się zalogować stałym linkiem:", wynik.error);
      }
    } catch (err) {
      console.error("Błąd logowania stałym linkiem:", err);
    }
  }
  return NextResponse.redirect(new URL("/logowanie?blad=zaproszenie", url.origin), { status: 303 });
}
