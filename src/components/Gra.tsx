"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OpisSprawy } from "@/lib/sprawy";
import { bezZnacznikow } from "@/lib/znaczniki";
import Ankieta from "./Ankieta";
import Notatnik from "./Notatnik";
import ZglosOdpowiedz from "./ZglosOdpowiedz";
import styles from "./Gra.module.css";

type Wynik = "rozwiazana" | "porazka" | null;
type SprawaKrotko = { id: string; nazwa: string };

// Znacznik końca gry od mistrza (także niedokończony w trakcie strumienia) nie trafia na ekran.
// Notatnik otwieramy też komendą wpisaną tekstem, bez wysyłania ruchu do mistrza gry.
const KOMENDA_NOTATNIKA = /^(notatnik|co już wiem\??)$/i;

type Wiadomosc = { rola: "gracz" | "mistrz"; tekst: string; czeka?: boolean };

type StanGry = {
  id: string;
  widoczne: { rola: "gracz" | "mistrz"; tekst: string }[];
  ruchy: number;
  limitRuchow: number;
  kosztUsd: number;
  wynik: Wynik;
  notatki: string[];
  ankieta: boolean;
  inneSprawy: SprawaKrotko[];
};

const KOMUNIKATY: Record<string, string> = {
  auth: "Mistrz gry nie ma dostępu do Claude: brakuje klucza API albo jest nieprawidłowy.",
  rate_limited: "Za dużo zapytań naraz. Spróbuj ponownie za chwilę.",
  refused: "Mistrz gry nie odpowiedział na ten ruch. Spróbuj sformułować go inaczej.",
  bad_request: "Mistrz gry nie mógł przetworzyć tego ruchu. Spróbuj jeszcze raz.",
  api: "Usługa Claude chwilowo nie odpowiada. Spróbuj ponownie za chwilę.",
  connection: "Połączenie się urwało. Wyślij ruch jeszcze raz.",
  brak_dostepu: "Sesja wygasła. Zaloguj się ponownie.",
  zgoda: "Zanim zagrasz, zaakceptuj zgodę na przetwarzanie rozmów przez AI. Odśwież stronę.",
  limit_podejsc: "Wykorzystano już wszystkie podejścia do tej sprawy w wersji testowej.",
  limit_gier: "Na dziś wyczerpany jest limit nowych rozgrywek. Wróć jutro albo dokończ obecną.",
};

