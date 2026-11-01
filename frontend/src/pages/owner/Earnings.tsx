import { IndianRupee } from "lucide-react";
import { BarChart, StatCard, Table, td, useApi } from "../../components/dashboard";
import { Alert, PageLoader } from "../../components/ui";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api } from "../../lib/api";
import { formatDate, formatINR, statusLabel } from "../../lib/format";
import type { OwnerSummary } from "./Dashboard";

export default function OwnerEarnings() {
  const { data, error, loading } = useApi(() => api.get<OwnerSummary>("/api/owner/summary"));
  if (loading) return <PageLoader />;
  if (error || !data) return <Alert tone="error">{error}</Alert>;
  return (
    <>
      <PageHeader title="Earnings & Analytics" subtitle="What your screens have earned from approved bookings." />
      <Alert tone="info" className="mb-6">Bank payouts aren&apos;t automated yet. Contact support to withdraw your earnings. Play counts need a screen player integration.</Alert>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={IndianRupee} label="Net earnings" value={formatINR(data.total_earnings)} />
        <StatCard icon={IndianRupee} label="Approved bookings" value={data.earnings_by_screen.reduce((a, r) => a + r.bookings, 0)} />
      </div>
      <div className="card mt-6 p-5">
        <h2 className="font-semibold">Earnings by month</h2>
        <BarChart data={data.earnings_by_month} empty="No earnings yet" />
      </div>
      <h2 className="mb-3 mt-6 font-semibold">By screen</h2>
      <Table head={["Screen", "Approved bookings", "Earnings"]}>
        {data.earnings_by_screen.map((r) => (
          <tr key={r.screen_id}><td className={`${td} font-medium text-slate-900`}>{r.screen_name}</td><td className={td}>{r.bookings}</td><td className={td}>{formatINR(r.amount)}</td></tr>
        ))}
      </Table>
      <h2 className="mb-3 mt-6 font-semibold">Ledger</h2>
      {data.transactions.length === 0 ? <p className="text-sm text-slate-500">No transactions yet.</p> : (
        <Table head={["Date", "Description", "Type", "Amount"]}>
          {data.transactions.map((t) => (
            <tr key={t.id}><td className={td}>{formatDate(t.created_at)}</td><td className={td}>{t.description}</td><td className={td}>{statusLabel(t.type)}</td><td className={`${td} font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{t.amount >= 0 ? "+" : ""}{formatINR(t.amount)}</td></tr>
          ))}
        </Table>
      )}
    </>
  );
}
