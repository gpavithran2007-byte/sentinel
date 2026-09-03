"use client";

import { useEffect, useState } from "react";
import { SignOut } from "@/app/components/sign-out";

type Intervention = {
  customer: string;
  signal: string;
  recommendation: string;
};

export default function CustomerPage() {
  const [intervention, setIntervention] =
    useState<Intervention | null>(null);

  const [requested, setRequested] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sentinel_intervention");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        setIntervention(parsed);
      } catch {
        setIntervention(null);
      }
    }
  }, []);

  const requestCall = () => {
    setRequested(true);

    localStorage.setItem(
      "sentinel_customer_request",
      JSON.stringify({
        requested: true,
        requestedAt: new Date().toISOString(),
      })
    );
  };

  return (
    <main className="min-h-screen bg-[#f4f7f6] text-[#17343a]">

      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#dfe7e8] bg-white px-6 py-5 sm:px-10">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#dff1e5] text-[#28634e]">
            🛡
          </div>

          <div>
            <p className="font-semibold">
              Sentinel
            </p>

            <p className="text-[9px] uppercase tracking-[.2em] text-[#789096]">
              Your financial care plan
            </p>
          </div>

        </div>

        <div className="flex items-center gap-3">

          <span className="hidden text-xs text-[#789096] sm:block">
            Private & secure
          </span>

          <SignOut />

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dbece3] text-xs font-semibold text-[#28634e]">
            MT
          </div>

        </div>

      </header>

      {/* Main */}
      <section className="mx-auto max-w-[1000px] px-6 py-10 sm:px-10">

        <p className="text-sm font-medium text-[#3f8068]">
          Your private overview
        </p>

        <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-[-.035em] sm:text-4xl">
          A clearer month starts here.
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-[#708388]">
          Sentinel noticed some changes in your recent financial activity.
          This is an early check-in, not a judgement.
        </p>

        {/* Main Cards */}
        <div className="mt-8 grid gap-5 md:grid-cols-[1.1fr_.9fr]">

          {/* Financial Health */}
          <div className="rounded-2xl border border-[#dfe7e8] bg-white p-7 shadow-[0_12px_35px_rgba(23,61,64,0.05)]">

            <div className="flex items-start justify-between">

              <div>
                <p className="text-sm font-medium text-[#789096]">
                  Financial breathing room
                </p>

                <p className="mt-3 text-4xl font-semibold text-[#28634e]">
                  Good
                </p>
              </div>

              <span className="rounded-xl bg-[#e9f4ee] px-3 py-2 text-xs font-medium text-[#3f8068]">
                Stable
              </span>

            </div>

            <div className="mt-7 h-3 rounded-full bg-[#e8efed]">
              <div className="h-full w-[68%] rounded-full bg-[#65af88]" />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-[#edf1f1] pt-5">

              <Metric
                label="Income buffer"
                value="18 days"
              />

              <Metric
                label="Essentials"
                value="62%"
              />

              <Metric
                label="Next payment"
                value="14 Sep"
              />

            </div>

          </div>

          {/* Support */}
          <div className="rounded-2xl bg-[#173d40] p-7 text-white shadow-[0_18px_45px_rgba(16,47,52,0.14)]">

            <p className="text-xs uppercase tracking-[.15em] text-[#9bc9b6]">
              A gentle next step
            </p>

            <h2 className="mt-3 text-xl font-semibold">
              Talk it through
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#c8dcd6]">
              A financial wellbeing specialist can help you understand your
              options before anything becomes urgent.
            </p>

            {!requested ? (
              <button
                onClick={requestCall}
                className="mt-6 rounded-lg bg-[#d9f0df] px-4 py-3 text-xs font-semibold text-[#245544] transition hover:bg-white"
              >
                Request a support call
              </button>
            ) : (
              <div className="mt-6 rounded-lg bg-[#d9f0df]/15 p-3 text-xs text-[#cce9d6]">
                ✓ Your request has been sent to a financial wellbeing
                specialist.
              </div>
            )}

            <p className="mt-4 text-[10px] text-[#8eafaa]">
              Your choice. No impact on your credit score.
            </p>

          </div>

        </div>

        {/* Sentinel intervention */}
        {intervention && (
          <section className="mt-6 rounded-2xl border border-[#cde2d5] bg-white p-6 shadow-sm">

            <div className="flex items-start gap-4">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e9f4ee] text-[#3f8068]">
                ✓
              </div>

              <div className="flex-1">

                <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#3f8068]">
                  Support available
                </p>

                <h2 className="mt-2 text-lg font-semibold">
                  We noticed a little more pressure than usual
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#708388]">
                  Your recent activity shows some changes around{" "}
                  <span className="font-medium text-[#31565b]">
                    {intervention.signal.toLowerCase()}
                  </span>
                  .
                </p>

                <div className="mt-4 rounded-xl bg-[#f3f8f5] p-4">

                  <p className="text-xs font-medium text-[#3f8068]">
                    Suggested support
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#4d666a]">
                    {intervention.recommendation}
                  </p>

                </div>

                <p className="mt-4 text-[10px] text-[#8a9a9d]">
                  This recommendation is designed to support you, not
                  penalize you. You remain in control.
                </p>

              </div>

            </div>

          </section>
        )}

        {/* Monthly overview */}
        <section className="mt-6 rounded-2xl border border-[#dfe7e8] bg-white p-7 shadow-[0_12px_35px_rgba(23,61,64,0.05)]">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">
                Your financial picture
              </h2>

              <p className="mt-1 text-xs text-[#829397]">
                A simple view of the signals Sentinel watches.
              </p>
            </div>

            <span className="rounded-full bg-[#e9f4ee] px-3 py-1 text-[10px] font-medium text-[#3f8068]">
              Healthy
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">

            <OverviewCard
              title="Income"
              value="₹48,000"
              description="Regular monthly income"
            />

            <OverviewCard
              title="Essential spending"
              value="₹29,760"
              description="62% of monthly income"
            />

            <OverviewCard
              title="Payment behaviour"
              value="Stable"
              description="No persistent missed payments"
            />

          </div>

        </section>

        <p className="mt-8 text-center text-xs leading-5 text-[#8a9a9d]">
          Your information is private. Sentinel recommendations are designed
          to support, never penalize.
        </p>

      </section>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[11px] text-[#8a9a9d]">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold">
        {value}
      </p>
    </div>
  );
}

function OverviewCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[#edf1f1] bg-[#fafcfc] p-4">

      <p className="text-xs text-[#789096]">
        {title}
      </p>

      <p className="mt-2 text-lg font-semibold">
        {value}
      </p>

      <p className="mt-1 text-[10px] leading-4 text-[#8a9a9d]">
        {description}
      </p>

    </div>
  );
}