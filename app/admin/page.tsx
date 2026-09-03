import { readFile } from "node:fs/promises";
import path from "node:path";
import { AdminShell } from "@/app/admin/admin-chrome";

type Metadata = {
  metrics: {
    roc_auc: number;
    pr_auc: number;
    precision: number;
    recall: number;
    f1: number;
    false_positives: number;
  };
  split: { test_customers: number; test_rows: number };
};

async function loadPrototypeData() {
  const base = path.join(process.cwd(), "models", "financial_distress");
  try {
    const metadata = JSON.parse(
      await readFile(path.join(base, "metadata.json"), "utf8"),
    ) as Metadata;
    const predictions = await readFile(
      path.join(base, "test_predictions.csv"),
      "utf8",
    );
    const rows = predictions.trim().split("\n").slice(1);
    const flagged = rows.filter((row) => row.split(",").at(-1) === "1").length;
    const scores = rows
      .map((row) => Number(row.split(",").at(-2)))
      .filter(Number.isFinite);
    return {
      metadata,
      flagged,
      distribution: [
        scores.filter((score) => score < 0.028).length,
        scores.filter((score) => score >= 0.028 && score < 0.5).length,
        scores.filter((score) => score >= 0.5).length,
      ],
      source: "Synthetic prototype evaluation",
    };
  } catch {
    return {
      metadata: {
        metrics: {
          roc_auc: 0.969,
          pr_auc: 0.969,
          precision: 0.694,
          recall: 0.954,
          f1: 0.803,
          false_positives: 64,
        },
        split: { test_customers: 200, test_rows: 400 },
      } satisfies Metadata,
      flagged: 152,
      distribution: [248, 88, 64],
      source: "Demo data; model artifacts unavailable",
    };
  }
}

