"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Stały link testera do skopiowania i przycisk wymiany, gdyby link trafił w niepowołane ręce.
export default function LinkTestera({ email, klucz }: { email: string; klucz: string }) {
  const router = useRouter();
  const [stan, setStan] = useState("");

  async function kopiuj() {
    const link = `${window.location.origin}/zaproszenie?k=${klucz}`;
    try {
      await navigator.clipboard.writeText(link);
      setStan("Skopiowano");
    } catch {
      window.prompt("Skopiuj link:", link);
    }
  }

  async function wymien() {
    if (!window.confirm(`Wygenerować nowy link dla ${email}? Stary przestanie działać.`)) return;
    const res = await fetch("/api/autorka/klucz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setStan(res.ok ? "Nowy link gotowy" : "Nie udało się");
    router.refresh();
  }

  return (
    <span style={{ display: "inline-flex", gap: 6, marginLeft: 8, alignItems: "center" }}>
      <button type="button" onClick={kopiuj}>
        Kopiuj link
      </button>
      <button type="button" onClick={wymien}>
        Nowy link
      </button>
      {stan && <small>{stan}</small>}
    </span>
  );
}
