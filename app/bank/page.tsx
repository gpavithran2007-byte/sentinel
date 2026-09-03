"use client";

import { useEffect, useState } from "react";

type RiskAssessment = {
  risk: {
    risk_score: number;
    distress_probability: number;
    prediction: number;
    risk_level: string;
    top_factors: Array<{ feature: string; impact: number }>;
  };
  recommendation: { action: string; message: string };
};

type Customer = {
  id: string;
  name: string;
  initials: string;
  location: string;
  score: number;
  confidence: number;
  status: string;
  signal: string;
  detail: string;
  income: string;
  spending: string;
  payments: string;
};

const customers: Customer[] = [
  {
    id: "C00001",
    name: "Maya Thompson",
    initials: "MT",
    location: "Birmingham · 5 products",
    score: 78,
    confidence: 91,
    status: "Needs review",
    signal: "Cash-flow pressure",
    detail:
      "Balance has fallen below the customer's usual buffer after two consecutive income gaps.",
    income: "−18%",
    spending: "+11%",
    payments: "1 late",
  },
  {
    id: "C00002",
    name: "Daniel Okafor",
    initials: "DO",
    location: "Leeds · 3 products",
    score: 64,
    confidence: 86,
    status: "Monitor",
    signal: "Repayment strain",
    detail:
      "A new short-term credit line and a missed minimum payment appeared this month.",
    income: "−7%",
    spending: "+4%",
    payments: "1 missed",
  },
  {
    id: "C00003",
    name: "Priya Shah",
    initials: "PS",
    location: "Manchester · 4 products",
    score: 51,
    confidence: 82,
    status: "Monitor",
    signal: "Spending shift",
    detail:
      "Essential spending has risen, but the customer still maintains a healthy buffer.",
    income: "+2%",
    spending: "+9%",
    payments: "On time",
  },
];

