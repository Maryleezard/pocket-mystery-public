"use client";

import { useState } from "react";
import styles from "./Ankieta.module.css";

type Sprawa = { id: string; nazwa: string };

const TRUDNOSCI = [
  ["za-latwa", "Za łatwa"],
  ["w-sam-raz", "W sam raz"],
  ["za-trudna", "Za trudna"],
] as const;

// Krótka ankieta po rozgrywce. Porównanie pojawia się tylko wtedy, gdy tester grał też w inną sprawę.
export default function Ankieta({
  graId,
  sprawa,
  inneSprawy,
  onWyslano,
}: {
  graId: string;
  sprawa: Sprawa;
  inneSprawy: Sprawa[];
  onWyslano: () => void;
}) {
  const [ocena, setOcena] = useState(0);
  const [uczciwosc, setUczciwosc] = useState(0);
  const [trudnosc, setTrudnosc] = useState("");
  const [komentarz, setKomentarz] = useState("");
  const [lepszaSprawa, setLepszaSprawa] = useState("");
  const [dlaczego, setDlaczego] = useState("");
  const [blad, setBlad] = useState("");
  const [wysylanie, setWysylanie] = useState(false);

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    if (!ocena || !uczciwosc || !trudnosc) {
      setBlad("Zaznacz ocenę sprawy, jej trudność i ocenę mistrza gry.");
      return;
    }
    setBlad("");
    setWysylanie(true);
    try {
      const res = await fetch(`/api/gry/${graId}/ankieta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ocena, uczciwosc, trudnosc, komentarz, lepszaSprawa, dlaczego }),
      });
      const dane = (await res.json().catch(() => ({}))) as { blad?: string };
      if (!res.ok) throw new Error(dane.blad ?? "Nie udało się wysłać ankiety.");
      onWyslano();
    } catch (err) {
      setBlad(err instanceof Error ? err.message : "Nie udało się wysłać ankiety.");
    } finally {
      setWysylanie(false);
    }
  }

  return (
    <form className={styles.wrap} onSubmit={wyslij}>
      <h2 className={styles.title}>Raport z akt: jak było?</h2>
      <p className={styles.note}>Trzy kliknięcia i jedno zdanie, jeśli masz ochotę. Twoje uwagi trafią prosto do autorki.</p>

      <Gwiazdki legenda={`Jak oceniasz sprawę ${sprawa.nazwa}?`} wartosc={ocena} onZmiana={setOcena} />

      <fieldset className={styles.group}>
        <legend>Trudność</legend>
        <div className={styles.choices}>
          {TRUDNOSCI.map(([w, etykieta]) => (
            <label key={w} className={styles.choice}>
              <input type="radio" name="trudnosc" value={w} checked={trudnosc === w} onChange={() => setTrudnosc(w)} />
              {etykieta}
            </label>
          ))}
        </div>
      </fieldset>

      <Gwiazdki
        legenda="Czy mistrz gry grał fair? (1 – podsuwał albo ukrywał, 5 – w sam raz)"
        wartosc={uczciwosc}
        onZmiana={setUczciwosc}
      />

      <label className={styles.group}>
        <span className={styles.legend}>Co zapamiętasz, co zgrzytało? (nieobowiązkowe)</span>
        <textarea rows={3} maxLength={2000} value={komentarz} onChange={(e) => setKomentarz(e.target.value)} />
      </label>

      {inneSprawy.length > 0 && (
        <fieldset className={styles.group}>
          <legend>Która sprawa podobała Ci się bardziej?</legend>
          <div className={styles.choices}>
            {[sprawa, ...inneSprawy].map((s) => (
              <label key={s.id} className={styles.choice}>
                <input
                  type="radio"
                  name="lepsza"
                  value={s.id}
                  checked={lepszaSprawa === s.id}
                  onChange={() => setLepszaSprawa(s.id)}
                />
                {s.nazwa}
              </label>
            ))}
          </div>
          {lepszaSprawa && (
            <label className={styles.group}>
              <span className={styles.legend}>Dlaczego? (nieobowiązkowe)</span>
              <textarea rows={2} maxLength={1000} value={dlaczego} onChange={(e) => setDlaczego(e.target.value)} />
            </label>
          )}
        </fieldset>
      )}

      {blad && <p className={styles.err}>{blad}</p>}
      <div>
        <button className="primary" type="submit" disabled={wysylanie}>
          {wysylanie ? "Wysyłanie…" : "Wyślij raport"}
        </button>
      </div>
    </form>
  );
}

function Gwiazdki({ legenda, wartosc, onZmiana }: { legenda: string; wartosc: number; onZmiana: (n: number) => void }) {
  return (
    <fieldset className={styles.group}>
      <legend>{legenda}</legend>
      <div className={styles.choices}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`${styles.star} ${n <= wartosc ? styles.on : ""}`}
            aria-pressed={n === wartosc}
            aria-label={`${n} z 5`}
            onClick={() => onZmiana(n)}
          >
            {n}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
