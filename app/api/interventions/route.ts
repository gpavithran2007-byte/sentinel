import { badRequest, interventionTable, requireUser, serverError } from "@/lib/sentinel-api";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  const customerId = new URL(request.url).searchParams.get("customer_id");
  let query = auth.supabase.from(interventionTable).select("*").order("created_at", { ascending: false });
  if (customerId) query = query.eq("customer_id", customerId);
  const { data, error } = await query;
  if (error) return serverError("Unable to retrieve interventions");
  return NextResponse.json({ interventions: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Request body must be JSON"); }
  if (typeof body !== "object" || body === null) return badRequest("A JSON object is required");
  const input = body as Record<string, unknown>;
  if (typeof input.customer_id !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(input.customer_id)) {
    return badRequest("customer_id is required and must be valid");
  }
  const { data, error } = await auth.supabase
    .from(interventionTable)
    .insert({
      customer_id: input.customer_id,
      created_by: auth.user.id,
      action: typeof input.action === "string" ? input.action : "support_review",
      recommendation: typeof input.recommendation === "string" ? input.recommendation : null,
      risk_score: typeof input.risk_score === "number" ? input.risk_score : null,
      status: "pending",
    })
    .select()
    .single();
  if (error) return serverError("Unable to create intervention");
  return NextResponse.json({ intervention: data }, { status: 201 });
}