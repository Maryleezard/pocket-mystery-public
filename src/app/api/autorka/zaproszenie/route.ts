import { jestAutorka, sprawdzDostep } from "@/lib/dostep";
import { linkTestera } from "@/lib/klucze";
import { baza } from "@/lib/supabase/admin";

const MAKS_NA_RAZ = 50;
const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/;

type Wynik = { email: string; link?: string; blad?: string };

// Dodaje testerów do listy i zwraca ich stałe osobiste linki (bez daty ważności).
// Supabase niczego nie wysyła: autorka sama przekazuje linki testerom.
// Każda linia to jeden tester: adres e-mail, a po nim opcjonalnie notatka (np. imię).
export async function POST(request: Request) {
  if (!jestAutorka(await sprawdzDostep())) {
    return Response.json({ blad: "Brak dostępu." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { lista?: unknown };
  const linie = (typeof body.lista === "string" ? body.lista : "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (linie.length === 0) return Response.json({ blad: "Wpisz co najmniej jeden adres." }, { status: 400 });
  if (linie.length > MAKS_NA_RAZ) {
    return Response.json({ blad: `Najwyżej ${MAKS_NA_RAZ} adresów naraz.` }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const wyniki: Wynik[] = [];
  const widziane = new Set<string>();
  for (const linia of linie) {
    const [pierwszy, ...reszta] = linia.split(/[\s,;]+/);
    const email = pierwszy.toLowerCase();
    if (!EMAIL.test(email)) {
      wyniki.push({ email: linia, blad: "To nie wygląda na adres e-mail." });
      continue;
    }
    if (widziane.has(email)) continue;
    widziane.add(email);
    wyniki.push(await zapros(email, reszta.join(" ").slice(0, 200), origin));
  }
  return Response.json({ wyniki });
}

// Dodaje testera (albo zostawia istniejącego) i zwraca link z jego kluczem.
async function zapros(email: string, notatka: string, origin: string): Promise<Wynik> {
  const { data, error } = await baza()
    .from("testerzy")
    .upsert({ email, ...(notatka ? { notatka } : {}) }, { onConflict: "email" })
    .select("klucz")
    .single();
  if (error || !data?.klucz) {
    console.error("Nie dodano testera:", error);
    return { email, blad: "Nie udało się dodać do listy." };
  }
  return { email, link: linkTestera(origin, data.klucz as string) };
}
