import { readFile } from "node:fs/promises";
import path from "node:path";
import { AdminShell } from "@/app/admin/admin-chrome";

type Feature = { feature: string; importance: number };

async function getFeatures(): Promise<Feature[]> {
  try {
    return JSON.parse(await readFile(path.join(process.cwd(), "models/financial_distress/feature_importance.json"), "utf8")) as Feature[];
  } catch {
    return [];
  }
}

export default async function ModelPerformancePage() {
  const features = (await getFeatures()).slice(0, 8);
  const metrics = [["ROC-AUC", "0.969"], ["PR-AUC", "0.969"], ["Precision", "69.4%"], ["Recall", "95.4%"], ["F1", "80.3%"]];
  return <AdminShell><section className="mx-auto max-w-[1400px] px-6 py-8 sm:px-10"><p className="text-sm font-medium text-[#3f8068]">Model Performance</p><h2 className="mt-1 text-3xl font-semibold tracking-[-.035em]">How Sentinel sees risk.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#708388]">Inspect the prototype model, its evaluation evidence, and the signals shaping each assessment.</p><div className="mt-8 rounded-2xl border border-[#f0d9a9] bg-[#fff8e9] px-5 py-4 text-xs text-[#86631c]"><span className="font-semibold">Synthetic prototype evaluation.</span> These metrics are not claims of real-world performance.</div><section className="mt-6 rounded-2xl border border-[#dfe7e8] bg-white p-7 shadow-[0_12px_35px_rgba(23,61,64,0.05)]"><div className="grid grid-cols-2 gap-6 sm:grid-cols-5">{metrics.map(([label, value]) => <div key={label} className="border-l-2 border-[#9bc9b6] pl-4"><p className="text-[10px] uppercase tracking-wide text-[#829397]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>)}</div><p className="mt-6 border-t border-[#edf1f1] pt-5 text-xs text-[#829397]">Customer-disjoint, chronological evaluation · early-warning horizon: two months</p></section><div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><section className="rounded-2xl border border-[#dfe7e8] bg-white p-7 shadow-sm"><h3 className="font-semibold">Feature importance</h3><p className="mt-1 text-xs text-[#829397]">Global XGBoost importance from the saved artifact</p>{features.length ? <div className="mt-6 space-y-4">{features.map((item) => <div key={item.feature}><div className="flex justify-between text-xs"><span>{item.feature.replaceAll("_", " ")}</span><span className="text-[#789096]">{item.importance.toFixed(3)}</span></div><div className="mt-2 h-2 rounded-full bg-[#edf3f0]"><div className="h-full rounded-full bg-[#65af88]" style={{ width: `${Math.max(4, item.importance * 100)}%` }} /></div></div>)}</div> : <p className="mt-6 rounded-xl bg-[#f7faf9] p-4 text-xs text-[#829397]">Feature artifact unavailable in this environment.</p>}</section><section className="rounded-2xl bg-[#173d40] p-7 text-white shadow-lg"><p className="text-xs uppercase tracking-[.15em] text-[#9bc9b6]">Monitoring note</p><h3 className="mt-2 text-xl font-semibold">Recall is intentionally prioritized.</h3><p className="mt-3 text-sm leading-6 text-[#c8dcd6]">The prototype threshold favors finding customers who may need support while keeping officer review in the loop.</p><div className="mt-7 border-t border-white/10 pt-5"><p className="text-xs text-[#9bc9b6]">Model behavior</p><p className="mt-2 text-sm">Every result is accompanied by SHAP contributions and is treated as a support signal, never an automated decision.</p></div></section></div></section></AdminShell>;
}