import { sprawdzDostep } from "@/lib/dostep";
import { zapiszZgodeAI } from "@/lib/zgody";

// Zapisuje zgodę zalogowanego gracza na przekazanie rozmów dostawcy AI.
export async function POST() {
  const dostep = await sprawdzDostep();
  if (dostep.stan !== "tester") return Response.json({ blad: "brak_dostepu" }, { status: 401 });
  try {
    await zapiszZgodeAI(dostep.gracz.id);
  } catch (err) {
    console.error("Nie udało się zapisać zgody:", err);
    return Response.json({ blad: "Nie udało się zapisać zgody. Spróbuj ponownie." }, { status: 500 });
  }
  return Response.json({ ok: true });
}
