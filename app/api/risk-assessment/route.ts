import { badRequest, financialTable, requireUser, serverError } from "@/lib/sentinel-api";
import { runSentinelModel, type ModelRow } from "@/lib/model-inference";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.response) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return badRequest("Request body must be JSON"); }
  const customerId = typeof body === "object" && body !== null && "customerId" in body
    ? (body as { customerId: unknown }).customerId : undefined;
  if (typeof customerId !== "string" || !/^[A-Za-z0-9_-]{1,64}$/.test(customerId)) {
    return badRequest("customerId is required and must be valid");
  }

  const { data: history, error } = await auth.supabase
    .from(financialTable)
    .select("*")
    .eq("customer_id", customerId)
    .order("month", { ascending: true });
  if (error) return serverError("Unable to retrieve financial history");
  if (!history?.length) return NextResponse.json({ error: "Customer history not found" }, { status: 404 });

  try {
    const assessment = await runSentinelModel(history as ModelRow[]);
    const percentage = Math.round(assessment.distress_probability * 100);
    return NextResponse.json({
      customer_id: customerId,
      assessed_at: new Date().toISOString(),
      risk: { ...assessment, risk_score: percentage, risk_level: percentage >= 70 ? "high" : percentage >= 40 ? "moderate" : "low" },
      recommendation: assessment.prediction
        ? { action: "support_review", message: "Offer a voluntary financial wellbeing conversation and review flexible support options." }
        : { action: "monitor", message: "Continue monitoring with no automated adverse action." },
    });
  } catch (error) {
    console.error("Sentinel model inference failed", error);
    return serverError("Risk assessment is temporarily unavailable");
  }
}