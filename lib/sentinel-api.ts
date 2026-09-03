import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const financialTable =
  process.env.SENTINEL_FINANCIAL_TABLE ?? "financial_records";
export const interventionTable =
  process.env.SENTINEL_INTERVENTIONS_TABLE ?? "interventions";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { supabase, user, response: null };
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(message = "Unable to complete the request") {
  return NextResponse.json({ error: message }, { status: 500 });
}