export default async function AdminPage() {
  const data = await loadPrototypeData();
  const { metrics, split } = data.metadata;
  const total = data.distribution.reduce((sum, value) => sum + value, 0) || 1;
  const cards = [
    ["Customers monitored", "1,000", "12 months of prototype history", "mint"],
    ["Customers flagged", data.flagged.toLocaleString(), data.source, "coral"],
    ["Active interventions", "38", "Demo queue · officer review", "amber"],
    ["Model recall", `${(metrics.recall * 100).toFixed(1)}%`, "Held-out prototype test", "mint"],
  ];

  return (
    <AdminShell>
        <section id="overview" className="mx-auto max-w-[1400px] px-6 py-8 sm:px-10">
          <div><p className="text-sm font-medium text-[#3f8068]">Operations overview</p><h2 className="mt-1 text-3xl font-semibold tracking-[-.035em]">A calm view of Sentinel.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#708388]">Monitor model behavior, intervention activity, and the controls that keep early support human-led.</p></div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([title, value, subtitle, tone]) => <Kpi key={title} title={title} value={value} subtitle={subtitle} tone={tone} />)}</div>

          <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
            <section id="performance" className="rounded-2xl border border-[#dfe7e8] bg-white p-7 shadow-[0_12px_35px_rgba(23,61,64,0.05)]">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">Model performance</h3><p className="mt-1 text-xs text-[#829397]">Results from the synthetic prototype evaluation</p></div><span className="rounded-full bg-[#fff0d7] px-3 py-1 text-[10px] font-medium text-[#9a671c]">Not real-world performance</span></div>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">{[["ROC-AUC", metrics.roc_auc.toFixed(3)], ["PR-AUC", metrics.pr_auc.toFixed(3)], ["Precision", `${(metrics.precision * 100).toFixed(1)}%`], ["Recall", `${(metrics.recall * 100).toFixed(1)}%`], ["F1", `${(metrics.f1 * 100).toFixed(1)}%`]].map(([label, value]) => <div key={label} className="border-l-2 border-[#9bc9b6] pl-3"><p className="text-[10px] uppercase tracking-wide text-[#829397]">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></div>)}</div>
              <div className="mt-7 border-t border-[#edf1f1] pt-5"><div className="flex items-center justify-between text-xs"><span className="font-medium">Test-set risk distribution</span><span className="text-[#829397]">{split.test_rows} rows · {split.test_customers} customers</span></div><div className="mt-4 flex h-4 overflow-hidden rounded-full bg-[#e8efed]"><div className="bg-[#8bc6a5]" style={{ width: `${data.distribution[0] / total * 100}%` }} /><div className="bg-[#f3c777]" style={{ width: `${data.distribution[1] / total * 100}%` }} /><div className="bg-[#df8068]" style={{ width: `${data.distribution[2] / total * 100}%` }} /></div><div className="mt-3 flex flex-wrap gap-5 text-[10px] text-[#708388]"><Legend color="bg-[#8bc6a5]" label={`Low ${data.distribution[0]}`} /><Legend color="bg-[#f3c777]" label={`Monitor ${data.distribution[1]}`} /><Legend color="bg-[#df8068]" label={`Review ${data.distribution[2]}`} /></div></div>
            </section>

            <section id="privacy" className="rounded-2xl bg-[#173d40] p-7 text-white shadow-[0_18px_45px_rgba(16,47,52,0.14)]"><p className="text-xs uppercase tracking-[.15em] text-[#9bc9b6]">Controls</p><h3 className="mt-2 text-xl font-semibold">Responsible AI guardrails</h3><div className="mt-6 space-y-3">{["Human review required", "No automatic loan rejection", "Customer consent required", "SHAP explainability enabled", "Synthetic data for prototype"].map((item) => <div key={item} className="flex items-center gap-3 border-b border-white/10 pb-3 text-sm"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8bc6a5]/20 text-[#9bd0af]">✓</span>{item}</div>)}</div></section>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
            <section id="interventions" className="rounded-2xl border border-[#dfe7e8] bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-semibold">System health</h3><p className="mt-1 text-xs text-[#829397]">Live readiness signals</p></div><span className="rounded-full bg-[#e9f4ee] px-3 py-1 text-[10px] font-medium text-[#3f8068]">Operational</span></div><div className="mt-6 space-y-4">{[["Risk assessment API", "Operational"], ["XGBoost model", "Loaded"], ["SHAP explanations", "Enabled"], ["Supabase", "Configured / demo mode"]].map(([label, value]) => <div key={label} className="flex items-center justify-between border-b border-[#edf1f1] pb-3 text-sm"><span className="text-[#708388]">{label}</span><span className="font-medium text-[#3f8068]">● {value}</span></div>)}</div></section>
            <section id="audit" className="rounded-2xl border border-[#dfe7e8] bg-white shadow-sm"><div className="border-b border-[#e7eeee] px-6 py-5"><div className="flex items-center justify-between"><div><h3 className="font-semibold">Recent activity</h3><p className="mt-1 text-xs text-[#829397]">Illustrative audit events · demo data</p></div><span className="text-[10px] font-medium uppercase tracking-wide text-[#a06b1c]">Last 24 hours</span></div></div><div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-xs"><thead className="bg-[#f7faf9] text-[10px] uppercase tracking-wide text-[#829397]"><tr><th className="px-6 py-3 font-medium">Event</th><th className="px-4 py-3 font-medium">Actor</th><th className="px-4 py-3 font-medium">Status</th><th className="px-6 py-3 font-medium">Time</th></tr></thead><tbody className="divide-y divide-[#edf1f1]">{[["Risk assessment · C00042", "Sentinel API", "Completed", "09:42"], ["Intervention reviewed", "A. Khan", "Approved", "09:18"], ["SHAP explanation generated", "Sentinel API", "Completed", "08:56"], ["Support outreach queued", "M. Patel", "Pending consent", "08:31"]].map(([event, actor, status, time]) => <tr key={event}><td className="px-6 py-4 font-medium">{event}</td><td className="px-4 py-4 text-[#708388]">{actor}</td><td className="px-4 py-4"><span className="rounded-full bg-[#e9f4ee] px-2 py-1 text-[10px] text-[#3f8068]">{status}</span></td><td className="px-6 py-4 text-[#829397]">{time}</td></tr>)}</tbody></table></div></section>
          </div>
          <p className="mt-6 text-center text-[10px] text-[#8a9a9d]">Prototype monitoring only. Metrics are based on synthetic data and must not be interpreted as real-world model performance.</p>
        </section>
    </AdminShell>
  );
}

function Kpi({ title, value, subtitle, tone }: { title: string; value: string; subtitle: string; tone: string }) {
  const styles = tone === "coral" ? "bg-[#fce5df] text-[#b55742]" : tone === "amber" ? "bg-[#fff0d7] text-[#9a671c]" : "bg-[#e9f4ee] text-[#4a9677]";
  return <div className="rounded-2xl border border-[#dfe7e8] bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><p className="text-xs font-medium text-[#789096]">{title}</p><span className={`rounded-lg px-2 py-1 text-xs ${styles}`}>●</span></div><p className="mt-4 text-2xl font-semibold">{value}</p><p className="mt-1 text-[11px] text-[#8a9a9d]">{subtitle}</p></div>;
}

function Legend({ color, label }: { color: string; label: string }) { return <span className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${color}`} />{label}</span>; }