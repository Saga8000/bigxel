import { CalendarCheck, IndianRupee, Megaphone, XCircle } from "lucide-react";
import { BarChart, StatCard, Table, td, useApi } from "../../components/dashboard";
import { Alert, PageLoader } from "../../components/ui";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api } from "../../lib/api";
import { formatINR } from "../../lib/format";
import type { AdvertiserSummary } from "./Dashboard";

export default function AdvertiserAnalytics() {
  const { data, error, loading } = useApi(() => api.get<AdvertiserSummary>("/api/advertiser/summary"));
  if (loading) return <PageLoader />;
  if (error || !data) return <Alert tone="error">{error}</Alert>;
  const b = data.bookings_by_status;
  return (
    <>
      <PageHeader title="Analytics" subtitle="Spend and booking performance across your campaigns." />
      <Alert tone="info" className="mb-6">Impressions, plays and clicks need a screen player integration that isn&apos;t connected yet. The figures below come from your real bookings.</Alert>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={IndianRupee} label="Committed spend" value={formatINR(data.total_spend)} />
        <StatCard icon={Megaphone} label="Campaigns" value={data.campaigns_total} />
        <StatCard icon={CalendarCheck} label="Approved bookings" value={b.approved ?? 0} hint={`${b.pending ?? 0} pending`} />
        <StatCard icon={XCircle} label="Declined / cancelled" value={(b.rejected ?? 0) + (b.cancelled ?? 0)} />
      </div>
      <div className="card mt-6 p-5">
        <h2 className="font-semibold">Spend by month (campaign start)</h2>
        <BarChart data={data.spend_by_month} empty="No spend yet" />
      </div>
      <h2 className="mb-3 mt-6 font-semibold">Spend by screen</h2>
      {data.spend_by_screen.length === 0 ? (
        <p className="text-sm text-slate-500">No bookings yet.</p>
      ) : (
        <Table head={["Screen", "City", "Bookings", "Spend"]}>
          {data.spend_by_screen.map((r) => (
            <tr key={r.screen_id}><td className={`${td} font-medium text-slate-900`}>{r.screen_name}</td><td className={td}>{r.city}</td><td className={td}>{r.bookings}</td><td className={td}>{formatINR(r.amount)}</td></tr>
          ))}
        </Table>
      )}
    </>
  );
}
