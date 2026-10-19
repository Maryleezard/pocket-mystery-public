import { czyNaLiscieTesterow } from "@/lib/dostep";
import { klientSesji } from "@/lib/supabase/serwer";

// Wysyła link logowania, ale tylko osobom z listy testerów.
// Odpowiedź jest zawsze taka sama, żeby nie zdradzać, kto jest na liście.
export async function POST(request: Request) {
  const { email } = (await request.json().catch(() => ({}))) as { email?: unknown };
  const adres = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adres)) {
    return Response.json({ blad: "Podaj poprawny adres e-mail." }, { status: 400 });
  }

  if (await czyNaLiscieTesterow(adres)) {
    const supabase = await klientSesji();
    const { error } = await supabase.auth.signInWithOtp({
      email: adres,
      options: { emailRedirectTo: `${new URL(request.url).origin}/auth/potwierdz` },
    });
    if (error) {
      console.error("Nie wysłano linku logowania:", error);
      return Response.json(
        { blad: "Nie udało się wysłać linku. Spróbuj ponownie za kilka minut." },
        { status: 502 },
      );
    }
  }
  return Response.json({ ok: true });
}
