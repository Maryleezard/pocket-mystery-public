import Link from "next/link";
import { jestAutorka, rejestracjaOtwarta, sprawdzDostep } from "@/lib/dostep";
import { postepGracza, type PostepWSprawie } from "@/lib/gry";
import { listaSpraw } from "@/lib/sprawy";
import styles from "./page.module.css";

// Wersja testowa: gościom pokazujemy zapowiedź, testerom bibliotekę spraw.
// Sprawy oznaczone jako szkic widzi tylko autorka.
export default async function Home() {
  const dostep = await sprawdzDostep();

  return (
    <main className={styles.wrap}>
      <header className={styles.header}>
        <p className={styles.kicker}>{dostep.stan === "tester" ? "Wersja testowa" : "Wkrótce"}</p>
        <h1 className={styles.title}>Pocket Mystery</h1>
        <p className={styles.tagline}>Kryminał, który mieści się w kieszeni.</p>
      </header>

      {dostep.stan === "niezalogowany" && (
        <section className={styles.card}>
          <p>
            Krótkie, interaktywne zagadki kryminalne, w których sam prowadzisz śledztwo, a mistrz gry odgrywa
            świadków i podejrzanych. Pracujemy nad pierwszymi sprawami.
          </p>
          <p className={styles.note}>
            {rejestracjaOtwarta() ? (
              <>
                <Link href="/logowanie">Zaloguj się lub załóż konto</Link>.
              </>
            ) : (
              <>
                Masz zaproszenie do testów? <Link href="/logowanie">Zaloguj się</Link>.
              </>
            )}
          </p>
          <p className={styles.note}>
            <Link href="/pomoc">Pomoc</Link> · <Link href="/prywatnosc">Polityka prywatności</Link>
          </p>
        </section>
      )}

      {dostep.stan === "spoza-listy" && (
        <section className={styles.card}>
          <p>
            Adresu <strong>{dostep.email}</strong> nie ma jeszcze na liście testerów. Jeśli dostałeś albo dostałaś
            zaproszenie, sprawdź, czy logujesz się tym samym adresem.
          </p>
          <Wyloguj />
        </section>
      )}

      {dostep.stan === "tester" && <Biblioteka id={dostep.gracz.id} email={dostep.gracz.email} autorka={jestAutorka(dostep)} />}
    </main>
  );
}

async function Biblioteka({ id, email, autorka }: { id: string; email: string; autorka: boolean }) {
  const [sprawy, postep] = await Promise.all([listaSpraw(), postepGracza(id)]);
  const widoczne = sprawy.filter((s) => autorka || !s.szkic);
  return (
    <>
      <div className={styles.lista}>
        {widoczne.map((sprawa) => {
          const p = postep[sprawa.id];
          return (
            <article key={sprawa.id} className={styles.card}>
              <p className={styles.kicker}>
                Akta nr {sprawa.numer} · {sprawa.nazwa} · trudność {sprawa.trudnosc}
                {sprawa.szkic && " · szkic (widzisz tylko Ty)"}
              </p>
              <h2 className={styles.caseTitle}>{sprawa.tytul}</h2>
              <p>{sprawa.zajawka}</p>
              <div className={styles.cardFoot}>
                <Link className={styles.cta} href={`/sprawy/${sprawa.id}`}>
                  {p?.wToku ? "Wróć do śledztwa" : p ? "Otwórz akta ponownie" : "Otwórz akta"}
                </Link>
                {p && <span className={styles.status}>{opisPostepu(p)}</span>}
              </div>
            </article>
          );
        })}
      </div>
      {widoczne.length > 1 && (
        <p className={styles.note}>
          Po każdej sprawie poprosimy Cię o krótki raport. Jeśli zagrasz w obie, zapytamy też, która podobała Ci
          się bardziej.
        </p>
      )}
      <footer className={styles.footer}>
        <span>{email}</span>
        {autorka && <Link href="/autorka">Panel autorki</Link>}
        <Link href="/konto">Konto</Link>
        <Link href="/pomoc">Pomoc</Link>
        <Link href="/prywatnosc">Prywatność</Link>
        <Wyloguj />
      </footer>
    </>
  );
}

function opisPostepu(p: PostepWSprawie): string {
  if (p.rozwiazana) return "Rozwiązana";
  if (p.wToku) return "W toku";
  return "Nierozwiązana";
}

function Wyloguj() {
  return (
    <form action="/api/wyloguj" method="post">
      <button type="submit">Wyloguj</button>
    </form>
  );
}
