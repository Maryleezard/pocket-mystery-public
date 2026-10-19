import type { Metadata } from "next";
import Link from "next/link";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "Brak połączenia · Pocket Mystery" };

// Pokazywana przez service worker (public/sw.js), gdy telefon nie ma internetu.
export default function Offline() {
  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.kicker}>Pocket Mystery</p>
        <h1 className={styles.title}>Brak połączenia</h1>
      </header>
      <section className={styles.card}>
        <p>
          Mistrz gry odpowiada przez internet, więc bez połączenia nie można prowadzić śledztwa. Twoje rozgrywki są
          bezpieczne i poczekają na Ciebie.
        </p>
        <Link className={styles.cta} href="/">
          Spróbuj ponownie
        </Link>
      </section>
    </main>
  );
}
