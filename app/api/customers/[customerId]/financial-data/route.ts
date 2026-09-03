import { badRequest, financialTable, requireUser, serverError } from "@/lib/sentinel-api";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> },
) {
  const customerId = (await params).customerId;
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(customerId)) return badRequest("Invalid customer ID");

  const auth = await requireUser();
  if (auth.response) return auth.response;
  const { data, error } = await auth.supabase
    .from(financialTable)
    .select("*")
    .eq("customer_id", customerId)
    .order("month", { ascending: true });
  if (error) return serverError("Unable to retrieve financial history");
  return NextResponse.json({ customer_id: customerId, history: data ?? [] });
}