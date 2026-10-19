import type { Metadata } from "next";
import Link from "next/link";
import styles from "../../page.module.css";

export const metadata: Metadata = { title: "Logowanie · Pocket Mystery" };

// Strona, na którą prowadzi link z e-maila. Logowanie następuje dopiero po kliknięciu przycisku,
// bo skanery wiadomości i komunikatory otwierają linki w tle i zużywałyby jednorazowy kod.
export default async function Wejdz({ searchParams }: PageProps<"/auth/wejdz">) {
  const { token_hash, type } = await searchParams;
  const kod = typeof token_hash === "string" ? token_hash : "";
  const rodzaj = typeof type === "string" ? type : "";

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.kicker}>Pocket Mystery</p>
        <h1 className={styles.title}>Logowanie</h1>
      </header>
      <section className={styles.card}>
        {kod ? (
          <>
            <p>Kliknij, żeby zalogować się do Pocket Mystery. Ten link działa tylko raz.</p>
            <form action="/auth/wejdz/potwierdz" method="post">
              <input type="hidden" name="token_hash" value={kod} />
              <input type="hidden" name="type" value={rodzaj} />
              <button className="primary" type="submit">
                Zaloguj się
              </button>
            </form>
          </>
        ) : (
          <p>
            Ten link jest niepełny. <Link href="/logowanie">Poproś o nowy</Link>.
          </p>
        )}
      </section>
    </main>
  );
}
