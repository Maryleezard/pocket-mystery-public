"use client";

import { useEffect } from "react";

// Rejestruje service worker z ekranem offline (public/sw.js).
export default function RejestracjaSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
