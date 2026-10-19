"use client";

import { useState } from "react";
import styles from "../page.module.css";

export default function UsunKonto() {
  const [potwierdzenie, setPotwierdzenie] = useState("");
  const [stan, setStan] = useState<"pusty" | "usuwanie" | "usuniete">("pusty");
  const [blad, setBlad] = useState("");

  async function usun(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    setStan("usuwanie");
    try {
      const res = await fetch("/api/konto/usun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ potwierdzenie }),
      });
      const dane = (await res.json().catch(() => ({}))) as { blad?: string };
      if (!res.ok) throw new Error(dane.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
      setStan("usuniete");
    } catch (err) {
      setBlad(err instanceof Error ? err.message : "Coś poszło nie tak. Spróbuj ponownie.");
      setStan("pusty");
    }
  }

  if (stan === "usuniete") {
    return <p>Konto i wszystkie Twoje dane zostały usunięte. Dziękujemy za grę.</p>;
  }

  return (
    <form className={styles.form} onSubmit={usun}>
      <label className={styles.kicker} htmlFor="potwierdzenie">
        Wpisz USUŃ, żeby potwierdzić
      </label>
      <input
        id="potwierdzenie"
        className={styles.input}
        value={potwierdzenie}
        onChange={(e) => setPotwierdzenie(e.target.value)}
        autoComplete="off"
      />
      <button className="primary" type="submit" disabled={potwierdzenie.trim().toLocaleUpperCase("pl") !== "USUŃ" || stan === "usuwanie"}>
        {stan === "usuwanie" ? "Usuwanie…" : "Usuń konto na stałe"}
      </button>
      {blad && <p className={styles.err}>{blad}</p>}
    </form>
  );
}
