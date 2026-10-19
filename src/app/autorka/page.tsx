import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { jestAutorka, sprawdzDostep } from "@/lib/dostep";
import { baza } from "@/lib/supabase/admin";
import FormularzZaproszenia from "./FormularzZaproszenia";
import LinkTestera from "./LinkTestera";
import WynikiTestow from "./WynikiTestow";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "Panel autorki · Pocket Mystery" };

type Tester = { email: string; notatka: string | null; dodano: string; klucz: string };

export default async function PanelAutorki() {
  if (!jestAutorka(await sprawdzDostep())) redirect("/");

  const { data } = await baza()
    .from("testerzy")
    .select("email, notatka, dodano, klucz")
    .order("dodano", { ascending: false });
  const testerzy = (data ?? []) as Tester[];

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.kicker}>Panel autorki</p>
        <h1 className={styles.title}>Testerzy i wyniki</h1>
      </header>

      <section className={styles.card}>
        <h2 className={styles.caseTitle}>Zaproś testerów</h2>
        <p>
          Wklej adresy e-mail, jeden w linii; po adresie możesz dopisać imię. Dla każdej osoby dostaniesz osobisty
          link logowania: wyślij go przez komunikator, SMS albo zwykłego maila. Link jest stały: tester może nim wracać do gry wiele razy i z różnych urządzeń. Linki wszystkich
          testerów znajdziesz też na liście poniżej. Nie otwieraj ich sama, bo zalogujesz się jako tester.
        </p>
        <FormularzZaproszenia />
      </section>

      <WynikiTestow />

      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2 className={styles.caseTitle}>Lista ({testerzy.length})</h2>
        <ul>
          {testerzy.map((t) => (
            <li key={t.email}>
              {t.email}
              {t.notatka ? ` – ${t.notatka}` : ""}
              <LinkTestera email={t.email} klucz={t.klucz} />
            </li>
          ))}
        </ul>
        <p className={styles.note}>
          Usunąć testera możesz w Supabase: Table Editor → testerzy. Po usunięciu traci dostęp do gry przy następnym
          wejściu.
        </p>
      </section>

      <p className={styles.note}>
        <Link href="/">Wróć na stronę główną</Link>
      </p>
    </main>
  );
}
