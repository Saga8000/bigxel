import { CalendarCheck, Clock, IndianRupee, Monitor, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, StatCard, useApi } from "../../components/dashboard";
import { Alert, PageLoader } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api } from "../../lib/api";
import { formatINR } from "../../lib/format";
import type { Transaction } from "../../lib/types";

export interface OwnerSummary {
  screens_total: number;
  screens_by_status: Record<string, number>;
  pending_bookings: number;
  active_bookings: number;
  total_earnings: number;
  earnings_by_month: { month: string; amount: number }[];
  earnings_by_screen: { screen_id: number; screen_name: string; bookings: number; amount: number }[];
  transactions: Transaction[];
}

export default function OwnerDashboard() {
  const { user } = useAuth();
  const { data, error, loading } = useApi(() => api.get<OwnerSummary>("/api/owner/summary"));
  if (loading) return <PageLoader />;
  if (error || !data) return <Alert tone="error">{error}</Alert>;
  return (
    <>
      <PageHeader title={`Welcome, ${user?.full_name.split(" ")[0]}`} subtitle="Your screens, bookings and earnings at a glance." actions={<Link to="/owner/screens/new" className="btn-primary"><PlusCircle className="h-4 w-4" /> Add Screen</Link>} />
      {data.pending_bookings > 0 && (
        <Alert tone="warning" className="mb-6">You have {data.pending_bookings} booking request{data.pending_bookings > 1 ? "s" : ""} waiting for approval. <Link to="/owner/bookings?status=pending" className="font-semibold underline">Review now</Link></Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Monitor} label="Screens" value={data.screens_total} hint={`${data.screens_by_status.approved ?? 0} live · ${data.screens_by_status.pending ?? 0} in review`} />
        <StatCard icon={Clock} label="Pending requests" value={data.pending_bookings} />
        <StatCard icon={CalendarCheck} label="Running now" value={data.active_bookings} />
        <StatCard icon={IndianRupee} label="Net earnings" value={formatINR(data.total_earnings)} />
      </div>
      <div className="card mt-6 p-5">
        <h2 className="font-semibold">Earnings by month</h2>
        <BarChart data={data.earnings_by_month} empty="No earnings yet — approve bookings to start earning." />
      </div>
      {data.screens_total === 0 && (
        <div className="card mt-6 p-6 text-center">
          <p className="font-semibold">List your first screen</p>
          <p className="mt-1 text-sm text-slate-600">Add details and a photo; our team reviews it before it goes live.</p>
          <Link to="/owner/screens/new" className="btn-primary mt-4">Add Screen</Link>
        </div>
      )}
    </>
  );
}
