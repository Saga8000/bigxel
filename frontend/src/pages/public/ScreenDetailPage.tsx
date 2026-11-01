import { ArrowLeft, BarChart3, CalendarDays, Clock, MapPin, Monitor, ScanLine, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Alert, DemoBadge, PageLoader } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { api, ApiError } from "../../lib/api";
import { formatDate, formatINR, formatNumber } from "../../lib/format";
import type { ScreenDetail } from "../../lib/types";

export default function ScreenDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [screen, setScreen] = useState<ScreenDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setScreen(null);
    setError("");
    api
      .get<ScreenDetail>(`/api/screens/${id}`)
      .then(setScreen)
      .catch((e) => setError(e instanceof ApiError && e.status === 404 ? "This screen is not available." : "Could not load this screen."));
  }, [id]);

  if (error)
    return (
      <div className="container-page py-16">
        <Alert tone="error">{error}</Alert>
        <Link to="/advertise" className="btn-outline mt-6">
          <ArrowLeft className="h-4 w-4" /> Back to screens
        </Link>
      </div>
    );
  if (!screen) return <PageLoader />;

  const specs = [
    { icon: Users, label: "Daily Footfall", value: `${formatNumber(screen.daily_footfall)}+` },
    { icon: Monitor, label: "Screen", value: `${screen.size_inches}" ${screen.screen_type}` },
    { icon: ScanLine, label: "Resolution", value: screen.resolution },
    { icon: Clock, label: "Operating Hours", value: screen.operating_hours },
    { icon: BarChart3, label: "Ad Slots", value: `${screen.ad_slots} rotating slots` },
    { icon: MapPin, label: "Category", value: screen.category },
  ];
  const bookTo =
    user?.role === "advertiser"
      ? `/advertiser/campaigns/new?screen=${screen.id}`
      : user
        ? undefined
        : `/login?next=${encodeURIComponent(`/advertiser/campaigns/new?screen=${screen.id}`)}`;

  return (
    <div className="container-page py-10">
      <Link to="/advertise" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> All screens
      </Link>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-2xl bg-slate-100">
            {screen.image_url ? (
              <img src={screen.image_url} alt={`${screen.name} screen`} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/10] place-items-center text-slate-400"><Monitor className="h-12 w-12" /></div>
            )}
          </div>
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">{screen.name}</h1>
              {screen.is_demo && <DemoBadge label="Demo listing" />}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-slate-600">
              <MapPin className="h-4 w-4" /> {screen.placement} · {screen.address}, {screen.state}
            </p>
            {screen.description && <p className="mt-4 text-slate-700">{screen.description}</p>}
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              {specs.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-200 p-4">
                  <span className="icon-badge h-10 w-10"><Icon className="h-5 w-5" /></span>
                  <div>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="font-semibold text-slate-900">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </div>
        <aside className="space-y-5">
          <div className="card p-6 lg:sticky lg:top-24">
            <p className="text-sm text-slate-500">Price</p>
            <p className="mt-1">
              <span className="text-3xl font-bold text-brand-700">{formatINR(screen.price_per_month)}</span>
              <span className="text-slate-500"> / month</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">Charged per day for shorter campaigns (monthly price ÷ 30).</p>
            {bookTo ? (
              <Link to={bookTo} className="btn-primary mt-5 w-full py-3">Book This Screen</Link>
            ) : (
              <Alert tone="info" className="mt-5">Log in with an advertiser account to book screens.</Alert>
            )}
            <p className="mt-4 text-xs text-slate-500">Listed by {screen.owner_display_name}</p>
            <div className="mt-6 border-t border-slate-100 pt-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4" /> Upcoming bookings</h2>
              {screen.booked_ranges.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No upcoming bookings — all {screen.ad_slots} slots open.</p>
              ) : (
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {screen.booked_ranges.map((r, i) => (
                    <li key={i}>{formatDate(r.start_date)} – {formatDate(r.end_date)}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
