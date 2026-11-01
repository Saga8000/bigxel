import { ImageUp, Monitor, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Alert, Field, Spinner, SubmitButton, TextAreaField } from "../../components/ui";
import { PageHeader } from "../../layouts/DashboardLayout";
import { api, ApiError, qs } from "../../lib/api";
import { addDays, daysBetween, formatINR, isoDate } from "../../lib/format";
import type { Campaign, Page, Screen, Wallet } from "../../lib/types";

const MAX_MB = 20;

export default function NewCampaign() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const tomorrow = isoDate(addDays(new Date(), 1));
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [start, setStart] = useState(tomorrow);
  const [end, setEnd] = useState(isoDate(addDays(new Date(), 7)));
  const [selected, setSelected] = useState<Screen[]>([]);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Screen[]>([]);
  const [creative, setCreative] = useState<{ url: string; kind: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get<Wallet>("/api/advertiser/wallet").then(setWallet).catch(() => null);
    const pre = params.get("screen");
    if (pre) api.get<Screen>(`/api/screens/${pre}`).then((s) => setSelected([s])).catch(() => setError("The selected screen is not available."));
  }, [params]);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get<Page<Screen>>(`/api/screens${qs({ q: search, limit: 8 })}`).then((p) => setResults(p.items)).catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  const days = start && end && end >= start ? daysBetween(start, end) : 0;
  const lines = useMemo(() => selected.map((s) => ({ s, amount: Math.round((s.price_per_month * days) / 30) })), [selected, days]);
  const total = lines.reduce((a, l) => a + l.amount, 0);
  const short = wallet ? total - wallet.balance : 0;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErrors((e) => ({ ...e, creative_url: "" }));
    if (!/^(image\/(jpeg|png|webp)|video\/mp4)$/.test(file.type)) {
      setErrors((e) => ({ ...e, creative_url: "Use a JPG, PNG, WEBP image or MP4 video" }));
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrors((e) => ({ ...e, creative_url: `File must be under ${MAX_MB} MB` }));
      return;
    }
    setUploading(true);
    try {
      const r = await api.upload(file);
      setCreative({ ...r, name: file.name });
    } catch (e) {
      setErrors((x) => ({ ...x, creative_url: e instanceof ApiError ? e.message : "Upload failed" }));
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = "Give your campaign a name";
    if (start < tomorrow) errs.start_date = "Start date must be tomorrow or later";
    if (end < start) errs.end_date = "End date must be on or after the start date";
    if (!selected.length) errs.screen_ids = "Select at least one screen";
    if (!creative) errs.creative_url = "Upload your ad creative";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const c = await api.post<Campaign>("/api/advertiser/campaigns", {
        name: name.trim(),
        objective: objective.trim() || null,
        creative_url: creative!.url,
        start_date: start,
        end_date: end,
        screen_ids: selected.map((s) => s.id),
      });
      navigate(`/advertiser/campaigns/${c.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setError(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Create Campaign" subtitle="Choose screens, upload your ad and set your dates." />
      <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="font-semibold">1. Campaign details</h2>
            <Field label="Campaign name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={160} />
            <TextAreaField label="Objective (optional)" value={objective} onChange={(e) => setObjective(e.target.value)} maxLength={255} className="[&_textarea]:min-h-[70px]" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Start date" type="date" min={tomorrow} value={start} onChange={(e) => setStart(e.target.value)} error={errors.start_date} />
              <Field label="End date" type="date" min={start} value={end} onChange={(e) => setEnd(e.target.value)} error={errors.end_date} />
            </div>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-semibold">2. Select screens</h2>
            {selected.length > 0 && (
              <ul className="space-y-2">
                {selected.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50/50 p-3">
                    <span className="flex items-center gap-3">
                      {s.image_url ? <img src={s.image_url} alt="" className="h-10 w-14 rounded object-cover" /> : <Monitor className="h-6 w-6" />}
                      <span><span className="block text-sm font-semibold text-slate-900">{s.name}</span><span className="text-xs text-slate-500">{s.city} · {formatINR(s.price_per_month)}/month</span></span>
                    </span>
                    <button type="button" onClick={() => setSelected(selected.filter((x) => x.id !== s.id))} className="rounded p-1 text-slate-500 hover:bg-white hover:text-rose-600" aria-label={`Remove ${s.name}`}><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ul>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input aria-label="Search screens to add" className="input pl-10" placeholder="Search screens by name, area or city" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <ul className="max-h-64 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {results.filter((r) => !selected.some((s) => s.id === r.id)).map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <span className="text-sm"><span className="font-medium text-slate-900">{r.name}</span> <span className="text-slate-500">· {r.city} · {formatINR(r.price_per_month)}/mo</span></span>
                  <button type="button" className="btn-outline-brand btn-sm" onClick={() => setSelected([...selected, r])} disabled={selected.length >= 20}>Add</button>
                </li>
              ))}
              {results.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-500">No screens found</li>}
            </ul>
            {errors.screen_ids && <p className="text-xs text-rose-600">{errors.screen_ids}</p>}
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="font-semibold">3. Upload your ad</h2>
            {creative ? (
              <div className="flex items-center gap-4 rounded-lg border border-slate-200 p-3">
                {creative.kind === "video" ? <video src={creative.url} className="h-20 w-32 rounded bg-black object-cover" muted /> : <img src={creative.url} alt="Uploaded creative preview" className="h-20 w-32 rounded object-cover" />}
                <div className="flex-1 truncate text-sm">{creative.name}</div>
                <button type="button" className="btn-ghost btn-sm" onClick={() => setCreative(null)}><Trash2 className="h-4 w-4" /> Remove</button>
              </div>
            ) : (
              <label className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition hover:border-brand-400 hover:bg-brand-50/40 ${errors.creative_url ? "border-rose-300" : "border-slate-300"}`}>
                {uploading ? <Spinner className="h-8 w-8 text-brand-600" /> : <ImageUp className="h-8 w-8 text-brand-600" />}
                <span className="text-sm font-medium text-slate-800">{uploading ? "Uploading…" : "Click to upload an image or video"}</span>
                <span className="text-xs text-slate-500">JPG, PNG, WEBP or MP4 · up to {MAX_MB} MB</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" className="sr-only" disabled={uploading} onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
            )}
            {errors.creative_url && <p className="text-xs text-rose-600">{errors.creative_url}</p>}
          </section>
        </div>

        <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-24">
          <h2 className="font-semibold">Summary</h2>
          <p className="text-sm text-slate-600">{days} day{days === 1 ? "" : "s"} · {selected.length} screen{selected.length === 1 ? "" : "s"}</p>
          <ul className="space-y-1.5 text-sm">
            {lines.map(({ s, amount }) => (
              <li key={s.id} className="flex justify-between gap-2"><span className="truncate text-slate-600">{s.name}</span><span className="font-medium">{formatINR(amount)}</span></li>
            ))}
          </ul>
          <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold"><span>Total</span><span className="text-brand-700">{formatINR(total)}</span></div>
          {wallet && <p className="text-sm text-slate-600">Wallet balance: <strong>{formatINR(wallet.balance)}</strong></p>}
          {wallet && short > 0 && (
            <Alert tone="warning">You need {formatINR(short)} more. <Link to="/advertiser/wallet" className="font-semibold underline">Add funds</Link></Alert>
          )}
          {error && <Alert tone="error">{error}</Alert>}
          <SubmitButton loading={loading} disabled={uploading} className="btn-primary w-full py-3">Book & Pay {total > 0 ? formatINR(total) : ""}</SubmitButton>
          <p className="text-xs text-slate-500">The amount is deducted from your wallet now. If a screen owner declines, that screen&apos;s amount is refunded automatically.</p>
        </aside>
      </form>
    </>
  );
}
