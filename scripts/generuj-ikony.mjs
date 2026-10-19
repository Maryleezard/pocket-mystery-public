// Generuje ikony PWA z public/ikona.svg. Uruchom po każdej zmianie rysunku:
//   npm run ikony
// Powstają: public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png (z zapasem na przycięcie
// do koła lub zaokrąglonego kwadratu) oraz src/app/apple-icon.png (ikona na ekran główny iPhone'a).
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SERWIS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const svg = path.join(SERWIS, "public", "ikona.svg");
const TLO = "#ecebe4";

const zwykla = (rozmiar, wyjscie) =>
  sharp(svg, { density: 384 }).resize(rozmiar, rozmiar).png().toFile(path.join(SERWIS, wyjscie));

// Ikona maskowana: rysunek zmniejszony do 80%, żeby system nie ucinał postaci.
async function maskowana(rozmiar, wyjscie) {
  const wnetrze = Math.round(rozmiar * 0.8);
  const margines = Math.round((rozmiar - wnetrze) / 2);
  const bufor = await sharp(svg, { density: 384 }).resize(wnetrze, wnetrze).png().toBuffer();
  await sharp({ create: { width: rozmiar, height: rozmiar, channels: 4, background: TLO } })
    .composite([{ input: bufor, left: margines, top: margines }])
    .png()
    .toFile(path.join(SERWIS, wyjscie));
}

await Promise.all([
  zwykla(192, "public/icon-192.png"),
  zwykla(512, "public/icon-512.png"),
  maskowana(512, "public/icon-maskable-512.png"),
  zwykla(180, "src/app/apple-icon.png"),
]);
console.log("Gotowe: icon-192.png, icon-512.png, icon-maskable-512.png, apple-icon.png");
