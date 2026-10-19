import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Source_Serif_4, Special_Elite } from "next/font/google";
import RejestracjaSW from "@/components/RejestracjaSW";
import "./globals.css";

const display = Special_Elite({ variable: "--f-display", weight: "400", subsets: ["latin", "latin-ext"] });
const body = Source_Serif_4({ variable: "--f-body", subsets: ["latin", "latin-ext"] });
const mono = IBM_Plex_Mono({ variable: "--f-mono", weight: ["400", "500"], subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Pocket Mystery",
  description: "Kryminał, który mieści się w kieszeni. Interaktywne zagadki kryminalne z mistrzem gry.",
  appleWebApp: { capable: true, title: "Pocket Mystery", statusBarStyle: "default" },
};

// viewportFit „cover” pozwala użyć całego ekranu, a safe-area w CSS omija wcięcie i pasek nawigacyjny.
export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ecebe4" },
    { media: "(prefers-color-scheme: dark)", color: "#16181b" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        {children}
        <RejestracjaSW />
      </body>
    </html>
  );
}
