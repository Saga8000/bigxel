import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Crosshair,
  Eye,
  ExternalLink,
  IndianRupee,
  MapPin,
  Monitor,
  MonitorPlay,
  ShieldCheck,
  ShoppingBag,
  Upload,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { FeatureItem, StatsStrip } from "../../components/sections";
import { DemoBadge } from "../../components/ui";
import { demoStats } from "../../content/site";

const features = [
  { icon: Eye, title: "High Visibility", text: "Your ad on premium screens in high footfall locations." },
  { icon: Crosshair, title: "Targeted Reach", text: "Choose locations that match your target audience." },
  { icon: Clock, title: "Real-time Control", text: "Schedule, update and monitor your campaigns in real time." },
  { icon: IndianRupee, title: "Affordable Pricing", text: "Flexible plans for every business size and budget." },
  { icon: BarChart3, title: "Detailed Analytics", text: "Track bookings and spend and get actionable insights." },
  { icon: ShieldCheck, title: "Trusted Network", text: "Every screen is reviewed before it goes live." },
];

const steps = [
  { icon: Monitor, title: "Choose Location", text: "Browse screens by city, area or category." },
  { icon: ShoppingBag, title: "Select & Book", text: "Choose your screen, dates and budget." },
  { icon: Upload, title: "Upload Your Ad", text: "Upload an image or video and set your schedule." },
  { icon: MonitorPlay, title: "Go Live", text: "Your ad goes live once the screen owner approves." },
];

export default function Home() {
  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50/50 to-white">
        <div className="absolute inset-y-0 right-0 hidden w-[58%] lg:block" aria-hidden="true">
          <img src="/images/hero-home.jpg" alt="" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/30 to-transparent" />
        </div>
        <div className="container-page relative grid items-center gap-10 py-14 lg:min-h-[480px] lg:grid-cols-2 lg:py-16">
          <div>
            <span className="pill">India&apos;s Smart Digital Advertising Network</span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-[56px]">
              Reach More People.
              <br />
              Grow Your <span className="text-gradient">Business.</span>
            </h1>
            <p className="mt-6 max-w-lg text-lg text-slate-600">
              BigXel Ads connects brands with high-traffic digital screens at the right places and the right time.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/advertise" className="btn-primary px-7 py-3.5 text-base">
                Book Your Ad Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/screen-owners" className="btn-outline px-7 py-3.5 text-base">
                List Your Screen <Monitor className="h-4 w-4" />
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-brand-600" /> Verified Screens</li>
              <li className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-brand-600" /> Campaign Tracking</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-brand-600" /> 100% Transparent</li>
            </ul>
          </div>
          <div className="relative lg:hidden">
            <img src="/images/hero-home.jpg" alt="Digital advertising screen in a busy mall" className="w-full rounded-2xl object-cover shadow-card" />
          </div>
          <div className="relative hidden justify-end lg:flex">
            <div className="card w-56 p-5 shadow-xl">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-brand-500" /> Sample Campaign
                </p>
                <DemoBadge label="Sample" />
              </div>
              <p className="mt-3 font-semibold text-slate-900">Demo Burger Co.</p>
              <p className="mt-3 flex items-center gap-2 text-xs text-slate-600"><MapPin className="h-3.5 w-3.5" /> City Centre Mall, Kochi</p>
              <p className="mt-2 flex items-center gap-2 text-xs text-slate-600"><CalendarDays className="h-3.5 w-3.5" /> 12 May - 25 May</p>
              <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                <p>Screens booked</p>
                <p className="text-base font-semibold text-slate-900">3</p>
                <p className="mt-2">Campaign spend</p>
                <p className="text-base font-semibold text-slate-900">₹18,500</p>
              </div>
              <Link to="/advertise" className="btn-outline btn-sm mt-4 w-full">
                Browse Screens <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page -mt-2 pb-4">
        <StatsStrip
          stats={[
            { icon: Monitor, value: demoStats.screens, label: "Digital Screens" },
            { icon: Building2, value: demoStats.cities, label: "Cities Covered" },
            { icon: Users, value: demoStats.advertisers, label: "Happy Advertisers" },
            { icon: Eye, value: demoStats.impressions, label: "Monthly Impressions" },
          ]}
        />
      </section>

      <section className="border-b border-slate-100 py-14">
        <div className="container-page">
          <h2 className="text-center text-2xl font-bold sm:text-3xl">Powerful Platform for Smart Advertising</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
            {features.map((f) => (
              <FeatureItem key={f.title} icon={f.icon} title={f.title}>
                {f.text}
              </FeatureItem>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">How It Works</h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="card relative p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <s.icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-xs font-medium text-slate-500">Step {i + 1}</p>
                      <h3 className="text-sm font-bold">{s.title}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-slate-600">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800 via-navy-700 to-brand-900 p-8 text-white">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-500/30 blur-3xl" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-white">Own a Screen?</h2>
            <p className="mt-3 text-white/80">Turn your empty screen into a steady income source.</p>
            <Link to="/screen-owners" className="btn-primary mt-8 px-6 py-3">
              List Your Screen Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
