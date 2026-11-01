import { BarChart3, Headphones, MapPin, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export default function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-brand-50/40">
      <div className="container-page flex flex-col items-center py-8 sm:py-10">
        <Link to="/" aria-label="BigXel Ads home" className="inline-flex flex-col leading-none">
          <span className="text-5xl font-extrabold tracking-tight sm:text-6xl">
            <span className="text-navy-900">Big</span>
            <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">Xel</span>
          </span>
          <span className="self-end pr-1 text-sm font-semibold tracking-[0.4em] text-navy-900">ADS</span>
        </Link>
        <p className="mt-3 text-lg text-slate-600">Smart Advertising. Bigger Impact.</p>
        <div className="mt-8 grid w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl md:grid-cols-[0.8fr_1fr]">
          <div className="relative hidden md:block">
            <img src="/images/login-side.jpg" alt="Digital standee reading Big Brands Bigger Impact" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="p-6 sm:p-10">{children}</div>
        </div>
        <ul className="mt-10 grid w-full max-w-5xl grid-cols-2 gap-6 lg:grid-cols-4 lg:divide-x lg:divide-slate-200">
          {[
            { icon: MapPin, t: "Premium Locations", d: "High traffic, verified screens" },
            { icon: BarChart3, t: "Campaign Tracking", d: "Follow every booking" },
            { icon: ShieldCheck, t: "Secure & Reliable", d: "Your data is always protected" },
            { icon: Headphones, t: "Dedicated Support", d: "We're here to help" },
          ].map(({ icon: Icon, t, d }) => (
            <li key={t} className="flex items-center gap-3 lg:pl-6">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-100/70 text-brand-600"><Icon className="h-6 w-6" /></span>
              <div><p className="text-sm font-semibold text-slate-900">{t}</p><p className="text-xs text-slate-500">{d}</p></div>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-sm text-slate-500">© {new Date().getFullYear()} BigXel Ads Pvt. Ltd. All rights reserved.</p>
      </div>
    </div>
  );
}

export function SocialButtons() {
  return (
    <>
      <div className="my-6 flex items-center gap-3 text-sm text-slate-500">
        <span className="h-px flex-1 bg-slate-200" /> or continue with <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[
          { name: "Google", icon: <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z" /></svg> },
          { name: "Facebook", icon: <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#1877F2" /><path fill="#fff" d="M13.4 21.9v-7h2.3l.4-2.8h-2.7v-1.8c0-.8.3-1.4 1.4-1.4h1.4V6.4c-.3 0-1.1-.1-2.1-.1-2.1 0-3.5 1.3-3.5 3.6v2.1H8.3v2.8h2.3v7z" /></svg> },
        ].map((p) => (
          <button key={p.name} type="button" disabled title={`${p.name} sign-in is not configured yet`} className="btn-outline py-3">
            {p.icon} {p.name}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-slate-500">Social sign-in is not configured yet.</p>
    </>
  );
}
