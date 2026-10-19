import type { MetadataRoute } from "next";

// Pozwala zainstalować grę na ekranie głównym telefonu (Android i iPhone przez „Dodaj do ekranu głównego”).
// Ikony powstają ze skryptu `npm run ikony` na podstawie public/ikona.svg.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pocket Mystery",
    short_name: "Pocket Mystery",
    description: "Kryminał, który mieści się w kieszeni. Interaktywne zagadki kryminalne z mistrzem gry.",
    lang: "pl",
    id: "/",
    categories: ["games", "entertainment"],
    orientation: "portrait",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ecebe4",
    theme_color: "#ecebe4",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
