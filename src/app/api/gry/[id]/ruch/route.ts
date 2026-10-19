import Anthropic from "@anthropic-ai/sdk";
import { sprawdzDostep } from "@/lib/dostep";
import { type Gra, wczytajGre, zajmij, zapiszGre, zapiszKosztRuchu, zwolnij } from "@/lib/gry";
import { wstepSprawy } from "@/lib/sprawy";
import { maZgodeAI } from "@/lib/zgody";
import { LIMIT_RUCHOW, MAKS_DLUGOSC_RUCHU } from "@/lib/limity";
import { MODEL, jestKluczApi, odpowiedzMistrza, policzKoszt } from "@/lib/mistrz-gry";
import { dopiszNotatki, wytnijZnaczniki } from "@/lib/znaczniki";

// Odpowiedź mistrza gry może trwać dłużej niż domyślny limit czasu funkcji na serwerze.
export const maxDuration = 300;

const RUCH_STARTOWY = "Rozpocznij grę.";

// Zdarzenia wysyłane do przeglądarki, po jednym obiekcie JSON w linii.
type Zdarzenie =
  | { tekst: string }
  | {
      koniec: true;
      kosztUsd: number;
      ruchy: number;
      uciete: boolean;
      wynik: "rozwiazana" | "porazka" | null;
      notatki: string[];
    }
  | { blad: string };

