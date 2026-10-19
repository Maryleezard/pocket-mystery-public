import { czyJestAnkieta, inneSprawyGracza } from "@/lib/ankiety";
import { jestAutorka, sprawdzDostep } from "@/lib/dostep";
import { ilePodejsc, ileGierOd, nowaGra, ostatniaGra } from "@/lib/gry";
import { LIMIT_NOWYCH_GIER_NA_DOBE, LIMIT_PODEJSC_NA_SPRAWE, LIMIT_RUCHOW } from "@/lib/limity";
import { opisSprawy } from "@/lib/sprawy";
import { maZgodeAI } from "@/lib/zgody";

// Ostatnia rozgrywka gracza w danej sprawie (do wznowienia gry) i liczba wykorzystanych podejść.
export async function GET(request: Request) {
  const dostep = await sprawdzDostep();
  if (dostep.stan !== "tester") return Response.json({ blad: "brak_dostepu" }, { status: 401 });

  const sprawaId = new URL(request.url).searchParams.get("sprawa") ?? "";
  const userId = dostep.gracz.id;
  const [gra, podejscia] = await Promise.all([ostatniaGra(userId, sprawaId), ilePodejsc(userId, sprawaId)]);
  const limitPodejsc = jestAutorka(dostep) ? null : LIMIT_PODEJSC_NA_SPRAWE;
  if (!gra || gra.widoczne.length === 0) return Response.json({ gra: null, podejscia, limitPodejsc });

  const [ankieta, inne] = await Promise.all([czyJestAnkieta(gra.id), inneSprawyGracza(userId, sprawaId)]);
  const inneSprawy = (await Promise.all(inne.map((id) => opisSprawy(id))))
    .filter((s) => s !== null)
    .map((s) => ({ id: s.id, nazwa: s.nazwa }));

  return Response.json({
    gra: {
      id: gra.id,
      widoczne: gra.widoczne,
      ruchy: gra.ruchy,
      limitRuchow: LIMIT_RUCHOW,
      kosztUsd: gra.koszt.usd,
      wynik: gra.wynik,
      notatki: gra.notatki,
      ankieta,
      inneSprawy,
    },
    podejscia,
    limitPodejsc,
  });
}

// Zakłada nową rozgrywkę dla wskazanej sprawy.
export async function POST(request: Request) {
  const dostep = await sprawdzDostep();
  if (dostep.stan !== "tester") return Response.json({ blad: "brak_dostepu" }, { status: 401 });
  if (!(await maZgodeAI(dostep.gracz.id))) return Response.json({ blad: "zgoda" }, { status: 403 });
  const autorka = jestAutorka(dostep);

  const { sprawaId } = (await request.json().catch(() => ({}))) as { sprawaId?: string };
  const sprawa = typeof sprawaId === "string" ? await opisSprawy(sprawaId).catch(() => null) : null;
  if (!sprawa || (sprawa.szkic && !autorka)) {
    return Response.json({ blad: "Nie ma takiej sprawy." }, { status: 404 });
  }

  if (!autorka && (await ilePodejsc(dostep.gracz.id, sprawa.id)) >= LIMIT_PODEJSC_NA_SPRAWE) {
    return Response.json({ blad: "limit_podejsc" }, { status: 429 });
  }
  const doba = new Date(Date.now() - 24 * 60 * 60_000);
  if ((await ileGierOd(dostep.gracz.id, doba)) >= LIMIT_NOWYCH_GIER_NA_DOBE) {
    return Response.json({ blad: "limit_gier" }, { status: 429 });
  }

  const gra = await nowaGra(dostep.gracz.id, sprawa.id);
  return Response.json({ id: gra.id });
}
