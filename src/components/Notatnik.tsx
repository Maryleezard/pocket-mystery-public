"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./Notatnik.module.css";

type Wiadomosc = { rola: "gracz" | "mistrz"; tekst: string; czeka?: boolean };

// Do wyszukiwania bez polskich znaków: małe litery, bez ogonków, każdy znak zamieniony na dokładnie jeden znak,
// więc pozycje w uproszczonym tekście zgadzają się z pozycjami w oryginale.
function uprosc(t: string): string {
  let wynik = "";
  for (const znak of t) {
    const m = znak.toLocaleLowerCase("pl").replace("ł", "l").normalize("NFD").replace(/\p{M}/gu, "");
    wynik += m.length === znak.length ? m : znak;
  }
  return wynik;
}

function Podswietl({ tekst, szukane }: { tekst: string; szukane: string }) {
  if (!szukane) return <>{tekst}</>;
  const proste = uprosc(tekst);
  const czesci: ReactNode[] = [];
  let od = 0;
  for (let i = proste.indexOf(szukane); i !== -1; i = proste.indexOf(szukane, od)) {
    if (i > od) czesci.push(tekst.slice(od, i));
    czesci.push(<mark key={i}>{tekst.slice(i, i + szukane.length)}</mark>);
    od = i + szukane.length;
  }
  czesci.push(tekst.slice(od));
  return <>{czesci}</>;
}

// Fragment długiej wiadomości wokół pierwszego trafienia.
function fragment(tekst: string, szukane: string): string {
  const MAKS = 240;
  if (tekst.length <= MAKS) return tekst;
  const i = uprosc(tekst).indexOf(szukane);
  const od = Math.max(0, Math.min(i - 80, tekst.length - MAKS));
  return `${od > 0 ? "…" : ""}${tekst.slice(od, od + MAKS)}${od + MAKS < tekst.length ? "…" : ""}`;
}

// Osobne okno z notatkami śledztwa. Wpisy dopisuje mistrz gry w trakcie zwykłych odpowiedzi,
// więc otwarcie okna i wyszukiwanie w rozmowie nie kosztują żadnego wywołania modelu.
export default function Notatnik({
  notatki,
  wiadomosci,
  onZamknij,
}: {
  notatki: string[];
  wiadomosci: Wiadomosc[];
  onZamknij: () => void;
}) {
  const [fraza, setFraza] = useState("");
  const panel = useRef<HTMLElement>(null);
  const szukane = uprosc(fraza.trim());

  // Fokus ustawiamy tylko przy otwarciu, żeby nie wyrywać go z pola szukania ani z pola ruchu.
  useEffect(() => {
    panel.current?.focus();
  }, []);

  useEffect(() => {
    const naKlawisz = (e: KeyboardEvent) => {
      if (e.key === "Escape") onZamknij();
    };
    window.addEventListener("keydown", naKlawisz);
    return () => window.removeEventListener("keydown", naKlawisz);
  }, [onZamknij]);

  const pasujaceWpisy = useMemo(
    () => notatki.map((tekst, i) => ({ tekst, nr: i + 1 })).filter((w) => !szukane || uprosc(w.tekst).includes(szukane)),
    [notatki, szukane],
  );
  const pasujaceWypowiedzi = useMemo(
    () => (szukane ? wiadomosci.filter((w) => !w.czeka && uprosc(w.tekst).includes(szukane)) : []),
    [wiadomosci, szukane],
  );

  return (
    <section ref={panel} className={styles.panel} role="dialog" aria-label="Notatnik" tabIndex={-1}>
      <header className={styles.glowa}>
        <h2>Notatnik</h2>
        <button type="button" onClick={onZamknij} aria-label="Zamknij notatnik">
          Zamknij
        </button>
      </header>

      <input
        className={styles.szukaj}
        type="search"
        placeholder="Szukaj w notatkach i rozmowie…"
        aria-label="Szukaj w notatkach i rozmowie"
        value={fraza}
        onChange={(e) => setFraza(e.target.value)}
      />

      <div className={styles.tresc}>
        {notatki.length === 0 && (
          <p className={styles.pusto}>
            Tu pojawią się ustalenia ze śledztwa, w kolejności zdobycia. Mistrz gry dopisuje je sam, gdy dowiesz się czegoś
            nowego.
          </p>
        )}

        {notatki.length > 0 && (
          <>
            <div className={styles.etykieta}>Ustalenia ({pasujaceWpisy.length}{szukane ? ` z ${notatki.length}` : ""})</div>
            {pasujaceWpisy.length === 0 ? (
              <p className={styles.pusto}>Brak pasujących wpisów.</p>
            ) : (
              <ol className={styles.lista}>
                {pasujaceWpisy.map((w) => (
                  <li key={w.nr} value={w.nr}>
                    <Podswietl tekst={w.tekst} szukane={szukane} />
                  </li>
                ))}
              </ol>
            )}
          </>
        )}

        {szukane && (
          <>
            <div className={styles.etykieta}>W rozmowie ({pasujaceWypowiedzi.length})</div>
            {pasujaceWypowiedzi.length === 0 ? (
              <p className={styles.pusto}>Nikt jeszcze tego nie wspominał.</p>
            ) : (
              <ul className={styles.wypowiedzi}>
                {pasujaceWypowiedzi.map((w, i) => (
                  <li key={i}>
                    <span className={styles.kto}>{w.rola === "gracz" ? "Ty" : "Mistrz gry"}</span>
                    <Podswietl tekst={fragment(w.tekst, szukane)} szukane={szukane} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