export default function BankDashboard() {
  const [selected, setSelected] = useState(customers[0]);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [assessmentLoading, setAssessmentLoading] = useState(true);
  const [assessmentError, setAssessmentError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/risk-assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: selected.id }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Risk assessment unavailable");
        return (await response.json()) as RiskAssessment;
      })
      .then((result) => setAssessment(result))
      .catch((error: Error) => {
        if (error.name !== "AbortError") {
          setAssessment(null);
          setAssessmentError("Live assessment unavailable. Showing demo case data.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAssessmentLoading(false);
      });

    return () => controller.abort();
  }, [selected.id]);

  const riskScore = assessment?.risk.risk_score ?? selected.score;
  const probability = assessment
    ? Math.round(assessment.risk.distress_probability * 100)
    : selected.confidence;
  const factors = assessment?.risk.top_factors.filter((factor) => factor.impact > 0).slice(0, 3);
  const recommendation = assessment?.recommendation.message ??
    "Offer a 15-minute financial wellbeing call and review repayment flexibility.";

  const showNotice = (message: string) => {
    setNotice(message);

    setTimeout(() => {
      setNotice("");
    }, 3000);
  };

  const prepareOutreach = () => {
    localStorage.setItem(
      "sentinel_intervention",
      JSON.stringify({
        customer: selected.name,
        signal: selected.signal,
        recommendation:
          "Offer a 15-minute financial wellbeing call and review repayment flexibility.",
        createdAt: new Date().toISOString(),
      })
    );

    showNotice(`Support intervention prepared for ${selected.name}`);
  };

  return (
    <main className="min-h-screen bg-[#f4f7f6] text-[#17343a]">

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-[245px] flex-col bg-[#102f34] px-5 py-7 text-white lg:flex">

        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e2f2e8] text-[#28634e]">
            🛡
          </div>

          <div>
            <p className="font-semibold">Sentinel</p>
            <p className="text-[9px] uppercase tracking-[.2em] text-[#9bb8b1]">
              Financial care
            </p>
          </div>
        </div>

        <nav className="mt-14 space-y-2 text-sm">

          <a
            href="#overview"
            className="block rounded-xl bg-white/10 px-4 py-3 font-medium"
          >
            Overview
          </a>

          <a
            href="#signals"
            className="block rounded-xl px-4 py-3 text-[#a9c2bd] hover:bg-white/5 hover:text-white"
          >
            Early signals
            <span className="ml-2 rounded-full bg-[#e77d63] px-2 py-0.5 text-[10px]">
              12
            </span>
          </a>

          <a
            href="#intervention"
            className="block rounded-xl px-4 py-3 text-[#a9c2bd] hover:bg-white/5 hover:text-white"
          >
            Interventions
          </a>

        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.05] p-4">
          <p className="text-xs font-medium">Responsible intervention</p>

          <p className="mt-2 text-[11px] leading-5 text-[#a9c2bd]">
            AI recommendations are explainable. Officers review every
            intervention before customer contact.
          </p>

          <div className="mt-4 text-[10px] text-[#9bd0af]">
            ● All systems operational
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-[245px]">

        <header className="flex h-[76px] items-center justify-between border-b border-[#dfe7e8] bg-white px-6 sm:px-10">
          <div>
            <p className="text-xs uppercase tracking-[.16em] text-[#789096]">
              Sentinel Bank Operations
            </p>

            <h1 className="mt-1 text-xl font-semibold">
              Good morning, Aisha
            </h1>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbece3] text-xs font-semibold text-[#28634e]">
            AK
          </div>
        </header>

        <section
          id="overview"
          className="mx-auto max-w-[1400px] px-6 py-8 sm:px-10"
        >

          {/* Heading */}
          <div>
            <p className="text-sm font-medium text-[#3f8068]">
              Portfolio health
            </p>

            <h2 className="mt-1 text-3xl font-semibold tracking-[-.035em]">
              Support before stress compounds.
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-[#708388]">
              Sentinel continuously looks for changes in financial resilience
              and brings explainable cases to human officers.
            </p>
          </div>

          {/* Stats */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <Stat
              title="Customers monitored"
              value="24,681"
              subtitle="Across portfolio"
            />

            <Stat
              title="Need review"
              value="12"
              subtitle="3 new today"
              alert
            />

            <Stat
              title="Support in progress"
              value="38"
              subtitle="71% accepted"
            />

            <Stat
              title="Resolved this month"
              value="86%"
              subtitle="↑ 8% from August"
            />

          </div>

          {/* Main Grid */}
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">

            {/* Customer Queue */}
            <section
              id="signals"
              className="rounded-2xl border border-[#dfe7e8] bg-white shadow-sm"
            >

              <div className="border-b border-[#e7eeee] px-6 py-5">
                <h3 className="font-semibold">
                  Early signal queue
                </h3>

                <p className="mt-1 text-xs text-[#829397]">
                  Customers ranked by change in financial resilience
                </p>
              </div>

              <div className="divide-y divide-[#edf1f1]">

                {customers.map((customer) => (
                  <button
                    key={customer.name}
                    onClick={() => {
                      setAssessmentLoading(true);
                      setAssessmentError("");
                      setAssessment(null);
                      setSelected(customer);
                    }}
                    className={`flex w-full items-center gap-4 px-6 py-5 text-left transition hover:bg-[#f7faf9] ${
                      selected.name === customer.name
                        ? "bg-[#f0f8f4]"
                        : ""
                    }`}
                  >

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e1eee8] text-xs font-semibold text-[#28634e]">
                      {customer.initials}
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">
                          {customer.name}
                        </p>

                        <span
                          className={`hidden rounded-full px-2 py-1 text-[10px] sm:inline ${
                            customer.status === "Needs review"
                              ? "bg-[#fce5df] text-[#a54f3c]"
                              : "bg-[#fff0d7] text-[#9a671c]"
                          }`}
                        >
                          {customer.status}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-[#8a9a9d]">
                        {customer.location}
                      </p>

                    </div>

                    <div className="text-right">
                      <p
                        className={`text-lg font-semibold ${
                          (assessment && customer.id === selected.id ? riskScore : customer.score) >= 70
                            ? "text-[#bd634f]"
                            : "text-[#a06b1c]"
                        }`}
                      >
                        {assessment && customer.id === selected.id ? riskScore : customer.score}
                      </p>

                      <p className="text-[9px] uppercase tracking-wide text-[#96a4a7]">
                        risk
                      </p>
                    </div>

                  </button>
                ))}

              </div>

              <div className="border-t border-[#e7eeee] px-6 py-4">
                <p className="text-xs font-medium text-[#3d8067]">
                  View all 12 flagged customers →
                </p>
              </div>

            </section>

            {/* Case Detail */}
            <section
              id="intervention"
              className="rounded-2xl bg-[#173d40] p-6 text-white shadow-lg"
            >

              <p className="text-xs uppercase tracking-[.15em] text-[#9bc9b6]">
                AI-assisted case review
              </p>

              <div className="mt-3 flex items-start justify-between">

                <div>
                  <h3 className="text-xl font-semibold">
                    {selected.name}
                  </h3>

                  <p className="mt-1 text-xs text-[#b1cbc5]">
                    {selected.location}
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 px-4 py-2 text-right">
                  <p className="text-2xl font-semibold text-[#f5c4a4]">
                    {assessmentLoading ? "..." : riskScore}
                  </p>

                  <p className="text-[9px] uppercase tracking-wide text-[#b1cbc5]">
                    risk score
                  </p>
                </div>

              </div>

              {assessmentError && (
                <div className="mt-4 rounded-lg border border-[#f5c4a4]/30 bg-[#f5c4a4]/10 px-3 py-2 text-[10px] text-[#f5c4a4]">
                  {assessmentError}
                </div>
              )}

              {/* AI explanation */}
              <div className="mt-6 rounded-xl border border-white/10 bg-white/[.06] p-5">

                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#f2d8c8]">
                    Why Sentinel flagged this case
                  </p>

                  <span className="text-[10px] text-[#a9c2bd]">
                    {assessmentLoading ? "Assessing..." : `${probability}% probability`}
                  </span>
                </div>

                {factors?.length ? (
                  <div className="mt-3 space-y-2">
                    {factors.map((factor) => (
                      <div key={factor.feature} className="flex items-center justify-between gap-3 text-xs">
                        <span className="text-[#dceae5]">{factor.feature.replaceAll("_", " ")}</span>
                        <span className="text-[#f5c4a4]">+{Math.abs(factor.impact).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="mt-3 text-sm font-medium">{selected.signal}</p>
                    <p className="mt-2 text-xs leading-5 text-[#a9c2bd]">{selected.detail}</p>
                  </>
                )}

              </div>

              {/* Signals */}
              <div className="mt-5 grid grid-cols-3 gap-2">

                <MiniMetric
                  label="Income"
                  value={selected.income}
                />

                <MiniMetric
                  label="Spending"
                  value={selected.spending}
                />

                <MiniMetric
                  label="Payments"
                  value={selected.payments}
                />

              </div>

              {/* Intervention */}
              <div className="mt-6">

                <p className="text-xs font-medium text-[#b1cbc5]">
                  Recommended intervention
                </p>

                <div className="mt-2 rounded-xl border border-[#8bc6a5]/20 bg-[#8bc6a5]/10 p-4">

                  <p className="text-sm leading-6">
                    {recommendation}
                  </p>

                  <p className="mt-2 text-[10px] text-[#9bc9b6]">
                    AI recommendation · Officer approval required
                  </p>

                </div>

              </div>

              <div className="mt-5 flex gap-2">

                <button
                  onClick={prepareOutreach}
                  className="flex-1 rounded-lg bg-[#d9f0df] px-4 py-3 text-xs font-semibold text-[#245544] transition hover:bg-white"
                >
                  Prepare outreach
                </button>

                <button
                  onClick={() =>
                    showNotice("Case snoozed for 7 days.")
                  }
                  className="rounded-lg border border-white/15 px-4 py-3 text-xs text-[#c3d6d1] hover:bg-white/10"
                >
                  Snooze
                </button>

              </div>

              <p className="mt-5 text-[10px] leading-4 text-[#8eafaa]">
                Sentinel does not automatically reject loans, change credit
                limits, or penalize customers. Human review and customer
                consent remain required.
              </p>

            </section>

          </div>
        </section>
      </div>

      {/* Notification */}
      {notice && (
        <div className="fixed bottom-6 right-6 rounded-xl bg-[#173d40] px-5 py-3 text-sm text-white shadow-xl">
          {notice}
        </div>
      )}

    </main>
  );
}

function Stat({
  title,
  value,
  subtitle,
  alert = false,
}: {
  title: string;
  value: string;
  subtitle: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#dfe7e8] bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#789096]">
          {title}
        </p>

        <span
          className={`rounded-lg px-2 py-1 text-xs ${
            alert
              ? "bg-[#fce5df] text-[#b55742]"
              : "bg-[#e9f4ee] text-[#4a9677]"
          }`}
        >
          ●
        </span>
      </div>

      <p className="mt-4 text-2xl font-semibold">
        {value}
      </p>

      <p className="mt-1 text-[11px] text-[#8a9a9d]">
        {subtitle}
      </p>

    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/[.06] p-3">
      <p className="text-[10px] text-[#8eafaa]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}