import {
  Building2,
  CloudUpload,
  CreditCard,
  Eye,
  Layers,
  MapPinned,
  Megaphone,
  MonitorCheck,
  MonitorPlay,
  Play,
  Monitor,
  Users,
} from "lucide-react";
import { Fragment } from "react";
import { ArrowRight } from "lucide-react";
import { CheckList, CtaBanner, StatsStrip } from "../../components/sections";
import { demoStats } from "../../content/site";
import { Rocket } from "lucide-react";

const steps = [
  { icon: MapPinned, title: "Choose Location", text: "Browse and select the perfect screen location based on your target audience." },
  { icon: MonitorPlay, title: "Select Screen", text: "View screen details, footfall, pricing and upcoming bookings." },
  { icon: CloudUpload, title: "Upload Your Ad", text: "Upload your image or video ad, set your dates and budget." },
  { icon: CreditCard, title: "Make Payment", text: "Pay from your BigXel wallet. Declined bookings are refunded automatically." },
  { icon: MonitorCheck, title: "Ad Gets Approved", text: "The screen owner reviews and approves your ad for their screen." },
  { icon: Play, title: "Go Live & Track", text: "Your ad goes live on the scheduled dates. Track campaign status in your dashboard." },
];

const audiences = [
  {
    icon: Megaphone,
    title: "For Advertisers",
    color: "text-brand-700",
    iconBg: "bg-brand-600",
    image: "/images/hiw-mobile.jpg",
    items: ["Find the best screens in your target area", "Upload ads and set your campaign", "Pay from your wallet", "Track bookings and spend"],
    tone: "brand" as const,
  },
  {
    icon: Monitor,
    title: "For Screen Owners",
    color: "text-emerald-600",
    iconBg: "bg-emerald-600",
    image: "/images/hiw-owner-dashboard.jpg",
    items: ["List your screens and reach brands", "Approve every ad before it plays", "Earnings dashboard and reports", "Share of every booking you approve"],
    tone: "green" as const,
  },
  {
    icon: Layers,
    title: "BigXel Platform",
    color: "text-blue-700",
    iconBg: "bg-blue-600",
    image: "/images/hiw-platform-dashboard.jpg",
    items: ["Verified screens & advertisers", "Wallet ledger for every transaction", "Booking approvals & refunds", "Support & monitoring"],
    tone: "brand" as const,
  },
];

export default function HowItWorks() {
  return (
    <div className="bg-gradient-to-b from-brand-50/40 to-white">
      <section className="container-page py-12 text-center">
        <span className="pill">Simple Process. Powerful Results.</span>
        <h1 className="mt-5 text-4xl font-extrabold sm:text-5xl">
          How BigXel Ads <span className="text-gradient">Works</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Our platform connects advertisers with premium digital screens in high-traffic locations in just a few simple steps.
        </p>
        <ol className="mt-12 flex flex-col items-stretch gap-4 lg:flex-row">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <Fragment key={title}>
              <li className="card relative flex-1 p-5 text-center transition hover:-translate-y-1 hover:shadow-lg">
                <span className="absolute left-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{i + 1}</span>
                <span className="mx-auto mt-4 grid h-20 w-20 place-items-center rounded-full bg-brand-100/80 text-brand-600"><Icon className="h-9 w-9" /></span>
                <h2 className="mt-4 text-base font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </li>
              {i < steps.length - 1 && <ArrowRight className="hidden h-5 w-5 shrink-0 self-center text-brand-500 lg:block" aria-hidden="true" />}
            </Fragment>
          ))}
        </ol>
        <p className="mx-auto mt-6 inline-block rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white">Live booking status in every dashboard</p>
      </section>

      <section className="container-page py-10">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">A Platform That Connects Everyone</h2>
          <p className="mt-3 text-slate-600">BigXel Ads brings together advertisers, screen owners, and our platform to create a transparent and profitable ecosystem.</p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {audiences.map((a) => (
            <div key={a.title} className="card flex flex-col gap-4 overflow-hidden p-6 sm:flex-row lg:flex-col xl:flex-row">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className={`grid h-11 w-11 place-items-center rounded-full text-white ${a.iconBg}`}><a.icon className="h-5 w-5" /></span>
                  <h3 className={`text-lg font-bold ${a.color}`}>{a.title}</h3>
                </div>
                <div className="mt-5"><CheckList items={a.items} tone={a.tone} /></div>
              </div>
              <img src={a.image} alt={`${a.title} preview`} className="h-40 w-auto self-center object-contain" loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-8">
        <StatsStrip
          stats={[
            { icon: Users, value: demoStats.screens, label: "Screens Live" },
            { icon: Building2, value: demoStats.cities, label: "Cities Covered" },
            { icon: Megaphone, value: demoStats.advertisers, label: "Advertisers" },
            { icon: Eye, value: demoStats.impressions, label: "Monthly Impressions" },
          ]}
          dark
        />
      </section>
      <section className="container-page pb-14 pt-6">
        <CtaBanner icon={Rocket} title="Ready to Get Started?" text="Create your free account and book your first screen today." cta="Create Your Account" to="/signup" />
      </section>
    </div>
  );
}
