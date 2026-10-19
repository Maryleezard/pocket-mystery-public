import type { Metadata } from "next";
import Link from "next/link";
import { ADMINISTRATOR, DATA_POLITYKI, KONTAKT_EMAIL } from "@/lib/kontakt";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "Polityka prywatności · Pocket Mystery" };

// Treść wymaga przeglądu prawnego i uzupełnienia pól w src/lib/kontakt.ts oraz oznaczonych [w nawiasach].
export default function Prywatnosc() {
  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.kicker}>Pocket Mystery</p>
        <h1 className={styles.title}>Polityka prywatności</h1>
        <p className={styles.tagline}>Ostatnia aktualizacja: {DATA_POLITYKI}</p>
      </header>
      <section className={styles.card}>
        <h2 className={styles.caseTitle}>1. Administrator danych</h2>
        <p>
          {ADMINISTRATOR}. Kontakt w sprawach prywatności: <a href={`mailto:${KONTAKT_EMAIL}`}>{KONTAKT_EMAIL}</a>.
        </p>

        <h2 className={styles.caseTitle}>2. Jakie dane zbieramy i po co</h2>
        <ul>
          <li>Adres e-mail i identyfikator konta: założenie konta i logowanie linkiem (podstawa: wykonanie umowy).</li>
          <li>
            Treść Twoich ruchów w grze, odpowiedzi mistrza gry, notatnik, stan i wynik rozgrywki: prowadzenie gry i jej
            wznowienie (wykonanie umowy).
          </li>
          <li>Odpowiedzi w ankiecie po grze: ulepszanie spraw (uzasadniony interes).</li>
          <li>Liczba ruchów i koszty techniczne rozgrywki: limity i rozliczenia (uzasadniony interes).</li>
        </ul>
        <p>Nie prowadzimy reklam, nie śledzimy Cię między aplikacjami i nie sprzedajemy danych.</p>

        <h2 className={styles.caseTitle}>3. Sztuczna inteligencja</h2>
        <p>
          Mistrza gry prowadzi model sztucznej inteligencji dostarczany przez Anthropic, PBC (USA). Aby wygenerować
          odpowiedź, wysyłamy do niego tekst Twoich ruchów i dotychczasowy przebieg rozgrywki. Nie wysyłamy mu Twojego
          adresu e-mail. Nie wpisuj w grze danych wrażliwych ani niepotrzebnych danych osobowych. Odpowiedzi AI mogą
          być błędne lub nieprzewidywalne. Dostawca przetwarza te dane wyłącznie w celu wygenerowania odpowiedzi,
          zgodnie ze swoimi warunkami przetwarzania danych dla klientów usługi API.
        </p>

        <h2 className={styles.caseTitle}>4. Podmioty przetwarzające</h2>
        <p>
          Supabase (baza danych i logowanie; serwery w regionie eu-west-1, Irlandia, Europejski Obszar Gospodarczy),
          Vercel (hosting aplikacji) oraz Anthropic (model AI, USA). Dane przekazywane poza EOG (Vercel, Anthropic)
          są chronione standardowymi klauzulami umownymi lub innym mechanizmem przewidzianym w RODO.
        </p>

        <h2 className={styles.caseTitle}>5. Okres przechowywania</h2>
        <p>
          Do usunięcia konta. Po usunięciu kasujemy adres e-mail, rozgrywki, notatki i ankiety. Kopie zapasowe wygasają
          w ciągu 30 dni.
        </p>

        <h2 className={styles.caseTitle}>6. Twoje prawa</h2>
        <p>
          Masz prawo dostępu do danych, sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia i sprzeciwu.
          Konto usuniesz sam w aplikacji (<Link href="/konto">Konto</Link>) albo według opisu na stronie{" "}
          <Link href="/usun-konto">Usuwanie konta</Link>. Możesz też złożyć skargę do Prezesa Urzędu Ochrony Danych
          Osobowych (uodo.gov.pl).
        </p>

        <h2 className={styles.caseTitle}>7. Wiek</h2>
        <p>
          Gra jest przeznaczona dla osób od 16 lat (historie zawierają fikcyjne zbrodnie). Nie zbieramy świadomie
          danych osób młodszych.
        </p>

        <h2 className={styles.caseTitle}>8. Pliki cookie</h2>
        <p>
          Używamy wyłącznie plików niezbędnych do utrzymania sesji logowania. Nie używamy cookies reklamowych ani
          analitycznych firm trzecich.
        </p>

        <h2 className={styles.caseTitle}>9. Zmiany</h2>
        <p>O istotnych zmianach poinformujemy w aplikacji.</p>
      </section>
      <p className={styles.note}>
        <Link href="/">Strona główna</Link> · <Link href="/pomoc">Pomoc</Link> ·{" "}
        <Link href="/usun-konto">Usuwanie konta</Link>
      </p>
    </main>
  );
}
