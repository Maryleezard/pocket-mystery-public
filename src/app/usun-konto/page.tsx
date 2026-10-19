import type { Metadata } from "next";
import Link from "next/link";
import { KONTAKT_EMAIL } from "@/lib/kontakt";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "Usuwanie konta · Pocket Mystery" };

// Publiczny adres dla sklepów (Google Play wymaga strony z opisem usuwania konta i danych).
export default function UsunKontoPubliczna() {
  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.kicker}>Pocket Mystery</p>
        <h1 className={styles.title}>Usuwanie konta i danych</h1>
      </header>
      <section className={styles.card}>
        <h2 className={styles.caseTitle}>W aplikacji</h2>
        <p>
          Zaloguj się, wejdź w <Link href="/konto">Konto</Link> i wybierz „Usuń konto na stałe”. Konto i dane znikają
          od razu.
        </p>
        <h2 className={styles.caseTitle}>Bez logowania</h2>
        <p>
          Napisz na <a href={`mailto:${KONTAKT_EMAIL}?subject=Usuni%C4%99cie%20konta`}>{KONTAKT_EMAIL}</a> z adresu
          e-mail konta. Usuniemy konto w ciągu 30 dni i potwierdzimy to na ten sam adres.
        </p>
        <h2 className={styles.caseTitle}>Co jest usuwane</h2>
        <p>
          Adres e-mail, identyfikator konta, wszystkie rozgrywki (rozmowy z mistrzem gry), notatki, wyniki i odpowiedzi
          w ankietach. Dane techniczne o kosztach rozgrywek kasują się razem z rozgrywkami. Kopie zapasowe wygasają w
          ciągu 30 dni.
        </p>
      </section>
      <p className={styles.note}>
        <Link href="/">Strona główna</Link> · <Link href="/prywatnosc">Polityka prywatności</Link>
      </p>
    </main>
  );
}
