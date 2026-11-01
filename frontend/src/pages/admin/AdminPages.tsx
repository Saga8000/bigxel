import { Check, X } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Table, td, useApi } from "../../components/dashboard";
import { Alert, DemoBadge, EmptyState, PageLoader, StatusBadge } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api, ApiError, qs } from "../../lib/api";
import { formatDate, formatINR, roleLabel, statusLabel } from "../../lib/format";
import type { AdminBooking, AdminCampaign, AdminScreen, AdminTransaction, ContactMessage, User } from "../../lib/types";

type Msg = { tone: "success" | "error"; text: string } | null;

function Filters({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter">
      {options.map((f) => (
        <button key={f} type="button" aria-pressed={value === f} onClick={() => onChange(f)} className={`rounded-full px-3 py-1 text-xs font-medium ${value === f ? "bg-brand-600 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-brand-300"}`}>
          {f ? (roleLabel[f] ?? statusLabel(f)) : "All"}
        </button>
      ))}
    </div>
  );
}

export function AdminUsers() {
  const { user: me } = useAuth();
  const [role, setRole] = useState("");
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const { data, error, loading, reload } = useApi(() => api.get<User[]>(`/api/admin/users${qs({ role, q: query })}`), [role, query]);
  const [msg, setMsg] = useState<Msg>(null);
  const toggle = async (u: User) => {
    if (!window.confirm(`${u.is_active ? "Deactivate" : "Reactivate"} ${u.email}?`)) return;
    try {
      await api.patch(`/api/admin/users/${u.id}`, { is_active: !u.is_active });
      setMsg({ tone: "success", text: "User updated." });
      void reload();
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof ApiError ? e.message : "Update failed" });
    }
  };
  return (
    <>
      <PageHeader title="Users" />
      <form className="mb-4 flex max-w-md gap-2" onSubmit={(e) => { e.preventDefault(); setQuery(q); }} role="search">
        <input aria-label="Search users" className="input" placeholder="Search name, email or company" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-outline" type="submit">Search</button>
      </form>
      <Filters options={["", "advertiser", "screen_owner", "admin"]} value={role} onChange={setRole} />
      {msg && <Alert tone={msg.tone} className="mb-4" onClose={() => setMsg(null)}>{msg.text}</Alert>}
      {loading ? <PageLoader /> : error || !data ? <Alert tone="error">{error}</Alert> : (
        <Table head={["Name", "Email", "Role", "Joined", "Status", ""]}>
          {data.map((u) => (
            <tr key={u.id}>
              <td className={`${td} font-medium text-slate-900`}>{u.full_name}<span className="block text-xs text-slate-500">{u.company_name}</span></td>
              <td className={td}>{u.email}</td>
              <td className={td}>{roleLabel[u.role]}</td>
              <td className={td}>{formatDate(u.created_at)}</td>
              <td className={td}><StatusBadge status={u.is_active ? "active" : "inactive"} /></td>
              <td className={`${td} text-right`}>{u.id !== me?.id && <button type="button" className="btn-outline btn-sm" onClick={() => toggle(u)}>{u.is_active ? "Deactivate" : "Reactivate"}</button>}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

export function AdminScreens() {
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "";
  const { data, error, loading, reload } = useApi(() => api.get<AdminScreen[]>(`/api/admin/screens${qs({ status })}`), [status]);
  const [msg, setMsg] = useState<Msg>(null);
  const review = async (s: AdminScreen, approve: boolean) => {
    let note: string | null = null;
    if (!approve) {
      note = window.prompt("Reason for rejection (shown to the owner):", "");
      if (!note) return;
    }
    try {
      await api.post(`/api/admin/screens/${s.id}/review`, { status: approve ? "approved" : "rejected", note });
      setMsg({ tone: "success", text: `Screen ${approve ? "approved" : "rejected"}.` });
      void reload();
    } catch (e) {
      setMsg({ tone: "error", text: e instanceof ApiError ? e.message : "Review failed" });
    }
  };
  return (
    <>
      <PageHeader title="Screens" subtitle="Approve new listings and moderate existing ones." />
      <Filters options={["", "pending", "approved", "rejected"]} value={status} onChange={(v) => setParams(v ? { status: v } : {})} />
      {msg && <Alert tone={msg.tone} className="mb-4" onClose={() => setMsg(null)}>{msg.text}</Alert>}
      {loading ? <PageLoader /> : error || !data ? <Alert tone="error">{error}</Alert> : data.length === 0 ? <EmptyState title="No screens" /> : (
        <Table head={["Screen", "Owner", "City", "Price", "Status", "Actions"]}>
          {data.map((s) => (
            <tr key={s.id}>
              <td className={`${td} font-medium text-slate-900`}>{s.status === "approved" && s.is_active ? <Link to={`/screens/${s.id}`} className="hover:text-brand-700">{s.name}</Link> : s.name} {s.is_demo && <DemoBadge />}</td>
              <td className={td}>{s.owner_name}<span className="block text-xs text-slate-500">{s.owner_email}</span></td>
              <td className={td}>{s.city}</td>
              <td className={td}>{formatINR(s.price_per_month)}</td>
              <td className={td}><StatusBadge status={s.is_active ? s.status : "inactive"} /></td>
              <td className={td}>
                <div className="flex gap-2">
                  {s.status !== "approved" && <button type="button" className="btn-primary btn-sm" onClick={() => review(s, true)}><Check className="h-3.5 w-3.5" /> Approve</button>}
                  {s.status !== "rejected" && <button type="button" className="btn-outline btn-sm" onClick={() => review(s, false)}><X className="h-3.5 w-3.5" /> Reject</button>}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

export function AdminCampaigns() {
  const { data, error, loading } = useApi(() => api.get<AdminCampaign[]>("/api/admin/campaigns"));
  return (
    <>
      <PageHeader title="Campaigns" />
      {loading ? <PageLoader /> : error || !data ? <Alert tone="error">{error}</Alert> : data.length === 0 ? <EmptyState title="No campaigns yet" /> : (
        <Table head={["Campaign", "Advertiser", "Dates", "Screens", "Amount", "Status"]}>
          {data.map((c) => (
            <tr key={c.id}>
              <td className={`${td} font-medium text-slate-900`}>{c.name}</td>
              <td className={td}>{c.advertiser_name}</td>
              <td className={td}>{formatDate(c.start_date)} – {formatDate(c.end_date)}</td>
              <td className={td}>{c.bookings.length}</td>
              <td className={td}>{formatINR(c.total_amount)}</td>
              <td className={td}><StatusBadge status={c.status} /></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

export function AdminBookings() {
  const [status, setStatus] = useState("");
  const { data, error, loading } = useApi(() => api.get<AdminBooking[]>(`/api/admin/bookings${qs({ status })}`), [status]);
  return (
    <>
      <PageHeader title="Bookings" />
      <Filters options={["", "pending", "approved", "rejected", "cancelled"]} value={status} onChange={setStatus} />
      {loading ? <PageLoader /> : error || !data ? <Alert tone="error">{error}</Alert> : data.length === 0 ? <EmptyState title="No bookings" /> : (
        <Table head={["Screen", "Owner", "Advertiser", "Dates", "Amount", "Status"]}>
          {data.map((b) => (
            <tr key={b.id}>
              <td className={`${td} font-medium text-slate-900`}>{b.screen.name}</td>
              <td className={td}>{b.owner_name}</td>
              <td className={td}>{b.advertiser_name}<span className="block text-xs text-slate-500">{b.campaign.name}</span></td>
              <td className={td}>{formatDate(b.start_date)} – {formatDate(b.end_date)}</td>
              <td className={td}>{formatINR(b.amount)}</td>
              <td className={td}><StatusBadge status={b.status} /></td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

export function AdminPayments() {
  const { data, error, loading } = useApi(() => api.get<AdminTransaction[]>("/api/admin/payments"));
  return (
    <>
      <PageHeader title="Payments" subtitle="Every wallet ledger entry across the platform." />
      <Alert tone="info" className="mb-4">No payment gateway is connected. Top-ups marked “Simulated” are demo credit, not real money.</Alert>
      {loading ? <PageLoader /> : error || !data ? <Alert tone="error">{error}</Alert> : data.length === 0 ? <EmptyState title="No transactions" /> : (
        <Table head={["Date", "User", "Description", "Type", "Amount"]}>
          {data.map((t) => (
            <tr key={t.id}>
              <td className={td}>{formatDate(t.created_at)}</td>
              <td className={td}>{t.user_name}<span className="block text-xs text-slate-500">{roleLabel[t.user_role]}</span></td>
              <td className={td}>{t.description} {t.is_simulated && <DemoBadge label="Simulated" />}</td>
              <td className={td}>{statusLabel(t.type)}</td>
              <td className={`${td} font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-slate-900"}`}>{t.amount >= 0 ? "+" : ""}{formatINR(t.amount)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

export function AdminMessages() {
  const { data, error, loading, reload } = useApi(() => api.get<ContactMessage[]>("/api/admin/messages"));
  const toggle = async (m: ContactMessage) => {
    await api.patch(`/api/admin/messages/${m.id}`, { is_resolved: !m.is_resolved }).catch(() => null);
    void reload();
  };
  return (
    <>
      <PageHeader title="Messages & Leads" subtitle="Contact form submissions and screen-listing leads." />
      {loading ? <PageLoader /> : error || !data ? <Alert tone="error">{error}</Alert> : data.length === 0 ? <EmptyState title="No messages yet" /> : (
        <div className="space-y-3">
          {data.map((m) => (
            <article key={m.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{m.full_name} <span className="font-normal text-slate-500">· {m.email}{m.phone ? ` · ${m.phone}` : ""}</span></p>
                  <p className="text-xs text-slate-500">{formatDate(m.created_at)} · {m.kind === "screen_lead" ? "Screen listing lead" : m.topic}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={m.is_resolved ? "completed" : "pending"} />
                  <button type="button" className="btn-outline btn-sm" onClick={() => toggle(m)}>{m.is_resolved ? "Reopen" : "Mark resolved"}</button>
                </div>
              </div>
              {m.message && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{m.message}</p>}
              {Object.keys(m.details).length > 0 && (
                <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                  {Object.entries(m.details).map(([k, v]) => <div key={k}><dt className="inline text-slate-500">{statusLabel(k)}: </dt><dd className="inline text-slate-800">{v}</dd></div>)}
                </dl>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
