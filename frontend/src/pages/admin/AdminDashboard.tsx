import { CalendarCheck, IndianRupee, Megaphone, MessageSquare, Monitor, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { StatCard, useApi } from "../../components/dashboard";
import { Alert, PageLoader } from "../../components/ui";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api } from "../../lib/api";
import { formatINR } from "../../lib/format";

interface AdminSummary {
  users_by_role: Record<string, number>;
  screens_by_status: Record<string, number>;
  bookings_by_status: Record<string, number>;
  campaigns_total: number;
  booking_volume: number;
  platform_fees: number;
  unresolved_messages: number;
}

export default function AdminDashboard() {
  const { data, error, loading } = useApi(() => api.get<AdminSummary>("/api/admin/summary"));
  if (loading) return <PageLoader />;
  if (error || !data) return <Alert tone="error">{error}</Alert>;
  const users = Object.values(data.users_by_role).reduce((a, b) => a + b, 0);
  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Platform overview." />
      {(data.screens_by_status.pending ?? 0) > 0 && (
        <Alert tone="warning" className="mb-6">{data.screens_by_status.pending} screen(s) awaiting review. <Link to="/admin/screens?status=pending" className="font-semibold underline">Review</Link></Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Users} label="Users" value={users} hint={`${data.users_by_role.advertiser ?? 0} advertisers · ${data.users_by_role.screen_owner ?? 0} owners`} />
        <StatCard icon={Monitor} label="Screens" value={Object.values(data.screens_by_status).reduce((a, b) => a + b, 0)} hint={`${data.screens_by_status.approved ?? 0} live · ${data.screens_by_status.pending ?? 0} pending`} />
        <StatCard icon={Megaphone} label="Campaigns" value={data.campaigns_total} />
        <StatCard icon={CalendarCheck} label="Bookings" value={Object.values(data.bookings_by_status).reduce((a, b) => a + b, 0)} hint={`${data.bookings_by_status.pending ?? 0} pending`} />
        <StatCard icon={IndianRupee} label="Approved booking volume" value={formatINR(data.booking_volume)} hint={`Platform fees ${formatINR(data.platform_fees)}`} />
        <StatCard icon={MessageSquare} label="Open messages" value={data.unresolved_messages} />
      </div>
    </>
  );
}
