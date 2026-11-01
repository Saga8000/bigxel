import { Check, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Table, td, useApi } from "../../components/dashboard";
import { Alert, EmptyState, PageLoader, StatusBadge } from "../../components/ui";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api, ApiError, qs } from "../../lib/api";
import { formatDate, formatINR, statusLabel } from "../../lib/format";
import type { OwnerBooking } from "../../lib/types";

const FILTERS = ["", "pending", "approved", "rejected", "cancelled"];

export default function OwnerBookings() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const { data, error, loading, reload } = useApi(() => api.get<OwnerBooking[]>(`/api/owner/bookings${qs({ status })}`), [status]);
  const [busy, setBusy] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const decide = async (b: OwnerBooking, approve: boolean) => {
    let note: string | null = null;
    if (!approve) {
      note = window.prompt("Reason for declining (shared with the advertiser):", "");
      if (note === null) return;
    }
    setBusy(b.id);
    try {
      await api.post(`/api/owner/bookings/${b.id}/${approve ? "approve" : "reject"}`, { note: note || null });
      setMsg({ tone: "success", text: approve ? "Booking approved — earning added." : "Booking declined — advertiser refunded." });
      void reload();
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof ApiError ? e.message : "Action failed" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader title="Bookings" subtitle="Review the ads advertisers want to run on your screens." />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button key={f} type="button" aria-pressed={status === f} onClick={() => setParams(f ? { status: f } : {})} className={`rounded-full px-3 py-1 text-xs font-medium ${status === f ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300"}`}>
            {f ? statusLabel(f) : "All"}
          </button>
        ))}
      </div>
      {msg && <Alert tone={msg.tone} className="mb-4" onClose={() => setMsg(null)}>{msg.text}</Alert>}
      {loading ? <PageLoader /> : error || !data ? <Alert tone="error">{error}</Alert> : data.length === 0 ? (
        <EmptyState title="No bookings yet">When advertisers book your screens, requests appear here for approval.</EmptyState>
      ) : (
        <Table head={["Ad", "Screen", "Advertiser", "Dates", "Your share", "Status", "Actions"]}>
          {data.map((b) => (
            <tr key={b.id}>
              <td className={td}>
                <a href={b.campaign.creative_url} target="_blank" rel="noreferrer" className="block h-12 w-16 overflow-hidden rounded bg-slate-100" aria-label={`View creative for ${b.campaign.name}`}>
                  {b.campaign.creative_type === "video" ? <video src={b.campaign.creative_url} muted className="h-full w-full object-cover" /> : <img src={b.campaign.creative_url} alt="" className="h-full w-full object-cover" />}
                </a>
              </td>
              <td className={`${td} font-medium text-slate-900`}>{b.screen.name}</td>
              <td className={td}>{b.advertiser_name}<span className="block text-xs text-slate-500">{b.campaign.name}</span></td>
              <td className={td}>{formatDate(b.start_date)} – {formatDate(b.end_date)}</td>
              <td className={td}>{formatINR(b.owner_share)}<span className="block text-xs text-slate-500">of {formatINR(b.amount)}</span></td>
              <td className={td}><StatusBadge status={b.status} /></td>
              <td className={td}>
                {b.status === "pending" ? (
                  <div className="flex gap-2">
                    <button type="button" className="btn-primary btn-sm" disabled={busy === b.id} onClick={() => decide(b, true)}><Check className="h-3.5 w-3.5" /> Approve</button>
                    <button type="button" className="btn-outline btn-sm" disabled={busy === b.id} onClick={() => decide(b, false)}><X className="h-3.5 w-3.5" /> Decline</button>
                  </div>
                ) : <span className="text-xs text-slate-500">{b.decision_note ?? "—"}</span>}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
