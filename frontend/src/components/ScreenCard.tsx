import { BarChart3, Clock, Monitor, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";
import { formatINR, formatNumber } from "../lib/format";
import type { Screen } from "../lib/types";
import { DemoBadge } from "./ui";

function badgeFor(s: Screen) {
  if (s.daily_footfall >= 20000) return { label: "High Footfall", cls: "bg-brand-600" };
  if (s.price_per_month >= 15000) return { label: "Premium", cls: "bg-amber-500" };
  if (s.daily_footfall >= 2000) return { label: "Popular", cls: "bg-emerald-500" };
  return { label: "New", cls: "bg-brand-500" };
}

export default function ScreenCard({ screen, bookTo }: { screen: Screen; bookTo?: string }) {
  const badge = badgeFor(screen);
  const detail = `/screens/${screen.id}`;
  const rows = [
    { icon: BarChart3, label: "Daily Footfall", value: `${formatNumber(screen.daily_footfall)}+` },
    { icon: Monitor, label: "Screen Size", value: `${screen.size_inches} inch` },
    { icon: ScanLine, label: "Resolution", value: screen.resolution },
    { icon: Clock, label: "Hours", value: screen.operating_hours },
  ];
  return (
    <article className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link to={detail} className="relative block aspect-[3/2] overflow-hidden bg-slate-100">
        {screen.image_url ? (
          <img
            src={screen.image_url}
            alt={`${screen.name} screen`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-slate-400">
            <Monitor className="h-10 w-10" />
          </div>
        )}
        <span className={`absolute left-3 top-3 rounded-md px-2 py-0.5 text-xs font-semibold text-white ${badge.cls}`}>
          {badge.label}
        </span>
        {screen.is_demo && (
          <span className="absolute right-3 top-3">
            <DemoBadge label="Demo listing" />
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold">
          <Link to={detail} className="hover:text-brand-700">
            {screen.name}
            {screen.area ? `, ${screen.area}` : ""}
          </Link>
        </h3>
        <p className="text-sm text-slate-500">
          {screen.placement} · {screen.city}
        </p>
        <dl className="mt-3 space-y-1.5 text-sm">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-2 text-slate-500">
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </dt>
              <dd className="text-right font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-4">
          <p>
            <span className="text-lg font-bold text-brand-700">{formatINR(screen.price_per_month)}</span>
            <span className="text-xs text-slate-500"> / month</span>
          </p>
          <Link to={bookTo ?? detail} className="btn-primary btn-sm px-3.5 py-2">
            Book Now
          </Link>
        </div>
        {screen.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {screen.tags.map((t) => (
              <span key={t} className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
