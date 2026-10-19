import type { Metadata } from "next";
import Link from "next/link";
import { KONTAKT_EMAIL } from "@/lib/kontakt";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "Pomoc · Pocket Mystery" };

export default function Pomoc() {
  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.kicker}>Pocket Mystery</p>
        <h1 className={styles.title}>Pomoc</h1>
      </header>
      <section className={styles.card}>
        <h2 className={styles.caseTitle}>Jak się gra</h2>
        <p>
          Wybierz sprawę, otwórz akta i pisz własnymi słowami, co robisz i o co pytasz. Mistrz gry odgrywa świadków i
          podejrzanych. Notatnik zbiera ustalenia, „Podpowiedź” podsuwa trop, a „Oskarżam” kończy śledztwo. Masz
          ograniczoną liczbę prób oskarżenia.
        </p>
        <h2 className={styles.caseTitle}>Nie mogę się zalogować</h2>
        <p>
          Podaj adres e-mail i otwórz link z wiadomości w tej samej przeglądarce lub aplikacji. Sprawdź spam. Link
          jest jednorazowy i wygasa.
        </p>
        <h2 className={styles.caseTitle}>Odpowiedź mistrza gry jest nieodpowiednia albo błędna</h2>
        <p>
          Mistrza gry prowadzi sztuczna inteligencja, więc może się mylić. Napisz do nas, a sprawdzimy zgłoszenie.
        </p>
        <h2 className={styles.caseTitle}>Kontakt</h2>
        <p>
          <a href={`mailto:${KONTAKT_EMAIL}`}>{KONTAKT_EMAIL}</a>
        </p>
      </section>
      <p className={styles.note}>
        <Link href="/">Strona główna</Link> · <Link href="/prywatnosc">Polityka prywatności</Link> ·{" "}
        <Link href="/usun-konto">Usuwanie konta</Link>
      </p>
    </main>
  );
}
