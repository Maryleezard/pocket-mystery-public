import "server-only";
import { baza } from "./supabase/admin";

// Zmień, gdy zmienia się treść zgody: gracze zobaczą ekran ponownie.
export const WERSJA_ZGODY = "2026-10";

export async function maZgodeAI(userId: string): Promise<boolean> {
  const { data, error } = await baza()
    .from("zgody_ai")
    .select("wersja")
    .eq("user_id", userId)
    .maybeSingle<{ wersja: string }>();
  if (error) throw error;
  return data?.wersja === WERSJA_ZGODY;
}

export async function zapiszZgodeAI(userId: string): Promise<void> {
  const { error } = await baza()
    .from("zgody_ai")
    .upsert({ user_id: userId, wersja: WERSJA_ZGODY, zgoda: new Date().toISOString() });
  if (error) throw error;
}
