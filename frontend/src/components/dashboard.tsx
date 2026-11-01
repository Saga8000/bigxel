import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../lib/api";
import { formatINR, formatMonth } from "../lib/format";

export function StatCard({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string | number; hint?: string }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <span className="icon-badge"><Icon className="h-6 w-6" aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="truncate text-xl font-bold text-slate-900">{value}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}

export function BarChart({ data, empty = "No data yet" }: { data: { month: string; amount: number }[]; empty?: string }) {
  if (!data.length) return <p className="py-10 text-center text-sm text-slate-500">{empty}</p>;
  const max = Math.max(...data.map((d) => d.amount), 1);
  return (
    <div className="flex h-48 items-end gap-3 overflow-x-auto pt-6" role="img" aria-label="Monthly totals chart">
      {data.map((d) => (
        <div key={d.month} className="flex min-w-[48px] flex-1 flex-col items-center gap-2">
          <span className="text-[11px] font-medium text-slate-600">{formatINR(d.amount)}</span>
          <div className="w-full max-w-[44px] rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400" style={{ height: `${Math.max(4, (d.amount / max) * 120)}px` }} />
          <span className="text-xs text-slate-500">{formatMonth(d.month)}</span>
        </div>
      ))}
    </div>
  );
}

export function useApi<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(loader, deps);
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await load());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load data");
    } finally {
      setLoading(false);
    }
  }, [load]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, error, loading, reload, setData };
}

export function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="card table-wrap">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>{head.map((h) => <th key={h} scope="col" className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export const td = "px-4 py-3 align-middle";
