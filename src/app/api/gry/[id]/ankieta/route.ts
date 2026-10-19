import { TRUDNOSCI, czyJestAnkieta, inneSprawyGracza, zapiszAnkiete, type Trudnosc } from "@/lib/ankiety";
import { sprawdzDostep } from "@/lib/dostep";
import { wczytajGre } from "@/lib/gry";

const ocena = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5 ? v : null);
const tekst = (v: unknown, maks: number) => (typeof v === "string" ? v.trim().slice(0, maks) : "");

// Zapisuje ankietę testera po rozgrywce. Jedna ankieta na rozgrywkę.
export async function POST(request: Request, ctx: RouteContext<"/api/gry/[id]/ankieta">) {
  const dostep = await sprawdzDostep();
  if (dostep.stan !== "tester") return Response.json({ blad: "brak_dostepu" }, { status: 401 });

  const { id } = await ctx.params;
  const gra = await wczytajGre(dostep.gracz.id, id).catch(() => null);
  if (!gra || gra.ruchy === 0) return Response.json({ blad: "Nie ma takiej rozgrywki." }, { status: 404 });
  if (await czyJestAnkieta(gra.id)) return Response.json({ blad: "Ta rozgrywka ma już ankietę." }, { status: 409 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const ocenaSprawy = ocena(body.ocena);
  const uczciwosc = ocena(body.uczciwosc);
  const trudnosc = typeof body.trudnosc === "string" && body.trudnosc in TRUDNOSCI ? (body.trudnosc as Trudnosc) : null;
  if (!ocenaSprawy || !uczciwosc || !trudnosc) {
    return Response.json({ blad: "Uzupełnij ocenę, trudność i ocenę mistrza gry." }, { status: 400 });
  }

  // Porównać można tylko z tą sprawą albo z inną, w którą gracz naprawdę grał.
  let lepszaSprawa: string | null = null;
  if (typeof body.lepszaSprawa === "string" && body.lepszaSprawa) {
    const dozwolone = [gra.sprawaId, ...(await inneSprawyGracza(dostep.gracz.id, gra.sprawaId))];
    if (!dozwolone.includes(body.lepszaSprawa)) {
      return Response.json({ blad: "Nieznana sprawa w porównaniu." }, { status: 400 });
    }
    lepszaSprawa = body.lepszaSprawa;
  }

  try {
    await zapiszAnkiete({
      graId: gra.id,
      userId: dostep.gracz.id,
      sprawaId: gra.sprawaId,
      ocena: ocenaSprawy,
      trudnosc,
      uczciwosc,
      komentarz: tekst(body.komentarz, 2000),
      lepszaSprawa,
      dlaczego: lepszaSprawa ? tekst(body.dlaczego, 1000) : "",
    });
  } catch (err) {
    console.error("Nie zapisano ankiety:", err);
    return Response.json({ blad: "Nie udało się zapisać ankiety. Spróbuj jeszcze raz." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
