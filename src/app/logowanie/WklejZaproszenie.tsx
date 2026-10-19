"use client";

import { useRef, useState } from "react";
import styles from "../page.module.css";

// Logowanie wklejonym linkiem z zaproszenia, bez wychodzenia z aplikacji. Na telefonie link z wiadomości albo
// maila otwiera się w innej przeglądarce niż zainstalowana gra, więc tester może go skopiować i wkleić tutaj.
// Klucz (32 znaki szesnastkowe) wyciągamy z całego linku albo przyjmujemy sam; resztę robi /auth/zaproszenie.
const KLUCZ = /[a-f0-9]{32}/i;

export default function WklejZaproszenie() {
  const [tekst, setTekst] = useState("");
  const [blad, setBlad] = useState("");
  const formularz = useRef<HTMLFormElement>(null);
  const pole = useRef<HTMLInputElement>(null);

  function wyslij(e: React.FormEvent) {
    e.preventDefault();
    const klucz = tekst.match(KLUCZ)?.[0]?.toLowerCase();
    if (!klucz || !pole.current) {
      setBlad("To nie wygląda na link ani kod z zaproszenia. Skopiuj go w całości z wiadomości.");
      return;
    }
    setBlad("");
    pole.current.value = klucz;
    formularz.current?.submit();
  }

  return (
    <form ref={formularz} className={styles.form} action="/auth/zaproszenie" method="post" onSubmit={wyslij}>
      <input ref={pole} type="hidden" name="k" />
      <label className={styles.kicker} htmlFor="zaproszenie">
        Link albo kod z zaproszenia
      </label>
      <input
        id="zaproszenie"
        type="text"
        inputMode="url"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        placeholder="Wklej tutaj"
        value={tekst}
        onChange={(e) => setTekst(e.target.value)}
        className={styles.input}
      />
      <button type="submit">Zaloguj się zaproszeniem</button>
      {blad && <p className={styles.err}>{blad}</p>}
    </form>
  );
}
