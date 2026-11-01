import { PlusCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Table, td, useApi } from "../../components/dashboard";
import { Alert, EmptyState, PageLoader, StatusBadge } from "../../components/ui";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api } from "../../lib/api";
import { formatDate, formatINR, statusLabel } from "../../lib/format";
import type { Campaign } from "../../lib/types";

const FILTERS = ["all", "pending_approval", "scheduled", "active", "completed", "rejected", "cancelled"];

export default function Campaigns() {
  const { data, error, loading } = useApi(() => api.get<Campaign[]>("/api/advertiser/campaigns"));
  const [filter, setFilter] = useState("all");
  if (loading) return <PageLoader />;
  if (error || !data) return <Alert tone="error">{error}</Alert>;
  const rows = filter === "all" ? data : data.filter((c) => c.status === filter);
  return (
    <>
      <PageHeader title="Campaigns" subtitle="Manage your advertising campaigns." actions={<Link to="/advertiser/campaigns/new" className="btn-primary"><PlusCircle className="h-4 w-4" /> New Campaign</Link>} />
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button key={f} type="button" onClick={() => setFilter(f)} aria-pressed={filter === f} className={`rounded-full px-3 py-1 text-xs font-medium ${filter === f ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300"}`}>
            {f === "all" ? "All" : statusLabel(f)}
          </button>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title="No campaigns here" />
      ) : (
        <Table head={["Campaign", "Dates", "Screens", "Amount", "Status", ""]}>
          {rows.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <td className={`${td} font-medium text-slate-900`}>{c.name}</td>
              <td className={td}>{formatDate(c.start_date)} – {formatDate(c.end_date)}</td>
              <td className={td}>{c.bookings.length}</td>
              <td className={td}>{formatINR(c.total_amount)}</td>
              <td className={td}><StatusBadge status={c.status} /></td>
              <td className={`${td} text-right`}><Link to={`/advertiser/campaigns/${c.id}`} className="font-medium text-brand-700 hover:underline">View</Link></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
