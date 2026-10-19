import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { jestAutorka, sprawdzDostep } from "@/lib/dostep";
import UsunKonto from "./UsunKonto";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "Konto · Pocket Mystery" };

export default async function Konto() {
  const dostep = await sprawdzDostep();
  if (dostep.stan !== "tester") redirect("/logowanie");

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.kicker}>Ustawienia</p>
        <h1 className={styles.title}>Konto</h1>
        <p className={styles.tagline}>{dostep.gracz.email}</p>
      </header>
      <section className={styles.card}>
        <h2 className={styles.caseTitle}>Usuń konto</h2>
        {jestAutorka(dostep) ? (
          <p>Konta autorki nie można usunąć z aplikacji.</p>
        ) : (
          <>
            <p>
              Usunięcie konta kasuje na stałe Twój adres e-mail, wszystkie rozgrywki, notatki i odpowiedzi w ankietach.
              Tej operacji nie można cofnąć.
            </p>
            <UsunKonto />
          </>
        )}
      </section>
      <p className={styles.note}>
        <Link href="/">Wróć do gry</Link> · <Link href="/prywatnosc">Polityka prywatności</Link>
      </p>
    </main>
  );
}
