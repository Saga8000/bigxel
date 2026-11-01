import { LayoutGrid, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ScreenCard from "../../components/ScreenCard";
import { Alert, EmptyState, Spinner } from "../../components/ui";
import { api, ApiError, qs } from "../../lib/api";
import type { Page, Screen, ScreenMeta } from "../../lib/types";

const FOOTFALL = [
  { value: "", label: "Any Footfall" },
  { value: "1000", label: "1,000+ / day" },
  { value: "5000", label: "5,000+ / day" },
  { value: "20000", label: "20,000+ / day" },
];
const SORTS = [
  { value: "recommended", label: "Recommended" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "footfall_desc", label: "Highest Footfall" },
  { value: "newest", label: "Newest" },
];
const PAGE_SIZE = 12;

export default function ScreenBrowser({ bookPath }: { bookPath?: (s: Screen) => string }) {
  const [params, setParams] = useSearchParams();
  const [meta, setMeta] = useState<ScreenMeta | null>(null);
  const [data, setData] = useState<Page<Screen> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const filters = useMemo(
    () => ({
      q: params.get("q") ?? "",
      city: params.get("city") ?? "",
      category: params.get("category") ?? "",
      screen_type: params.get("screen_type") ?? "",
      min_price: params.get("min_price") ?? "",
      max_price: params.get("max_price") ?? "",
      min_footfall: params.get("min_footfall") ?? "",
      sort: params.get("sort") ?? "recommended",
      page: Number(params.get("page") ?? "1") || 1,
    }),
    [params],
  );
  const [draft, setDraft] = useState(filters);
  useEffect(() => setDraft(filters), [filters]);

  useEffect(() => {
    api.get<ScreenMeta>("/api/screens/meta").then(setMeta).catch(() => setMeta(null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    const { page, ...rest } = filters;
    api
      .get<Page<Screen>>(`/api/screens${qs({ ...rest, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })}`)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e instanceof ApiError ? e.message : "Could not load screens"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const apply = (next: Partial<typeof filters>) => {
    const merged = { ...draft, ...next, page: next.page ?? 1 };
    const sp = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v !== "" && v !== undefined && !(k === "sort" && v === "recommended") && !(k === "page" && v === 1)) sp.set(k, String(v));
    });
    setParams(sp);
    setShowFilters(false);
  };
  const clear = () => {
    setParams(new URLSearchParams());
    setShowFilters(false);
  };

  const priceInvalid = draft.min_price !== "" && draft.max_price !== "" && Number(draft.min_price) > Number(draft.max_price);
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <form
        className="card grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          apply({});
        }}
        role="search"
      >
        <label className="relative">
          <span className="sr-only">Search screens</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input h-12 pl-10"
            placeholder="Search by location, area or business type..."
            value={draft.q}
            maxLength={100}
            onChange={(e) => setDraft({ ...draft, q: e.target.value })}
          />
        </label>
        <label className="relative">
          <span className="sr-only">City</span>
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select className="input h-12 pl-10" value={draft.city} onChange={(e) => apply({ city: e.target.value })}>
            <option value="">All Cities</option>
            {meta?.cities.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="relative">
          <span className="sr-only">Category</span>
          <LayoutGrid className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select className="input h-12 pl-10" value={draft.category} onChange={(e) => apply({ category: e.target.value })}>
            <option value="">All Categories</option>
            {meta?.categories.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary h-12 flex-1">
            Search
          </button>
          <button type="button" className="btn-outline-brand h-12 lg:hidden" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
        </div>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className={`${showFilters ? "block" : "hidden"} lg:block`} aria-label="Filters">
          <form
            className="card space-y-5 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!priceInvalid) apply({});
            }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Filter Screens</h2>
              <button type="button" onClick={clear} className="text-xs font-medium text-brand-600 hover:underline">
                Clear All
              </button>
            </div>
            <label className="block">
              <span className="label">Location</span>
              <select className="input" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })}>
                <option value="">All Cities</option>
                {meta?.cities.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Business Type</span>
              <select className="input" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                <option value="">All Business Types</option>
                {meta?.categories.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="label">Screen Type</span>
              <select className="input" value={draft.screen_type} onChange={(e) => setDraft({ ...draft, screen_type: e.target.value })}>
                <option value="">All Screen Types</option>
                {meta?.screen_types.map((c) => <option key={c}>{c}</option>)}
              </select>
            </label>
            <fieldset>
              <legend className="label">Price Range (Monthly, ₹)</legend>
              <div className="grid grid-cols-2 gap-2">
                <input aria-label="Minimum price" type="number" min={0} step={500} className="input" placeholder="Min" value={draft.min_price} onChange={(e) => setDraft({ ...draft, min_price: e.target.value })} />
                <input aria-label="Maximum price" type="number" min={0} step={500} className={`input ${priceInvalid ? "input-error" : ""}`} placeholder="Max" value={draft.max_price} onChange={(e) => setDraft({ ...draft, max_price: e.target.value })} />
              </div>
              {priceInvalid && <p className="mt-1 text-xs text-rose-600">Min price must be less than max price.</p>}
            </fieldset>
            <label className="block">
              <span className="label">Daily Footfall</span>
              <select className="input" value={draft.min_footfall} onChange={(e) => setDraft({ ...draft, min_footfall: e.target.value })}>
                {FOOTFALL.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </label>
            <button type="submit" className="btn-primary w-full" disabled={priceInvalid}>
              Apply Filters
            </button>
          </form>
        </aside>

        <section aria-live="polite">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {loading ? (
                <span className="inline-flex items-center gap-2"><Spinner className="h-4 w-4" /> Loading screens…</span>
              ) : data ? (
                <>
                  Showing <strong className="text-brand-700">{data.total}</strong> screen{data.total === 1 ? "" : "s"}
                  {filters.city && <> in <strong>{filters.city}</strong></>}
                </>
              ) : null}
            </p>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              Sort by:
              <select className="input w-auto py-2" value={filters.sort} onChange={(e) => apply({ sort: e.target.value })}>
                {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>
          {Object.entries(filters).some(([k, v]) => !["sort", "page"].includes(k) && v) && (
            <button type="button" onClick={clear} className="mb-4 inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 hover:bg-brand-100">
              Clear filters <X className="h-3 w-3" />
            </button>
          )}
          {error && <Alert tone="error">{error}</Alert>}
          {!error && data && data.items.length === 0 && !loading && (
            <EmptyState title="No screens match your filters">Try a different city or widen your price range.</EmptyState>
          )}
          <div className={`grid gap-5 sm:grid-cols-2 xl:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
            {data?.items.map((s) => <ScreenCard key={s.id} screen={s} bookTo={bookPath?.(s)} />)}
          </div>
          {data && totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
              <button type="button" className="btn-outline btn-sm" disabled={filters.page <= 1} onClick={() => apply({ ...filters, page: filters.page - 1 })}>
                Previous
              </button>
              <span className="text-sm text-slate-600">Page {filters.page} of {totalPages}</span>
              <button type="button" className="btn-outline btn-sm" disabled={filters.page >= totalPages} onClick={() => apply({ ...filters, page: filters.page + 1 })}>
                Next
              </button>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
