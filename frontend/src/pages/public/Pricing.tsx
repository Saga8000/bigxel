import {
  ArrowRight,
  BarChart3,
  Building2,
  Crown,
  Diamond,
  Headphones,
  IndianRupee,
  MonitorPlay,
  ShieldCheck,
  Star,
  Store,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { CheckList } from "../../components/sections";
import { DemoNote } from "../../components/ui";

type Plan = {
  name: string;
  desc: string;
  price: string;
  unit?: string;
  sub?: string;
  features: string[];
  cta: string;
  to: string;
  popular?: boolean;
  icon?: LucideIcon;
  solid?: boolean;
};

const advertiserPlans: Plan[] = [
  { name: "Starter", desc: "Perfect for small businesses running local campaigns.", price: "₹2,999", unit: "/campaign", features: ["Up to 7 Days Campaign", "1 Screen Location", "Image / Video Ad", "Basic Campaign Insights", "Email Support"], cta: "Get Started", to: "/signup?role=advertiser" },
  { name: "Growth", desc: "Ideal for growing brands who want more reach.", price: "₹7,999", unit: "/campaign", features: ["Up to 30 Days Campaign", "Up to 5 Screen Locations", "Image / Video Ad", "Detailed Spend Reports", "Priority Support", "Campaign Scheduling"], cta: "Choose Plan", to: "/signup?role=advertiser", popular: true, solid: true },
  { name: "Pro", desc: "For businesses looking for maximum visibility.", price: "₹19,999", unit: "/campaign", features: ["Up to 60 Days Campaign", "Up to 15 Screen Locations", "Image / Video Ad", "Advanced Reports", "Priority Support", "Campaign Scheduling", "Audience Targeting (Coming Soon)"], cta: "Choose Plan", to: "/signup?role=advertiser" },
  { name: "Enterprise", desc: "Custom solutions for large brands & agencies.", price: "Custom Pricing", features: ["Unlimited Screen Locations", "Unlimited Campaign Duration", "Advanced Analytics & Reports", "Dedicated Account Manager", "Priority Support (24/7)", "API Access (Coming Soon)", "Custom Integrations"], cta: "Contact Sales", to: "/contact" },
];

const ownerPlans: Plan[] = [
  { name: "Starter", icon: Star, desc: "Perfect for getting started", price: "₹0", unit: "/month", sub: "Always Free", features: ["List Up to 5 Screens", "Basic Performance Insights", "Standard Ad Opportunities", "Secure & Timely Payouts", "Email Support"], cta: "Get Started Free", to: "/signup?role=screen_owner", popular: true },
  { name: "Growth", icon: BarChart3, desc: "Grow your reach & earnings", price: "₹399", unit: "/month", sub: "Billed Monthly", features: ["Up to 25 Screens", "Advanced Analytics", "Priority Ad Opportunities", "Higher Fill Rate", "Priority Support"], cta: "Choose Plan", to: "/signup?role=screen_owner", solid: true },
  { name: "Pro", icon: Crown, desc: "For high-performing owners", price: "₹999", unit: "/month", sub: "Billed Monthly", features: ["Up to 100 Screens", "Detailed Analytics", "Premium Ad Opportunities", "Maximum Fill Rate", "Priority Support (24/7)"], cta: "Choose Plan", to: "/signup?role=screen_owner", solid: true },
  { name: "Enterprise", icon: Building2, desc: "For large screen networks", price: "Custom Pricing", sub: "Tailored for You", features: ["100+ Screens", "Dedicated Account Manager", "Guaranteed Fill & Revenue", "Custom Integrations", "24/7 Phone & WhatsApp Support"], cta: "Contact Sales", to: "/contact" },
];

function PlanCard({ plan, centered }: { plan: Plan; centered?: boolean }) {
  return (
    <div className={`card relative flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-lg ${plan.popular ? "border-2 border-brand-500" : ""} ${centered ? "text-center" : ""}`}>
      {plan.popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white">Most Popular</span>
      )}
      {plan.icon && (
        <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-100/70 text-brand-600"><plan.icon className="h-7 w-7" /></span>
      )}
      <h3 className="text-xl font-bold">{plan.name}</h3>
      <p className="mt-1 text-sm text-slate-600">{plan.desc}</p>
      <p className="mt-5">
        <span className={`font-bold text-brand-700 ${plan.unit ? "text-3xl" : "text-2xl"}`}>{plan.price}</span>
        {plan.unit && <span className="text-sm font-semibold text-slate-700"> {plan.unit}</span>}
      </p>
      {plan.sub && <p className="mt-1 text-xs text-slate-500">{plan.sub}</p>}
      <div className={`mt-5 flex-1 border-t border-slate-100 pt-5 ${centered ? "text-left" : ""}`}>
        <CheckList items={plan.features} tone={centered ? "green" : "brand"} />
      </div>
      <Link to={plan.to} className={`${plan.solid ? "btn-primary" : "btn-outline-brand"} mt-6 w-full`}>
        {plan.cta}
      </Link>
    </div>
  );
}

