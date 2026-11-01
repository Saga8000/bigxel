import { IndianRupee, Megaphone, PlusCircle, Search, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { StatCard, useApi } from "../../components/dashboard";
import { Alert, EmptyState, PageLoader, StatusBadge } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api } from "../../lib/api";
import { formatDate, formatINR } from "../../lib/format";
import type { Campaign } from "../../lib/types";

export interface AdvertiserSummary {
  wallet_balance: number;
  total_spend: number;
  campaigns_total: number;
  campaigns_by_status: Record<string, number>;
  bookings_by_status: Record<string, number>;
  spend_by_month: { month: string; amount: number }[];
  spend_by_screen: { screen_id: number; screen_name: string; city: string; bookings: number; amount: number }[];
  recent_campaigns: Campaign[];
}

export default function AdvertiserDashboard() {
  const { user } = useAuth();
  const { data, error, loading } = useApi(() => api.get<AdvertiserSummary>("/api/advertiser/summary"));
  if (loading) return <PageLoader />;
  if (error || !data) return <Alert tone="error">{error}</Alert>;
  const active = (data.campaigns_by_status.active ?? 0) + (data.campaigns_by_status.scheduled ?? 0);
  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.full_name.split(" ")[0]}`}
        subtitle="Here's an overview of your advertising."
        actions={
          <>
            <Link to="/advertiser/screens" className="btn-outline"><Search className="h-4 w-4" /> Browse Screens</Link>
            <Link to="/advertiser/campaigns/new" className="btn-primary"><PlusCircle className="h-4 w-4" /> New Campaign</Link>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Wallet Balance" value={formatINR(data.wallet_balance)} />
        <StatCard icon={IndianRupee} label="Total Committed Spend" value={formatINR(data.total_spend)} />
        <StatCard icon={Megaphone} label="Active & Scheduled" value={active} />
        <StatCard icon={Megaphone} label="Awaiting Approval" value={data.campaigns_by_status.pending_approval ?? 0} />
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Recent campaigns</h2>
      {data.recent_campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet" action={<Link to="/advertiser/campaigns/new" className="btn-primary">Create your first campaign</Link>}>
          Pick one or more screens, upload your ad and choose your dates.
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {data.recent_campaigns.map((c) => (
            <Link key={c.id} to={`/advertiser/campaigns/${c.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:border-brand-300">
              <div>
                <p className="font-semibold text-slate-900">{c.name}</p>
                <p className="text-sm text-slate-500">{formatDate(c.start_date)} – {formatDate(c.end_date)} · {c.bookings.length} screen(s)</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatINR(c.total_amount)}</span>
                <StatusBadge status={c.status} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
