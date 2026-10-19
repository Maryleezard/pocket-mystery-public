import { sprawdzDostep } from "@/lib/dostep";
import { wczytajGre } from "@/lib/gry";
import { baza } from "@/lib/supabase/admin";

const POWODY = ["nieodpowiednia", "bledna", "inne"] as const;

// Zapisuje zgłoszenie odpowiedzi mistrza gry (nieodpowiednia treść, błąd w faktach, inne).
export async function POST(request: Request, ctx: RouteContext<"/api/gry/[id]/zgloszenie">) {
  const dostep = await sprawdzDostep();
  if (dostep.stan !== "tester") return Response.json({ blad: "brak_dostepu" }, { status: 401 });

  const { id } = await ctx.params;
  const gra = await wczytajGre(dostep.gracz.id, id).catch(() => null);
  if (!gra) return Response.json({ blad: "Nie ma takiej rozgrywki." }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as {
    powod?: unknown;
    komentarz?: unknown;
    tekst?: unknown;
    indeks?: unknown;
  };
  const powod = POWODY.find((p) => p === body.powod);
  if (!powod) return Response.json({ blad: "Wybierz powód zgłoszenia." }, { status: 400 });
  const komentarz = typeof body.komentarz === "string" ? body.komentarz.trim().slice(0, 1000) : null;
  const tekst = typeof body.tekst === "string" ? body.tekst.slice(0, 6000) : null;
  const indeks = typeof body.indeks === "number" && Number.isInteger(body.indeks) ? body.indeks : null;

  const { error } = await baza().from("zgloszenia").insert({
    user_id: dostep.gracz.id,
    gra_id: gra.id,
    sprawa_id: gra.sprawaId,
    indeks,
    powod,
    komentarz: komentarz || null,
    tekst,
  });
  if (error) {
    console.error("Nie udało się zapisać zgłoszenia:", error);
    return Response.json({ blad: "Nie udało się wysłać zgłoszenia. Spróbuj ponownie." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
