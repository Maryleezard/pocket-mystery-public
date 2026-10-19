import { jestAutorka, sprawdzDostep } from "@/lib/dostep";
import { baza } from "@/lib/supabase/admin";
import { klientSesji } from "@/lib/supabase/serwer";

// Usuwa konto zalogowanego gracza razem z rozgrywkami, notatkami i ankietami
// (tabele gry, ankiety i koszty_ruchow kasują się kaskadowo po usunięciu użytkownika).
export async function POST(request: Request) {
  const dostep = await sprawdzDostep();
  if (dostep.stan !== "tester") return Response.json({ blad: "brak_dostepu" }, { status: 401 });
  if (jestAutorka(dostep)) {
    return Response.json({ blad: "Konta autorki nie można usunąć z aplikacji." }, { status: 403 });
  }

  const { potwierdzenie } = (await request.json().catch(() => ({}))) as { potwierdzenie?: unknown };
  if (typeof potwierdzenie !== "string" || potwierdzenie.trim().toLocaleUpperCase("pl") !== "USUŃ") {
    return Response.json({ blad: "Wpisz słowo USUŃ, żeby potwierdzić." }, { status: 400 });
  }

  const db = baza();
  const { error } = await db.auth.admin.deleteUser(dostep.gracz.id);
  if (error) {
    console.error("Nie udało się usunąć konta:", error);
    return Response.json({ blad: "Nie udało się usunąć konta. Spróbuj ponownie albo napisz do nas." }, { status: 500 });
  }
  // Wpis na liście testerów (e-mail i stały link) też znika.
  await db.from("testerzy").delete().eq("email", dostep.gracz.email);

  const supabase = await klientSesji();
  await supabase.auth.signOut().catch(() => {});
  return Response.json({ ok: true });
}
