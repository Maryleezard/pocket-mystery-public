import type { Metadata } from "next";
import Link from "next/link";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "Zaproszenie · Pocket Mystery" };

// Strona ze stałego osobistego linku testera. Logowanie następuje dopiero po kliknięciu przycisku,
// bo komunikatory otwierają linki w tle, żeby pokazać podgląd.
export default async function Zaproszenie({ searchParams }: PageProps<"/zaproszenie">) {
  const { k, token } = await searchParams;
  const klucz = typeof k === "string" ? k : "";
  // Stare jednorazowe linki (z parametrem token) już nie działają.
  const staryLink = !klucz && typeof token === "string";

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.kicker}>Zaproszenie do testów</p>
        <h1 className={styles.title}>Pocket Mystery</h1>
        <p className={styles.tagline}>Kryminał, który mieści się w kieszeni.</p>
      </header>
      <section className={styles.card}>
        {klucz ? (
          <>
            <p>
              Dostajesz dostęp do testowej wersji Pocket Mystery: interaktywnych zagadek kryminalnych, w których
              sam prowadzisz śledztwo. Kliknij, żeby się zalogować. Ten link jest Twój na stałe: zapisz go i wracaj nim do gry z każdego urządzenia.
            </p>
            <form action="/auth/zaproszenie" method="post">
              <input type="hidden" name="k" value={klucz} />
              <button className="primary" type="submit">
                Zaloguj się i zacznij grać
              </button>
            </form>
          </>
        ) : (
          <p>
            {staryLink ? "Ten link już nie działa." : "Ten link jest niepełny."} Poproś osobę, od której go masz, o nowy albo <Link href="/">wróć na stronę główną</Link>.
          </p>
        )}
      </section>
    </main>
  );
}
