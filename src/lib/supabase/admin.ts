import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Klient z kluczem sekretnym: pełny dostęp do bazy, tylko po stronie serwera.
// Każde użycie musi samo sprawdzić, czy gracz ma prawo do danych.
let klient: SupabaseClient | null = null;

export function baza(): SupabaseClient {
  klient ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return klient;
}
