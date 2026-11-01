import {
  BarChart3,
  Building2,
  CheckCircle2,
  Crosshair,
  Eye,
  Gem,
  HandHeart,
  Headphones,
  IndianRupee,
  Megaphone,
  MapPin,
  MonitorSmartphone,
  PlayCircle,
  Send,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { CtaBanner, StatsStrip } from "../../components/sections";
import { demoStats } from "../../content/site";

const why = [
  { icon: ShieldCheck, t: "Verified Screens", d: "Every screen is reviewed for quality, location and audience." },
  { icon: BarChart3, t: "Campaign Tracking", d: "Track bookings, approvals and spend in one place." },
  { icon: IndianRupee, t: "Wallet Ledger", d: "Every charge, refund and earning is recorded." },
  { icon: Headphones, t: "Support", d: "Our support team is here to help you succeed." },
  { icon: Megaphone, t: "Easy to Use", d: "Simple platform for booking, managing and running campaigns." },
  { icon: Users, t: "Growing Network", d: "Join a growing network of screens, brands and partners." },
];

export default function About() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 hidden w-[55%] lg:block" aria-hidden="true">
          <img src="/images/hero-about.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/10 to-transparent" />
        </div>
        <div className="container-page relative py-14 lg:py-20">
          <div className="max-w-xl">
            <p className="eyebrow">About BigXel Ads</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl">
              Reimagining Advertising.
              <br />
              Connecting <span className="text-gradient">People.</span>
            </h1>
            <p className="mt-5 text-lg text-slate-600">
              BigXel Ads is a smart digital advertising platform that connects businesses with premium digital screens in high-traffic locations. We make advertising simple, affordable and impactful for everyone.
            </p>
            <a href="#story" className="btn-primary mt-7"><PlayCircle className="h-4 w-4" /> Our Story</a>
          </div>
          <img src="/images/hero-about.jpg" alt="Digital screen in a shopping mall" className="mt-8 w-full rounded-2xl lg:hidden" />
        </div>
      </section>

      <section className="container-page py-12">
        <div className="text-center">
          <p className="eyebrow">Our Mission</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Empowering Brands. Rewarding Partners. Engaging Audiences.</h2>
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-3 md:divide-x md:divide-slate-200">
          <div className="flex gap-4 md:pr-6">
            <span className="icon-badge h-14 w-14"><Crosshair className="h-7 w-7" /></span>
            <div><h3 className="font-semibold">Our Mission</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">To empower businesses to reach the right audience through location-based advertising while creating sustainable income opportunities for screen owners.</p></div>
          </div>
          <div className="flex gap-4 md:px-6">
            <span className="icon-badge h-14 w-14"><Eye className="h-7 w-7" /></span>
            <div><h3 className="font-semibold">Our Vision</h3><p className="mt-2 text-sm leading-relaxed text-slate-600">To become a leading digital out-of-home advertising platform in India and beyond, creating a connected ecosystem of brands, screens and communities.</p></div>
          </div>
          <div className="flex gap-4 md:pl-6">
            <span className="icon-badge h-14 w-14"><Gem className="h-7 w-7" /></span>
            <div>
              <h3 className="font-semibold">Our Values</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                {["Transparency in everything we do", "Innovation that drives impact", "Fairness for advertisers and partners", "Commitment to customer success"].map((v) => (
                  <li key={v} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> {v}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container-page pb-6">
        <StatsStrip
          dark
          stats={[
            { icon: MonitorSmartphone, value: demoStats.screens, label: "Screens Live" },
            { icon: MapPin, value: demoStats.cities, label: "Cities Covered" },
            { icon: Building2, value: demoStats.advertisers, label: "Business Partners" },
            { icon: Eye, value: demoStats.impressions, label: "Monthly Impressions" },
            { icon: Users, value: demoStats.users, label: "Happy Users" },
          ]}
        />
      </section>

      <section id="story" className="container-page grid scroll-mt-24 items-center gap-10 py-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Our Story</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Built with a Simple Idea:<br /><span className="text-gradient">Make Every Screen Count.</span></h2>
          <p className="mt-5 font-semibold text-slate-800">BigXel Ads was founded with the vision to transform the way brands advertise and how businesses monetize their digital screens.</p>
          <p className="mt-4 text-slate-600">We noticed many high-quality screens in malls, restaurants, gyms, clinics and public spaces were underutilized. At the same time, businesses struggled to find the right platform to reach local audiences effectively.</p>
          <p className="mt-4 text-slate-600">So we built BigXel Ads — a transparent, technology-driven platform that connects advertisers with the right screens at the right time, delivering value for everyone.</p>
        </div>
        <div className="relative pb-16">
          <img src="/images/about-story.jpg" alt="Large digital billboard reading Big Brands Bigger Impact" className="w-full rounded-2xl object-cover shadow-card" loading="lazy" />
          <div className="card absolute -bottom-0 left-4 right-4 flex gap-4 p-5 sm:left-8 sm:right-8">
            <span className="icon-badge"><HandHeart className="h-6 w-6" /></span>
            <div><p className="font-semibold text-slate-900">More than just advertising.</p><p className="mt-1 text-sm text-slate-600">We&apos;re building a movement that empowers local businesses, supports screen partners and creates meaningful connections with communities.</p></div>
          </div>
        </div>
      </section>

      <section className="container-page py-10">
        <p className="eyebrow text-center">Why Choose BigXel Ads?</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {why.map(({ icon: Icon, t, d }) => (
            <div key={t} className="card p-5 text-center transition hover:-translate-y-1 hover:shadow-lg">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600"><Icon className="h-6 w-6" /></span>
              <h3 className="mt-3 text-sm font-bold">{t}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-10">
        <p className="eyebrow text-center">Our Team</p>
        <h2 className="mt-2 text-center text-2xl font-bold sm:text-3xl">The People Behind BigXel Ads</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {["Founder & CEO", "Co-Founder & COO", "CTO", "Head of Marketing"].map((role) => (
            <div key={role} className="card flex items-center gap-4 p-4">
              <span className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400"><UserRound className="h-10 w-10" /></span>
              <div>
                <p className="font-semibold text-slate-900">Team member</p>
                <p className="text-sm font-medium text-brand-700">{role}</p>
                <p className="mt-1 text-xs text-slate-500">Profile to be added</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-slate-500">Placeholder cards — add real team names, photos and bios before launch.</p>
      </section>

      <section className="container-page pb-14 pt-4">
        <CtaBanner icon={Send} title="Let's Build the Future of Local Advertising Together" text="Whether you're a business, a screen owner or a brand — we're here to help you grow." cta="Get in Touch" to="/contact" />
      </section>
      <span className="sr-only"><Link to="/contact">Contact</Link></span>
    </>
  );
}
