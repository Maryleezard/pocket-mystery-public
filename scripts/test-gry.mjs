// Test rozgrywki z mistrzem gry z wiersza poleceń, bez Supabase i logowania.
// Odtwarza wywołanie z src/lib/mistrz-gry.ts i src/app/api/gry/[id]/ruch/route.ts:
// ten sam prompt systemowy, model i ustawienia. Każdy ruch kosztuje prawdziwe pieniądze
// z klucza w .env.local (zwykle kilka groszy po pierwszym ruchu dzięki cache).
//
// Użycie (z folderu serwis):
//   npm run test:gra -- <id-sprawy> <nazwa-gry> start
//   npm run test:gra -- <id-sprawy> <nazwa-gry> "tekst ruchu gracza"
//   npm run test:gra -- <id-sprawy> <nazwa-gry> log        (cała dotychczasowa rozmowa)
//
// Przebieg gry zapisuje się w dane/testy/<id-sprawy>-<nazwa-gry>.json.
// Gdy zmienisz parametry wywołania w mistrz-gry.ts, popraw je też tutaj (sekcja „Wywołanie”).
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SERWIS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const [sprawaId, nazwa, ...reszta] = process.argv.slice(2);
const ruch = reszta.join(" ").trim();
if (!sprawaId || !nazwa || !ruch) {
  console.error('Użycie: npm run test:gra -- <id-sprawy> <nazwa-gry> start | log | "tekst ruchu"');
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(sprawaId) || !/^[A-Za-z0-9_-]+$/.test(nazwa)) {
  console.error("Id sprawy i nazwa gry mogą zawierać tylko litery, cyfry, myślniki i podkreślenia.");
  process.exit(1);
}

// Klucz API z .env.local; nigdzie go nie wypisujemy.
const envPlik = path.join(SERWIS, ".env.local");
if (fs.existsSync(envPlik)) {
  for (const l of fs.readFileSync(envPlik, "utf8").split(/\r?\n/)) {
    const m = l.match(/^ANTHROPIC_API_KEY=(.+)$/);
    if (m) process.env.ANTHROPIC_API_KEY = m[1].trim();
  }
}

const zrodlo = fs.readFileSync(path.join(SERWIS, "src/lib/mistrz-gry.ts"), "utf8");
const MODEL = zrodlo.match(/export const MODEL = "([^"]+)"/)[1];
const CENA = JSON.parse(
  zrodlo.match(/const CENA = (\{[^}]+\})/)[1].replace(/(\w+):/g, '"$1":'),
);
const uwagi = new Function("return " + zrodlo.match(/const UWAGI_TECHNICZNE = (\[[\s\S]*?\])\.join/)[1])().join("\n");
const sprawy = fs.readFileSync(path.join(SERWIS, "src/lib/sprawy.ts"), "utf8");
const KOMENDY = new Function("return " + sprawy.match(/const KOMENDY =\s*([\s\S]*?);\n/)[1])();

const instrukcja = fs.readFileSync(path.join(SERWIS, "tresci/instrukcja-mistrza-gry.md"), "utf8");
const biblia = fs.readFileSync(path.join(SERWIS, "tresci/sprawy", sprawaId, "biblia.md"), "utf8");
const system = [
  uwagi, "",
  "=== INSTRUKCJA MISTRZA GRY ===", instrukcja, "",
  "=== BIBLIA SPRAWY (ściśle tajna dla gracza) ===", biblia, "",
  "=== KONIEC DOKUMENTÓW. Dalej zaczyna się rozgrywka. ===",
].join("\n");

// Wstęp jak w wstepSprawy(): akapity pod tytułem biblii do pierwszej sekcji, plus komendy.
function wstep() {
  const wst = [];
  for (const l of biblia.split(/\r?\n/).slice(1)) {
    if (l.startsWith("## ")) break;
    if (l.includes(" · @")) continue;
    wst.push(l.replace(/\\$/, "").trimEnd());
  }
  const akapity = wst.join("\n").split(/\n{2,}/).map((a) => a.trim()).filter(Boolean);
  return [...akapity, KOMENDY].join("\n\n");
}

