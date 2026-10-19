import "server-only";
import { baza } from "./supabase/admin";

// Ankiety testerów: jedna na rozgrywkę, z opcjonalnym porównaniem z inną sprawą.

export const TRUDNOSCI = { "za-latwa": "Za łatwa", "w-sam-raz": "W sam raz", "za-trudna": "Za trudna" } as const;
export type Trudnosc = keyof typeof TRUDNOSCI;

export type Ankieta = {
  graId: string;
  userId: string;
  sprawaId: string;
  ocena: number;
  trudnosc: Trudnosc;
  uczciwosc: number;
  komentarz: string;
  lepszaSprawa: string | null;
  dlaczego: string;
};

export async function czyJestAnkieta(graId: string): Promise<boolean> {
  const { count, error } = await baza()
    .from("ankiety")
    .select("id", { count: "exact", head: true })
    .eq("gra_id", graId);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function zapiszAnkiete(a: Ankieta): Promise<void> {
  const { error } = await baza().from("ankiety").insert({
    gra_id: a.graId,
    user_id: a.userId,
    sprawa_id: a.sprawaId,
    ocena: a.ocena,
    trudnosc: a.trudnosc,
    uczciwosc: a.uczciwosc,
    komentarz: a.komentarz || null,
    lepsza_sprawa: a.lepszaSprawa,
    dlaczego: a.dlaczego || null,
  });
  if (error) throw error;
}

// Inne sprawy, w które gracz już grał: tylko z nimi ma sens porównanie.
export async function inneSprawyGracza(userId: string, sprawaId: string): Promise<string[]> {
  const { data, error } = await baza()
    .from("gry")
    .select("sprawa_id")
    .eq("user_id", userId)
    .neq("sprawa_id", sprawaId)
    .gt("ruchy", 0);
  if (error) throw error;
  return [...new Set((data ?? []).map((g) => g.sprawa_id as string))];
}
