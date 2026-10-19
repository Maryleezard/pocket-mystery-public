"use client";

import { useState } from "react";
import styles from "../page.module.css";

export default function FormularzLogowania() {
  const [email, setEmail] = useState("");
  const [stan, setStan] = useState<"pusty" | "wysylanie" | "wyslany">("pusty");
  const [blad, setBlad] = useState("");

  async function wyslij(e: React.FormEvent) {
    e.preventDefault();
    setBlad("");
    setStan("wysylanie");
    try {
      const res = await fetch("/api/logowanie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const dane = (await res.json().catch(() => ({}))) as { blad?: string };
      if (!res.ok) throw new Error(dane.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
      setStan("wyslany");
    } catch (err) {
      setBlad(err instanceof Error ? err.message : "Coś poszło nie tak. Spróbuj ponownie.");
      setStan("pusty");
    }
  }

  if (stan === "wyslany") {
    return (
      <p>
        Jeśli adres <strong>{email}</strong> może się zalogować, za chwilę przyjdzie na niego link do logowania.
        Otwórz go w tej samej przeglądarce. Nie widzisz wiadomości? Zajrzyj do spamu.
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={wyslij}>
      <label className={styles.kicker} htmlFor="email">
        Adres e-mail
      </label>
      <input
        id="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={styles.input}
      />
      <button className="primary" type="submit" disabled={stan === "wysylanie"}>
        {stan === "wysylanie" ? "Wysyłanie…" : "Wyślij link"}
      </button>
      {blad && <p className={styles.err}>{blad}</p>}
    </form>
  );
}