// Jak w znaczniki.ts: oddziela znaczniki notatnika i końca gry od tekstu dla gracza.
function wytnij(surowy) {
  let t = surowy, wynik = null;
  const k = t.match(/\s*\[\[KONIEC:(ROZWIAZANA|PORAZKA)\]\]\s*$/);
  if (k) { wynik = k[1]; t = t.slice(0, k.index); }
  const notatki = [];
  t = t.replace(/\[\[NOTATKA:\s*([\s\S]*?)\s*\]\]/g, (_, w) => { notatki.push(w.replace(/\s+/g, " ").trim()); return ""; });
  return { tekst: t.trimEnd(), notatki, wynik };
}

const katalog = path.join(SERWIS, "dane", "testy");
fs.mkdirSync(katalog, { recursive: true });
const plik = path.join(katalog, `${sprawaId}-${nazwa}.json`);
const gra = fs.existsSync(plik)
  ? JSON.parse(fs.readFileSync(plik, "utf8"))
  : { historia: [], ruchy: 0, usd: 0, notatki: [], log: [] };

if (ruch === "log") {
  for (const w of gra.log) console.log(`\n--- ${w.rola.toUpperCase()}\n${w.tekst}`);
  console.log(`\n(ruchy: ${Math.max(gra.ruchy - 1, 0)}, koszt łącznie: ${gra.usd.toFixed(2)} USD)`);
  process.exit(0);
}

if (ruch === "start") {
  const w = wstep();
  gra.historia = [{ role: "user", content: "Rozpocznij grę." }, { role: "assistant", content: [{ type: "text", text: w }] }];
  gra.ruchy = 1; gra.usd = 0; gra.notatki = []; gra.log = [{ rola: "mistrz", tekst: w }];
  fs.writeFileSync(plik, JSON.stringify(gra));
  console.log(w);
  process.exit(0);
}

if (!gra.historia.length) {
  console.error('Najpierw zacznij grę: npm run test:gra -- ' + sprawaId + " " + nazwa + " start");
  process.exit(1);
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("Brak ANTHROPIC_API_KEY w .env.local.");
  process.exit(1);
}

// === Wywołanie (zsynchronizowane z odpowiedzMistrza w mistrz-gry.ts) ===
const historia = [...gra.historia, { role: "user", content: `[Ruch ${gra.ruchy}] ${ruch}` }];
const client = new Anthropic();
const msg = await client.beta.messages.stream({
  model: MODEL,
  max_tokens: 64000,
  output_config: { effort: "medium" },
  thinking: { type: "adaptive", block_binding: { prefix_mismatch_behavior: "drop_block" } },
  cache_control: { type: "ephemeral" },
  betas: ["server-side-fallback-2026-07-01", "thinking-binding-controls-2026-08-01"],
  fallbacks: "default",
  system,
  messages: historia,
}).finalMessage();
// === koniec wywołania ===

const u = msg.usage;
const usd = (u.input_tokens * CENA.wejscie + (u.cache_creation_input_tokens ?? 0) * CENA.zapisCache
  + (u.cache_read_input_tokens ?? 0) * CENA.odczytCache + u.output_tokens * CENA.wyjscie) / 1e6;
const { tekst, notatki, wynik } = wytnij(msg.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join(""));

gra.historia = [...historia, { role: "assistant", content: msg.content }];
gra.ruchy += 1; gra.usd += usd;
gra.notatki = [...gra.notatki, ...notatki.filter((n) => !gra.notatki.includes(n))];
gra.log.push({ rola: "gracz", tekst: ruch }, { rola: "mistrz", tekst, notatki, wynik });
fs.writeFileSync(plik, JSON.stringify(gra));

console.log(tekst);
if (notatki.length) console.log("\n[notatnik +] " + notatki.join(" | "));
if (wynik) console.log("\n[KONIEC: " + wynik + "]");
console.error(`(ruch ${gra.ruchy - 1}, ${usd.toFixed(3)} USD, łącznie ${gra.usd.toFixed(2)} USD, stop=${msg.stop_reason})`);