const commissions = [
  { icon: Store, label: "Standard Screens", value: "20% - 25%" },
  { icon: Star, label: "High Performing Screens", value: "25% - 30%" },
  { icon: Crown, label: "Premium Locations", value: "30% - 35%" },
  { icon: Diamond, label: "Exclusive Partnerships", value: "Up to 40%" },
];

function OwnerExtras() {
  return (
    <>
      <div className="mt-8 grid gap-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: IndianRupee, t: "No Listing Fee", d: "List your screens absolutely free and start earning." },
          { icon: Wallet, t: "Timely Payouts", d: "Earnings are recorded as soon as you approve a booking." },
          { icon: ShieldCheck, t: "Safe & Secure", d: "Your data and earnings are always protected." },
          { icon: Headphones, t: "Dedicated Support", d: "Our team is here to help you succeed." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex gap-3">
            <span className="icon-badge"><Icon className="h-5 w-5" /></span>
            <div><p className="text-sm font-semibold text-slate-900">{t}</p><p className="mt-1 text-xs text-slate-600">{d}</p></div>
          </div>
        ))}
      </div>
      <div className="mt-14 text-center">
        <p className="eyebrow">How You Earn</p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Transparent Commission Structure</h2>
        <p className="mt-2 text-slate-600">You earn a share of the ad revenue for every booking you approve.</p>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center justify-around gap-2 text-center">
            {[
              { icon: Building2, t: "Advertiser", d: "Books & pays for the ad campaign" },
              { icon: MonitorPlay, t: "Ad Played", d: "Ad is played on your screen" },
              { icon: Wallet, t: "You Earn", d: "You earn your share of the revenue" },
            ].map(({ icon: Icon, t, d }, i) => (
              <div key={t} className="flex items-center gap-2">
                <div className="max-w-[130px]">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-brand-100/70 text-brand-600"><Icon className="h-7 w-7" /></span>
                  <p className="mt-3 text-sm font-semibold text-slate-900">{t}</p>
                  <p className="mt-1 text-xs text-slate-600">{d}</p>
                </div>
                {i < 2 && <ArrowRight className="hidden h-5 w-5 text-slate-400 sm:block" aria-hidden="true" />}
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-5 text-sm">
            <div className="flex items-center justify-between"><p className="font-semibold text-brand-700">Example</p><span className="rounded bg-brand-100 px-2 py-0.5 text-xs font-medium text-brand-700">Pro Plan</span></div>
            <div className="mt-3 flex justify-between"><span>Ad Revenue Paid by Advertiser</span><span className="font-semibold">₹100</span></div>
            <div className="mt-2 flex justify-between"><span>BigXel Platform Fee (30%)</span><span>- ₹30</span></div>
            <div className="mt-3 flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-brand-700"><span>Your Earning (70%)</span><span>₹70</span></div>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">*Actual earnings may vary based on location, screen type, demand and ad completion.</p>
        </div>
        <div className="card p-6">
          <h3 className="text-center text-base font-semibold">Your Earning Share by Plan</h3>
          <div className="table-wrap mt-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-slate-600"><th className="py-2 font-medium">Plan</th><th className="py-2 text-center font-medium">Your Share of Ad Revenue</th><th className="py-2 text-center font-medium">Platform Fee</th></tr></thead>
              <tbody>
                {[["Starter (Free)", "60%", "40%"], ["Growth", "65%", "35%"], ["Pro", "70%", "30%"], ["Enterprise", "Custom", "Custom"]].map(([p, s, f]) => (
                  <tr key={p} className="border-b border-slate-100 last:border-0"><td className="py-3 font-medium text-slate-900">{p}</td><td className="py-3 text-center font-semibold text-emerald-600">{s}</td><td className="py-3 text-center">{f}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 flex gap-4 rounded-xl bg-brand-50/70 p-4">
            <span className="icon-badge bg-white"><BarChart3 className="h-5 w-5" /></span>
            <div><p className="font-semibold text-slate-900">The More You Grow, The More You Earn</p><p className="mt-1 text-sm text-slate-600">Upgrade your plan, list more screens, and unlock higher earnings with better ad opportunities.</p></div>
          </div>
          <DemoNote className="mt-3">Plan subscriptions are not billed yet; the platform currently applies a single fee set in server config.</DemoNote>
        </div>
      </div>
    </>
  );
}

function AdvertiserExtras() {
  return (
    <>
      <div className="mt-10 grid items-center gap-6 rounded-2xl border border-brand-100 bg-brand-50/50 p-6 lg:grid-cols-[1.3fr_1fr_1fr_1fr_auto]">
        <div>
          <span className="pill">For Screen Owners</span>
          <h3 className="mt-3 text-xl font-bold">Earn More with BigXel Ads</h3>
          <p className="mt-1 text-sm text-slate-600">List your screens for free and earn a share every time an ad is booked on your screen.</p>
        </div>
        {[
          { icon: IndianRupee, t: "No Registration Fee", d: "List your screens absolutely free." },
          { icon: BarChart3, t: "Earn for Every Booking", d: "Get paid for every ad you approve." },
          { icon: Wallet, t: "Timely Payouts", d: "Track every rupee in your dashboard." },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="flex gap-3">
            <span className="icon-badge bg-white"><Icon className="h-5 w-5" /></span>
            <div><p className="text-sm font-semibold text-slate-900">{t}</p><p className="mt-1 text-xs text-slate-600">{d}</p></div>
          </div>
        ))}
        <div className="flex flex-col items-center gap-2">
          <Link to="/screen-owners" className="btn-primary">List Your Screen Now</Link>
          <Link to="/pricing?tab=owners" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">Learn More <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </div>
      <h2 className="mt-12 text-center text-2xl font-bold">Our Transparent Commission Structure</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {commissions.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100/70 text-brand-600"><Icon className="h-7 w-7" /></span>
            <div><p className="text-sm text-slate-700">{label}</p><p className="text-2xl font-bold">{value}</p><p className="text-sm text-slate-600">of total ad revenue</p></div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">*Commission may vary based on location, screen type, footfall and partnership terms.</p>
    </>
  );
}

export default function Pricing() {
  const [params, setParams] = useSearchParams();
  const owners = params.get("tab") === "owners";
  const tabs = [
    { key: "advertisers", label: "For Advertisers", sub: "Book Ads on Screens" },
    { key: "owners", label: "For Screen Owners", sub: "List & Earn from Screens" },
  ];
  return (
    <div className="bg-gradient-to-b from-brand-50/40 to-white">
      <div className="container-page py-12">
        <div className="text-center">
          <span className="pill">{owners ? "For Screen Owners" : "Flexible Plans for Everyone"}</span>
          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
            {owners ? <>Simple Plans. <span className="text-gradient">Real Earnings.</span></> : <>Simple, Transparent <span className="text-gradient">Pricing</span></>}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            {owners
              ? "List your screens for free and start earning from every ad booked. No hidden fees. No lock-in."
              : "Whether you're an advertiser looking to reach more customers or a business owner with screens to monetize — we have the perfect plan for you."}
          </p>
          <div role="tablist" aria-label="Pricing audience" className="mx-auto mt-8 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {tabs.map((t) => {
              const active = (t.key === "owners") === owners;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setParams(t.key === "owners" ? { tab: "owners" } : {})}
                  className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition sm:px-8 ${active ? "bg-brand-600 text-white shadow-glow" : "text-slate-700 hover:text-brand-700"}`}
                >
                  {t.label}
                  <span className={`hidden text-xs font-normal sm:block ${active ? "text-white/85" : "text-slate-500"}`}>{t.sub}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div role="tabpanel" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(owners ? ownerPlans : advertiserPlans).map((p) => <PlanCard key={p.name} plan={p} centered={owners} />)}
        </div>
        {!owners && <DemoNote className="mt-4">Campaign packages are indicative; bookings are currently priced per screen per day from each screen&apos;s listed monthly price.</DemoNote>}
        {owners ? <OwnerExtras /> : <AdvertiserExtras />}
      </div>
    </div>
  );
}
