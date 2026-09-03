"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Role = "customer" | "bank" | "admin";

const roles = [
  {
    id: "customer" as Role,
    label: "Customer",
    description: "View your financial wellbeing",
  },
  {
    id: "bank" as Role,
    label: "Bank Officer",
    description: "Identify and support customers",
  },
  {
    id: "admin" as Role,
    label: "Administrator",
    description: "Manage Sentinel intelligence",
  },
];

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
      <path d="M12 3 5 6v5c0 4.8 2.9 8.4 7 10 4.1-1.6 7-5.2 7-10V6l-7-3Z" />
      <path d="m9.5 12 1.7 1.7 3.5-3.7" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();

  const [role, setRole] = useState<Role>("bank");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);

    setTimeout(() => {
      if (role === "customer") {
        router.push("/customer");
      } else {
        router.push("/bank");
      }
    }, 700);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#061014] text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-400/[0.07] blur-[130px]" />
        <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-500/[0.07] blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-[1400px] flex-col px-6 py-6 lg:px-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] text-cyan-300">
              <ShieldIcon />
            </div>

            <div>
              <p className="text-lg font-semibold">Sentinel</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/35">
                Financial Intelligence
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/45 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            System operational
          </div>
        </header>

        {/* Main */}
        <section className="flex flex-1 items-center justify-center py-12">
          <div className="grid w-full max-w-[1150px] items-center gap-16 lg:grid-cols-[1fr_470px]">

            {/* Left */}
            <div className="hidden lg:block">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/10 bg-cyan-300/[0.05] px-4 py-2 text-xs text-cyan-200">
                <span className="h-2 w-2 rounded-full bg-cyan-300" />
                Proactive financial protection
              </div>

              <h1 className="max-w-[650px] text-6xl font-semibold leading-[1.05] tracking-[-0.05em]">
                See financial stress
                <span className="block bg-gradient-to-r from-cyan-200 to-blue-400 bg-clip-text text-transparent">
                  before it becomes a crisis.
                </span>
              </h1>

              <p className="mt-7 max-w-[580px] text-base leading-7 text-white/45">
                Sentinel identifies early changes in financial behaviour,
                explains why a customer may need support, and helps banks
                intervene before financial distress becomes a crisis.
              </p>

              <div className="mt-10 grid max-w-[600px] grid-cols-3 gap-3">
                {[
                  ["Early", "Risk detection"],
                  ["Explainable", "AI insights"],
                  ["Human-led", "Intervention"],
                ].map(([title, text]) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"
                  >
                    <p className="text-sm font-medium">{title}</p>
                    <p className="mt-1 text-xs leading-5 text-white/35">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Login Card */}
            <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-2 shadow-2xl backdrop-blur-2xl">
              <div className="rounded-[22px] border border-white/[0.06] bg-[#091219]/95 p-7 sm:p-9">

                <div className="mb-8">
                  <p className="text-2xl font-semibold tracking-tight">
                    Welcome to Sentinel
                  </p>

                  <p className="mt-2 text-sm text-white/35">
                    Choose your secure access portal.
                  </p>
                </div>

                {/* Role */}
                <div className="mb-7">
                  <label className="mb-3 block text-[11px] font-medium uppercase tracking-[0.16em] text-white/35">
                    Access portal
                  </label>

                  <div className="grid grid-cols-3 gap-1 rounded-xl border border-white/[0.07] bg-white/[0.025] p-1">
                    {roles.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRole(item.id)}
                        className={`rounded-lg px-2 py-3 text-xs font-medium transition ${
                          role === item.id
                            ? "bg-white/10 text-white shadow-sm"
                            : "text-white/35 hover:bg-white/[0.04] hover:text-white/70"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-white/30">
                    {roles.find((r) => r.id === role)?.description}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/60">
                      Email address
                    </label>

                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 text-sm outline-none placeholder:text-white/20 focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/[0.05]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-white/60">
                      Password
                    </label>

                    <div className="relative">
                      <input
                        type={passwordVisible ? "text" : "password"}
                        required
                        placeholder="Enter your password"
                        className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 pr-12 text-sm outline-none placeholder:text-white/20 focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/[0.05]"
                      />

                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30 hover:text-white"
                      >
                        {passwordVisible ? "Hide" : "Show"}
                      </button>
                    </div>
                  </div>

                  <button
                    disabled={loading}
                    className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-cyan-300 to-blue-400 text-sm font-semibold text-[#041018] transition hover:scale-[1.01] disabled:opacity-60"
                  >
                    {loading ? "Authenticating..." : "Continue securely →"}
                  </button>
                </form>

                <div className="mt-7 border-t border-white/[0.06] pt-5 text-center text-[10px] uppercase tracking-[0.12em] text-white/25">
                  🛡 Secure access · Human-reviewed decisions
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/[0.05] pt-4 text-center text-[10px] uppercase tracking-[0.14em] text-white/20">
          Sentinel © 2026 · Responsible AI · Financial resilience
        </footer>
      </div>
    </main>
  );
}