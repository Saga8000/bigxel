import { Monitor, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../../components/dashboard";
import { Alert, EmptyState, PageLoader, StatusBadge } from "../../components/ui";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api, ApiError } from "../../lib/api";
import { formatINR, formatNumber } from "../../lib/format";
import type { OwnerScreen } from "../../lib/types";

export default function MyScreens() {
  const { data, error, loading, reload } = useApi(() => api.get<OwnerScreen[]>("/api/owner/screens"));
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  if (loading) return <PageLoader />;
  if (error || !data) return <Alert tone="error">{error}</Alert>;

  const remove = async (s: OwnerScreen) => {
    if (!window.confirm(`Delete "${s.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/owner/screens/${s.id}`);
      setMsg({ tone: "success", text: "Screen deleted." });
      void reload();
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof ApiError ? e.message : "Delete failed" });
    }
  };

  return (
    <>
      <PageHeader title="My Screens" subtitle="Register and manage your digital screens." actions={<Link to="/owner/screens/new" className="btn-primary"><PlusCircle className="h-4 w-4" /> Add Screen</Link>} />
      {msg && <Alert tone={msg.tone} className="mb-4" onClose={() => setMsg(null)}>{msg.text}</Alert>}
      {data.length === 0 ? (
        <EmptyState title="No screens yet" action={<Link to="/owner/screens/new" className="btn-primary">Add your first screen</Link>}>Screens are reviewed by our team before advertisers can book them.</EmptyState>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((s) => (
            <article key={s.id} className="card flex gap-4 p-4">
              <div className="h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {s.image_url ? <img src={s.image_url} alt="" className="h-full w-full object-cover" /> : <Monitor className="m-auto mt-8 h-8 w-8 text-slate-400" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate font-semibold">{s.name}</h2>
                  <StatusBadge status={s.is_active ? s.status : "inactive"} />
                </div>
                <p className="text-sm text-slate-500">{s.area ? `${s.area}, ` : ""}{s.city} · {s.category}</p>
                <p className="mt-1 text-sm text-slate-700">{formatINR(s.price_per_month)}/month · {formatNumber(s.daily_footfall)} daily footfall</p>
                {s.status === "rejected" && s.review_note && <p className="mt-1 text-xs text-rose-600">Review note: {s.review_note}</p>}
                <div className="mt-3 flex gap-2">
                  <Link to={`/owner/screens/${s.id}/edit`} className="btn-outline btn-sm"><Pencil className="h-3.5 w-3.5" /> Edit</Link>
                  <button type="button" onClick={() => remove(s)} className="btn-ghost btn-sm text-rose-600"><Trash2 className="h-3.5 w-3.5" /> Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
