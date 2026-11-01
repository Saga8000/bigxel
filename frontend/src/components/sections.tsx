import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { DemoNote } from "./ui";

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-slate-600">{subtitle}</p>}
    </div>
  );
}

export interface Stat {
  icon: LucideIcon;
  value: string;
  label: string;
}

export function StatsStrip({ stats, dark = false, note = true }: { stats: Stat[]; dark?: boolean; note?: boolean }) {
  return (
    <div>
      <div
        className={`grid grid-cols-2 gap-y-6 rounded-2xl px-4 py-6 sm:px-8 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none lg:divide-x ${
          dark
            ? "bg-gradient-to-r from-navy-900 to-navy-700 text-white lg:divide-white/10"
            : "border border-slate-100 bg-slate-50/70 lg:divide-slate-200"
        }`}
      >
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex items-center justify-center gap-3 px-2 sm:gap-4">
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${dark ? "bg-white/10 text-brand-300" : "bg-brand-100/70 text-brand-600"}`}>
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className={`text-xl font-bold sm:text-2xl ${dark ? "text-white" : "text-slate-900"}`}>{value}</p>
              <p className={`text-xs sm:text-sm ${dark ? "text-white/75" : "text-slate-600"}`}>{label}</p>
            </div>
          </div>
        ))}
      </div>
      {note && <DemoNote className="mt-2">Illustrative figures for the design preview — not actual platform data.</DemoNote>}
    </div>
  );
}

export function FeatureItem({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="group">
      <span className="icon-badge transition group-hover:bg-brand-600 group-hover:text-white">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-sm font-bold">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">{children}</p>
    </div>
  );
}

export function CtaBanner({
  icon: Icon,
  title,
  text,
  cta,
  to,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  cta: string;
  to: string;
}) {
  return (
    <div className="flex flex-col items-start gap-5 rounded-2xl bg-banner-gradient px-6 py-7 text-white shadow-glow sm:flex-row sm:items-center sm:px-10">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white text-brand-600">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </span>
      <div className="flex-1">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/85">{text}</p>
      </div>
      <Link to={to} className="btn bg-white px-6 py-3 text-brand-700 hover:bg-brand-50">
        {cta} <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export function CheckList({ items, tone = "brand" }: { items: string[]; tone?: "brand" | "green" }) {
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
          <svg viewBox="0 0 20 20" className={`mt-0.5 h-4 w-4 shrink-0 ${tone === "green" ? "text-emerald-500" : "text-brand-600"}`} aria-hidden="true">
            <circle cx="10" cy="10" r="10" fill="currentColor" />
            <path d="M6 10.5l2.5 2.5L14 7.5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {i}
        </li>
      ))}
    </ul>
  );
}
