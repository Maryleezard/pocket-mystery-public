import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Gra from "@/components/Gra";
import { jestAutorka, sprawdzDostep } from "@/lib/dostep";
import { opisSprawy } from "@/lib/sprawy";
import { maZgodeAI } from "@/lib/zgody";

export async function generateMetadata({ params }: PageProps<"/sprawy/[id]">): Promise<Metadata> {
  const { id } = await params;
  const sprawa = await opisSprawy(id).catch(() => null);
  return { title: sprawa ? `${sprawa.nazwa} · Pocket Mystery` : "Pocket Mystery" };
}

export default async function StronaSprawy({ params }: PageProps<"/sprawy/[id]">) {
  const dostep = await sprawdzDostep();
  if (dostep.stan === "niezalogowany") redirect("/logowanie");
  if (dostep.stan !== "tester") redirect("/");
  const { id } = await params;
  if (!(await maZgodeAI(dostep.gracz.id))) redirect(`/zgoda?wroc=/sprawy/${encodeURIComponent(id)}`);
  const sprawa = await opisSprawy(id).catch(() => null);
  if (!sprawa || (sprawa.szkic && !jestAutorka(dostep))) notFound();
  // Do przeglądarki trafia tylko jawny opis sprawy, nigdy biblia.
  return <Gra sprawa={sprawa} pokazKoszt={jestAutorka(dostep)} />;
}
