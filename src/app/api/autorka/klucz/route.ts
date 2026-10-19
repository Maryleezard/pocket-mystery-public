import { jestAutorka, sprawdzDostep } from "@/lib/dostep";
import { wymienKlucz } from "@/lib/klucze";

// Wymienia stały link testera; stary przestaje działać.
export async function POST(request: Request) {
  if (!jestAutorka(await sprawdzDostep())) {
    return Response.json({ blad: "Brak dostępu." }, { status: 403 });
  }
  const { email } = (await request.json().catch(() => ({}))) as { email?: unknown };
  if (typeof email !== "string" || !email) return Response.json({ blad: "Brak adresu." }, { status: 400 });
  try {
    await wymienKlucz(email.trim().toLowerCase());
  } catch (err) {
    console.error("Nie wymieniono klucza:", err);
    return Response.json({ blad: "Nie udało się." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
