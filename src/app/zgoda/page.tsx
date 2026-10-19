import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { sprawdzDostep } from "@/lib/dostep";
import { maZgodeAI } from "@/lib/zgody";
import FormularzZgody from "./FormularzZgody";
import styles from "../page.module.css";

export const metadata: Metadata = { title: "Zgoda · Pocket Mystery" };

// Dokąd wracamy po zgodzie: tylko adresy wewnątrz serwisu.
function bezpiecznyCel(wroc: unknown): string {
  return typeof wroc === "string" && /^\/[a-z0-9/_-]*$/i.test(wroc) && !wroc.startsWith("//") ? wroc : "/";
}

export default async function Zgoda({ searchParams }: PageProps<"/zgoda">) {
  const dostep = await sprawdzDostep();
  if (dostep.stan !== "tester") redirect("/logowanie");
  const { wroc } = await searchParams;
  const cel = bezpiecznyCel(wroc);
  if (await maZgodeAI(dostep.gracz.id)) redirect(cel);

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.kicker}>Zanim zaczniesz</p>
        <h1 className={styles.title}>Mistrz gry to sztuczna inteligencja</h1>
      </header>
      <section className={styles.card}>
        <p>
          Postaci, świadków i podejrzanych odgrywa model sztucznej inteligencji. Odpowiedzi są generowane na bieżąco,
          więc mogą być błędne albo nieprzewidywalne. Nieodpowiednią odpowiedź zgłosisz przyciskiem „Zgłoś” pod nią.
        </p>
        <p>
          Żeby odpowiedzieć, wysyłamy treść Twoich ruchów i dotychczasowy przebieg rozgrywki do Anthropic (USA), czyli
          dostawcy modelu. Nie wysyłamy mu Twojego adresu e-mail. Nie wpisuj w grze danych wrażliwych ani
          niepotrzebnych danych osobowych. Szczegóły w <Link href="/prywatnosc">Polityce prywatności</Link>.
        </p>
        <p>Historie zawierają fikcyjne zbrodnie (zabójstwa) i są przeznaczone dla osób od 16 lat.</p>
        <FormularzZgody cel={cel} />
      </section>
    </main>
  );
}