// pokazKoszt: licznik kosztów widzi tylko autorka, nie testerzy.
export default function Gra({ sprawa, pokazKoszt }: { sprawa: OpisSprawy; pokazKoszt: boolean }) {
  const [graId, setGraId] = useState<string | null>(null);
  const [wiadomosci, setWiadomosci] = useState<Wiadomosc[]>([]);
  const [zajety, setZajety] = useState(false);
  const [status, setStatus] = useState("");
  const [ruch, setRuch] = useState("");
  const [kosztUsd, setKosztUsd] = useState(0);
  const [ruchy, setRuchy] = useState(0);
  const [limit, setLimit] = useState(100);
  const [wczytano, setWczytano] = useState(false);
  const [wynik, setWynik] = useState<Wynik>(null);
  const [ankietaWyslana, setAnkietaWyslana] = useState(false);
  const [pokazAnkiete, setPokazAnkiete] = useState(false);
  const [inneSprawy, setInneSprawy] = useState<SprawaKrotko[]>([]);
  const [notatki, setNotatki] = useState<string[]>([]);
  const [notatnikOtwarty, setNotatnikOtwarty] = useState(false);
  const [podejscia, setPodejscia] = useState(0);
  const [limitPodejsc, setLimitPodejsc] = useState<number | null>(null);
  const poleRuchu = useRef<HTMLTextAreaElement>(null);
  const koniecLogu = useRef<HTMLDivElement>(null);

  // Wznawia ostatnią rozgrywkę gracza w tej sprawie, zapisaną na jego koncie.
  useEffect(() => {
    fetch(`/api/gry?sprawa=${encodeURIComponent(sprawa.id)}`)
      .then((r) =>
        r.ok
          ? (r.json() as Promise<{ gra: StanGry | null; podejscia: number; limitPodejsc: number | null }>)
          : { gra: null, podejscia: 0, limitPodejsc: null },
      )
      .then(({ gra, podejscia, limitPodejsc }) => {
        setPodejscia(podejscia);
        setLimitPodejsc(limitPodejsc);
        if (gra) {
          setGraId(gra.id);
          setWiadomosci(gra.widoczne);
          setRuchy(gra.ruchy);
          setLimit(gra.limitRuchow);
          setKosztUsd(gra.kosztUsd);
          setWynik(gra.wynik);
          setNotatki(gra.notatki ?? []);
          setAnkietaWyslana(gra.ankieta);
          setPokazAnkiete(Boolean(gra.wynik) && !gra.ankieta);
          setInneSprawy(gra.inneSprawy);
        }
      })
      .catch(() => {})
      .finally(() => setWczytano(true));
  }, [sprawa.id]);

  useEffect(() => {
    koniecLogu.current?.scrollIntoView({ block: "nearest" });
  }, [wiadomosci]);

  async function wyslij(id: string, tekst: string | null) {
    setStatus("");
    setZajety(true);
    setWiadomosci((w) => [
      ...w,
      ...(tekst ? [{ rola: "gracz" as const, tekst }] : []),
      { rola: "mistrz" as const, tekst: "Mistrz gry się zastanawia…", czeka: true },
    ]);
    const cofnij = () => setWiadomosci((w) => w.slice(0, tekst ? -2 : -1));

    let odpowiedz = "";
    try {
      const res = await fetch(`/api/gry/${id}/ruch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tekst }),
      });
      if (!res.ok || !res.body) {
        const dane = (await res.json().catch(() => ({}))) as { blad?: string };
        cofnij();
        if (tekst) setRuch(tekst);
        setStatus(KOMUNIKATY[dane.blad ?? ""] ?? dane.blad ?? KOMUNIKATY.connection);
        return;
      }

      const czytnik = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let bufor = "";
      for (;;) {
        const { value, done } = await czytnik.read();
        if (done) break;
        bufor += value;
        const linie = bufor.split("\n");
        bufor = linie.pop() ?? "";
        for (const linia of linie) {
          if (!linia.trim()) continue;
          const z = JSON.parse(linia) as {
            tekst?: string;
            koniec?: boolean;
            kosztUsd?: number;
            ruchy?: number;
            uciete?: boolean;
            wynik?: Wynik;
            notatki?: string[];
            blad?: string;
          };
          if (z.tekst) {
            odpowiedz += z.tekst;
            const t = bezZnacznikow(odpowiedz);
            setWiadomosci((w) => [...w.slice(0, -1), { rola: "mistrz", tekst: t }]);
          } else if (z.koniec) {
            setKosztUsd(z.kosztUsd ?? 0);
            setRuchy(z.ruchy ?? 0);
            if (z.notatki) setNotatki(z.notatki);
            if (z.wynik && !wynik) {
              setWynik(z.wynik);
              if (!ankietaWyslana) setPokazAnkiete(true);
            }
            if (z.uciete) setStatus("Odpowiedź została ucięta. Poproś mistrza gry, żeby dokończył.");
          } else if (z.blad) {
            cofnij();
            if (tekst) setRuch(tekst);
            setStatus(KOMUNIKATY[z.blad] ?? KOMUNIKATY.connection);
            return;
          }
        }
      }
    } catch {
      if (!odpowiedz) {
        cofnij();
        if (tekst) setRuch(tekst);
      }
      setStatus(KOMUNIKATY.connection);
    } finally {
      setZajety(false);
      poleRuchu.current?.focus();
    }
  }

  async function rozpocznij() {
    setStatus("");
    setZajety(true);
    try {
      const res = await fetch("/api/gry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sprawaId: sprawa.id }),
      });
      const dane = (await res.json().catch(() => ({}))) as { id?: string; blad?: string };
      if (!res.ok || !dane.id) {
        setStatus(KOMUNIKATY[dane.blad ?? ""] ?? dane.blad ?? KOMUNIKATY.connection);
        setZajety(false);
        return;
      }
      setGraId(dane.id);
      setPodejscia((p) => p + 1);
      await wyslij(dane.id, null);
    } catch {
      setStatus(KOMUNIKATY.connection);
      setZajety(false);
    }
  }

  function wyslijRuch(tekst: string) {
    const t = tekst.trim();
    if (graId && KOMENDA_NOTATNIKA.test(t)) {
      setRuch("");
      setNotatnikOtwarty(true);
      return;
    }
    if (!t || !graId || zajety) return;
    setRuch("");
    void wyslij(graId, t);
  }

  function odNowa() {
    if (!window.confirm("Zacząć sprawę od nowa? Obecnej rozgrywki nie będzie można wznowić.")) return;
    setGraId(null);
    setWiadomosci([]);
    setRuchy(0);
    setKosztUsd(0);
    setStatus("");
    setWynik(null);
    setNotatki([]);
    setNotatnikOtwarty(false);
    setAnkietaWyslana(false);
    setPokazAnkiete(false);
  }

  const zamknijNotatnik = useCallback(() => setNotatnikOtwarty(false), []);

  const graTrwa = Boolean(graId) && wiadomosci.length > 0;
  const limitOsiagniety = ruchy >= limit;
  const bezPodejsc = limitPodejsc !== null && podejscia >= limitPodejsc;

  // Te same trzy komendy są w teczce (komputer) i w pasku przy polu ruchu (telefon); CSS pokazuje jedno z nich.
  const komendy = (
    <>
      <button
        type="button"
        disabled={!graTrwa}
        aria-expanded={notatnikOtwarty}
        onClick={() => setNotatnikOtwarty((o) => !o)}
      >
        Notatnik{notatki.length > 0 ? ` (${notatki.length})` : ""}
      </button>
      <button type="button" disabled={!graTrwa || zajety} onClick={() => wyslijRuch("podpowiedź")}>
        Podpowiedź
      </button>
      <button
        type="button"
        disabled={!graTrwa || zajety}
        onClick={() => {
          setRuch("oskarżam ");
          poleRuchu.current?.focus();
        }}
      >
        Oskarżam…
      </button>
    </>
  );

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div>
          <div className={styles.caseNo}>
            Akta nr {sprawa.numer} · {sprawa.nazwa}
          </div>
          <h1 className={styles.title}>{sprawa.tytul}</h1>
        </div>
        <span className={styles.stamp}>{wynik ? "SPRAWA ZAMKNIĘTA" : "ŚLEDZTWO W TOKU"}</span>
      </header>

      <main className={styles.main}>
        {!graTrwa && wczytano && (
          <div className={styles.intro}>
            <p>
              Prowadzisz śledztwo. Mistrz gry opisze miejsce zbrodni, odegra podejrzanych i odsłoni wskazówki, kiedy
              na nie zapracujesz. Pisz, co robisz albo o co pytasz, na przykład: „Oglądam miejsce zbrodni” albo
              „Pytam świadka, co widział”.
            </p>
            <div className={styles.cmds}>
              <button className="primary" type="button" onClick={rozpocznij} disabled={zajety || bezPodejsc}>
                Rozpocznij śledztwo
              </button>
            </div>
            {bezPodejsc && <p className={styles.note}>{KOMUNIKATY.limit_podejsc}</p>}
          </div>
        )}

        <div className={styles.log} aria-live="polite">
          {wiadomosci.map((w, i) => (
            <div
              key={i}
              className={`${styles.msg} ${w.rola === "gracz" ? styles.you : styles.gm} ${w.czeka ? styles.thinking : ""}`}
            >
              <div className={styles.who}>{w.rola === "gracz" ? "Ty" : "Mistrz gry"}</div>
              <div className={styles.body}>{w.tekst}</div>
              {w.rola === "mistrz" && !w.czeka && graId && <ZglosOdpowiedz graId={graId} indeks={i} tekst={w.tekst} />}
            </div>
          ))}
          <div ref={koniecLogu} className={styles.koniecLogu} />
        </div>

        {graId && pokazAnkiete && !ankietaWyslana && (
          <Ankieta
            graId={graId}
            sprawa={{ id: sprawa.id, nazwa: sprawa.nazwa }}
            inneSprawy={inneSprawy}
            onWyslano={() => {
              setAnkietaWyslana(true);
              setPokazAnkiete(false);
            }}
          />
        )}
        {ankietaWyslana && <p className={styles.note}>Dziękujemy za raport! Autorka przeczyta każde słowo.</p>}

        {status && <p className={`${styles.note} ${styles.err}`}>{status}</p>}

        {graTrwa && (
          <div className={styles.dock}>
            <div className={`${styles.cmds} ${styles.komendyDock}`}>{komendy}</div>
            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                wyslijRuch(ruch);
              }}
            >
              <textarea
                ref={poleRuchu}
                rows={2}
                placeholder={limitOsiagniety ? "Limit ruchów w tej rozgrywce został wyczerpany." : "Co robisz?"}
                aria-label="Twój ruch"
                value={ruch}
                maxLength={1000}
                disabled={limitOsiagniety}
                onChange={(e) => setRuch(e.target.value)}
                onKeyDown={(e) => {
                  // Na ekranie dotykowym Enter to nowa linia, a ruch wysyła się przyciskiem „Wyślij”.
                  if (e.key === "Enter" && !e.shiftKey && !window.matchMedia("(pointer: coarse)").matches) {
                    e.preventDefault();
                    wyslijRuch(ruch);
                  }
                }}
              />
              <div className={styles.cmds}>
                <button className="primary" type="submit" disabled={zajety || limitOsiagniety}>
                  Wyślij
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      <aside className={styles.aside}>
        <h2>Teczka</h2>
        <div className={styles.komendyAside}>
          <div className={styles.label}>Szybkie komendy</div>
          <div className={styles.cmds}>{komendy}</div>
        </div>
        <div className={styles.label}>Osoby na miejscu</div>
        <ul>
          {sprawa.osoby.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
        <div className={styles.label}>Próby oskarżenia</div>
        <div className={styles.mono}>{sprawa.probyOskarzenia} na całą grę</div>
        <div className={styles.label}>Wersja testowa</div>
        <p className={styles.note}>
          {limitPodejsc !== null && (
            <>
              Wykorzystane podejścia: {podejscia} z {limitPodejsc}
              <br />
            </>
          )}
          Ruchy: {ruchy} z {limit}
          {pokazKoszt && (
            <>
              <br />
              Koszt tej partii: ${kosztUsd.toFixed(3)}
            </>
          )}
        </p>
        <div className={styles.cmds}>
          {graTrwa && !ankietaWyslana && !pokazAnkiete && ruchy >= 3 && (
            <button type="button" onClick={() => setPokazAnkiete(true)}>
              Oceń sprawę
            </button>
          )}
          <button type="button" onClick={odNowa} disabled={zajety || !graId || bezPodejsc}>
            Od nowa
          </button>
        </div>
      </aside>

      {notatnikOtwarty && graTrwa && (
        <Notatnik notatki={notatki} wiadomosci={wiadomosci} onZamknij={zamknijNotatnik} />
      )}
    </div>
  );
}
