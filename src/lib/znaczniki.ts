// Znaczniki, które mistrz gry dopisuje na końcu odpowiedzi. Gracz ich nie widzi.
//   [[NOTATKA: ...]]          wpis do notatnika (może być kilka w jednej odpowiedzi)
//   [[KONIEC:ROZWIAZANA]]     ostateczne zakończenie gry (zawsze ostatni)
//   [[KONIEC:PORAZKA]]
// Plik bez "server-only", bo korzysta z niego też przeglądarka (ucinanie znaczników w strumieniu).

export type WynikGry = "rozwiazana" | "porazka";

const NOTATKA = /\[\[NOTATKA:\s*([\s\S]*?)\s*\]\]/g;
const KONIEC = /\s*\[\[KONIEC:(ROZWIAZANA|PORAZKA)\]\]\s*$/;

// Najdłuższy wpis w notatniku; dłuższe ucinamy, żeby jeden błąd modelu nie zaśmiecił panelu.
const MAKS_DLUGOSC_WPISU = 400;

// Rozdziela odpowiedź mistrza na tekst dla gracza, wpisy do notatnika i wynik gry.
export function wytnijZnaczniki(surowy: string): { tekst: string; notatki: string[]; wynik: WynikGry | null } {
  let tekst = surowy;
  let wynik: WynikGry | null = null;

  const koniec = tekst.match(KONIEC);
  if (koniec) {
    wynik = koniec[1] === "ROZWIAZANA" ? "rozwiazana" : "porazka";
    tekst = tekst.slice(0, koniec.index);
  }

  const notatki: string[] = [];
  tekst = tekst.replace(NOTATKA, (_, wpis: string) => {
    const czysty = wpis.replace(/\s+/g, " ").trim().slice(0, MAKS_DLUGOSC_WPISU);
    if (czysty) notatki.push(czysty);
    return "";
  });

  return { tekst: tekst.trimEnd(), notatki, wynik };
}

// Dopisuje nowe wpisy do notatnika, pomijając te, które już tam są (bez względu na wielkość liter).
export function dopiszNotatki(istniejace: string[], nowe: string[]): string[] {
  const widziane = new Set(istniejace.map((w) => w.toLocaleLowerCase("pl")));
  const wynik = [...istniejace];
  for (const wpis of nowe) {
    const klucz = wpis.toLocaleLowerCase("pl");
    if (widziane.has(klucz)) continue;
    widziane.add(klucz);
    wynik.push(wpis);
  }
  return wynik;
}

// Do pokazywania odpowiedzi w trakcie strumienia: obcina wszystko od pierwszego „[[”,
// także niedokończony znacznik, i pojedynczy „[” na końcu, który może być jego początkiem.
export function bezZnacznikow(t: string): string {
  const i = t.indexOf("[[");
  return (i >= 0 ? t.slice(0, i) : t).replace(/\[$/, "").trimEnd();
}
