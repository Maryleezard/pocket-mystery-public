import { NextResponse } from "next/server";
import { klientSesji } from "@/lib/supabase/serwer";

// Tu prowadzi link z e-maila: zamienia jednorazowy kod na sesję i wraca na stronę główną.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await klientSesji();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/", url.origin));
    console.error("Nie udało się zalogować z linku:", error);
  }
  return NextResponse.redirect(new URL("/logowanie?blad=link", url.origin));
}
