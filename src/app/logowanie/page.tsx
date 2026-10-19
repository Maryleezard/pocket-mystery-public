import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { rejestracjaOtwarta, sprawdzDostep } from "@/lib/dostep";
import FormularzLogowania from "./FormularzLogowania";
import WklejZaproszenie from "./WklejZaproszenie";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "Logowanie · Pocket Mystery" };

export default async function Logowanie({ searchParams }: PageProps<"/logowanie">) {
  if ((await sprawdzDostep()).stan === "tester") redirect("/");
  const { blad } = await searchParams;

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.kicker}>Wersja testowa</p>
        <h1 className={styles.title}>Logowanie</h1>
      </header>
      <section className={styles.card}>
        {blad === "link" && (
          <p className={styles.note}>Ten link logowania wygasł albo był już użyty. Poproś o nowy.</p>
        )}
        {blad === "zaproszenie" && (
          <p className={styles.note}>
            Link z zaproszenia wygasł albo był już użyty. Poproś osobę, od której go masz, o nowy.
          </p>
        )}
        {rejestracjaOtwarta() ? (
          <p>Podaj adres e-mail. Wyślemy na niego link do logowania, bez hasła. Jeśli nie masz jeszcze konta, założymy je przy pierwszym logowaniu.</p>
        ) : (
          <p>Podaj adres, na który dostałeś albo dostałaś zaproszenie. Wyślemy na niego link do logowania, bez hasła.</p>
        )}
        <FormularzLogowania />
        <p className={styles.note}>
          Logując się, akceptujesz <Link href="/prywatnosc">Politykę prywatności</Link>. Treść Twoich ruchów w grze jest
          przekazywana do dostawcy sztucznej inteligencji (Anthropic), który generuje odpowiedzi mistrza gry.
        </p>
      </section>
      <section className={styles.card}>
        <p>
          Masz osobisty link z zaproszenia? Otwórz grę z ekranu głównego, skopiuj link z wiadomości i wklej go tutaj.
          Zalogujesz się w aplikacji, bez wracania do przeglądarki.
        </p>
        <WklejZaproszenie />
      </section>
      <p className={styles.note}>
        <Link href="/">Wróć na stronę główną</Link>
      </p>
    </main>
  );
}
