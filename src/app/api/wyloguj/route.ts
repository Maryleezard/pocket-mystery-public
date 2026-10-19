import { NextResponse } from "next/server";
import { klientSesji } from "@/lib/supabase/serwer";

export async function POST(request: Request) {
  const supabase = await klientSesji();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