// Przyjmuje ruch gracza i strumieniuje odpowiedź mistrza gry.
export async function POST(request: Request, ctx: RouteContext<"/api/gry/[id]/ruch">) {
  const dostep = await sprawdzDostep();
  if (dostep.stan !== "tester") return Response.json({ blad: "brak_dostepu" }, { status: 401 });

  if (!(await maZgodeAI(dostep.gracz.id))) return Response.json({ blad: "zgoda" }, { status: 403 });

  const { id } = await ctx.params;
  const gra = await wczytajGre(dostep.gracz.id, id).catch(() => null);
  if (!gra) return Response.json({ blad: "Nie ma takiej rozgrywki." }, { status: 404 });

  const start = gra.historia.length === 0;
  let tekst = RUCH_STARTOWY;
  if (!start) {
    const body = (await request.json().catch(() => ({}))) as { tekst?: unknown };
    tekst = typeof body.tekst === "string" ? body.tekst.trim() : "";
    if (!tekst) return Response.json({ blad: "Pusty ruch." }, { status: 400 });
    if (tekst.length > MAKS_DLUGOSC_RUCHU) {
      return Response.json({ blad: `Ruch może mieć najwyżej ${MAKS_DLUGOSC_RUCHU} znaków.` }, { status: 400 });
    }
  }
  if (start) return rozpocznij(gra);
  if (!jestKluczApi()) {
    return Response.json({ blad: "auth" }, { status: 503 });
  }
  if (gra.ruchy >= LIMIT_RUCHOW) {
    return Response.json({ blad: "Ta rozgrywka osiągnęła limit ruchów." }, { status: 429 });
  }
  if (!(await zajmij(gra))) {
    return Response.json({ blad: "Mistrz gry odpowiada jeszcze na poprzedni ruch." }, { status: 409 });
  }

  // Numer ruchu pozwala mistrzowi gry pilnować tempa (zegar podpowiedzi); gracz go nie widzi.
  const historia: Anthropic.Beta.BetaMessageParam[] = [
    ...gra.historia,
    { role: "user", content: start ? tekst : `[Ruch ${gra.ruchy}] ${tekst}` },
  ];
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let polaczony = true;
      const wyslij = (z: Zdarzenie) => {
        if (!polaczony) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(z) + "\n"));
        } catch {
          // Gracz zamknął stronę; dokańczamy ruch i zapisujemy go mimo to.
          polaczony = false;
        }
      };

      try {
        const odpowiedz = await odpowiedzMistrza(gra.sprawaId, historia);
        for await (const event of odpowiedz) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            wyslij({ tekst: event.delta.text });
          }
        }
        const wiadomosc = await odpowiedz.finalMessage();
        const koszt = policzKoszt(wiadomosc.usage);
        // Znaczniki (koniec gry, wpisy do notatnika) zostają w historii dla modelu, ale gracz ich nie widzi.
        const { tekst: tekstMistrza, wynik, notatki } = wytnijZnaczniki(
          wiadomosc.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(""),
        );

        if (wiadomosc.stop_reason === "refusal" && !tekstMistrza) {
          wyslij({ blad: "refused" });
        } else {
          // Odsyłamy pełną treść odpowiedzi bez zmian, łącznie z blokami myślenia.
          gra.historia = [...historia, { role: "assistant", content: wiadomosc.content }];
          if (!start) gra.widoczne.push({ rola: "gracz", tekst });
          gra.widoczne.push({ rola: "mistrz", tekst: tekstMistrza });
          gra.ruchy += 1;
          if (wynik && !gra.wynik) gra.wynik = wynik;
          gra.notatki = dopiszNotatki(gra.notatki, notatki);
        }
        gra.koszt = {
          wejscie: gra.koszt.wejscie + koszt.wejscie,
          zapisCache: gra.koszt.zapisCache + koszt.zapisCache,
          odczytCache: gra.koszt.odczytCache + koszt.odczytCache,
          wyjscie: gra.koszt.wyjscie + koszt.wyjscie,
          usd: gra.koszt.usd + koszt.usd,
        };
        await zapiszGre(gra);
        await zapiszKosztRuchu({
          graId: gra.id,
          userId: gra.userId,
          sprawaId: gra.sprawaId,
          ruch: gra.ruchy,
          model: wiadomosc.model ?? MODEL,
          stop: wiadomosc.stop_reason,
          // Niepusta lista oznacza pominięte bloki myślenia (np. po zmianie instrukcji).
          zmianyHistorii: (wiadomosc as { input_transformations?: unknown[] }).input_transformations ?? [],
          koszt,
        });
        wyslij({
          koniec: true,
          kosztUsd: gra.koszt.usd,
          ruchy: gra.ruchy,
          uciete: wiadomosc.stop_reason === "max_tokens",
          wynik: gra.wynik,
          notatki: gra.notatki,
        });
      } catch (err) {
        console.error("Błąd mistrza gry:", err);
        wyslij({ blad: kodBledu(err) });
      } finally {
        await zwolnij(gra);
        try {
          controller.close();
        } catch {
          // strumień był już zamknięty
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// Pierwszy ruch: wstęp z biblii pokazujemy od razu, bez pytania mistrza gry (szybciej i bez kosztu).
// W historii zostaje jako zwykła wymiana, więc mistrz gry wie, co gracz już przeczytał.
async function rozpocznij(gra: Gra): Promise<Response> {
  let wstep: string;
  try {
    wstep = await wstepSprawy(gra.sprawaId);
  } catch (err) {
    console.error("Nie wczytano wstępu sprawy:", err);
    return Response.json({ blad: "connection" }, { status: 500 });
  }
  gra.historia = [
    { role: "user", content: RUCH_STARTOWY },
    { role: "assistant", content: [{ type: "text", text: wstep }] },
  ];
  gra.widoczne = [{ rola: "mistrz", tekst: wstep }];
  gra.ruchy = 1;
  await zapiszGre(gra);
  const linie: Zdarzenie[] = [
    { tekst: wstep },
    { koniec: true, kosztUsd: gra.koszt.usd, ruchy: gra.ruchy, uciete: false, wynik: null, notatki: gra.notatki },
  ];
  return new Response(linie.map((z) => JSON.stringify(z)).join("\n") + "\n", {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function kodBledu(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return "auth";
  if (err instanceof Anthropic.RateLimitError) return "rate_limited";
  if (err instanceof Anthropic.BadRequestError) return "bad_request";
  if (err instanceof Anthropic.APIError) return "api";
  return "connection";
}
