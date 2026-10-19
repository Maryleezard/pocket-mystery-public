import { TRUDNOSCI, type Trudnosc } from "@/lib/ankiety";
import { listaSpraw } from "@/lib/sprawy";
import { baza } from "@/lib/supabase/admin";
import styles from "../page.module.css";

type GraWiersz = { user_id: string; sprawa_id: string; wynik: string | null; ruchy: number; koszt: { usd: number } };
type AnkietaWiersz = {
  user_id: string;
  sprawa_id: string;
  ocena: number;
  trudnosc: Trudnosc;
  uczciwosc: number;
  komentarz: string | null;
  lepsza_sprawa: string | null;
  dlaczego: string | null;
  utworzono: string;
};

const srednia = (liczby: number[]) =>
  liczby.length ? (liczby.reduce((a, b) => a + b, 0) / liczby.length).toFixed(1) : "–";

// Zestawienie dla autorki: jak idą sprawy i co piszą testerzy. Tylko serwer, tylko panel autorki.
export default async function WynikiTestow() {
  const [sprawy, gry, ankiety, uzytkownicy] = await Promise.all([
    listaSpraw(),
    baza().from("gry").select("user_id, sprawa_id, wynik, ruchy, koszt").gt("ruchy", 0),
    baza()
      .from("ankiety")
      .select("user_id, sprawa_id, ocena, trudnosc, uczciwosc, komentarz, lepsza_sprawa, dlaczego, utworzono")
      .order("utworzono", { ascending: false }),
    baza().auth.admin.listUsers({ perPage: 1000 }),
  ]);
  const listaGier = (gry.data ?? []) as GraWiersz[];
  const listaAnkiet = (ankiety.data ?? []) as AnkietaWiersz[];
  const email = new Map((uzytkownicy.data?.users ?? []).map((u) => [u.id, u.email ?? "?"]));
  const nazwa = new Map(sprawy.map((s) => [s.id, s.nazwa]));

  return (
    <>
      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2 className={styles.caseTitle}>Sprawy w liczbach</h2>
        <div className={styles.przewijana}>
          <table className={styles.tabela}>
            <thead>
              <tr>
                <th>Sprawa</th>
                <th>Gracze</th>
                <th>Rozgrywki</th>
                <th>Rozwiązane</th>
                <th>Porażki</th>
                <th>Śr. ruchów</th>
                <th>Śr. koszt</th>
                <th>Ocena</th>
                <th>Fair play</th>
                <th>Ankiety</th>
              </tr>
            </thead>
            <tbody>
              {sprawy.map((s) => {
                const g = listaGier.filter((x) => x.sprawa_id === s.id);
                const a = listaAnkiet.filter((x) => x.sprawa_id === s.id);
                return (
                  <tr key={s.id}>
                    <td>{s.nazwa}</td>
                    <td>{new Set(g.map((x) => x.user_id)).size}</td>
                    <td>{g.length}</td>
                    <td>{g.filter((x) => x.wynik === "rozwiazana").length}</td>
                    <td>{g.filter((x) => x.wynik === "porazka").length}</td>
                    <td>{srednia(g.map((x) => x.ruchy))}</td>
                    <td>{g.length ? `$${(g.reduce((sum, x) => sum + (x.koszt?.usd ?? 0), 0) / g.length).toFixed(2)}` : "–"}</td>
                    <td>{srednia(a.map((x) => x.ocena))}</td>
                    <td>{srednia(a.map((x) => x.uczciwosc))}</td>
                    <td>{a.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Porownanie ankiety={listaAnkiet} nazwa={nazwa} />
      </section>

      <section className={styles.card} style={{ marginTop: 16 }}>
        <h2 className={styles.caseTitle}>Raporty testerów ({listaAnkiet.length})</h2>
        {listaAnkiet.length === 0 && <p className={styles.note}>Jeszcze nikt nie wypełnił ankiety.</p>}
        <div className={styles.przewijana}>
          {listaAnkiet.length > 0 && (
            <table className={styles.tabela}>
              <thead>
                <tr>
                  <th>Kiedy</th>
                  <th>Kto</th>
                  <th>Sprawa</th>
                  <th>Ocena</th>
                  <th>Trudność</th>
                  <th>Fair play</th>
                  <th>Komentarz</th>
                  <th>Lepsza sprawa</th>
                </tr>
              </thead>
              <tbody>
                {listaAnkiet.map((a, i) => (
                  <tr key={i}>
                    <td>{new Date(a.utworzono).toLocaleDateString("pl-PL")}</td>
                    <td>{email.get(a.user_id) ?? "?"}</td>
                    <td>{nazwa.get(a.sprawa_id) ?? a.sprawa_id}</td>
                    <td>{a.ocena}/5</td>
                    <td>{TRUDNOSCI[a.trudnosc]}</td>
                    <td>{a.uczciwosc}/5</td>
                    <td>{a.komentarz ?? ""}</td>
                    <td>
                      {a.lepsza_sprawa ? nazwa.get(a.lepsza_sprawa) ?? a.lepsza_sprawa : ""}
                      {a.dlaczego ? ` – ${a.dlaczego}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}

function Porownanie({ ankiety, nazwa }: { ankiety: AnkietaWiersz[]; nazwa: Map<string, string> }) {
  const glosy = new Map<string, number>();
  for (const a of ankiety) if (a.lepsza_sprawa) glosy.set(a.lepsza_sprawa, (glosy.get(a.lepsza_sprawa) ?? 0) + 1);
  if (glosy.size === 0) return null;
  return (
    <p className={styles.note}>
      Głosy w porównaniu „która lepsza”:{" "}
      {[...glosy].map(([id, n]) => `${nazwa.get(id) ?? id}: ${n}`).join(" · ")}
    </p>
  );
}
