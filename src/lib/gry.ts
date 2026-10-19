import "server-only";
import type Anthropic from "@anthropic-ai/sdk";
import { baza } from "./supabase/admin";

// Rozgrywki są zapisane w tabeli `gry` w Supabase. Każda funkcja przyjmuje
// identyfikator gracza i działa tylko na jego rozgrywkach.

export type Koszt = {
  wejscie: number; // tokeny wejściowe bez cache
  zapisCache: number;
  odczytCache: number;
  wyjscie: number;
  usd: number;
};

export type Wynik = "rozwiazana" | "porazka";

export type WidocznaWiadomosc = { rola: "gracz" | "mistrz"; tekst: string };

export type Gra = {
  id: string;
  userId: string;
  sprawaId: string;
  // Pełna historia dla API, łącznie z blokami myślenia, odsyłana bez zmian.
  historia: Anthropic.Beta.BetaMessageParam[];
  // To, co widzi gracz.
  widoczne: WidocznaWiadomosc[];
  ruchy: number;
  koszt: Koszt;
  // Ustawiany, gdy mistrz gry zakończy sprawę.
  wynik: Wynik | null;
  // Wpisy do notatnika gracza, w kolejności zdobycia (dopisuje je mistrz gry znacznikiem NOTATKA).
  notatki: string[];
};

type Wiersz = {
  id: string;
  user_id: string;
  sprawa_id: string;
  historia: Anthropic.Beta.BetaMessageParam[];
  widoczne: WidocznaWiadomosc[];
  ruchy: number;
  koszt: Koszt;
  wynik: Wynik | null;
  notatki: string[] | null;
};

const KOLUMNY = "id, user_id, sprawa_id, historia, widoczne, ruchy, koszt, wynik, notatki";

function zWiersza(w: Wiersz): Gra {
  return {
    id: w.id,
    userId: w.user_id,
    sprawaId: w.sprawa_id,
    historia: w.historia,
    widoczne: w.widoczne,
    ruchy: w.ruchy,
    koszt: w.koszt,
    wynik: w.wynik,
    notatki: w.notatki ?? [],
  };
}

export async function nowaGra(userId: string, sprawaId: string): Promise<Gra> {
  const { data, error } = await baza()
    .from("gry")
    .insert({ user_id: userId, sprawa_id: sprawaId })
    .select(KOLUMNY)
    .single<Wiersz>();
  if (error) throw error;
  return zWiersza(data);
}

export async function wczytajGre(userId: string, id: string): Promise<Gra | null> {
  const { data, error } = await baza()
    .from("gry")
    .select(KOLUMNY)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle<Wiersz>();
  if (error) throw error;
  return data ? zWiersza(data) : null;
}

// Ostatnia rozgrywka gracza w danej sprawie, żeby wrócić do niej po powrocie na stronę.
export async function ostatniaGra(userId: string, sprawaId: string): Promise<Gra | null> {
  const { data, error } = await baza()
    .from("gry")
    .select(KOLUMNY)
    .eq("user_id", userId)
    .eq("sprawa_id", sprawaId)
    .order("utworzono", { ascending: false })
    .limit(1)
    .maybeSingle<Wiersz>();
  if (error) throw error;
  return data ? zWiersza(data) : null;
}

export async function ileGierOd(userId: string, od: Date): Promise<number> {
  const { count, error } = await baza()
    .from("gry")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("utworzono", od.toISOString());
  if (error) throw error;
  return count ?? 0;
}

// Rozgrywki, które naprawdę ruszyły (mistrz gry odpowiedział choć raz), liczone do limitu podejść.
export async function ilePodejsc(userId: string, sprawaId: string): Promise<number> {
  const { count, error } = await baza()
    .from("gry")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("sprawa_id", sprawaId)
    .gt("ruchy", 0);
  if (error) throw error;
  return count ?? 0;
}

export type PostepWSprawie = { podejscia: number; rozwiazana: boolean; zakonczona: boolean; wToku: boolean };

// Stan gracza w każdej sprawie, do kart w bibliotece.
export async function postepGracza(userId: string): Promise<Record<string, PostepWSprawie>> {
  const { data, error } = await baza()
    .from("gry")
    .select("sprawa_id, wynik, utworzono")
    .eq("user_id", userId)
    .gt("ruchy", 0)
    .order("utworzono", { ascending: true });
  if (error) throw error;
  const postep: Record<string, PostepWSprawie> = {};
  for (const g of (data ?? []) as { sprawa_id: string; wynik: Wynik | null }[]) {
    const p = (postep[g.sprawa_id] ??= { podejscia: 0, rozwiazana: false, zakonczona: false, wToku: false });
    p.podejscia += 1;
    if (g.wynik === "rozwiazana") p.rozwiazana = true;
    if (g.wynik) p.zakonczona = true;
    // Liczy się ostatnia rozgrywka: czy jeszcze trwa.
    p.wToku = !g.wynik;
  }
  return postep;
}

export async function zapiszGre(gra: Gra): Promise<void> {
  const { error } = await baza()
    .from("gry")
    .update({
      historia: gra.historia,
      widoczne: gra.widoczne,
      ruchy: gra.ruchy,
      koszt: gra.koszt,
      wynik: gra.wynik,
      notatki: gra.notatki,
      ...(gra.wynik ? { zakonczono: new Date().toISOString() } : {}),
      zaktualizowano: new Date().toISOString(),
    })
    .eq("id", gra.id)
    .eq("user_id", gra.userId);
  if (error) throw error;
}

export async function zapiszKosztRuchu(wpis: {
  graId: string;
  userId: string;
  sprawaId: string;
  ruch: number;
  model: string;
  stop: string | null;
  zmianyHistorii: unknown[];
  koszt: Koszt;
}): Promise<void> {
  const { error } = await baza().from("koszty_ruchow").insert({
    gra_id: wpis.graId,
    user_id: wpis.userId,
    sprawa_id: wpis.sprawaId,
    ruch: wpis.ruch,
    model: wpis.model,
    stop: wpis.stop,
    zmiany_historii: wpis.zmianyHistorii,
    wejscie: wpis.koszt.wejscie,
    zapis_cache: wpis.koszt.zapisCache,
    odczyt_cache: wpis.koszt.odczytCache,
    wyjscie: wpis.koszt.wyjscie,
    usd: wpis.koszt.usd,
  });
  if (error) console.error("Nie zapisano kosztu ruchu:", error);
}

// Blokada w bazie, żeby jedna gra nie obsługiwała dwóch ruchów naraz, nawet na różnych serwerach.
// Wygasa sama po 5 minutach, gdyby ruch przerwał się w połowie.
export async function zajmij(gra: Gra): Promise<boolean> {
  const teraz = new Date();
  const { data, error } = await baza()
    .from("gry")
    .update({ zajeta_do: new Date(teraz.getTime() + 5 * 60_000).toISOString() })
    .eq("id", gra.id)
    .eq("user_id", gra.userId)
    .or(`zajeta_do.is.null,zajeta_do.lt.${teraz.toISOString()}`)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function zwolnij(gra: Gra): Promise<void> {
  const { error } = await baza().from("gry").update({ zajeta_do: null }).eq("id", gra.id);
  if (error) console.error("Nie zwolniono blokady gry:", error);
}
