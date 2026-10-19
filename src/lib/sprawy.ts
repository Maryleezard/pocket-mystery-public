import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Treści spraw leżą w folderze `tresci` poza `public`, więc przeglądarka
// nigdy ich nie dostaje. Do klienta trafia tylko to, co zwraca `opisSprawy`.

const TRESCI = path.join(process.cwd(), "tresci");

export type OpisSprawy = {
  id: string;
  numer: number;
  tytul: string;
  nazwa: string;
  zajawka: string;
  trudnosc: string;
  osoby: string[];
  probyOskarzenia: number;
  // Sprawa w przygotowaniu: widzi ją tylko autorka.
  szkic?: boolean;
};

function bezpiecznyId(id: string): string {
  if (!/^[a-z0-9-]+$/.test(id)) throw new Error(`Nieprawidłowy identyfikator sprawy: ${id}`);
  return id;
}

export async function opisSprawy(id: string): Promise<OpisSprawy | null> {
  try {
    const plik = path.join(TRESCI, "sprawy", bezpiecznyId(id), "sprawa.json");
    return JSON.parse(await readFile(plik, "utf8")) as OpisSprawy;
  } catch {
    return null;
  }
}

// Wszystkie sprawy z folderu `tresci/sprawy`, w kolejności numerów akt.
export async function listaSpraw(): Promise<OpisSprawy[]> {
  const katalogi = await readdir(path.join(TRESCI, "sprawy"), { withFileTypes: true });
  const sprawy = await Promise.all(
    katalogi.filter((k) => k.isDirectory() && /^[a-z0-9-]+$/.test(k.name)).map((k) => opisSprawy(k.name)),
  );
  return sprawy.filter((s): s is OpisSprawy => s !== null).sort((a, b) => a.numer - b.numer);
}

const KOMENDY =
  "W każdej chwili możesz zajrzeć do notatnika (przycisk w teczce), żeby przejrzeć, co już wiesz, poprosić o „podpowiedź” albo złożyć oskarżenie przyciskiem „Oskarżam”. Od czego zaczynasz?";

// Wstęp dla gracza: akapity pod tytułem biblii (bez linii z datą i autorką), do pierwszej sekcji.
// Serwis pokazuje go od razu, bez pytania mistrza gry.
export async function wstepSprawy(id: string): Promise<string> {
  const linie = (await bibliaSprawy(id)).split(/\r?\n/);
  const wstep: string[] = [];
  for (const linia of linie.slice(1)) {
    if (linia.startsWith("## ")) break;
    if (linia.includes(" · @")) continue;
    wstep.push(linia.replace(/\\$/, "").trimEnd());
  }
  const akapity = wstep.join("\n").split(/\n{2,}/).map((a) => a.trim()).filter(Boolean);
  return [...akapity, KOMENDY].join("\n\n");
}

export async function bibliaSprawy(id: string): Promise<string> {
  return readFile(path.join(TRESCI, "sprawy", bezpiecznyId(id), "biblia.md"), "utf8");
}

export async function instrukcjaMistrzaGry(): Promise<string> {
  return readFile(path.join(TRESCI, "instrukcja-mistrza-gry.md"), "utf8");
}
