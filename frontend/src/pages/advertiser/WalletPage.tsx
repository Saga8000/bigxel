import { Plus, Wallet as WalletIcon } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Table, td, useApi } from "../../components/dashboard";
import { Alert, DemoBadge, PageLoader, SubmitButton } from "../../components/ui";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api, ApiError } from "../../lib/api";
import { formatDate, formatINR, statusLabel } from "../../lib/format";
import type { Wallet } from "../../lib/types";

export default function WalletPage() {
  const { data, error, loading, setData } = useApi(() => api.get<Wallet>("/api/advertiser/wallet"));
  const [amount, setAmount] = useState("5000");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  if (loading) return <PageLoader />;
  if (error || !data) return <Alert tone="error">{error}</Alert>;

  const topup = async (e: FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const n = Number(amount);
    if (!Number.isInteger(n) || n < 100 || n > data.max_topup_amount) {
      setMsg({ tone: "error", text: `Enter a whole amount between ₹100 and ${formatINR(data.max_topup_amount)}` });
      return;
    }
    setBusy(true);
    try {
      setData(await api.post<Wallet>("/api/advertiser/wallet/topup", { amount: n }));
      setMsg({ tone: "success", text: `Added ${formatINR(n)} simulated credit.` });
    } catch (err) {
      setMsg({ tone: "error", text: err instanceof ApiError ? err.message : "Top-up failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Wallet & Payments" subtitle="Your balance and full payment history." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="card bg-gradient-to-br from-navy-800 to-brand-800 p-6 text-white">
          <p className="flex items-center gap-2 text-sm text-white/80"><WalletIcon className="h-4 w-4" /> Wallet balance</p>
          <p className="mt-2 text-4xl font-bold">{formatINR(data.balance)}</p>
        </div>
        <div className="card p-6">
          <h2 className="font-semibold">Add funds</h2>
          {data.payments_mode === "simulated" ? (
            <form onSubmit={topup} noValidate className="mt-3 space-y-3">
              <Alert tone="warning">Development mode: no payment gateway is connected. Top-ups add <strong>simulated credit</strong> — no money is charged.</Alert>
              <div className="flex flex-wrap gap-2">
                {[1000, 5000, 10000, 25000].map((v) => (
                  <button key={v} type="button" onClick={() => setAmount(String(v))} className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ${amount === String(v) ? "bg-brand-600 text-white ring-brand-600" : "ring-slate-200 hover:ring-brand-300"}`}>{formatINR(v)}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <label className="sr-only" htmlFor="topup">Amount</label>
                <input id="topup" type="number" min={100} max={data.max_topup_amount} step={100} className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
                <SubmitButton loading={busy} className="btn-primary shrink-0"><Plus className="h-4 w-4" /> Add simulated credit</SubmitButton>
              </div>
            </form>
          ) : (
            <Alert tone="info" className="mt-3">Online payments aren&apos;t configured yet. Please contact support to add funds.</Alert>
          )}
          {msg && <Alert tone={msg.tone} className="mt-3" onClose={() => setMsg(null)}>{msg.text}</Alert>}
        </div>
      </div>
      <h2 className="mb-3 mt-8 font-semibold">Payment history</h2>
      {data.transactions.length === 0 ? (
        <p className="text-sm text-slate-500">No transactions yet.</p>
      ) : (
        <Table head={["Date", "Description", "Type", "Amount"]}>
          {data.transactions.map((t) => (
            <tr key={t.id}>
              <td className={td}>{formatDate(t.created_at)}</td>
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
