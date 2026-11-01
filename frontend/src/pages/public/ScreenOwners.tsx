import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  Calculator,
  IndianRupee,
  Lock,
  Megaphone,
  MonitorUp,
  Monitor,
  PlayCircle,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckList, StatsStrip } from "../../components/sections";
import { Alert, DemoNote, Field, SelectField, SubmitButton } from "../../components/ui";
import { demoStats, site } from "../../content/site";
import { api, ApiError } from "../../lib/api";

const steps = [
  { icon: MonitorUp, title: "1. Add Your Screen", text: "Share details about your screen, location, size, and availability." },
  { icon: ShieldCheck, title: "2. Get Verified", text: "Our team will verify your screen and get it live on the platform." },
  { icon: Megaphone, title: "3. Ads Get Booked", text: "Advertisers choose your screen to run their campaigns." },
  { icon: Wallet, title: "4. You Earn", text: "Earn a share of every booking you approve." },
];

const SCREEN_TYPES = ["Indoor LED", "Indoor LCD", "Outdoor LED", "Digital Standee", "Video Wall"];
const empty = { full_name: "", business_name: "", email: "", phone: "", city: "", screen_type: "" };

function LeadForm() {
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<{ tone: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.full_name.trim().length < 2) e.full_name = "Enter your name";
    if (form.business_name.trim().length < 2) e.business_name = "Enter your business name";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email";
    if (!/^\+?[0-9\s-]{10,16}$/.test(form.phone)) e.phone = "Enter a valid phone number";
    if (form.city.trim().length < 2) e.city = "Enter your city";
    if (!form.screen_type) e.screen_type = "Choose a screen type";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    setStatus(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    try {
      const r = await api.post<{ detail: string }>("/api/contact/screen-lead", form);
      setStatus({ tone: "success", msg: r.detail });
      setForm(empty);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        setStatus({ tone: "error", msg: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={submit} noValidate className="card p-6" aria-labelledby="lead-title">
      <h2 id="lead-title" className="text-xl font-bold">List Your Screen</h2>
      <p className="mt-1 text-sm text-slate-600">Get started in less than 2 minutes.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Field label="Full Name" srOnlyLabel value={form.full_name} onChange={set("full_name")} error={errors.full_name} autoComplete="name" />
        <Field label="Business Name" srOnlyLabel value={form.business_name} onChange={set("business_name")} error={errors.business_name} autoComplete="organization" />
        <Field label="Email Address" srOnlyLabel type="email" value={form.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        <Field label="Phone Number" srOnlyLabel type="tel" value={form.phone} onChange={set("phone")} error={errors.phone} autoComplete="tel" />
        <Field label="City" srOnlyLabel value={form.city} onChange={set("city")} error={errors.city} autoComplete="address-level2" />
        <SelectField label="Screen Type" srOnlyLabel value={form.screen_type} onChange={set("screen_type")} error={errors.screen_type}>
          <option value="">Screen Type</option>
          {SCREEN_TYPES.map((t) => <option key={t}>{t}</option>)}
        </SelectField>
      </div>
      {status && <Alert tone={status.tone} className="mt-4">{status.msg}</Alert>}
      <SubmitButton loading={loading} className="btn-primary mt-5 w-full py-3">
        List My Screen Now <ArrowRight className="h-4 w-4" />
      </SubmitButton>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500"><Lock className="h-3.5 w-3.5" /> Your information is safe with us.</p>
      <p className="mt-2 text-center text-xs text-slate-500">
        Prefer to do it yourself? <Link to="/signup?role=screen_owner" className="font-medium text-brand-700 hover:underline">Create a screen owner account</Link>
      </p>
    </form>
  );
}

export default function ScreenOwners() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 hidden w-[55%] lg:block" aria-hidden="true">
          <img src="/images/hero-owners.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-transparent" />
        </div>
        <div className="container-page relative grid gap-10 py-12 lg:grid-cols-2 lg:py-14">
          <div>
            <span className="pill">For Business Owners &amp; Screen Partners</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-5xl">
              Turn Your Screens
              <br />
              Into a Steady <span className="text-gradient">Income</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">
              List your digital screens on BigXel Ads and start earning by displaying ads from brands in your area.
            </p>
            <div className="mt-7 grid gap-5 sm:grid-cols-3">
              {[
                { icon: IndianRupee, t: "Earn More", d: "Get paid a share of every booking on your screen." },
                { icon: Users, t: "Hassle Free", d: "We handle advertisers, payments & ad management." },
                { icon: BarChart3, t: "100% Transparent", d: "Track bookings and earnings in your dashboard." },
              ].map(({ icon: Icon, t, d }) => (
                <div key={t} className="flex gap-3">
                  <span className="icon-badge"><Icon className="h-5 w-5" /></span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t}</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{d}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="#list-screen" className="btn-primary px-7 py-3.5 text-base">List Your Screen Now <ArrowRight className="h-4 w-4" /></a>
              <Link to="/how-it-works" className="btn-outline px-7 py-3.5 text-base"><PlayCircle className="h-4 w-4" /> How It Works</Link>
            </div>
            <p className="mt-6 text-sm text-slate-600">Questions? Call us at <a className="font-medium text-brand-700" href={site.phoneHref}>{site.phone}</a></p>
          </div>
          <div className="relative flex items-center justify-end">
            <img src="/images/hero-owners.jpg" alt="Digital standee advertising drinks in a restaurant" className="w-full rounded-2xl object-cover lg:hidden" />
            <div className="card absolute bottom-4 right-4 w-60 p-5 lg:static lg:w-64">
              <h2 className="text-base font-semibold">Why Partner With Us?</h2>
              <div className="mt-4">
                <CheckList items={["No Joining Fees", "No Hidden Charges", "Approve Every Booking", "Dedicated Support", "Ad Content Review", "Earnings Dashboard"]} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page py-4">
        <StatsStrip
          stats={[
            { icon: Monitor, value: demoStats.screens, label: "Screens Listed" },
            { icon: Building2, value: demoStats.cities, label: "Cities Covered" },
            { icon: IndianRupee, value: demoStats.paidToOwners, label: "Paid to Screen Owners" },
            { icon: Users, value: demoStats.happyPartners, label: "Happy Screen Partners" },
          ]}
        />
      </section>

      <section id="list-screen" className="container-page grid scroll-mt-24 gap-6 py-12 lg:grid-cols-[1.5fr_1fr_0.8fr]">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">How It Works</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }) => (
              <li key={title} className="text-center">
                <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100/70 text-brand-600"><Icon className="h-8 w-8" /></span>
                <h3 className="mt-4 text-sm font-bold">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-emerald-600"><BadgeCheck className="h-5 w-5" /></span>
            <div>
              <p className="font-semibold text-emerald-700">Quick review process</p>
              <p className="text-sm text-slate-600">Your screen can receive bookings as soon as it&apos;s verified.</p>
            </div>
          </div>
        </div>
        <LeadForm />
        <div className="card p-6">
          <h2 className="text-base font-semibold">Potential Earnings</h2>
          <p className="mt-1 text-sm text-slate-600">Estimated monthly earnings for your screen</p>
          <p className="mt-3 text-2xl font-bold">₹8,000 - ₹25,000+</p>
          <p className="text-xs text-slate-500">per screen*</p>
          <div className="mt-4">
            <CheckList tone="green" items={["High Footfall Locations", "Premium Advertisers", "Regular Campaigns", "Timely Payouts"]} />
          </div>
          <Link to="/pricing?tab=owners" className="btn-outline-brand mt-5 w-full"><Calculator className="h-4 w-4" /> View Commission Plans</Link>
          <DemoNote className="mt-3">*Illustrative range; actual earnings depend on bookings.</DemoNote>
        </div>
      </section>
    </>
  );
}
