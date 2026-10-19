import "server-only";
import { randomBytes } from "node:crypto";
import { baza } from "./supabase/admin";

// Stałe osobiste linki testerów: klucz w linku działa jak hasło, więc autorka może go w każdej chwili wymienić.

const KLUCZ = /^[a-f0-9]{32}$/;

export const nowyKlucz = () => randomBytes(16).toString("hex");

export function linkTestera(origin: string, klucz: string): string {
  const link = new URL("/zaproszenie", origin);
  link.searchParams.set("k", klucz);
  return link.toString();
}

export async function emailDlaKlucza(klucz: string): Promise<string | null> {
  if (!KLUCZ.test(klucz)) return null;
  const { data, error } = await baza().from("testerzy").select("email").eq("klucz", klucz).maybeSingle();
  if (error) throw error;
  return (data?.email as string | undefined) ?? null;
}

export async function wymienKlucz(email: string): Promise<string> {
  const klucz = nowyKlucz();
  const { error } = await baza().from("testerzy").update({ klucz }).eq("email", email);
  if (error) throw error;
  return klucz;
}
