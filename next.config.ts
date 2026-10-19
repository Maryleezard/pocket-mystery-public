import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Instrukcja mistrza gry i biblie spraw są czytane z dysku na serwerze,
  // więc muszą trafić do paczki wysyłanej na hosting.
  outputFileTracingIncludes: {
    "/*": ["./tresci/**/*"],
  },
};

export default nextConfig;
