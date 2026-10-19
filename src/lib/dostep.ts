import "server-only";
import { baza } from "./supabase/admin";
import { klientSesji } from "./supabase/serwer";

export type Gracz = { id: string; email: string };

export type Dostep =
  | { stan: "niezalogowany" }
  | { stan: "spoza-listy"; email: string }
  | { stan: "tester"; gracz: Gracz };

// Publiczne wydanie: REJESTRACJA_OTWARTA=1 wpuszcza każdy zweryfikowany adres e-mail.
// Bez tej zmiennej gra działa jak dotąd, tylko dla listy testerów.
export function rejestracjaOtwarta(): boolean {
  return process.env.REJESTRACJA_OTWARTA === "1";
}

export async function czyNaLiscieTesterow(email: string): Promise<boolean> {
  if (rejestracjaOtwarta()) return true;
  const { data, error } = await baza()
    .from("testerzy")
    .select("email")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export function jestAutorka(dostep: Dostep): boolean {
  const autorka = process.env.AUTORKA_EMAIL?.trim().toLowerCase();
  return dostep.stan === "tester" && Boolean(autorka) && dostep.gracz.email === autorka;
}

// Sprawdza zweryfikowaną sesję i listę testerów. Używać w każdej stronie i trasie API z grą.
export async function sprawdzDostep(): Promise<Dostep> {
  const supabase = await klientSesji();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email.toLowerCase() : "";
  if (!claims?.sub || !email) return { stan: "niezalogowany" };
  if (!(await czyNaLiscieTesterow(email))) return { stan: "spoza-listy", email };
  return { stan: "tester", gracz: { id: claims.sub, email } };
}
