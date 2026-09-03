"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  ["Overview", "/admin"],
  ["Model Performance", "/admin/model-performance"],
  ["Interventions", "/admin/interventions"],
  ["Data & Privacy", "/admin/data-privacy"],
  ["Audit", "/admin/audit"],
] as const;

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-[245px] flex-col bg-[#102f34] px-5 py-7 text-white lg:flex">
      <Link href="/admin" className="flex items-center gap-3 px-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e2f2e8] text-[#28634e]">🛡</div>
        <div><p className="font-semibold">Sentinel</p><p className="text-[9px] uppercase tracking-[.2em] text-[#9bb8b1]">Administration</p></div>
      </Link>
      <nav className="mt-14 space-y-2 text-sm" aria-label="Administrator navigation">
        {navigation.map(([label, href]) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return <Link key={href} href={href} className={`block rounded-xl px-4 py-3 ${active ? "bg-white/10 font-medium text-white" : "text-[#a9c2bd] hover:bg-white/5 hover:text-white"}`}>{label}</Link>;
        })}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.05] p-4">
        <p className="text-xs font-medium">Governance status</p>
        <p className="mt-2 text-[11px] leading-5 text-[#a9c2bd]">Human oversight is active across every intervention workflow.</p>
        <div className="mt-4 text-[10px] text-[#9bd0af]">● Prototype environment</div>
      </div>
    </aside>
  );
}

export function AdminHeader({ eyebrow = "Sentinel Administration" }: { eyebrow?: string }) {
  return <header className="flex min-h-[76px] items-center justify-between border-b border-[#dfe7e8] bg-white px-6 py-5 sm:px-10"><div><p className="text-xs uppercase tracking-[.16em] text-[#789096]">{eyebrow}</p><h1 className="mt-1 max-w-3xl text-xl font-semibold tracking-[-.02em]">System health, model monitoring and responsible AI oversight</h1></div><div className="hidden h-9 items-center rounded-full bg-[#e9f4ee] px-3 text-[10px] font-medium text-[#3f8068] sm:flex">DEMO ENVIRONMENT</div></header>;
}

export function AdminShell({ children, eyebrow }: { children: ReactNode; eyebrow?: string }) {
  return <main className="min-h-screen bg-[#f4f7f6] text-[#17343a]"><AdminSidebar /><div className="lg:pl-[245px]"><AdminHeader eyebrow={eyebrow} />{children}</div></main>;
}
