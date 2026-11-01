import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Table, td, useApi } from "../../components/dashboard";
import { Alert, PageLoader, Spinner, StatusBadge } from "../../components/ui";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api, ApiError } from "../../lib/api";
import { formatDate, formatINR, isoDate } from "../../lib/format";
import type { Campaign } from "../../lib/types";

export default function CampaignDetail() {
  const { id } = useParams();
  const { data, error, loading, setData } = useApi(() => api.get<Campaign>(`/api/advertiser/campaigns/${id}`), [id]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  if (loading) return <PageLoader />;
  if (error || !data) return <Alert tone="error">{error}</Alert>;
  const canCancel = !["cancelled", "rejected", "completed", "active"].includes(data.status) && data.start_date > isoDate(new Date());

  const cancel = async () => {
    if (!window.confirm("Cancel this campaign? Pending and approved bookings will be refunded to your wallet.")) return;
    setBusy(true);
    try {
      setData(await api.post<Campaign>(`/api/advertiser/campaigns/${data.id}/cancel`));
      setMsg({ tone: "success", text: "Campaign cancelled and refunded to your wallet." });
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof ApiError ? e.message : "Could not cancel" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/advertiser/campaigns" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline"><ArrowLeft className="h-4 w-4" /> All campaigns</Link>
      <PageHeader
        title={data.name}
        subtitle={`${formatDate(data.start_date)} – ${formatDate(data.end_date)}`}
        actions={canCancel && <button type="button" className="btn-danger" onClick={cancel} disabled={busy}>{busy && <Spinner className="h-4 w-4" />} Cancel Campaign</button>}
      />
      {msg && <Alert tone={msg.tone} className="mb-4" onClose={() => setMsg(null)}>{msg.text}</Alert>}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3"><StatusBadge status={data.status} /><span className="text-sm text-slate-600">Total {formatINR(data.total_amount)}</span></div>
          {data.objective && <p className="text-sm text-slate-700">{data.objective}</p>}
          <Table head={["Screen", "City", "Amount", "Status", "Owner note"]}>
            {data.bookings.map((b) => (
              <tr key={b.id}>
                <td className={`${td} font-medium text-slate-900`}><Link to={`/screens/${b.screen.id}`} className="hover:text-brand-700">{b.screen.name}</Link></td>
                <td className={td}>{b.screen.city}</td>
                <td className={td}>{formatINR(b.amount)}</td>
                <td className={td}><StatusBadge status={b.status} /></td>
                <td className={`${td} text-slate-500`}>{b.decision_note ?? "—"}</td>
              </tr>
            ))}
          </Table>
          <Alert tone="info">Impression and play-count tracking needs a screen player integration, which isn&apos;t connected yet. Booking status and spend are live.</Alert>
        </div>
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold">Ad creative</h2>
          {data.creative_type === "video" ? (
            <video src={data.creative_url} controls className="w-full rounded-lg bg-black" />
          ) : (
            <img src={data.creative_url} alt={`${data.name} creative`} className="w-full rounded-lg object-contain" />
          )}
        </div>
      </div>
    </>
  );
}
