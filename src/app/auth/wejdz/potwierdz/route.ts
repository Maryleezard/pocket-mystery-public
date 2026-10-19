import { NextResponse } from "next/server";
import { klientSesji } from "@/lib/supabase/serwer";

const RODZAJE = ["magiclink", "signup", "email"] as const;
type Rodzaj = (typeof RODZAJE)[number];

// Loguje po kliknięciu przycisku na stronie /auth/wejdz: zamienia kod z e-maila na sesję.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const form = await request.formData().catch(() => null);
  const kod = form?.get("token_hash");
  const rodzaj = form?.get("type");

  if (typeof kod === "string" && kod && typeof rodzaj === "string" && RODZAJE.includes(rodzaj as Rodzaj)) {
    const supabase = await klientSesji();
    const { error } = await supabase.auth.verifyOtp({ token_hash: kod, type: rodzaj as Rodzaj });
    if (!error) return NextResponse.redirect(new URL("/", url.origin), { status: 303 });
    console.error("Nie udało się zalogować z linku:", error);
  }
  return NextResponse.redirect(new URL("/logowanie?blad=link", url.origin), { status: 303 });
}
