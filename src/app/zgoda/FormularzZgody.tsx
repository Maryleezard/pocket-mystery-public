"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "../page.module.css";

export default function FormularzZgody({ cel }: { cel: string }) {
  const [stan, setStan] = useState<"pusty" | "zapis">("pusty");
  const [blad, setBlad] = useState("");

  async function zgoda() {
    setBlad("");
    setStan("zapis");
    try {
      const res = await fetch("/api/zgoda", { method: "POST" });
      const dane = (await res.json().catch(() => ({}))) as { blad?: string };
      if (!res.ok) throw new Error(dane.blad ?? "Coś poszło nie tak. Spróbuj ponownie.");
      window.location.assign(cel);
    } catch (err) {
      setBlad(err instanceof Error ? err.message : "Coś poszło nie tak. Spróbuj ponownie.");
      setStan("pusty");
    }
  }

  return (
    <div className={styles.form}>
      <button className="primary" type="button" onClick={zgoda} disabled={stan === "zapis"}>
        {stan === "zapis" ? "Zapisywanie…" : "Rozumiem i się zgadzam"}
      </button>
      <Link href="/">Nie teraz, wróć na stronę główną</Link>
      {blad && <p className={styles.err}>{blad}</p>}
    </div>
  );
}
