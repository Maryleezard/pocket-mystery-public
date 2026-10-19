"use client";

import { useState } from "react";
import styles from "./ZglosOdpowiedz.module.css";

const POWODY = [
  { id: "nieodpowiednia", opis: "Nieodpowiednia lub obraźliwa treść" },
  { id: "bledna", opis: "Błąd albo sprzeczność z faktami sprawy" },
  { id: "inne", opis: "Inny powód" },
] as const;

// Przycisk „Zgłoś” pod odpowiedzią mistrza gry (wymóg sklepów dla treści generowanych przez AI).
export default function ZglosOdpowiedz({ graId, indeks, tekst }: { graId: string; indeks: number; tekst: string }) {
  const [otwarte, setOtwarte] = useState(false);
  const [powod, setPowod] = useState<string>("");
  const [komentarz, setKomentarz] = useState("");
  const [stan, setStan] = useState<"pusty" | "wysylanie" | "wyslane">("pusty");
  const [blad, setBlad] = useState("");

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    if (!powod) {
      setBlad("Wybierz powód zgłoszenia.");
      return;
    }
    setBlad("");
    setStan("wysylanie");
    try {
      const res = await fetch(`/api/gry/${graId}/zgloszenie`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ powod, komentarz, tekst, indeks }),
      });
      const dane = (await res.json().catch(() => ({}))) as { blad?: string };
      if (!res.ok) throw new Error(dane.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
      setStan("wyslane");
    } catch (err) {
      setBlad(err instanceof Error ? err.message : "Coś poszło nie tak. Spróbuj ponownie.");
      setStan("pusty");
    }
  }

  if (stan === "wyslane") return <p className={styles.note}>Dziękujemy, zgłoszenie dotarło do autorki.</p>;

  if (!otwarte) {
    return (
      <button type="button" className={styles.link} onClick={() => setOtwarte(true)}>
        Zgłoś odpowiedź
      </button>
    );
  }

  return (
    <form className={styles.form} onSubmit={wyslij}>
      <fieldset className={styles.group}>
        <legend>Co jest nie tak?</legend>
        {POWODY.map((p) => (
          <label key={p.id} className={styles.choice}>
            <input type="radio" name={`powod-${indeks}`} value={p.id} checked={powod === p.id} onChange={() => setPowod(p.id)} />
            {p.opis}
          </label>
        ))}
      </fieldset>
      <textarea
        value={komentarz}
        onChange={(e) => setKomentarz(e.target.value)}
        maxLength={1000}
        rows={2}
        placeholder="Dodatkowy komentarz (opcjonalnie)"
        aria-label="Dodatkowy komentarz"
      />
      <div className={styles.row}>
        <button type="submit" disabled={stan === "wysylanie"}>
          {stan === "wysylanie" ? "Wysyłanie…" : "Wyślij zgłoszenie"}
        </button>
        <button type="button" className={styles.link} onClick={() => setOtwarte(false)}>
          Anuluj
        </button>
      </div>
      {blad && <p className={styles.err}>{blad}</p>}
    </form>
  );
}
