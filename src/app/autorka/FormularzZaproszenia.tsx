"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../page.module.css";

type Wynik = { email: string; link?: string; blad?: string };

export default function FormularzZaproszenia() {
  const router = useRouter();
  const [lista, setLista] = useState("");
  const [wyniki, setWyniki] = useState<Wynik[]>([]);
  const [blad, setBlad] = useState("");
  const [wysylanie, setWysylanie] = useState(false);
  const [skopiowano, setSkopiowano] = useState("");

  async function zapros(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    setWyniki([]);
    setSkopiowano("");
    setWysylanie(true);
    try {
      const res = await fetch("/api/autorka/zaproszenie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lista }),
      });
      const dane = (await res.json().catch(() => ({}))) as { wyniki?: Wynik[]; blad?: string };
      if (!res.ok || !dane.wyniki) throw new Error(dane.blad ?? "Coś poszło nie tak.");
      setWyniki(dane.wyniki);
      router.refresh();
    } catch (err) {
      setBlad(err instanceof Error ? err.message : "Coś poszło nie tak.");
    } finally {
      setWysylanie(false);
    }
  }

  async function kopiuj(tekst: string, klucz: string) {
    try {
      await navigator.clipboard.writeText(tekst);
      setSkopiowano(klucz);
    } catch {
      setBlad("Nie udało się skopiować. Zaznacz link i skopiuj go ręcznie.");
    }
  }

  const udane = wyniki.filter((w) => w.link);
  const wszystkie = udane.map((w) => `${w.email}\n${w.link}`).join("\n\n");

  return (
    <form className={styles.form} onSubmit={zapros}>
      <label className={styles.kicker} htmlFor="lista-testerow">
        Testerzy: jeden w linii, adres i opcjonalnie imię
      </label>
      <textarea
        id="lista-testerow"
        required
        rows={6}
        placeholder={"ania@example.com Ania\nbartek@example.com"}
        value={lista}
        onChange={(e) => setLista(e.target.value)}
        className={styles.input}
      />
      <button className="primary" type="submit" disabled={wysylanie}>
        {wysylanie ? "Generowanie…" : "Dodaj i wygeneruj linki"}
      </button>
      {blad && <p className={styles.err}>{blad}</p>}

      {wyniki.length > 0 && (
        <div className={styles.wyniki}>
          {udane.length > 1 && (
            <button type="button" onClick={() => kopiuj(wszystkie, "*")}>
              {skopiowano === "*" ? "Skopiowano wszystkie" : `Kopiuj wszystkie (${udane.length})`}
            </button>
          )}
          {wyniki.map((w) => (
            <div key={w.email} className={styles.wynik}>
              <strong>{w.email}</strong>
              {w.link ? (
                <>
                  <input readOnly value={w.link} className={styles.input} onFocus={(e) => e.target.select()} />
                  <button type="button" onClick={() => kopiuj(w.link!, w.email)}>
                    {skopiowano === w.email ? "Skopiowano" : "Kopiuj"}
                  </button>
                </>
              ) : (
                <span className={styles.err}>{w.blad}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
